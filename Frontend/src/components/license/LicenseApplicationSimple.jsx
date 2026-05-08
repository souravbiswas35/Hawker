import { useState } from "react";

export default function LicenseApplicationSimple() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <h4 className="mb-4">License Application</h4>
          
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
              <h5>Step {currentStep}: Test Content</h5>
              <p>This is a simplified version to test if the component renders properly.</p>
              
              <div className="d-flex justify-content-between mt-4">
                <button
                  className="btn btn-outline-secondary px-4 rounded-pill"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </button>
                <button
                  className="btn btn-warning px-4 rounded-pill"
                  onClick={() => setCurrentStep(Math.min(6, currentStep + 1))}
                  disabled={currentStep === 6}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
