// Milestone stages of a customs clearance dossier.
// Each stage lists the questions asked when a BL/consignment moves to that stage.
// Every answer is optional — but the update time and the user who made the change
// are always recorded by buildStatusLogEntry().

export const STATUS_STAGES = [
  {
    id: 'Pre-Arrival',
    label: 'Pre-Arrival',
    questions: [
      { key: 'arrivalConfirmedBy', label: 'Arrival confirmed by', placeholder: 'e.g. Port Control / Line agent' },
      { key: 'ata', label: 'Actual arrival (ATA)', type: 'date' },
      { key: 'berth', label: 'Berth / Terminal', placeholder: 'e.g. Jebel Ali Terminal 1' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  },
  {
    id: 'DO Taken',
    label: 'DO Issued',
    questions: [
      { key: 'doReceivedBy', label: 'DO received by', placeholder: 'e.g. Tariq Al-Mansoor' },
      { key: 'amount', label: 'Amount paid', type: 'number', placeholder: 'e.g. 2000' },
      { key: 'doNumber', label: 'DO number', placeholder: 'e.g. HL-DO-88231' },
      { key: 'doDate', label: 'DO issued date', type: 'date' },
      { key: 'doValidity', label: 'DO validity date', type: 'date' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  },
  {
    id: 'Declaration Filed',
    label: 'BOE Filed',
    questions: [
      { key: 'declarationNo', label: 'BOE / Declaration no', placeholder: 'e.g. DXB-CUST-883921' },
      { key: 'filedBy', label: 'Filed by (broker)', placeholder: 'e.g. Fatima Al-Zahra' },
      { key: 'filedDate', label: 'Filing date', type: 'date' },
      { key: 'customsOffice', label: 'Customs office / Port', placeholder: 'e.g. Jebel Ali Customs' },
      { key: 'amount', label: 'Filing charges', type: 'number', placeholder: 'e.g. 150' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  },
  {
    id: 'Under Inspection',
    label: 'Inspection',
    questions: [
      { key: 'inspectionType', label: 'Inspection channel / type', placeholder: 'e.g. Red (Physical & Lab)' },
      { key: 'inspectedBy', label: 'Inspected by / Officer', placeholder: 'e.g. Customs Inspector' },
      { key: 'inspectionDate', label: 'Inspection date', type: 'date' },
      { key: 'labSampleRef', label: 'Lab / Sample reference', placeholder: 'e.g. LAB-2026-4471' },
      { key: 'amount', label: 'Inspection charges', type: 'number', placeholder: 'e.g. 300' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  },
  {
    id: 'Duty Paid',
    label: 'Duty Paid',
    questions: [
      { key: 'dutyAmount', label: 'Duty amount', type: 'number', placeholder: 'e.g. 2607' },
      { key: 'vatAmount', label: 'VAT amount', type: 'number', placeholder: 'e.g. 2737' },
      { key: 'receiptNo', label: 'Payment receipt / ref no', placeholder: 'e.g. DXB-DUTY-99321' },
      { key: 'paidBy', label: 'Paid by', placeholder: 'e.g. Accounts department' },
      { key: 'paymentDate', label: 'Payment date', type: 'date' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  },
  {
    id: 'Customs Cleared',
    label: 'OOC Cleared',
    questions: [
      { key: 'oocRef', label: 'OOC / Release reference', placeholder: 'e.g. OOC-883921' },
      { key: 'oocDate', label: 'OOC date', type: 'date' },
      { key: 'releasedBy', label: 'Released by / Officer', placeholder: 'e.g. Customs Inspector' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  },
  {
    id: 'Gate Out',
    label: 'Port Gate-Out',
    questions: [
      { key: 'gateOutBy', label: 'Gate-out arranged by', placeholder: 'e.g. Trucker / Transport co.' },
      { key: 'truckPlate', label: 'Truck / Plate no', placeholder: 'e.g. DXB-B-48213' },
      { key: 'gatePassNo', label: 'Gate pass no', placeholder: 'e.g. GP-77120' },
      { key: 'gateOutDate', label: 'Gate-out date', type: 'date' },
      { key: 'amount', label: 'Port / transport charges', type: 'number', placeholder: 'e.g. 450' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  },
  {
    id: 'Delivered',
    label: 'Delivered',
    questions: [
      { key: 'deliveredTo', label: 'Delivered to (site / warehouse)', placeholder: 'e.g. Dubai Industrial City Yard' },
      { key: 'receivedBy', label: 'Received by', placeholder: 'e.g. Warehouse supervisor' },
      { key: 'deliveryDate', label: 'Delivery date', type: 'date' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  },
  {
    id: 'Empties Returned',
    label: 'Empties Returned',
    questions: [
      { key: 'eirNumber', label: 'EIR number', placeholder: 'e.g. EIR-582910' },
      { key: 'depot', label: 'Return depot', placeholder: 'e.g. Hapag-Lloyd Inland Depot 4' },
      { key: 'returnedBy', label: 'Returned by (driver)', placeholder: 'e.g. Suresh Kumar' },
      { key: 'returnDate', label: 'Return date', type: 'date' },
      { key: 'amount', label: 'Depot / handling charges', type: 'number', placeholder: 'e.g. 120' },
      { key: 'remarks', label: 'Remarks', placeholder: 'Optional notes', full: true }
    ]
  }
];

export const getStatusStage = (statusId) =>
  STATUS_STAGES.find((stage) => stage.id === statusId) || null;

export const TOTAL_STATUS_STAGES = STATUS_STAGES.length;

export const COMPLETED_STATUS = 'Empties Returned';

/** 0-based index of the stage a status sits on, or -1 when it is unknown. */
export const getStatusStageIndex = (status) =>
  STATUS_STAGES.findIndex((stage) => stage.id === status);

/**
 * How far a BL still has to travel: the stage it has reached counts as done,
 * so Pre-Arrival leaves 8 of 9 steps, Delivered leaves 1, Empties Returned 0.
 */
export const getStepsRemaining = (status) => {
  const index = getStatusStageIndex(status);
  const completed = index < 0 ? 0 : index + 1;
  const total = TOTAL_STATUS_STAGES;
  const remaining = Math.max(0, total - completed);
  const nextStage = STATUS_STAGES[completed] || null;

  return {
    completed,
    total,
    remaining,
    percent: Math.round((completed / total) * 100),
    nextStage,
    isComplete: completed >= total
  };
};

/**
 * Build the immutable audit record for one status change.
 * The timestamp and the acting user are always captured.
 */
export const buildStatusLogEntry = ({ status, answers = {}, session, containerNo = null }) => {
  const stage = getStatusStage(status);
  const details = [];

  (stage?.questions || []).forEach((question) => {
    const raw = answers[question.key];
    const value = raw === undefined || raw === null ? '' : String(raw).trim();
    if (value) {
      details.push({ key: question.key, label: question.label, value });
    }
  });

  return {
    status,
    stageLabel: stage?.label || status,
    at: new Date().toISOString(),
    by: session?.displayName || session?.username || 'Unknown user',
    byUsername: session?.username || '',
    byRole: session?.role || '',
    containerNo,
    details
  };
};
