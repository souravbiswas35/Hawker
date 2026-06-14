import { useState, useEffect } from "react";
import { FiUpload, FiFile, FiCheck, FiAlertCircle, FiDownload } from "react-icons/fi";
import api from "../../../api/client";

const requiredDocuments = [
  { id: 'national_id', name: 'National ID', required: true, description: 'Front and back of your national ID card' },
  { id: 'address_proof', name: 'Address Proof', required: true, description: 'Utility bill or rental agreement' },
  { id: 'business_registration', name: 'Business Registration', required: false, description: 'If you have registered business' },
  { id: 'health_certificate', name: 'Health Certificate', required: false, description: 'Required for food vendors only' },
  { id: 'photo', name: 'Recent Photograph', required: true, description: 'Passport size photograph' }
];

export default function Step4DocumentVerification({ onSubmit, data, loading, onValidationChange }) {
  const [documents, setDocuments] = useState(data.documentVerification || {});
  const [uploading, setUploading] = useState({});
  const [existingDocs, setExistingDocs] = useState([]);

  useEffect(() => {
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const allRequiredUploaded = requiredDocs.every(doc => isDocumentComplete(doc.id));
    onValidationChange?.(allRequiredUploaded);
  }, [documents, existingDocs, onValidationChange]);

  useEffect(() => {
    fetchExistingDocuments();
  }, []);

  const fetchExistingDocuments = async () => {
    try {
      // For license application, use existing documents from the application data
      setExistingDocs(data.documentVerification ? Object.keys(data.documentVerification) : []);
    } catch (err) {
      console.error("Failed to fetch existing documents");
    }
  };

  const handleFileUpload = async (documentType, files) => {
    const file = files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [documentType]: true }));

    try {
      // Check if applicationId is available
      if (!data.applicationId) {
        throw new Error("Application ID not found. Please start the application from the beginning.");
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);

      console.log("Uploading document for application:", data.applicationId, "Type:", documentType, "File:", file.name);

      // Upload file to server
      const { data: responseData } = await api.post(`/license/applications/${data.applicationId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log("Upload successful:", responseData);

      // Update documents state with server response
      setDocuments(prev => {
        const updated = {
          ...prev,
          [documentType]: {
            fileName: responseData.fileName,
            storedName: responseData.storedName,
            mimeType: file.type,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            uploaded: true
          }
        };
        console.log("Updated documents state:", updated);
        return updated;
      });

      setExistingDocs(prev => {
        const updated = [...prev, documentType];
        console.log("Updated existing docs:", updated);
        return updated;
      });
    } catch (err) {
      console.error("Upload failed:", err);
      alert(`Failed to upload document: ${err.response?.data?.message || err.message || "Unknown error"}`);
    } finally {
      setUploading(prev => ({ ...prev, [documentType]: false }));
    }
  };

  const handleRemoveDocument = (documentType) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[documentType];
      return newDocs;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if all required documents are uploaded
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const missingDocs = requiredDocs.filter(doc => !documents[doc.id]?.uploaded);

    if (missingDocs.length > 0) {
      alert(`Please upload all required documents: ${missingDocs.map(doc => doc.name).join(', ')}`);
      return;
    }

    console.log("Submitting document verification:", documents);
    onSubmit({ documentVerification: documents });
  };

  const getExistingDocForType = (documentType) => {
    return existingDocs.find(doc => doc.document_type === documentType);
  };

  const isDocumentComplete = (documentType) => {
    return documents[documentType]?.uploaded || getExistingDocForType(documentType);
  };

  return (
    <div>
      <div className="d-flex align-items-center mb-4">
        <h5 className="mb-0 me-3">Step 4: Document Verification</h5>
        <div className="badge bg-warning text-dark">Required</div>
      </div>

      <div className="mb-4">
        <p className="text-muted">Upload and verify all required documents for your license application.</p>
      </div>

      {/* Existing Documents from Profile */}
      {existingDocs.length > 0 && (
        <div className="card bg-light mb-4">
          <div className="card-body">
            <h6 className="mb-3">Documents from Profile</h6>
            <div className="row g-2">
              {existingDocs.map(docId => {
                const doc = requiredDocuments.find(d => d.id === docId);
                if (!doc) return null;
                return (
                  <div key={doc.id} className="col-md-6">
                    <div className="d-flex align-items-center p-2 border rounded">
                      <FiFile className="me-2 text-success" />
                      <div className="flex-grow-1">
                        <small className="fw-bold">{doc.name.toUpperCase()}</small>
                        <br />
                        <small className="text-muted">{doc.description}</small>
                      </div>
                      <FiCheck className="text-success" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <h6 className="mb-3">Upload Documents</h6>
        <div className="row g-3">
          {requiredDocuments.map((doc) => {
            const isUploaded = isDocumentComplete(doc.id);
            const isCurrentlyUploading = uploading[doc.id];
            const existingDoc = getExistingDocForType(doc.id);

            return (
              <div key={doc.id} className="col-md-6">
                <div className={`card h-100 ${isUploaded ? 'border-success bg-light' : 'border-secondary'}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="mb-1">
                          {doc.name}
                          {doc.required && <span className="text-danger ms-1">*</span>}
                        </h6>
                        <small className="text-muted">{doc.description}</small>
                      </div>
                      {isUploaded && <FiCheck className="text-success" />}
                    </div>

                    {existingDoc ? (
                      <div className="alert alert-success py-2 mb-2">
                        <FiCheck className="me-1" />
                        <small>Document available from profile</small>
                      </div>
                    ) : documents[doc.id]?.uploaded ? (
                      <div className="alert alert-success py-2 mb-2">
                        <FiCheck className="me-1" />
                        <small>Uploaded: {documents[doc.id].fileName}</small>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded mb-2 p-3">
                        <input
                          type="file"
                          id={`file-${doc.id}`}
                          className="d-none"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileUpload(doc.id, e.target.files)}
                          disabled={isCurrentlyUploading}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-warning w-100"
                          onClick={() => document.getElementById(`file-${doc.id}`).click()}
                          disabled={isCurrentlyUploading}
                        >
                          {isCurrentlyUploading ? (
                            <span>
                              <div className="spinner-border spinner-border-sm me-2 d-inline-block" />
                              Uploading...
                            </span>
                          ) : (
                            <span>
                              <FiUpload className="me-2" />
                              Upload Document
                            </span>
                          )}
                        </button>
                        <small className="text-muted d-block text-center mt-2">PNG, JPG, PDF (Max 5MB)</small>
                      </div>
                    )}

                    {!doc.required && (
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`skip-${doc.id}`}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleRemoveDocument(doc.id);
                            }
                          }}
                        />
                        <label className="form-check-label" htmlFor={`skip-${doc.id}`}>
                          <small>Skip this document</small>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Health Certificate Notice */}
        <div className="alert alert-info mt-4">
          <FiAlertCircle className="me-2" />
          <strong>Health Certificate Required:</strong> If you're applying for food & beverages category, a health certificate is mandatory. Please upload it to avoid delays in processing.
        </div>

        {/* Document Summary */}
        <div className="card bg-light mt-4">
          <div className="card-body">
            <h6 className="mb-3">Document Status Summary</h6>
            <div className="row">
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>Required Documents:</strong> {requiredDocuments.filter(d => d.required).length}
                </p>
                <p className="mb-1">
                  <strong>Uploaded:</strong> {requiredDocuments.filter(d => isDocumentComplete(d.id)).length}
                </p>
              </div>
              <div className="col-md-6">
                <p className="mb-1">
                  <strong>Status:</strong> 
                  <span className={`ms-2 ${requiredDocuments.filter(d => d.required).every(d => isDocumentComplete(d.id)) ? 'text-success' : 'text-warning'}`}>
                    {requiredDocuments.filter(d => d.required).every(d => isDocumentComplete(d.id)) ? 'Complete' : 'Incomplete'}
                  </span>
                </p>
                <p className="mb-1">
                  <strong>Missing:</strong> {requiredDocuments.filter(d => d.required && !isDocumentComplete(d.id)).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
