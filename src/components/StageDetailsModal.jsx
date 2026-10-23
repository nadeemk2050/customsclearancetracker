import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, User, Save, ShieldCheck, FileEdit } from 'lucide-react';
import { getStatusStage } from '../utils/statusStages';
import { formatDateTime } from '../utils/dateUtils';

const labelStyle = {
  display: 'block',
  fontWeight: 700,
  fontSize: '0.8rem',
  color: '#334155',
  marginBottom: '4px'
};

/**
 * StageDetailsModal
 * Allows viewing and editing saved details/answers for:
 * 1. Present status (blue active point)
 * 2. Passed / completed statuses (green checkmark points)
 * Crucially: Editing details for a passed stage updates that stage's records
 * WITHOUT changing the overall shipment customsStatus back!
 */
export const StageDetailsModal = ({
  isOpen,
  stageId,
  stageLabel,
  shipment,
  initialAnswers = {},
  isCurrentStatus = false,
  currentUser,
  onClose,
  onSave
}) => {
  const [answers, setAnswers] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAnswers({ ...initialAnswers });
    }
  }, [isOpen, initialAnswers]);

  if (!isOpen || !shipment || !stageId) return null;

  const stage = getStatusStage(stageId);
  const displayLabel = stageLabel || stage?.label || stageId;
  const staffName = currentUser?.displayName || currentUser?.username || 'Staff User';

  const handleChange = (key, value) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(answers);
      onClose();
    } catch (err) {
      console.error('Error saving stage details:', err);
      window.alert('❌ Error saving stage details: ' + (err?.message || 'Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box" style={{ maxWidth: '680px', maxHeight: '92vh' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
              isCurrentStatus ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              <FileEdit size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>
                  Edit Details — {displayLabel}
                </h3>
                {isCurrentStatus ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    Active Status (Blue Point)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    Passed Status (Preserves Current: {shipment.customsStatus})
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
                BL: <strong className="font-mono text-slate-800">{shipment.blNo}</strong> · CCT: <strong className="font-mono text-slate-800">{shipment.cctRefNo || shipment.id}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon-only"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit}>
          <div className="modal-body" style={{ overflowY: 'auto' }}>
            {/* Status Stamp / Meta */}
            <div className="status-stamp" style={{ marginBottom: '12px' }}>
              <span><User size={13} /> <strong>{staffName}</strong></span>
              <span><Clock size={13} /> {formatDateTime(new Date().toISOString())}</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck size={13} /> Password Verified (abcd)
              </span>
            </div>

            {/* Explanatory Banner */}
            <div className={`p-3 rounded-lg border text-xs mb-4 ${
              isCurrentStatus 
                ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-0.5">
                <CheckCircle size={14} className={isCurrentStatus ? 'text-blue-600' : 'text-emerald-600'} />
                <span>
                  {isCurrentStatus
                    ? 'Editing Current Stage Questionnaire'
                    : 'Updating Details in Passed Status (No Status Rollback)'}
                </span>
              </div>
              <p className="m-0 text-[11px] text-slate-600">
                {isCurrentStatus
                  ? 'Update the recorded information for the current operational stage. The shipment status remains active.'
                  : `You are editing saved audit details for "${displayLabel}". The shipment customs status will remain strictly at "${shipment.customsStatus}".`}
              </p>
            </div>

            {/* Questions Form Grid */}
            {stage && stage.questions && stage.questions.length > 0 ? (
              <div className="form-grid">
                {stage.questions.map((question) => (
                  <div key={question.key} className={question.full ? 'form-full' : undefined}>
                    <label style={labelStyle} htmlFor={`edit-${stageId}-${question.key}`}>
                      {question.label}
                    </label>
                    {question.full && question.key === 'remarks' ? (
                      <textarea
                        id={`edit-${stageId}-${question.key}`}
                        className="form-control"
                        rows={3}
                        value={answers[question.key] || ''}
                        onChange={(e) => handleChange(question.key, e.target.value)}
                        placeholder={question.placeholder || 'Enter notes or remarks...'}
                      />
                    ) : (
                      <input
                        id={`edit-${stageId}-${question.key}`}
                        type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
                        className="form-control"
                        value={answers[question.key] ?? ''}
                        onChange={(e) => handleChange(question.key, e.target.value)}
                        placeholder={question.placeholder || ''}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                No extra questions configured for this status. You may record operational remarks below:
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              <Save size={15} />
              <span>{isSaving ? 'Saving Updates...' : 'Save Stage Details'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StageDetailsModal;
