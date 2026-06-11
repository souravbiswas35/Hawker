import { useState, useEffect } from "react";
import { FiCreditCard, FiSmartphone, FiDollarSign, FiPercent } from "react-icons/fi";
import "../../../styles/components/license/LicenseApplicationSteps.css";

const paymentMethods = [
  { id: 'bkash', name: 'bKash', icon: FiSmartphone, description: 'Mobile banking', hasCashback: true },
  { id: 'nagad', name: 'Nagad', icon: FiSmartphone, description: 'Mobile banking', hasCashback: false },
  { id: 'visa', name: 'Visa', icon: FiCreditCard, description: 'Credit/Debit card', hasCashback: false },
  { id: 'mastercard', name: 'Mastercard', icon: FiCreditCard, description: 'Credit/Debit card', hasCashback: false },
  { id: 'pay_later', name: 'Pay Later at Designated Booth', icon: FiDollarSign, description: 'Pay in person', hasCashback: false }
];

export default function Step5FeePayment({ onSubmit, data, loading, onValidationChange }) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(data.paymentMethod || "");
  const [formData, setFormData] = useState({
    paymentMethod: data.paymentMethod || "",
    transactionId: data.transactionId || "",
    agreeToTerms: data.agreeToTerms || false
  });

  useEffect(() => {
    const isValid = selectedPaymentMethod && 
                    (selectedPaymentMethod === 'pay_later' || formData.transactionId) && 
                    formData.agreeToTerms;
    onValidationChange?.(!!isValid);
  }, [selectedPaymentMethod, formData, onValidationChange]);

  // Calculate fees based on license type (this would come from previous steps)
  const feeBreakdown = {
    monthlyFee: 3000.00,
    securityDeposit: 500.00,
    processingFee: 100.00,
    total: 3600.00
  };

  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
  const cashbackAmount = selectedMethod?.hasCashback ? feeBreakdown.total * 0.05 : 0;
  const finalAmount = feeBreakdown.total - cashbackAmount;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    if (selectedPaymentMethod !== 'pay_later' && !formData.transactionId) {
      alert("Please enter transaction ID");
      return;
    }

    if (!formData.agreeToTerms) {
      alert("Please agree to the terms and conditions");
      return;
    }

    onSubmit({
      paymentMethod: selectedPaymentMethod,
      transactionId: formData.transactionId,
      totalAmount: finalAmount,
      cashbackAmount,
      feeBreakdown,
      agreeToTerms: formData.agreeToTerms
    });
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <h5 className="mb-0 me-3">Step 5: Fee Payment</h5>
        <div className="badge bg-warning text-dark">Required</div>
      </div>

      <div className="mb-4">
        <p className="text-muted">Complete your license fee payment to proceed with the application.</p>
      </div>

      {/* Fee Breakdown */}
      <div className="card bg-light mb-4">
        <div className="card-body">
          <h6 className="mb-3">Fee Breakdown</h6>
          <div className="row">
            <div className="col-md-8">
              <div className="d-flex justify-content-between mb-2">
                <span>Monthly Fee:</span>
                <strong>৳ {feeBreakdown.monthlyFee.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Security deposit (Refundable):</span>
                <strong>৳ {feeBreakdown.securityDeposit.toFixed(2)}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Processing Fee:</span>
                <strong>৳ {feeBreakdown.processingFee.toFixed(2)}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Total:</span>
                <strong className="text-warning">৳ {feeBreakdown.total.toFixed(2)}</strong>
              </div>
              
              {cashbackAmount > 0 && (
                <>
                  <div className="d-flex justify-content-between mb-2 text-success">
                    <span><FiPercent className="me-1" />5% Cashback (bKash):</span>
                    <strong>-৳ {cashbackAmount.toFixed(2)}</strong>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <span>Final Amount:</span>
                    <strong className="text-success">৳ {finalAmount.toFixed(2)}</strong>
                  </div>
                </>
              )}
            </div>
            <div className="col-md-4">
              <div className="alert alert-info">
                <h6 className="mb-2">Payment Information</h6>
                <small className="d-block mb-1">• Security deposit is refundable</small>
                <small className="d-block mb-1">• Processing fee is non-refundable</small>
                <small className="d-block">• 5% cashback on bKash payments</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <h6 className="mb-3">Payment Method</h6>
        <div className="row g-3 mb-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedPaymentMethod === method.id;
            
            return (
              <div key={method.id} className="col-md-6">
                <div
                  className={`card h-100 license-selection-card ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedPaymentMethod(method.id);
                    setFormData(prev => ({ ...prev, paymentMethod: method.id }));
                  }}
                >
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-2">
                      <Icon size={24} className="me-3" />
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{method.name}</h6>
                        <small className="text-muted">{method.description}</small>
                      </div>
                      {method.hasCashback && (
                        <span className="badge bg-success">5% Cashback</span>
                      )}
                    </div>
                    
                    {method.id === 'pay_later' && (
                      <div className="alert alert-warning py-2 mb-0">
                        <small>Pay at designated vending booth within 7 days</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Transaction ID Input */}
        {selectedPaymentMethod && selectedPaymentMethod !== 'pay_later' && (
          <div className="row g-3 mb-4">
            <div className="col-md-6">
              <label className="form-label fw-bold">Transaction ID</label>
              <input
                type="text"
                className="form-control"
                name="transactionId"
                placeholder="Enter your transaction ID"
                value={formData.transactionId}
                onChange={handleChange}
                required
              />
              <small className="text-muted">Please provide the transaction ID after completing payment</small>
            </div>
          </div>
        )}

        {/* Payment Instructions */}
        {selectedPaymentMethod && selectedPaymentMethod !== 'pay_later' && (
          <div className="card bg-light mb-4">
            <div className="card-body">
              <h6 className="mb-3">Payment Instructions</h6>
              <div className="row">
                <div className="col-md-6">
                  <h6>Mobile Banking (bKash/Nagad)</h6>
                  <ol className="small">
                    <li>Open your {selectedPaymentMethod} app</li>
                    <li>Go to "Send Money" or "Pay Bill"</li>
                    <li>Enter merchant number: 017XXXXXXXX</li>
                    <li>Enter amount: ৳ {finalAmount.toFixed(2)}</li>
                    <li>Enter PIN to confirm</li>
                    <li>Save transaction ID</li>
                  </ol>
                </div>
                <div className="col-md-6">
                  <h6>Credit/Debit Card (Visa/Mastercard)</h6>
                  <ol className="small">
                    <li>Click "Pay with Card" button</li>
                    <li>Enter card details</li>
                    <li>Enter billing information</li>
                    <li>Confirm payment</li>
                    <li>Save transaction ID</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terms and Conditions */}
        <div className="card bg-light mb-4">
          <div className="card-body">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="agreeToTerms"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                required
              />
              <label className="form-check-label" htmlFor="agreeToTerms">
                I agree to the terms and conditions of the license application. I understand that the security deposit is refundable upon license termination, and the processing fee is non-refundable.
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
