import { useState } from "react";
import { FiFilePlus, FiCheck } from "react-icons/fi";

// Test import of all step components using proper ES6 imports
import Step1LicenseType from "./steps/Step1LicenseType";
import Step2ZoneSelection from "./steps/Step2ZoneSelection";
import Step3BusinessDetails from "./steps/Step3BusinessDetails";
import Step4DocumentVerification from "./steps/Step4DocumentVerification";
import Step5FeePayment from "./steps/Step5FeePayment";
import Step6ReviewSubmit from "./steps/Step6ReviewSubmit";

console.log("All step components imported successfully");

export default function LicenseApplicationDebug() {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");

  // Mock data
  const licenseTypes = [
    { id: 1, name: 'Daily', duration_days: 1, base_price: 100.00, security_deposit: 50.00, processing_fee: 100.00 },
    { id: 2, name: 'Monthly', duration_days: 30, base_price: 3000.00, security_deposit: 500.00, processing_fee: 100.00 }
  ];
  
  const zones = [
    { id: 1, zone_code: 'MR10', name: 'Mirpur 10', location: 'Mirpur 10 Circle', area: 'Mirpur', total_spots: 50, available_spots: 38, has_electricity: 1, has_water: 1, has_shade: 1, zone_type: 'commercial', traffic_level: 'high' }
  ];

  const handleStepSubmit = (stepData) => {
    console.log("Step submitted:", stepData);
    if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStep = () => {
    try {
      switch (currentStep) {
        case 1:
          return (
            <Step1LicenseType
              onSubmit={handleStepSubmit}
              data={{}}
              licenseTypes={licenseTypes}
              loading={false}
            />
          );
        
        case 2:
          return (
            <Step2ZoneSelection
              onSubmit={handleStepSubmit}
              data={{}}
              zones={zones}
              loading={false}
            />
          );
        
        case 3:
          return (
            <Step3BusinessDetails
              onSubmit={handleStepSubmit}
              data={{}}
              loading={false}
            />
          );
        
        case 4:
          return (
            <Step4DocumentVerification
              onSubmit={handleStepSubmit}
              data={{}}
              loading={false}
            />
          );
        
        case 5:
          return (
            <Step5FeePayment
              onSubmit={handleStepSubmit}
              data={{}}
              loading={false}
            />
          );
        
        case 6:
          return (
            <Step6ReviewSubmit
              onSubmit={handleStepSubmit}
              data={{}}
              trackingNumber="LIC-123456"
              loading={false}
            />
          );
        
        default:
          return (
            <div>
              <h5>Step {currentStep} - Debug Mode</h5>
              <p>Invalid step number.</p>
              <button className="btn btn-warning" onClick={() => setCurrentStep(1)}>
                Go to Step 1
              </button>
            </div>
          );
      }
    } catch (err) {
      console.error("Error rendering step:", err);
      setError(`Step rendering error: ${err.message}`);
      return (
        <div className="alert alert-danger">
          <h6>Step Rendering Error</h6>
          <p>{err.message}</p>
          <button className="btn btn-secondary" onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}>
            Skip to Next Step
          </button>
        </div>
      );
    }
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <h4 className="mb-4">License Application (Debug Mode)</h4>
          
          {error && (
            <div className="alert alert-danger mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="progress" style={{ height: "8px" }}>
              <div
                className="progress-bar bg-warning"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
            
            {/* Step Indicators */}
            <div className="d-flex justify-content-between mt-3">
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  className={`text-center flex-fill ${
                    step === currentStep ? "text-warning" : "text-muted"
                  }`}
                >
                  <div
                    className={`d-inline-flex align-items-center justify-content-center rounded-circle mb-1 ${
                      step === currentStep ? "bg-warning text-dark" : "bg-secondary"
                    }`}
                    style={{ width: "32px", height: "32px" }}
                  >
                    {step}
                  </div>
                  <div className="small">Step {step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="card border-0 shadow-sm app-surface-card">
            <div className="card-body p-4">
              {renderStep()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
