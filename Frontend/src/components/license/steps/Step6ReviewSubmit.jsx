import { useState } from "react";
import { FiCheck, FiFileText, FiMapPin, FiBriefcase, FiCreditCard, FiEdit } from "react-icons/fi";

const businessCategories = [
  { id: 'food_beverages', name: 'Food & Beverages' },
  { id: 'fruits_vegetables', name: 'Fruits & Vegetables' },
  { id: 'retail_goods', name: 'Retail Goods' },
  { id: 'handicrafts', name: 'Handicrafts' },
  { id: 'services', name: 'Services' }
];

const operatingDays = [
  { id: 'all_days', name: 'All Days (Monday-Sunday)' },
  { id: 'weekdays', name: 'Weekdays Only (Sunday-Wednesday)' },
  { id: 'weekend', name: 'Weekend Only (Friday-Saturday)' },
  { id: 'custom', name: 'Custom' }
];

const stallSizes = [
  { id: '3x3', name: '3m X 3m' },
  { id: '2x2', name: '2m X 2m' },
  { id: '4x4', name: '4m X 4m' }
];

export default function Step6ReviewSubmit({ onSubmit, data, trackingNumber, loading }) {
  const [declaration, setDeclaration] = useState(false);
  const [digitalSignature, setDigitalSignature] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Real data from previous steps
  const applicationSummary = {
    licenseType: data.licenseType ? {
      name: data.licenseType.name,
      duration: `${data.licenseType.duration_days} days`,
      totalCost: `৳ ${(parseFloat(data.licenseType.base_price || 0) + parseFloat(data.licenseType.security_deposit || 0) + parseFloat(data.licenseType.processing_fee || 0)).toFixed(2)}`
    } : {
      name: "Monthly License",
      duration: "30 days", 
      totalCost: "৳ 3600.00"
    },
    zone: {
      primary: data.primaryZone ? `${data.primaryZone.zone_code} - ${data.primaryZone.name}` : "JC6 - Old Dhaka Court",
      alternate: data.alternateZone ? `${data.alternateZone.zone_code} - ${data.alternateZone.name}` : "MR10 - Mirpur 10"
    },
    businessDetails: {
      category: data.typeOfGoods ? businessCategories.find(c => c.id === data.typeOfGoods)?.name || "Food & Beverages" : "Food & Beverages",
      goodsDescription: data.goodsDescription || "Snacks, Tea, Coffee",
      staffCount: data.numberOfStaff || 1,
      operatingHours: `${data.operatingHoursStart || "09:00"} - ${data.operatingHoursEnd || "19:30"}`,
      operatingDays: operatingDays.find(d => d.id === (data.operatingDays || "all_days"))?.name || "All Days",
      stallSize: stallSizes.find(s => s.id === (data.stallSize || "3x3"))?.name || "3m X 3m"
    },
    documents: {
      uploaded: data.documentVerification ? Object.keys(data.documentVerification).map(key => 
        key.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
      ) : ["National ID", "Address Proof", "Recent Photograph"],
      status: "Complete"
    },
    payment: {
      method: data.paymentMethod || "bKash",
      amount: data.totalAmount ? `৳ ${data.totalAmount.toFixed(2)}` : "৳ 3420.00",
      status: "Completed"
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!declaration) {
      alert("Please accept the declaration");
      return;
    }

    if (!digitalSignature.trim()) {
      alert("Please provide your digital signature");
      return;
    }

    onSubmit({
      declaration: true,
      digitalSignature,
      finalSubmission: true
    }).then(() => {
      setSubmitted(true);
    }).catch((error) => {
      console.error("Submission failed:", error);
      alert("Failed to submit application. Please try again.");
    });
  };

  const SummarySection = ({ icon: Icon, title, children, onEdit }) => (
    <div className="card mb-3">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center">
            <Icon className="me-2" />
            <h6 className="mb-0">{title}</h6>
          </div>
          {onEdit && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setIsEditing(title)}
            >
              <FiEdit className="me-1" />
              Edit
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <h5 className="mb-0 me-3">Step 6: Review & Submit</h5>
        <div className="badge bg-warning text-dark">Final Step</div>
      </div>

      <div className="mb-4">
        <p className="text-muted">Please review your application details before final submission.</p>
        {trackingNumber && (
          <div className="alert alert-info">
            <strong>Application Tracking Number:</strong> {trackingNumber}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* License Information */}
        <SummarySection icon={FiFileText} title="License Information">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1"><strong>License Type:</strong> {applicationSummary.licenseType.name}</p>
              <p className="mb-1"><strong>Duration:</strong> {applicationSummary.licenseType.duration}</p>
            </div>
            <div className="col-md-6">
              <p className="mb-1"><strong>Total Cost:</strong> {applicationSummary.licenseType.totalCost}</p>
              <p className="mb-1"><strong>Security Deposit:</strong> Refundable</p>
            </div>
          </div>
        </SummarySection>

        {/* Zone Selection */}
        <SummarySection icon={FiMapPin} title="Zone Selection">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1"><strong>Primary Zone:</strong> {applicationSummary.zone.primary}</p>
            </div>
            <div className="col-md-6">
              <p className="mb-1"><strong>Alternate Zone:</strong> {applicationSummary.zone.alternate}</p>
            </div>
          </div>
        </SummarySection>

        {/* Business Details */}
        <SummarySection icon={FiBriefcase} title="Business Details">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1"><strong>Category:</strong> {applicationSummary.businessDetails.category}</p>
              <p className="mb-1"><strong>Goods:</strong> {applicationSummary.businessDetails.goodsDescription}</p>
              <p className="mb-1"><strong>Staff Count:</strong> {applicationSummary.businessDetails.staffCount}</p>
            </div>
            <div className="col-md-6">
              <p className="mb-1"><strong>Operating Hours:</strong> {applicationSummary.businessDetails.operatingHours}</p>
              <p className="mb-1"><strong>Operating Days:</strong> {applicationSummary.businessDetails.operatingDays}</p>
              <p className="mb-1"><strong>Stall Size:</strong> {applicationSummary.businessDetails.stallSize}</p>
            </div>
          </div>
        </SummarySection>

        {/* Document Verification */}
        <SummarySection icon={FiFileText} title="Document Verification">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1"><strong>Uploaded Documents:</strong></p>
              <ul className="small mb-0">
                {applicationSummary.documents.uploaded.map((doc, index) => (
                  <li key={index}>{doc}</li>
                ))}
              </ul>
            </div>
            <div className="col-md-6">
              <p className="mb-1">
                <strong>Status:</strong> 
                <span className="ms-2 text-success">
                  <FiCheck className="me-1" />
                  {applicationSummary.documents.status}
                </span>
              </p>
            </div>
          </div>
        </SummarySection>

        {/* Fee Payment */}
        <SummarySection icon={FiCreditCard} title="Fee Payment">
          <div className="row">
            <div className="col-md-6">
              <p className="mb-1"><strong>Payment Method:</strong> {applicationSummary.payment.method}</p>
              <p className="mb-1"><strong>Amount Paid:</strong> {applicationSummary.payment.amount}</p>
            </div>
            <div className="col-md-6">
              <p className="mb-1">
                <strong>Status:</strong> 
                <span className="ms-2 text-success">
                  <FiCheck className="me-1" />
                  {applicationSummary.payment.status}
                </span>
              </p>
            </div>
          </div>
        </SummarySection>

        {/* Declaration */}
        <div className="card bg-light mb-4">
          <div className="card-body">
            <h6 className="mb-3">Declaration</h6>
            <div className="mb-3">
              <p className="mb-2">I hereby declare that:</p>
              <ul className="small">
                <li>All information provided in this application is true and correct</li>
                <li>I have read and understood the terms and conditions</li>
                <li>I will comply with all vending regulations and guidelines</li>
                <li>I understand that false information may lead to rejection of this application</li>
                <li>I agree to pay the applicable fees and abide by the payment terms</li>
              </ul>
            </div>
            
            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="declaration"
                checked={declaration}
                onChange={(e) => setDeclaration(e.target.checked)}
                required
              />
              <label className="form-check-label" htmlFor="declaration">
                I accept the above declaration and terms
              </label>
            </div>
          </div>
        </div>

        {/* Digital Signature */}
        <div className="card bg-light mb-4">
          <div className="card-body">
            <h6 className="mb-3">Digital Signature</h6>
            <p className="text-muted small mb-3">Type your full name as digital signature</p>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your full name"
              value={digitalSignature}
              onChange={(e) => setDigitalSignature(e.target.value)}
              required
            />
            <small className="text-muted">This digital signature serves as your electronic signature</small>
          </div>
        </div>

        {/* Final Instructions */}
        <div className="alert alert-warning mb-4">
          <h6 className="mb-2">Important Notes:</h6>
          <ul className="small mb-0">
            <li>After submission, you will receive a tracking number to monitor your application status</li>
            <li>Processing time typically takes 3-5 business days</li>
            <li>You will be notified via email and SMS about any updates</li>
            <li>Keep your tracking number safe for future reference</li>
          </ul>
        </div>

        <div className="d-flex justify-content-between">
          <button
            type="button"
            className="btn btn-outline-secondary px-4 rounded-pill"
            disabled={loading}
          >
            Save as Draft
          </button>
          <button
            type="submit"
            className="btn btn-warning px-4 rounded-pill"
            disabled={!declaration || !digitalSignature.trim() || loading}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>

      {/* Success Message */}
      {submitted && (
        <div className="alert alert-success mt-4">
          <div className="text-center">
            <h5 className="mb-3">🎉 Application Submitted Successfully!</h5>
            <p className="mb-2">
              Your license application has been submitted successfully.
            </p>
            <p className="mb-3">
              <strong>Tracking Number:</strong> {trackingNumber}
            </p>
            <p className="text-muted mb-4">
              You can track your application status using the tracking number above.
            </p>
            <button 
              className="btn btn-success"
              onClick={() => window.location.href = '/vendor/dashboard'}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
