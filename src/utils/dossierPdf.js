// Professional PDF export of a BL customs dossier.
// jsPDF is imported on demand so it never lands in the main bundle.

import { formatDate, formatDateTime, formatCurrency } from './dateUtils';
import { calculateDetentionMetrics } from './detentionEngine';
import { BL_ATTACHMENT_SLOTS, formatFileSize } from '../services/attachmentService';
import { STATUS_STAGES } from './statusStages';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_H - 20;

const NAVY = [15, 28, 63];
const BLUE = [37, 99, 235];
const SLATE = [71, 85, 105];
const MUTED = [148, 163, 184];
const BORDER = [203, 213, 225];
const BAND = [241, 245, 249];
const EMERALD = [5, 150, 105];
const AMBER = [180, 83, 9];
const ROSE = [159, 18, 57];

const value = (input, fallback = 'Not specified') => {
  if (input === undefined || input === null) return fallback;
  const text = String(input).trim();
  return text === '' ? fallback : text;
};

const riskColor = (risk) => {
  if (risk === 'OVERDUE') return ROSE;
  if (risk === 'CRITICAL') return AMBER;
  if (risk === 'APPROACHING') return AMBER;
  if (risk === 'SAFE' || risk === 'COMPLETED') return EMERALD;
  return SLATE;
};

/**
 * Build the dossier PDF document.
 * @returns {Promise<import('jspdf').jsPDF>} the generated document
 */
