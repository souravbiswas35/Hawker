import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/layout/VendorLayout';
import PageTitle from '../../components/common/PageTitle';
import { FiFileText, FiCheckCircle, FiClock, FiXCircle, FiUser, FiMessageSquare, FiDownload, FiUpload, FiTrash2, FiAlertCircle, FiCalendar, FiMapPin, FiDollarSign } from 'react-icons/fi';
import api from '../../api/client';

const applicationStages = [
  { id: 'submitted', name: 'Application Submitted', description: 'Your application has been successfully submitted and assigned a tracking number.', icon: FiFileText },
  { id: 'document_verification', name: 'Documents Verification', description: 'All submitted documents have been verified and approved. If not, please provide all the details given in order.', icon: FiCheckCircle },
  { id: 'admin_review', name: 'Admin Review', description: 'Your application is currently being reviewed by our licensing team. We are verifying zone availability and assessing your business\'s eligibility.', icon: FiClock },
  { id: 'field_inspection_scheduled', name: 'Field Inspection Scheduled', description: 'Once admin review is complete, a field inspection will be scheduled. You will receive a notification with date and time.', icon: FiCalendar },
  { id: 'inspection_conducted', name: 'Inspection Conducted', description: 'An inspector will visit your proposed vending location to verify compliance with regulations and assess the site.', icon: FiCheckCircle },
  { id: 'final_approval', name: 'Final Approval & License Issuance', description: 'After successful inspection, your license will be approved and issued. You can download your digital ID card and start your business.', icon: FiCheckCircle },
  { id: 'rejected', name: 'Application Rejected', description: 'Your application has been rejected. Please check the admin comments for more details.', icon: FiXCircle },
];

