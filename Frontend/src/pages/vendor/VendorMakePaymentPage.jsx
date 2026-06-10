import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiDollarSign,
  FiCreditCard,
  FiCheck,
  FiX,
  FiArrowRight,
  FiTag,
  FiAlertCircle,
} from "react-icons/fi";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorPaymentsPage.css";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(amount);
}

export default function VendorMakePaymentPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Select Type, 2: Payment Details, 3: Confirmation, 4: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [options, setOptions] = useState({
    payment_types: [],
    payment_methods: [],
  });

  const [pendingApplications, setPendingApplications] = useState([]);

  const [formData, setFormData] = useState({
    payment_type_id: "",
    payment_method_id: "",
    amount: "",
    discount_code: "",
    notes: "",
    license_application_id: "",
  });

  const [discount, setDiscount] = useState(null);
  const [discountError, setDiscountError] = useState("");
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await api.get("/payments/vendor/options");
        setOptions(res.data);
      } catch (err) {
        setError("Failed to load payment options");
      }
    }
    loadOptions();
  }, []);

  useEffect(() => {
    async function loadPendingApplications() {
      try {
        const res = await api.get("/vendor/dashboard");
        const pendingApps = res.data.applications.filter(
          app => app.status === 'submitted' || app.status === 'under-review' || app.payment_status === 'pending'
        );
        setPendingApplications(pendingApps);
      } catch (err) {
        console.error("Failed to load pending applications:", err);
      }
    }
    loadPendingApplications();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear discount when discount code changes
    if (name === "discount_code") {
      setDiscount(null);
      setDiscountError("");
    }
  };

  const validateDiscountCode = async () => {
    if (!formData.discount_code.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }

    try {
      const res = await api.get(`/payments/vendor/discount/${formData.discount_code}/validate`);
      setDiscount(res.data);
      setDiscountError("");
    } catch (err) {
      setDiscountError(err.response?.data?.message || "Invalid discount code");
      setDiscount(null);
    }
  };

  const calculateFinalAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    if (discount && discount.valid) {
      const discountAmount = (amount * discount.discount_percent) / 100;
      return amount - discountAmount;
    }
    return amount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (step === 1) {
      if (!formData.payment_type_id) {
        setError("Please select a payment type");
        return;
      }
      setStep(2);
      setError("");
    } else if (step === 2) {
      if (!formData.payment_method_id || !formData.amount) {
        setError("Please fill in all required fields");
        return;
      }
      setStep(3);
      setError("");
    } else if (step === 3) {
      await processPayment();
    }
  };

  const processPayment = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await api.post("/payments/vendor", {
        payment_type_id: formData.payment_type_id,
        payment_method_id: formData.payment_method_id,
        amount: parseFloat(formData.amount),
        discount_code: formData.discount_code || undefined,
        notes: formData.notes,
        license_application_id: formData.license_application_id || undefined,
      });
      
      setPaymentResult(res.data);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || "Payment processing failed");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      payment_type_id: "",
      payment_method_id: "",
      amount: "",
      discount_code: "",
      notes: "",
      license_application_id: "",
    });
    setDiscount(null);
    setDiscountError("");
    setPaymentResult(null);
    setError("");
  };

  const getPaymentTypeIcon = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case "license fee":
        return <FiDollarSign />;
      case "renewal fee":
        return <FiArrowRight />;
      case "penalty":
        return <FiAlertCircle />;
      default:
        return <FiCreditCard />;
    }
  };

  const getPaymentMethodIcon = (methodName) => {
    return <FiCreditCard />;
  };

  return (
    <VendorLayout>
      <PageTitle
        title="Make Payment"
        subtitle="Complete your payment securely and efficiently."
        icon={FiDollarSign}
        iconSize={62}
        className="mb-4"
      />

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2">
          <FiX /> {error}
        </div>
      )}

      {step === 4 && paymentResult ? (
        <div className="card border-0 shadow-sm app-surface-card">
          <div className="card-body p-5 text-center">
            <div className="mb-4">
              <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 mb-3">
                <FiCheck size={64} className="text-success" />
              </div>
              <h3 className="mb-2">Payment Successful!</h3>
              <p className="text-muted mb-4">
                Your payment has been processed successfully.
              </p>
            </div>

            <div className="card bg-light mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <small className="text-muted d-block">Transaction ID</small>
                    <strong>{paymentResult.transaction_id}</strong>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Amount Paid</small>
                    <strong className="text-success">{formatCurrency(paymentResult.final_amount)}</strong>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Payment Date</small>
                    <strong>{formatDate(paymentResult.payment_date)}</strong>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">Status</small>
                    <span className="badge bg-success">Completed</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate("/vendor/payments")}
              >
                View Payment History
              </button>
              <button
                className="btn btn-primary"
                onClick={resetForm}
              >
                Make Another Payment
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card border-0 shadow-sm app-surface-card">
          <div className="card-body p-4">
            {/* Progress Steps */}
            <div className="d-flex justify-content-between mb-4 position-relative">
              <div className="progress-steps d-flex w-100">
                <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                  <div className="step-number">1</div>
                  <div className="step-label">Select Type</div>
                </div>
                <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                  <div className="step-number">2</div>
                  <div className="step-label">Payment Details</div>
                </div>
                <div className={`step ${step >= 3 ? 'active' : ''}`}>
                  <div className="step-number">3</div>
                  <div className="step-label">Confirmation</div>
                </div>
              </div>
            </div>

            {loading ? (
              <LoadingState label="Processing payment..." />
            ) : (
              <form onSubmit={handleSubmit}>
                {/* Step 1: Select Payment Type */}
                {step === 1 && (
                  <div>
                    <h5 className="mb-3">Select Payment Type</h5>
                    <div className="row g-3">
                      {Array.from(
                        new Map(options.payment_types.map(item => [item.name, item])).values()
                      ).map((type) => (
                        <div className="col-md-6" key={type.id}>
                          <div
                            className={`payment-type-card ${formData.payment_type_id === type.id ? 'selected' : ''}`}
                            onClick={() => setFormData({ ...formData, payment_type_id: type.id })}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <div className="payment-type-icon">
                                {getPaymentTypeIcon(type.name)}
                              </div>
                              <div>
                                <h6 className="mb-1">{type.name}</h6>
                                <p className="text-muted small mb-0">{type.description}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="d-flex justify-content-end mt-4">
                      <button type="submit" className="btn btn-primary">
                        Continue <FiArrowRight className="ms-2" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Payment Details */}
                {step === 2 && (
                  <div>
                    <h5 className="mb-3">Payment Details</h5>

                    {/* License Application Selection for License Fee */}
                    {options.payment_types.find(t => t.id === parseInt(formData.payment_type_id))?.name === 'License Fee' && pendingApplications.length > 0 && (
                      <div className="mb-3">
                        <label className="form-label">Select License Application (Optional)</label>
                        <select
                          className="form-select"
                          name="license_application_id"
                          value={formData.license_application_id}
                          onChange={handleInputChange}
                        >
                          <option value="">-- Select Application --</option>
                          {pendingApplications.map(app => (
                            <option key={app.id} value={app.id}>
                              {app.application_ref} - {app.desired_zone} ({app.status})
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">Link this payment to a pending license application</small>
                      </div>
                    )}

                    <div className="mb-3">
                      <label className="form-label">Payment Method *</label>
                      <div className="row g-3">
                        {Array.from(
                          new Map(options.payment_methods.map(item => [item.display_name, item])).values()
                        ).map((method) => (
                          <div className="col-md-6" key={method.id}>
                            <div
                              className={`payment-method-card ${formData.payment_method_id === method.id ? 'selected' : ''}`}
                              onClick={() => setFormData({ ...formData, payment_method_id: method.id })}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div className="payment-method-icon">
                                  {getPaymentMethodIcon(method.name)}
                                </div>
                                <div>
                                  <h6 className="mb-0">{method.display_name}</h6>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Amount (BDT) *</label>
                      <input
                        type="number"
                        name="amount"
                        className="form-control"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="Enter amount"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Discount Code (Optional)</label>
                      <div className="input-group">
                        <input
                          type="text"
                          name="discount_code"
                          className="form-control"
                          value={formData.discount_code}
                          onChange={handleInputChange}
                          placeholder="Enter discount code"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={validateDiscountCode}
                        >
                          <FiTag /> Apply
                        </button>
                      </div>
                      {discountError && (
                        <div className="text-danger small mt-1">{discountError}</div>
                      )}
                      {discount && discount.valid && (
                        <div className="text-success small mt-1">
                          <FiCheck /> Discount applied: {discount.discount_percent}% off
                        </div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Notes (Optional)</label>
                      <textarea
                        name="notes"
                        className="form-control"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Add any notes for this payment"
                        rows="3"
                      />
                    </div>

                    {/* Amount Summary */}
                    <div className="card bg-light mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <span>Amount:</span>
                          <strong>{formatCurrency(parseFloat(formData.amount) || 0)}</strong>
                        </div>
                        {discount && discount.valid && (
                          <div className="d-flex justify-content-between mb-2 text-success">
                            <span>Discount ({discount.discount_percent}%):</span>
                            <strong>-{formatCurrency((parseFloat(formData.amount) * discount.discount_percent) / 100)}</strong>
                          </div>
                        )}
                        <hr />
                        <div className="d-flex justify-content-between">
                          <span className="fw-bold">Total:</span>
                          <strong className="text-success fs-5">{formatCurrency(calculateFinalAmount())}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button type="button" className="btn btn-outline-secondary" onClick={goBack}>
                        Back
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Review Payment <FiArrowRight className="ms-2" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <div>
                    <h5 className="mb-3">Confirm Payment</h5>
                    
                    <div className="card bg-light mb-4">
                      <div className="card-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <small className="text-muted d-block">Payment Type</small>
                            <strong>
                              {options.payment_types.find(t => t.id === parseInt(formData.payment_type_id))?.name}
                            </strong>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted d-block">Payment Method</small>
                            <strong>
                              {options.payment_methods.find(m => m.id === parseInt(formData.payment_method_id))?.display_name}
                            </strong>
                          </div>
                          <div className="col-md-6">
                            <small className="text-muted d-block">Amount</small>
                            <strong>{formatCurrency(parseFloat(formData.amount))}</strong>
                          </div>
                          {discount && discount.valid && (
                            <div className="col-md-6">
                              <small className="text-muted d-block">Discount Applied</small>
                              <strong className="text-success">{discount.discount_percent}%</strong>
                            </div>
                          )}
                          <div className="col-12">
                            <hr />
                            <small className="text-muted d-block">Total Amount to Pay</small>
                            <strong className="text-success fs-4">{formatCurrency(calculateFinalAmount())}</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {formData.notes && (
                      <div className="mb-4">
                        <small className="text-muted d-block">Notes</small>
                        <p>{formData.notes}</p>
                      </div>
                    )}

                    <div className="alert alert-info d-flex align-items-start gap-2">
                      <FiAlertCircle className="mt-1" />
                      <div>
                        <strong>Important:</strong> By clicking "Confirm Payment", you authorize this transaction. 
                        Please review all details carefully before proceeding.
                      </div>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button type="button" className="btn btn-outline-secondary" onClick={goBack}>
                        Back
                      </button>
                      <button type="submit" className="btn btn-success btn-lg">
                        <FiCheck className="me-2" /> Confirm Payment
                      </button>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      )}
    </VendorLayout>
  );
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
