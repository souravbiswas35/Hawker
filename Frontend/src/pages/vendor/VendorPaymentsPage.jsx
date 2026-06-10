import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet,
  CheckCircle2,
  Calendar,
  BarChart3,
  DollarSign,
  Download,
  FileText,
} from "lucide-react";
import api from "../../api/client";
import LoadingState from "../../components/common/LoadingState";
import PageTitle from "../../components/common/PageTitle";
import VendorLayout from "../../components/layout/VendorLayout";
import "../../styles/pages/vendor/VendorPaymentsPage.css";

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
  }).format(amount);
}

export default function VendorPaymentsPage() {
  const [data, setData] = useState({
    outstanding_dues: [],
    payment_history: [],
    upcoming_payments: [],
    total_outstanding: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/payments/vendor/dashboard");
        console.log("Payment dashboard data:", res.data);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load payment data:", err);
        setError(err.response?.data?.message || "Failed to load payment data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Calculate statistics
  const totalPaidThisYear = data.payment_history
    .filter(p => new Date(p.payment_date).getFullYear() === new Date().getFullYear())
    .reduce((sum, p) => sum + parseFloat(p.final_amount || p.amount), 0);

  const nextPaymentDue = data.upcoming_payments.length > 0 
    ? data.upcoming_payments[0] 
    : null;

  const totalTransactions = data.payment_history.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <VendorLayout>
      <PageTitle
        title="Payment Dashboard"
        subtitle="Manage your payments, view outstanding dues, and track your transaction history."
        icon={Wallet}
        iconSize={62}
        className="mb-4"
      />

      <div className="payment-dashboard-container">
        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}
        
        {loading ? (
          <LoadingState label="Loading payment data..." />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="payment-dashboard-content"
          >
            {/* Statistics Cards */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="statistics-cards-grid"
            >
              {/* Outstanding Dues */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)" }}
                transition={{ duration: 0.3 }}
                className="stat-card"
              >
                <Wallet className="stat-card-icon" />
                <div className="stat-card-value">
                  {formatCurrency(data.total_outstanding).replace('৳', '').trim()}
                </div>
                <div className="stat-card-label">
                  Outstanding Dues
                </div>
              </motion.div>

              {/* Total Paid This Year */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)" }}
                transition={{ duration: 0.3 }}
                className="stat-card"
              >
                <CheckCircle2 className="stat-card-icon" />
                <div className="stat-card-value">
                  {totalPaidThisYear.toLocaleString()}
                </div>
                <div className="stat-card-label">
                  Total Paid (This Year)
                </div>
              </motion.div>

              {/* Next Payment Due */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)" }}
                transition={{ duration: 0.3 }}
                className="stat-card"
              >
                <Calendar className="stat-card-icon" />
                <div className="stat-card-value">
                  {nextPaymentDue ? formatDate(nextPaymentDue.due_date) : "N/A"}
                </div>
                <div className="stat-card-label">
                  Next Payment Due
                </div>
              </motion.div>

              {/* Transactions */}
              <motion.div
                variants={cardVariants}
                whileHover={{ y: -4, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)" }}
                transition={{ duration: 0.3 }}
                className="stat-card"
              >
                <BarChart3 className="stat-card-icon" />
                <div className="stat-card-value">
                  {totalTransactions}
                </div>
                <div className="stat-card-label">
                  Transactions
                </div>
              </motion.div>
            </motion.div>

            {/* Upcoming Payments Section */}
            <motion.div
              variants={cardVariants}
              className="upcoming-payments-section"
            >
              <div className="upcoming-payments-header">
                <Calendar className="upcoming-payments-header-icon" />
                <div>
                  <h2 className="upcoming-payments-title">Upcoming Payments</h2>
                  <p className="upcoming-payments-description">
                    Never worry about license expiry. We'll automatically renew your license 7 days before expiry and send you a confirmation.
                  </p>
                </div>
              </div>

              {data.upcoming_payments.length === 0 ? (
                <div className="empty-state">
                  <Calendar className="empty-state-icon" />
                  <p className="empty-state-text">No upcoming payments scheduled</p>
                </div>
              ) : (
                <div className="payment-cards-list">
                  {data.upcoming_payments.map((payment, index) => (
                    <motion.div
                      key={payment.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      className={`payment-card ${index % 2 === 0 ? 'license-renewal' : 'zone-maintenance'}`}
                    >
                      <div className="payment-card-content">
                        <h3 className="payment-card-title">{payment.title}</h3>
                        <p className="payment-card-subtitle">
                          Due in {Math.ceil((new Date(payment.due_date) - new Date()) / (1000 * 60 * 60 * 24))} days • {formatDate(payment.due_date)}
                        </p>
                      </div>
                      <div className="payment-card-amount">
                        ৳ {parseFloat(payment.amount).toLocaleString()}.00
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              variants={cardVariants}
              className="quick-actions-section"
            >
              <h3 className="quick-actions-title">Quick Actions</h3>
              <div className="quick-actions-grid">
                <Link
                  to="/vendor/payments/make"
                  className="quick-action-button primary"
                >
                  <DollarSign className="quick-action-icon" />
                  Make a Payment
                </Link>
                <Link
                  to="/vendor/payments/history"
                  className="quick-action-button outline-primary"
                >
                  <FileText className="quick-action-icon" />
                  View Full History
                </Link>
                <Link
                  to="/vendor/payments/history"
                  className="quick-action-button outline-secondary"
                >
                  <Download className="quick-action-icon" />
                  Download Statement
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </VendorLayout>
  );
}
