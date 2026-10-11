// BL consignment attachments (BL draft / Original BL) stored in Firebase Storage.
// Every file is compressed to the 150 KB ceiling before it leaves the browser.

import { storage, ref, uploadBytes, getDownloadURL, deleteObject } from '../firebase/config';
import { compressAttachment, MAX_ATTACHMENT_BYTES } from '../utils/fileCompression';

export const BL_ATTACHMENT_SLOTS = [
  { key: 'blDraft', label: 'BL Draft', hint: 'Scanned or photographed draft bill of lading' },
  { key: 'originalBL', label: 'Original BL', hint: 'Signed original / telex release copy' }
];

const extensionFor = (blob, fileName) => {
  const type = blob?.type || '';
  if (type === 'application/pdf') return 'pdf';
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  const match = /\.([a-z0-9]+)$/i.exec(fileName || '');
  return match ? match[1].toLowerCase() : 'jpg';
};

/**
 * Compress and upload one attachment slot for a shipment.
 * @returns {Promise<object>} attachment metadata stored on the shipment document
 */
export const uploadBlAttachment = async ({ file, companyId, shipmentId, slot, user, onProgress }) => {
  const compressed = await compressAttachment(file, onProgress);

  if (compressed.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(
      `Could not compress below ${Math.round(MAX_ATTACHMENT_BYTES / 1024)} KB (smallest was ${Math.round(
        compressed.size / 1024
      )} KB). Try a photo of the document or a PDF with fewer pages.`
    );
  }

  const path = [
    'bl_documents',
    companyId || 'default',
    shipmentId || 'unassigned',
    `${slot}_${Date.now()}.${extensionFor(compressed.blob, file.name)}`
  ].join('/');

  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, compressed.blob, {
    contentType: compressed.blob.type || 'application/octet-stream',
    customMetadata: {
      slot,
      originalName: file.name,
      uploadedBy: user?.displayName || user?.username || 'Unknown user',
      originalSizeBytes: String(compressed.originalSize)
    }
  });

  const url = await getDownloadURL(objectRef);

  return {
    slot,
    name: file.name,
    size: compressed.size,
    originalSize: compressed.originalSize,
    kind: compressed.kind,
    type: compressed.blob.type || file.type || '',
    pages: compressed.pages || null,
    width: compressed.width || null,
    url,
    path,
    uploadedAt: new Date().toISOString(),
    uploadedBy: user?.displayName || user?.username || 'Unknown user'
  };
};

/** Best-effort removal of a stored attachment (never blocks the UI). */
export const deleteBlAttachment = async (path) => {
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    console.warn('[BL attachments] could not delete remote file:', err?.message || err);
  }
};

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
