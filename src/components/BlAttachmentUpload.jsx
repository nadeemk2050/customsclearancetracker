import React, { useRef, useState } from 'react';
import { Upload, FileText, ImageIcon, Eye, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { uploadBlAttachment, deleteBlAttachment, formatFileSize } from '../services/attachmentService';
import { formatDateTime } from '../utils/dateUtils';

/**
 * One BL attachment slot (BL Draft / Original BL).
 * The picked file is compressed to <= 150 KB and pushed to Firebase Storage immediately.
 */
export const BlAttachmentUpload = ({
  slot,
  label,
  hint,
  value,
  onChange,
  companyId,
  shipmentId,
  user
}) => {
  const inputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | compressing | uploading
  const [error, setError] = useState('');

  const busy = status !== 'idle';
  const isImage = (value?.type || '').startsWith('image/') || value?.kind === 'image';

  const handlePick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError('');
    setStatus('compressing');
    try {
      const meta = await uploadBlAttachment({
        file,
        companyId,
        shipmentId,
        slot,
        user,
        onProgress: (info) => {
          if (info?.phase === 'compressing') setStatus('compressing');
        }
      });
      setStatus('uploading');
      if (value?.path) await deleteBlAttachment(value.path);
      onChange(meta);
    } catch (err) {
      setError(err?.message || 'Upload failed. Please check your connection and try again.');
    } finally {
      setStatus('idle');
    }
  };

  const handleRemove = async () => {
    const path = value?.path;
    onChange(null);
    await deleteBlAttachment(path);
  };

  return (
    <div className="bl-attach-card">
      <div className="bl-attach-head">
        <div>
          <strong>{label}</strong>
          <span>{hint}</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handlePick}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          <Upload size={14} />
          <span>{value ? 'Replace' : 'Upload'}</span>
        </button>
      </div>

      {busy && (
        <div className="bl-attach-status">
          <Loader2 size={13} className="spin" />
          <span>{status === 'compressing' ? 'Compressing to under 150 KB…' : 'Uploading to Firebase Storage…'}</span>
        </div>
      )}

      {error && (
        <div className="bl-attach-error">
          <AlertTriangle size={13} /> <span>{error}</span>
        </div>
      )}

      {value && !busy && (
        <div className="bl-attach-file">
          {isImage ? <ImageIcon size={16} color="#047857" /> : <FileText size={16} color="#047857" />}
          <div style={{ minWidth: 0 }}>
            <strong>{value.name}</strong>
            <small>
              {formatFileSize(value.size)}
              {value.originalSize && value.originalSize > value.size ? ` · compressed from ${formatFileSize(value.originalSize)}` : ''}
              {value.pages ? ` · ${value.pages} page(s)` : ''}
              {' · '}{value.uploadedBy} · {formatDateTime(value.uploadedAt)}
            </small>
          </div>

          <div className="bl-attach-actions">
            <a className="bl-attach-link" href={value.url} target="_blank" rel="noreferrer">
              <Eye size={12} /> View
            </a>
            <button type="button" className="btn btn-danger btn-sm btn-icon-only" onClick={handleRemove} title={`Remove ${label}`}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
