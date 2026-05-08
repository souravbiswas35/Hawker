import { useState } from "react";
import { FiInfo, FiCheck } from "react-icons/fi";

export default function Step1LicenseType({ onSubmit, data, licenseTypes, loading }) {
  const [selectedLicense, setSelectedLicense] = useState(data.licenseTypeId || null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedLicense) return;
    
    onSubmit({ licenseTypeId: selectedLicense });
  };

  const selectedLicenseData = licenseTypes.find(lt => lt.id === selectedLicense);

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <h5 className="mb-0 me-3">Step 1: License Type</h5>
        <div className="badge bg-warning text-dark">Required</div>
      </div>

      <div className="mb-4">
        <p className="text-muted">Select your preferred license duration. Annual licenses offer the best value with significant savings.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {licenseTypes.map((license) => {
            const isSelected = selectedLicense === license.id;
            const totalCost = parseFloat(license.base_price || 0) + parseFloat(license.security_deposit || 0) + parseFloat(license.processing_fee || 0);
            
            return (
              <div key={license.id} className="col-md-6">
                <div
                  className={`card h-100 cursor-pointer transition-all ${
                    isSelected ? "border-warning bg-light" : "border-secondary"
                  }`}
                  onClick={() => setSelectedLicense(license.id)}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="mb-1">{license.name}</h6>
                        <small className="text-muted">Valid for {license.duration_days} days</small>
                      </div>
                      {isSelected && <FiCheck className="text-warning" />}
                    </div>
                    
                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Base Price:</small>
                        <small>৳ {typeof license.base_price === 'number' ? license.base_price.toFixed(2) : parseFloat(license.base_price || 0).toFixed(2)}</small>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Security Deposit:</small>
                        <small>৳ {typeof license.security_deposit === 'number' ? license.security_deposit.toFixed(2) : parseFloat(license.security_deposit || 0).toFixed(2)}</small>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <small className="text-muted">Processing Fee:</small>
                        <small>৳ {typeof license.processing_fee === 'number' ? license.processing_fee.toFixed(2) : parseFloat(license.processing_fee || 0).toFixed(2)}</small>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between">
                        <strong>Total:</strong>
                        <strong className="text-warning">৳ {totalCost.toFixed(2)}</strong>
                      </div>
                    </div>

                    {license.name === 'Annually' && (
                      <div className="alert alert-info py-2 mb-0">
                        <FiInfo className="me-1" />
                        <small>Save 20% compared to monthly licenses!</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {selectedLicenseData && (
          <div className="alert bg-light border mt-4">
            <h6 className="mb-2">Selected License Summary</h6>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-1"><strong>Type:</strong> {selectedLicenseData.name}</p>
                <p className="mb-1"><strong>Duration:</strong> {selectedLicenseData.duration_days} days</p>
              </div>
              <div className="col-md-6">
                <p className="mb-1"><strong>Total Cost:</strong> ৳ {(parseFloat(selectedLicenseData.base_price || 0) + parseFloat(selectedLicenseData.security_deposit || 0) + parseFloat(selectedLicenseData.processing_fee || 0)).toFixed(2)}</p>
                <p className="mb-1"><strong>Refundable Deposit:</strong> ৳ {typeof selectedLicenseData.security_deposit === 'number' ? selectedLicenseData.security_deposit.toFixed(2) : parseFloat(selectedLicenseData.security_deposit || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="d-flex justify-content-end mt-4">
          <button
            type="submit"
            className="btn btn-warning px-4 rounded-pill"
            disabled={!selectedLicense || loading}
          >
            {loading ? "Processing..." : "Continue to Zone Selection"}
          </button>
        </div>
      </form>
    </div>
  );
}
