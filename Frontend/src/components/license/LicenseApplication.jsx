import { useState, useEffect } from "react";
import { FiFilePlus, FiCheck, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import api from "../../api/client";
import Step1LicenseType from "./steps/Step1LicenseType";
import Step2ZoneSelection from "./steps/Step2ZoneSelection";
import Step3BusinessDetails from "./steps/Step3BusinessDetails";
import Step4DocumentVerification from "./steps/Step4DocumentVerification";
import Step5FeePayment from "./steps/Step5FeePayment";
import Step6ReviewSubmit from "./steps/Step6ReviewSubmit";

const steps = [
  { id: 1, title: "License Type", icon: FiFilePlus },
  { id: 2, title: "Zone Selection", icon: FiFilePlus },
  { id: 3, title: "Business Details", icon: FiFilePlus },
  { id: 4, title: "Document Verification", icon: FiFilePlus },
  { id: 5, title: "Fee Payment", icon: FiFilePlus },
  { id: 6, title: "Review & Submit", icon: FiFilePlus },
];

export default function LicenseApplication() {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState(null);
  const [trackingNumber, setTrackingNumber] = useState(null);
  const [applicationData, setApplicationData] = useState({});
  const [licenseTypes, setLicenseTypes] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stepValid, setStepValid] = useState(false);

  useEffect(() => {
    fetchLicenseTypes();
    fetchZones();
  }, []);

  const fetchLicenseTypes = async () => {
    try {
      const { data } = await api.get("/license/license-types");
      setLicenseTypes(data.licenseTypes || []);
    } catch (err) {
      console.error("Failed to load license types:", err);
      setError("Failed to load license types. Please ensure the backend server is running.");
      // Set fallback data
      setLicenseTypes([
        { id: 1, name: 'Daily', duration_days: 1, base_price: 100.00, security_deposit: 50.00, processing_fee: 100.00 },
        { id: 2, name: 'Weekly', duration_days: 7, base_price: 500.00, security_deposit: 100.00, processing_fee: 100.00 },
        { id: 3, name: 'Monthly', duration_days: 30, base_price: 3000.00, security_deposit: 500.00, processing_fee: 100.00 },
        { id: 4, name: '6 Month', duration_days: 180, base_price: 15000.00, security_deposit: 1000.00, processing_fee: 100.00 },
        { id: 5, name: 'Annually', duration_days: 365, base_price: 30000.00, security_deposit: 2000.00, processing_fee: 100.00 }
      ]);
    }
  };

  const fetchZones = async () => {
    try {
      const { data } = await api.get("/license/vending-zones");
      setZones(data.zones || []);
    } catch (err) {
      console.error("Failed to load vending zones:", err);
      setError("Failed to load vending zones. Please ensure the backend server is running.");
      // Set fallback data
      setZones([
        { id: 1, zone_code: 'MR10', name: 'Mirpur 10', location: 'Mirpur 10 Circle', area: 'Mirpur', total_spots: 50, available_spots: 38, has_electricity: 1, has_water: 1, has_shade: 1, zone_type: 'commercial', traffic_level: 'high' },
        { id: 2, zone_code: 'JC6', name: 'Old Dhaka Court', location: 'CMC Judge Court', area: 'Old Dhaka', total_spots: 60, available_spots: 3, has_electricity: 1, has_water: 1, has_shade: 1, zone_type: 'commercial', traffic_level: 'medium' },
        { id: 3, zone_code: 'MMP30', name: 'Mohammadpur', location: 'Mohammadpur Bus Stand', area: 'Mohammadpur', total_spots: 40, available_spots: 11, has_electricity: 1, has_water: 1, has_shade: 0, zone_type: 'transport', traffic_level: 'high' },
        { id: 4, zone_code: 'JTB03', name: 'Jatrabari Area', location: 'Jatrabari Flyover Bridge', area: 'Jatrabari', total_spots: 30, available_spots: 8, has_electricity: 1, has_water: 0, has_shade: 1, zone_type: 'transport', traffic_level: 'medium' }
      ]);
    }
  };

  const handleStepSubmit = async (stepData) => {
    setLoading(true);
    setError("");

    try {
      if (currentStep === 1) {
        // Create new application
        const { data } = await api.post("/license/applications", {
          licenseTypeId: stepData.licenseTypeId,
        });
        setApplicationId(data.applicationId);
        setTrackingNumber(data.trackingNumber);
        setCurrentStep(data.currentStep);
        setApplicationData(prev => ({ 
          ...prev, 
          ...stepData,
          licenseType: licenseTypes.find(lt => lt.id === stepData.licenseTypeId)
        }));
      } else {
        // Update existing application
        const { data } = await api.put(`/license/applications/${applicationId}/steps/${currentStep}`, stepData);
        setCurrentStep(data.currentStep);
        setApplicationData(prev => ({ 
          ...prev, 
          ...stepData,
          // Add zone information for step 2
          ...(currentStep === 2 && {
            primaryZone: zones.find(z => z.id === stepData.primaryZoneId),
            alternateZone: stepData.alternateZoneId ? zones.find(z => z.id === stepData.alternateZoneId) : null
          })
        }));
      }
    } catch (err) {
      console.error("Step submission error:", err);
      setError(err.response?.data?.message || "Failed to save step. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    const stepProps = {
      onSubmit: handleStepSubmit,
      data: applicationData,
      licenseTypes,
      zones,
      loading,
      onValidationChange: setStepValid,
    };

    switch (currentStep) {
      case 1:
        return <Step1LicenseType {...stepProps} />;
      case 2:
        return <Step2ZoneSelection {...stepProps} />;
      case 3:
        return <Step3BusinessDetails {...stepProps} />;
      case 4:
        return <Step4DocumentVerification {...stepProps} />;
      case 5:
        return <Step5FeePayment {...stepProps} />;
      case 6:
        return <Step6ReviewSubmit {...stepProps} trackingNumber={trackingNumber} />;
      default:
        return null;
    }
  };

  const handleContinue = () => {
    // Trigger form submission for current step
    const form = document.querySelector('.card-body form');
    if (form) {
      form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const getContinueButtonText = () => {
    switch (currentStep) {
      case 1:
        return "Continue to Zone Selection";
      case 2:
        return "Continue to Business Details";
      case 3:
        return "Continue to Document Verification";
      case 4:
        return "Continue to Fee Payment";
      case 5:
        return "Continue to Review & Submit";
      default:
        return "Continue";
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">License Application</h4>
              {trackingNumber && (
                <span className="badge bg-primary">Tracking: {trackingNumber}</span>
              )}
            </div>
            
            {/* Step Progress */}
            <div className="progress" style={{ height: "8px" }}>
              <div
                className="progress-bar bg-warning"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
            
            {/* Step Indicators */}
            <div className="d-flex justify-content-between mt-3">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                
                return (
                  <div
                    key={step.id}
                    className={`text-center flex-fill ${isActive ? "text-warning" : isCompleted ? "text-success" : "text-muted"}`}
                    style={{ cursor: "pointer" }}
                    onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  >
                    <div
                      className={`d-inline-flex align-items-center justify-content-center mb-1 ${
                        isActive ? "bg-warning text-dark" : isCompleted ? "bg-success text-white" : "bg-light border"
                      }`}
                      style={{ width: "32px", height: "32px", borderRadius: "4px" }}
                    >
                      {isCompleted ? <FiCheck size={16} /> : <Icon size={16} />}
                    </div>
                    <div className="small">{step.title}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger mb-4">
              {error}
            </div>
          )}

          {/* Step Content */}
          <div className="card border-0 shadow-sm app-surface-card">
            <div className="card-body p-4">
              {renderStep()}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="d-flex justify-content-between mt-4">
            {currentStep > 1 && (
              <button
                className="btn btn-outline-secondary px-4 rounded-pill"
                onClick={handlePrevious}
                disabled={loading}
              >
                <FiArrowLeft className="me-2" />
                Previous
              </button>
            )}
            {currentStep < 6 && (
              <button
                className="btn btn-warning px-4 rounded-pill"
                onClick={handleContinue}
                disabled={!stepValid || loading}
              >
                {loading ? "Processing..." : getContinueButtonText()}
                <FiArrowRight className="ms-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
