import { useState } from "react";
import { FiFilePlus } from "react-icons/fi";

export default function LicenseApplicationTest() {
  const [loading, setLoading] = useState(false);

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="d-flex align-items-center mb-4">
            <h4 className="mb-0">License Application</h4>
          </div>
          
          <div className="card border-0 shadow-sm app-surface-card">
            <div className="card-body p-4">
              <h5>Test Version - License Application</h5>
              <p>This is a test version to check if the component renders properly.</p>
              
              <div className="alert alert-info">
                <FiFilePlus className="me-2" />
                If you can see this message, the basic component structure is working.
                The issue might be with API calls or the step components.
              </div>
              
              <button className="btn btn-warning px-4 rounded-pill">
                Test Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