export default function TrackLicenseApplicationPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawModal, setWithdrawModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const loadApplication = async () => {
      try {
        // First try to get from dashboard data
        const { data } = await api.get("/vendor/dashboard");
        const application = data.applications?.find(app => app.id == applicationId);
        
        if (application) {
          setApplication(application);
        } else {
          setError('Application not found');
        }
      } catch (err) {
        console.error('Failed to load application:', err);
        setError('Failed to load application details');
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  const getCurrentStageIndex = (status) => {
    return applicationStages.findIndex(stage => stage.id === status);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'submitted':
      case 'document_verification':
      case 'admin_review':
      case 'field_inspection_scheduled':
        return 'text-warning';
      case 'inspection_conducted':
      case 'final_approval':
        return 'text-success';
      case 'rejected':
        return 'text-danger';
      default:
        return 'text-muted';
    }
  };

  const handleWithdrawApplication = async () => {
    try {
      await api.put(`/license/applications/${applicationId}/withdraw`);
      navigate('/vendor/applications');
    } catch (err) {
      console.error('Failed to withdraw application:', err);
      setError('Failed to withdraw application');
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('document', selectedFile);
    
    try {
      await api.post(`/license/applications/${applicationId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadModal(false);
      setSelectedFile(null);
      // Reload application data
      const { data } = await api.get(`/license/applications/${applicationId}`);
      setApplication(data);
    } catch (err) {
      console.error('Failed to upload document:', err);
      setError('Failed to upload document');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'submitted': { text: 'Under Review', color: 'bg-warning' },
      'document_verification': { text: 'Under Review', color: 'bg-warning' },
      'admin_review': { text: 'Under Review', color: 'bg-warning' },
      'field_inspection_scheduled': { text: 'Under Review', color: 'bg-warning' },
      'inspection_conducted': { text: 'Under Review', color: 'bg-warning' },
      'final_approval': { text: 'Approved', color: 'bg-success' },
      'rejected': { text: 'Rejected', color: 'bg-danger' },
    };
    
    const config = statusConfig[status] || { text: 'Unknown', color: 'bg-secondary' };
    return <span className={`badge ${config.color} text-white`}>{config.text}</span>;
  };

  if (loading) {
    return (
      <VendorLayout>
        <div className="text-center py-5">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </VendorLayout>
    );
  }

  if (error || !application) {
    return (
      <VendorLayout>
        <div className="alert alert-danger">{error || 'Application not found'}</div>
      </VendorLayout>
    );
  }

  const currentStageIndex = getCurrentStageIndex(application.status);

  return (
    <VendorLayout>
      <PageTitle
        title="Track License Application"
        subtitle="Monitor your application status and progress"
        icon={FiFileText}
        className="mb-4"
      />

      {/* Status Banner */}
      <div className="card border-0 shadow-sm app-surface-card mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-2">Application Status</h4>
              <div className="d-flex align-items-center gap-3">
                {getStatusBadge(application.status)}
                <span className="text-muted">Application ID: {application.application_ref}</span>
              </div>
            </div>
            <div className="text-end">
              <div className="text-muted small">Estimated Processing Time</div>
              <div className="fw-bold">3-5 business days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Stepper */}
      <div className="card border-0 shadow-sm app-surface-card mb-4">
        <div className="card-body p-4">
          <h5 className="mb-4">Application Progress</h5>
          <div className="application-stepper">
            {applicationStages.map((stage, index) => {
              const Icon = stage.icon;
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isPending = index > currentStageIndex;
              
              return (
                <div key={stage.id} className="stepper-item">
                  <div className="stepper-marker">
                    <div className={`stepper-icon ${isCompleted ? 'completed' : isCurrent ? 'current' : 'pending'}`}>
                      <Icon className={getStatusColor(application.status)} />
                    </div>
                    {index < applicationStages.length - 1 && (
                      <div className={`stepper-line ${isCompleted ? 'completed' : ''}`}></div>
                    )}
                  </div>
                  <div className="stepper-content">
                    <h6 className={`stepper-title ${isCurrent ? 'text-warning' : isCompleted ? 'text-success' : 'text-muted'}`}>
                      {stage.name}
                    </h6>
                    <p className="stepper-description text-muted small">{stage.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* License Details */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm app-surface-card h-100">
            <div className="card-body p-4">
              <h5 className="mb-3">License Details</h5>
              <div className="detail-item">
                <div className="detail-label">
                  <FiFileText className="me-2" />
                  License Type
                </div>
                <div className="detail-value">{application.license_type || 'Monthly License'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <FiMapPin className="me-2" />
                  Selected Zone
                </div>
                <div className="detail-value">{application.desired_zone || 'Not specified'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">
                  <FiMapPin className="me-2" />
                  Zone Location
                </div>
                <div className="detail-value">{application.zone_location || 'Not specified'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="col-lg-6">
          <div className="card border-0 shadow-sm app-surface-card h-100">
            <div className="card-body p-4">
              <h5 className="mb-3">Business Information</h5>
              <div className="detail-item">
                <div className="detail-label">Business Type</div>
                <div className="detail-value">{application.business_type || 'Not specified'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Items to Sell</div>
                <div className="detail-value">{application.items_to_sell || 'Not specified'}</div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Operating Hours</div>
                <div className="detail-value">{application.operating_hours || 'Not specified'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="card border-0 shadow-sm app-surface-card mb-4">
        <div className="card-body p-4">
          <h5 className="mb-3">Payment Status</h5>
          <div className="row g-3">
            <div className="col-md-3">
              <div className="payment-item">
                <div className="payment-label">License Fee</div>
                <div className="payment-value">
                  <FiDollarSign className="me-1" />
                  {application.license_fee || '3000.00'}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="payment-item">
                <div className="payment-label">Security Deposit</div>
                <div className="payment-value">
                  <FiDollarSign className="me-1" />
                  {application.security_deposit || '500.00'}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="payment-item">
                <div className="payment-label">Processing Fee</div>
                <div className="payment-value">
                  <FiDollarSign className="me-1" />
                  {application.processing_fee || '100.00'}
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="payment-item">
                <div className="payment-label">Total Amount</div>
                <div className="payment-value fw-bold">
                  <FiDollarSign className="me-1" />
                  {application.total_amount || '3600.00'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspector Details */}
      {application.inspector && (
        <div className="card border-0 shadow-sm app-surface-card mb-4">
          <div className="card-body p-4">
            <h5 className="mb-3">Upcoming Field Inspection</h5>
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <div className="inspector-avatar me-3">
                  <FiUser className="fs-2 text-primary" />
                </div>
                <div>
                  <h6 className="mb-1">{application.inspector.name}</h6>
                  <div className="text-muted small">Inspector ID: {application.inspector.id}</div>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary btn-sm">
                  <FiMessageSquare className="me-1" />
                  Contact Inspector
                </button>
                <button className="btn btn-outline-secondary btn-sm">
                  <FiMessageSquare className="me-1" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Comments */}
      {application.admin_comments && (
        <div className="card border-0 shadow-sm app-surface-card mb-4">
          <div className="card-body p-4">
            <h5 className="mb-3">Admin Comments</h5>
            <div className="alert alert-info">
              <FiAlertCircle className="me-2" />
              {application.admin_comments}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card border-0 shadow-sm app-surface-card">
        <div className="card-body p-4">
          <h5 className="mb-3">Actions</h5>
          <div className="d-flex flex-wrap gap-2">
            <button className="btn btn-outline-primary">
              <FiDownload className="me-2" />
              Download Application Copy
            </button>
            <button className="btn btn-outline-success" onClick={() => setUploadModal(true)}>
              <FiUpload className="me-2" />
              Upload Additional Document
            </button>
            <button className="btn btn-outline-danger" onClick={() => setWithdrawModal(true)}>
              <FiTrash2 className="me-2" />
              Withdraw Application
            </button>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {uploadModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Additional Document</h5>
                <button type="button" className="btn-close" onClick={() => setUploadModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Select Document</label>
                  <input
                    type="file"
                    className="form-control"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setUploadModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleFileUpload}>
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawModal && (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Withdraw Application</h5>
                <button type="button" className="btn-close" onClick={() => setWithdrawModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to withdraw this application? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setWithdrawModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleWithdrawApplication}>
                  Withdraw Application
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .application-stepper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .stepper-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        
        .stepper-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        
        .stepper-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border: 2px solid #dee2e6;
        }
        
        .stepper-icon.completed {
          background: #d1f2eb;
          border-color: #28a745;
        }
        
        .stepper-icon.current {
          background: #fff3cd;
          border-color: #ffc107;
        }
        
        .stepper-line {
          width: 2px;
          height: 40px;
          background: #dee2e6;
          margin-top: 8px;
        }
        
        .stepper-line.completed {
          background: #28a745;
        }
        
        .stepper-content {
          flex: 1;
        }
        
        .stepper-title {
          margin-bottom: 0.25rem;
          font-weight: 600;
        }
        
        .stepper-description {
          line-height: 1.4;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .detail-item:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: 500;
          color: #6c757d;
        }
        
        .detail-value {
          font-weight: 600;
        }
        
        .payment-item {
          text-align: center;
          padding: 1rem;
          border: 1px solid #f0f0f0;
          border-radius: 8px;
        }
        
        .payment-label {
          font-size: 0.875rem;
          color: #6c757d;
          margin-bottom: 0.25rem;
        }
        
        .payment-value {
          font-size: 1.25rem;
          font-weight: 600;
          color: #28a745;
        }
        
        .inspector-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </VendorLayout>
  );
}
