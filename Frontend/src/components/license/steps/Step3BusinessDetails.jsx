import { useState, useEffect } from "react";
import "../../../styles/components/license/LicenseApplicationSteps.css";

const businessCategories = [
  { id: 'food_beverages', name: 'Food & Beverages', examples: 'Snacks, Tea, Coffee, Fast Food' },
  { id: 'fruits_vegetables', name: 'Fruits & Vegetables', examples: 'Fresh Produce, Juices' },
  { id: 'retail_goods', name: 'Retail Goods', examples: 'Clothing, Accessories, Electronics' },
  { id: 'handicrafts', name: 'Handicrafts', examples: 'Artisan Products, Souvenirs' },
  { id: 'services', name: 'Services', examples: 'Mobile Repair, Key Making' }
];

const stallSizes = [
  { id: '3x3', name: '3m X 3m', description: 'Standard size' },
  { id: '2x2', name: '2m X 2m', description: 'Compact size' },
  { id: '4x4', name: '4m X 4m', description: 'Large size' }
];

const operatingDays = [
  { id: 'all_days', name: 'All Days (Monday-Sunday)' },
  { id: 'weekdays', name: 'Weekdays Only (Sunday-Wednesday)' },
  { id: 'weekend', name: 'Weekend Only (Friday-Saturday)' },
  { id: 'custom', name: 'Custom' }
];

export default function Step3BusinessDetails({ onSubmit, data, loading, onValidationChange }) {
  const [formData, setFormData] = useState({
    typeOfGoods: data.typeOfGoods || "",
    goodsDescription: data.goodsDescription || "",
    numberOfStaff: data.numberOfStaff || 1,
    operatingHoursStart: data.operatingHoursStart || "09:00",
    operatingHoursEnd: data.operatingHoursEnd || "19:30",
    operatingDays: data.operatingDays || "all_days",
    stallSize: data.stallSize || "3x3",
    additionalRequirements: data.additionalRequirements || ""
  });

  const [selectedCategory, setSelectedCategory] = useState(data.typeOfGoods || "");

  useEffect(() => {
    const isValid = formData.typeOfGoods && formData.goodsDescription && formData.numberOfStaff && formData.operatingHoursStart && formData.operatingHoursEnd && formData.operatingDays && formData.stallSize;
    onValidationChange?.(!!isValid);
  }, [formData, onValidationChange]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setFormData(prev => ({
      ...prev,
      typeOfGoods: categoryId,
      goodsDescription: ""
    }));
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <h5 className="mb-0 me-3">Step 3: Business Details</h5>
        <div className="badge bg-warning text-dark">Required</div>
      </div>

      <div className="mb-4">
        <p className="text-muted">Tell us about your business operations and requirements.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Type of Goods/Services */}
          <div className="col-12">
            <label className="form-label fw-bold">Type of Goods/Services</label>
            <div className="row g-2 mb-3">
              {businessCategories.map((category) => (
                <div key={category.id} className="col-md-6 col-lg-4">
                  <div
                    className={`card h-100 license-selection-card ${
                      selectedCategory === category.id ? "selected" : ""
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className="card-body p-3">
                      <h6 className="mb-1">{category.name}</h6>
                      <small className="text-muted">{category.examples}</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <input
              type="text"
              className="form-control"
              name="goodsDescription"
              placeholder="e.g., Snacks, Tea, Coffee"
              value={formData.goodsDescription}
              onChange={handleChange}
              required
            />
          </div>

          {/* Number of Staffs/Helpers */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Number of Staffs/Helpers</label>
            <input
              type="number"
              className="form-control"
              name="numberOfStaff"
              min="1"
              max="10"
              value={formData.numberOfStaff}
              onChange={handleChange}
              required
            />
          </div>

          {/* Operating Hours */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Operating Hours</label>
            <div className="d-flex gap-2">
              <input
                type="time"
                className="form-control"
                name="operatingHoursStart"
                value={formData.operatingHoursStart}
                onChange={handleChange}
                required
              />
              <span className="align-self-center">to</span>
              <input
                type="time"
                className="form-control"
                name="operatingHoursEnd"
                value={formData.operatingHoursEnd}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Operating Days */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Operating Days</label>
            <select
              className="form-select"
              name="operatingDays"
              value={formData.operatingDays}
              onChange={handleChange}
              required
            >
              {operatingDays.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stall Dimension Required */}
          <div className="col-md-6">
            <label className="form-label fw-bold">Stall Dimension Required</label>
            <div className="d-flex gap-2">
              {stallSizes.map((size) => (
                <div key={size.id} className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="stallSize"
                    id={size.id}
                    value={size.id}
                    checked={formData.stallSize === size.id}
                    onChange={handleChange}
                    required
                  />
                  <label className="form-check-label" htmlFor={size.id}>
                    <div>
                      <div className="fw-bold">{size.name}</div>
                      <small className="text-muted">{size.description}</small>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Requirements / Comments */}
          <div className="col-12">
            <label className="form-label fw-bold">Additional Requirements / Comments</label>
            <textarea
              className="form-control"
              rows="4"
              name="additionalRequirements"
              placeholder="Any special requirements or information we should know..."
              value={formData.additionalRequirements}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Summary Card */}
        <div className="card bg-light mt-4">
          <div className="card-body">
            <h6 className="mb-3">Business Details Summary</h6>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-1"><strong>Category:</strong> {businessCategories.find(c => c.id === selectedCategory)?.name || 'Not selected'}</p>
                <p className="mb-1"><strong>Staff Count:</strong> {formData.numberOfStaff}</p>
                <p className="mb-1"><strong>Operating Hours:</strong> {formData.operatingHoursStart} - {formData.operatingHoursEnd}</p>
              </div>
              <div className="col-md-6">
                <p className="mb-1"><strong>Operating Days:</strong> {operatingDays.find(d => d.id === formData.operatingDays)?.name}</p>
                <p className="mb-1"><strong>Stall Size:</strong> {stallSizes.find(s => s.id === formData.stallSize)?.name}</p>
                <p className="mb-1"><strong>Special Requirements:</strong> {formData.additionalRequirements || 'None'}</p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
