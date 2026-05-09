import { useState, useEffect } from "react";
import { FiMapPin, FiZap, FiDroplet, FiSun, FiUsers } from "react-icons/fi";

export default function Step2ZoneSelection({ onSubmit, data, zones, loading }) {
  const [selectedPrimaryZone, setSelectedPrimaryZone] = useState(data.primaryZoneId || null);
  const [selectedAlternateZone, setSelectedAlternateZone] = useState(data.alternateZoneId || "");
  const [filteredZones, setFilteredZones] = useState(zones);
  const [areaFilter, setAreaFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    let filtered = zones;
    
    if (areaFilter) {
      filtered = filtered.filter(zone => zone.area.toLowerCase().includes(areaFilter.toLowerCase()));
    }
    
    if (typeFilter) {
      filtered = filtered.filter(zone => zone.zone_type === typeFilter);
    }
    
    setFilteredZones(filtered);
  }, [areaFilter, typeFilter, zones]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPrimaryZone) return;
    
    onSubmit({
      primaryZoneId: selectedPrimaryZone,
      alternateZoneId: selectedAlternateZone || null
    });
  };

  const getFacilityIcon = (facility) => {
    switch (facility) {
      case 'electricity': return <FiZap />;
      case 'water': return <FiDroplet />;
      case 'shade': return <FiSun />;
      default: return null;
    }
  };

  const getTrafficColor = (level) => {
    switch (level) {
      case 'high': return 'text-danger';
      case 'medium': return 'text-warning';
      case 'low': return 'text-success';
      default: return 'text-muted';
    }
  };

  const getAvailabilityColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 50) return 'text-success';
    if (percentage > 20) return 'text-warning';
    return 'text-danger';
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <h5 className="mb-0 me-3">Step 2: Select Vending Zone</h5>
        <div className="badge bg-warning text-dark">Required</div>
      </div>

      <div className="mb-4">
        <p className="text-muted">Choose your preferred vending location. You can also select an alternative zone.</p>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <label className="form-label">Filter by Area</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g., Mirpur, Dhanmondi"
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label">Filter by Type</label>
          <select
            className="form-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="commercial">Commercial</option>
            <option value="residential">Residential</option>
            <option value="transport">Transport</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Clear Filters</label>
          <button
            type="button"
            className="btn btn-outline-secondary w-100"
            onClick={() => {
              setAreaFilter("");
              setTypeFilter("");
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Interactive Map Placeholder */}
      <div className="card bg-light mb-4">
        <div className="card-body text-center py-5">
          <FiMapPin size={48} className="text-muted mb-3" />
          <h6>Interactive Map</h6>
          <p className="text-muted">Map integration would show zone locations here</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <h6 className="mb-3">Available Zones</h6>
        <div className="row g-3 mb-4">
          {filteredZones.map((zone) => {
            const isPrimarySelected = selectedPrimaryZone === zone.id;
            const isAlternateSelected = selectedAlternateZone === zone.id;
            
            return (
              <div key={zone.id} className="col-md-6">
                <div
                  className={`card h-100 cursor-pointer transition-all ${
                    isPrimarySelected ? "border-warning bg-light" : 
                    isAlternateSelected ? "border-info bg-light" : 
                    "border-secondary"
                  }`}
                  onClick={() => {
                    if (!isPrimarySelected) {
                      setSelectedPrimaryZone(zone.id);
                      if (selectedAlternateZone === zone.id) {
                        setSelectedAlternateZone("");
                      }
                    }
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">{zone.zone_code} - {zone.name}</h6>
                        <small className="text-muted">{zone.location}</small>
                      </div>
                      {isPrimarySelected && <div className="badge bg-warning">Primary</div>}
                      {isAlternateSelected && <div className="badge bg-info">Alternate</div>}
                    </div>
                    
                    <div className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Available Spots:</small>
                        <small className={getAvailabilityColor(zone.available_spots, zone.total_spots)}>
                          {zone.available_spots}/{zone.total_spots}
                        </small>
                      </div>
                      <div className="progress" style={{ height: "4px" }}>
                        <div
                          className={`progress-bar ${
                            (zone.available_spots / zone.total_spots) > 0.5 ? 'bg-success' :
                            (zone.available_spots / zone.total_spots) > 0.2 ? 'bg-warning' : 'bg-danger'
                          }`}
                          style={{ width: `${(zone.available_spots / zone.total_spots) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mb-2">
                      <small className="text-muted">Facilities: </small>
                      {zone.has_electricity && <span className="me-2">{getFacilityIcon('electricity')} Electricity</span>}
                      {zone.has_water && <span className="me-2">{getFacilityIcon('water')} Water</span>}
                      {zone.has_shade && <span className="me-2">{getFacilityIcon('shade')} Shade</span>}
                    </div>

                    <div className="d-flex justify-content-between">
                      <small className="text-muted">Traffic:</small>
                      <small className={getTrafficColor(zone.traffic_level)}>
                        <FiUsers className="me-1" />
                        {zone.traffic_level}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alternate Zone Selection */}
        <div className="card bg-light mb-4">
          <div className="card-body">
            <h6 className="mb-3">Alternative Zone (Optional)</h6>
            <p className="text-muted small">Select an alternative zone if your primary choice is unavailable.</p>
            <select
              className="form-select"
              value={selectedAlternateZone}
              onChange={(e) => setSelectedAlternateZone(e.target.value)}
            >
              <option value="">No alternative zone</option>
              {filteredZones
                .filter(zone => zone.id !== selectedPrimaryZone)
                .map(zone => (
                  <option key={zone.id} value={zone.id}>
                    {zone.zone_code} - {zone.name}
                  </option>
                ))
              }
            </select>
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button
            type="submit"
            className="btn btn-warning px-4 rounded-pill"
            disabled={!selectedPrimaryZone || loading}
          >
            {loading ? "Processing..." : "Continue to Business Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