export const buildDossierPdf = async ({ shipment, companyName = 'CustomsTrack PRO' }) => {
  if (!shipment) throw new Error('No dossier data to export.');

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const metrics = calculateDetentionMetrics(shipment);
  const generatedAt = formatDateTime(new Date().toISOString());
  let y = 0;
  let pageNo = 1;

  const drawPageChrome = () => {
    // Header band
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, 0, PAGE_W, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('CUSTOMS CLEARANCE DOSSIER', MARGIN, 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(190, 205, 225);
    doc.text(String(companyName).toUpperCase(), MARGIN, 17.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`BL ${value(shipment.blNo, '-')}`, PAGE_W - MARGIN, 11, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(190, 205, 225);
    doc.text(`Page ${pageNo}`, PAGE_W - MARGIN, 17.5, { align: 'right' });

    y = 32;
  };

  const addPage = () => {
    doc.addPage();
    pageNo += 1;
    drawPageChrome();
  };

  const ensureSpace = (needed) => {
    if (y + needed > BOTTOM_LIMIT) addPage();
  };

  const sectionTitle = (title) => {
    ensureSpace(14);
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.rect(MARGIN, y - 3, 1.6, 4.6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text(String(title).toUpperCase(), MARGIN + 4, y);
    y += 6;
  };

  // Two column key/value rows, wrapping long values
  const keyValueRows = (rows) => {
    const labelW = 42;
    rows.forEach(([label, raw]) => {
      const text = value(raw, '-');
      const lines = doc.splitTextToSize(text, CONTENT_W - labelW - 4);
      ensureSpace(lines.length * 4.6 + 1.6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
      doc.text(label, MARGIN, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(lines, MARGIN + labelW, y);
      y += lines.length * 4.6 + 1.6;
    });
  };

  const badge = (text, color) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const w = doc.getTextWidth(text) + 6;
    ensureSpace(7);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(MARGIN, y - 4, w, 5.6, 1.2, 1.2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(text, MARGIN + 3, y);
    y += 8;
  };

  const table = (columns, rows) => {
    const drawHead = () => {
      doc.setFillColor(BAND[0], BAND[1], BAND[2]);
      doc.rect(MARGIN, y - 4, CONTENT_W, 6.4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.4);
      doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
      let x = MARGIN + 1.5;
      columns.forEach((col) => {
        doc.text(col.label, x, y);
        x += col.width;
      });
      y += 6.4;
    };

    ensureSpace(14);
    drawHead();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.6);

    rows.forEach((row, index) => {
      const cellLines = row.map((cell, i) => doc.splitTextToSize(value(cell, '-'), columns[i].width - 3));
      const rowHeight = Math.max(...cellLines.map((lines) => lines.length)) * 4 + 2.6;

      if (y + rowHeight > BOTTOM_LIMIT) {
        addPage();
        drawHead();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.6);
      }

      if (index % 2 === 1) {
        doc.setFillColor(250, 251, 253);
        doc.rect(MARGIN, y - 3.4, CONTENT_W, rowHeight, 'F');
      }

      let x = MARGIN + 1.5;
      doc.setTextColor(15, 23, 42);
      cellLines.forEach((lines, colIndex) => {
        doc.text(lines, x, y);
        x += columns[colIndex].width;
      });

      y += rowHeight;
    });

    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.line(MARGIN, y - 3, PAGE_W - MARGIN, y - 3);
    y += 4;
  };

  drawPageChrome();

  // Summary strip
  const stageIndex = STATUS_STAGES.findIndex((stage) => stage.id === shipment.customsStatus);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
  doc.text(
    `${value(shipment.shippingLine, 'Carrier not set')}  |  ${value(shipment.vessel, 'Vessel TBD')}${
      shipment.voyage ? ' / ' + shipment.voyage : ''
    }  |  Milestone ${stageIndex >= 0 ? stageIndex + 1 : 1} of ${STATUS_STAGES.length} (${value(
      shipment.customsStatus,
      'Pre-Arrival'
    )})`,
    MARGIN,
    y
  );
  y += 5;
  doc.setFontSize(7.6);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.text(`Generated ${generatedAt} by CustomsTrack PRO`, MARGIN, y);
  y += 8;

  badge(
    `SHIELD STATUS: ${value(metrics.overallRisk, 'SAFE')}`,
    riskColor(metrics.overallRisk)
  );
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
  const riskLines = doc.splitTextToSize(value(metrics.riskMessage, '-'), CONTENT_W);
  ensureSpace(riskLines.length * 4.4 + 3);
  doc.text(riskLines, MARGIN, y);
  y += riskLines.length * 4.4 + 6;

  sectionTitle('Consignment & Routing');
  keyValueRows([
    ['BL Number', shipment.blNo],
    ['Shipping Line', shipment.shippingLine],
    ['Vessel / Voyage', `${value(shipment.vessel, '-')}${shipment.voyage ? ' / ' + shipment.voyage : ''}`],
    ['Port of Loading', shipment.pol],
    ['Port of Discharge', shipment.pod],
    ['Final Destination', shipment.finalDestination],
    ['Consignee', shipment.consignee],
    ['Shipper', shipment.shipper],
    ['Cargo Description', shipment.cargoDescription],
    ['Packaging / Packages', shipment.totalPackages],
    ['Gross Weight', shipment.grossWeightKg ? `${shipment.grossWeightKg} KG` : '-'],
    ['HS Code', shipment.hsCode]
  ]);
  y += 3;

  sectionTitle('Dates & Free Time Tracking');
  keyValueRows([
    ['ETA', shipment.eta ? formatDate(shipment.eta) : '-'],
    ['Discharge Date (day 0)', shipment.dischargeDate ? formatDate(shipment.dischargeDate) : '-'],
    ['Port Free Storage', `${value(shipment.portFreeDays, '5')} days (expires ${formatDate(metrics.portExpiryDate)})`],
    [
      'Port Days Remaining',
      metrics.portDaysLeft === null
        ? 'Not started'
        : metrics.portDaysLeft < 0
        ? `${Math.abs(metrics.portDaysLeft)} day(s) over`
        : `${metrics.portDaysLeft} day(s) left`
    ],
    ['Line D&D Free Time', `${value(shipment.lineFreeDays, '14')} days (cutoff ${formatDate(metrics.lineExpiryDate)})`],
    [
      'Line Days Remaining',
      metrics.lineDaysLeft === null
        ? 'Not started'
        : metrics.lineDaysLeft < 0
        ? `${Math.abs(metrics.lineDaysLeft)} day(s) over`
        : `${metrics.lineDaysLeft} day(s) left`
    ],
    ['DO Validity', shipment.doValidityDate ? formatDate(shipment.doValidityDate) : '-'],
    ['Customs Milestone', value(shipment.customsStatus, 'Pre-Arrival')]
  ]);
  y += 3;

  sectionTitle('Security Deposit');
  keyValueRows([
    ['Deposit Amount', formatCurrency(shipment.doSecurityDeposit?.amount)],
    ['Refund Status', shipment.doSecurityDeposit?.status],
    ['Receipt / Guarantee Ref', shipment.doSecurityDeposit?.receiptNo]
  ]);
  y += 3;

  sectionTitle(`Container Equipment Manifest (${(shipment.containers || []).length} units)`);
  const columns = [
    { label: 'Container No', width: 30 },
    { label: 'Type', width: 14 },
    { label: 'Seal', width: 22 },
    { label: 'Discharge', width: 23 },
    { label: 'Gate Out', width: 23 },
    { label: 'Empty Ret', width: 23 },
    { label: 'EIR', width: 22 },
    { label: 'Status', width: CONTENT_W - 157 }
  ];
  table(
    columns,
    (shipment.containers || []).map((container) => [
      container.containerNo,
      container.sizeType,
      container.sealNo,
      formatDate(container.dischargeDate || shipment.dischargeDate),
      container.gateOutDate ? formatDate(container.gateOutDate) : 'At port',
      container.emptyReturnDate ? formatDate(container.emptyReturnDate) : 'Unreturned',
      container.eirNumber,
      container.status
    ])
  );
  y += 3;

  sectionTitle('BL Consignment Attachments');
  keyValueRows(
    BL_ATTACHMENT_SLOTS.map((slot) => {
      const doc_ = (shipment.blDocuments || {})[slot.key];
      if (!doc_) return [slot.label, 'Not uploaded'];
      const size = formatFileSize(doc_.size);
      const pages = doc_.pages ? `, ${doc_.pages} page(s)` : '';
      return [slot.label, `${doc_.name} (${size}${pages}) - uploaded by ${doc_.uploadedBy || '-'} on ${formatDateTime(doc_.uploadedAt)}`];
    })
  );
  y += 3;

  const history = shipment.statusHistory || [];
  if (history.length > 0) {
    sectionTitle(`Status Update Audit Trail (${history.length} updates)`);
    [...history].reverse().forEach((entry) => {
      ensureSpace(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.4);
      doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
      doc.text(value(entry.stageLabel || entry.status, '-'), MARGIN, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
      doc.text(formatDateTime(entry.at), PAGE_W - MARGIN, y, { align: 'right' });
      y += 4.4;

      const byLine = `Updated by ${value(entry.by, 'Unknown')}${entry.byRole ? ` (${entry.byRole})` : ''}${
        entry.containerNo ? ` - container ${entry.containerNo}` : ''
      }`;
      doc.setFontSize(7.8);
      doc.setTextColor(SLATE[0], SLATE[1], SLATE[2]);
      const byLines = doc.splitTextToSize(byLine, CONTENT_W);
      doc.text(byLines, MARGIN, y);
      y += byLines.length * 4;

      (entry.details || []).forEach((detail) => {
        const line = `${detail.label}: ${detail.value}`;
        const lines = doc.splitTextToSize(line, CONTENT_W - 6);
        ensureSpace(lines.length * 4 + 1);
        doc.setTextColor(15, 23, 42);
        doc.text(lines, MARGIN + 4, y);
        y += lines.length * 4;
      });
      y += 2.4;
    });
    y += 2;
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text(`${companyName} - BL ${value(shipment.blNo, '-')}`, MARGIN, PAGE_H - 9.5);
    doc.text(`Page ${page} of ${totalPages}`, PAGE_W - MARGIN, PAGE_H - 9.5, { align: 'right' });
  }

  doc.setProperties({
    title: `Customs Dossier - BL ${value(shipment.blNo, '')}`,
    subject: 'Customs clearance tracking dossier',
    creator: 'CustomsTrack PRO'
  });

  return doc;
};

/** File name used for the downloaded dossier. */
export const dossierFileName = (shipment) => {
  const safeBl = String(value(shipment?.blNo, 'BL')).replace(/[^A-Za-z0-9-]/g, '');
  return `Dossier_${safeBl}_${new Date().toISOString().split('T')[0]}.pdf`;
};

/**
 * Build and download the dossier as a PDF file.
 */
export const downloadDossierPdf = async ({ shipment, companyName = 'CustomsTrack PRO' }) => {
  const doc = await buildDossierPdf({ shipment, companyName });
  doc.save(dossierFileName(shipment));
};
