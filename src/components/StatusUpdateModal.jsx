import React, { useState } from 'react';
import { X, Clock, User, ClipboardCheck } from 'lucide-react';
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
 * Asks the stage-specific questions when a BL/consignment status changes.
 * The update time and the acting user are always stamped automatically.
 */
export const StatusUpdateModal = ({
  isOpen,
  shipment,
  status,
  containerNo = null,
  currentUser,
  requestedAt,
  onClose,
  onConfirm
}) => {
  const [answers, setAnswers] = useState({});

  if (!isOpen || !shipment || !status) return null;

  const stage = getStatusStage(status);
  const recordedBy = currentUser?.displayName || currentUser?.username || 'Unknown user';
  const recordedAt = formatDateTime(requestedAt);

  const handleChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '700px', maxHeight: '92vh' }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.05rem' }}>Update Status — {stage?.label || status}</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              BL: <strong>{shipment.blNo || shipment.id}</strong>
              {containerNo ? <> · Container <strong>{containerNo}</strong></> : null}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-icon-only"
            onClick={onClose}
            aria-label="Close status update"
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto' }}>
          <div className="status-stamp">
            <span><User size={13} /> <strong>{recordedBy}</strong></span>
            <span><Clock size={13} /> {recordedAt}</span>
          </div>
          <p className="status-stamp-note">
            The update time and your user name are saved automatically. Every field below is optional —
            leave any of them blank if the information is not available yet.
          </p>

          {stage && stage.questions.length > 0 ? (
            <div className="form-grid">
              {stage.questions.map((question) => (
                <div key={question.key} className={question.full ? 'form-full' : undefined}>
                  <label style={labelStyle} htmlFor={`status-${question.key}`}>{question.label}</label>
                  <input
                    id={`status-${question.key}`}
                    type={question.type === 'number' ? 'number' : question.type === 'date' ? 'date' : 'text'}
                    className="form-control"
                    value={answers[question.key] || ''}
                    onChange={(e) => handleChange(question.key, e.target.value)}
                    placeholder={question.placeholder || ''}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              No extra details are asked for this status.
            </p>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => onConfirm(answers)}>
            <ClipboardCheck size={15} />
            <span>Save Status Update</span>
          </button>
        </div>
      </div>
    </div>
  );
};
