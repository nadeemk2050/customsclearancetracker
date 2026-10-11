// Client-side BL attachment compression.
//
// Images are re-encoded through the canvas API and PDFs are rasterised page by page
// and rebuilt as a JPEG based PDF. Quality is searched from best to worst so the file
// lands under the 150 KB ceiling without dropping below a readable floor.
// The PDF libraries are imported on demand, so they never touch the main bundle.

export const MAX_ATTACHMENT_BYTES = 150 * 1024;

const IMAGE_MAX_EDGE = 1600;
const IMAGE_MIN_EDGE = 800;
const IMAGE_QUALITIES = [0.82, 0.68, 0.55, 0.45];
const EDGE_STEP = 0.8;

const PDF_MAX_PAGES = 25;
const PDF_QUALITIES = [0.7, 0.5, 0.4];

/** Width ladder adapted to the page count so the whole document can fit the budget. */
const pdfWidthsForPageCount = (pageCount) => {
  if (pageCount <= 1) return [1400, 1200, 1000];
  if (pageCount <= 3) return [1100, 950, 800];
  if (pageCount <= 6) return [900, 780, 650];
  return [780, 650, 560];
};

export const isPdfFile = (file) =>
  file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '');

export const isImageFile = (file) =>
  (file?.type || '').startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|heic|heif)$/i.test(file?.name || '');

const createCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
};

const canvasToBlob = (canvas, type, quality) =>
  new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality));

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That image could not be read. Try a JPG or PNG copy of the document.'));
    };
    img.src = url;
  });

const candidateEdges = (longestEdge) => {
  const edges = [];
  let edge = Math.min(IMAGE_MAX_EDGE, longestEdge);
  while (true) {
    edges.push(edge);
    if (edge <= IMAGE_MIN_EDGE) break;
    const next = Math.round(edge * EDGE_STEP);
    edge = next < IMAGE_MIN_EDGE ? IMAGE_MIN_EDGE : next;
  }
  return edges;
};

/**
 * Re-encode a photo or scan. Never upscales; never shrinks below IMAGE_MIN_EDGE.
 * @returns {Promise<{blob: Blob, width: number, height: number, quality: number}>}
 */
export const compressImage = async (file) => {
  const img = await loadImage(file);
  const naturalWidth = img.naturalWidth || img.width;
  const naturalHeight = img.naturalHeight || img.height;
  const longestEdge = Math.max(naturalWidth, naturalHeight) || 1;

  let best = null;

  for (const edge of candidateEdges(longestEdge)) {
    const scale = edge / longestEdge;
    const canvas = createCanvas(naturalWidth * scale, naturalHeight * scale);

    for (const quality of IMAGE_QUALITIES) {
      const blob = await canvasToBlob(canvas, 'image/jpeg', quality);
      if (!blob) continue;

      const candidate = { blob, width: canvas.width, height: canvas.height, quality };
      if (!best || blob.size < best.blob.size) best = candidate;
      if (blob.size <= MAX_ATTACHMENT_BYTES) return candidate;
    }
  }

  if (!best) throw new Error('That image could not be compressed.');
  return best;
};

/**
 * Rebuild a PDF from rasterised pages, shrinking resolution and JPEG quality
 * until the result fits the ceiling.
 * @returns {Promise<{blob: Blob, pages: number, width: number, quality: number}>}
 */
export const compressPdf = async (file, onProgress) => {
  const [pdfjs, workerModule, jspdfModule] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    import('jspdf')
  ]);

  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

  const { jsPDF } = jspdfModule;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const pageCount = pdf.numPages;

  if (pageCount > PDF_MAX_PAGES) {
    throw new Error(`That PDF has ${pageCount} pages. Please upload a version with ${PDF_MAX_PAGES} pages or fewer.`);
  }

  const attempts = [];
  for (const width of pdfWidthsForPageCount(pageCount)) {
    for (const quality of PDF_QUALITIES) {
      attempts.push({ width, quality });
    }
  }

  let best = null;

  for (let attemptIndex = 0; attemptIndex < attempts.length; attemptIndex += 1) {
    const attempt = attempts[attemptIndex];

    try {
      const pages = [];
      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        if (onProgress) onProgress({ phase: 'compressing', attempt: attemptIndex + 1, page: pageNumber, pages: pageCount });

        const page = await pdf.getPage(pageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(attempt.width / baseViewport.width, 2);
        const viewport = page.getViewport({ scale });

        const canvas = createCanvas(viewport.width, viewport.height);
        const ctx = canvas.getContext('2d');
        await page.render({ canvas, canvasContext: ctx, viewport }).promise;

        pages.push({
          dataUrl: canvas.toDataURL('image/jpeg', attempt.quality),
          width: canvas.width,
          height: canvas.height
        });
        page.cleanup();
      }

      const first = pages[0];
      const doc = new jsPDF({
        unit: 'pt',
        format: [first.width, first.height],
        orientation: first.width > first.height ? 'landscape' : 'portrait',
        compress: true
      });

      pages.forEach((page, index) => {
        if (index > 0) {
          doc.addPage([page.width, page.height], page.width > page.height ? 'landscape' : 'portrait');
        }
        doc.addImage(page.dataUrl, 'JPEG', 0, 0, page.width, page.height, undefined, 'FAST');
      });

      const blob = doc.output('blob');
      const candidate = { blob, pages: pageCount, width: attempt.width, quality: attempt.quality };

      if (!best || blob.size < best.blob.size) best = candidate;
      if (blob.size <= MAX_ATTACHMENT_BYTES) return candidate;
    } catch (err) {
      if (!best) throw err;
      break;
    }
  }

  if (!best) throw new Error('That PDF could not be compressed.');
  return best;
};

/**
 * Compress any supported attachment down towards MAX_ATTACHMENT_BYTES.
 * @returns {Promise<{blob: Blob, size: number, originalSize: number, kind: string,
 *                    recompressed: boolean, overTarget: boolean}>}
 */
export const compressAttachment = async (file, onProgress) => {
  const originalSize = file.size;
  const base = { originalSize, overTarget: false, recompressed: false };

  if (isPdfFile(file)) {
    if (originalSize <= MAX_ATTACHMENT_BYTES) {
      return { ...base, blob: file, size: originalSize, kind: 'pdf' };
    }
    const result = await compressPdf(file, onProgress);
    return {
      ...base,
      blob: result.blob,
      size: result.blob.size,
      kind: 'pdf',
      pages: result.pages,
      recompressed: true,
      overTarget: result.blob.size > MAX_ATTACHMENT_BYTES
    };
  }

  if (isImageFile(file)) {
    const result = await compressImage(file);
    return {
      ...base,
      blob: result.blob,
      size: result.blob.size,
      kind: 'image',
      width: result.width,
      height: result.height,
      recompressed: true,
      overTarget: result.blob.size > MAX_ATTACHMENT_BYTES
    };
  }

  throw new Error('Only image files (JPG, PNG, WebP) or PDF documents are allowed.');
};
