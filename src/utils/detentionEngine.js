// Demurrage, Detention & Port Storage Loss Prevention Engine
import { addDays, getDaysDifference } from './dateUtils';

export const calculateDetentionMetrics = (shipment) => {
  const containers = shipment.containers || [];
  const totalContainers = containers.length;
  
  // Containers currently still in port (not gated out)
  const containersAtPort = containers.filter(c => !c.gateOutDate).length;
  
  // Containers not yet returned empty to the line's depot
  const unreturnedContainers = containers.filter(c => !c.emptyReturnDate).length;

  // 1. Port Storage Calculation (Port Terminal Clock)
  // Port storage free days start from vessel discharge date
  const dischargeDate = shipment.dischargeDate || shipment.ata || shipment.eta;
  const portFreeDays = parseInt(shipment.portFreeDays || 5, 10);
  const portExpiryDate = dischargeDate ? addDays(dischargeDate, portFreeDays) : null;
  const portDaysLeft = portExpiryDate ? getDaysDifference(portExpiryDate) : null;

  const portDailyRate = parseFloat(shipment.portStorageDailyRate || 45);
  let portStorageIncurred = 0;
  let portStorageProjected = 0;

  if (portDaysLeft !== null && containersAtPort > 0) {
    if (portDaysLeft < 0) {
      // Already in port storage penalty!
      portStorageIncurred = Math.abs(portDaysLeft) * portDailyRate * containersAtPort;
    } else if (portDaysLeft <= 2) {
      // Risk of imminent port storage
      portStorageProjected = portDailyRate * containersAtPort * 2;
    }
  }

  // 2. Shipping Line Demurrage & Detention Calculation (Carrier Clock)
  const lineFreeDays = parseInt(shipment.lineFreeDays || 14, 10);
  const lineExpiryDate = dischargeDate ? addDays(dischargeDate, lineFreeDays) : null;
  const lineDaysLeft = lineExpiryDate ? getDaysDifference(lineExpiryDate) : null;

  const lineDailyRate = parseFloat(shipment.lineDetentionDailyRate || 80);
  let lineDetentionIncurred = 0;
  let lineDetentionProjected = 0;

  if (lineDaysLeft !== null && unreturnedContainers > 0) {
    if (lineDaysLeft < 0) {
      // Overdue container detention penalty accumulating
      lineDetentionIncurred = Math.abs(lineDaysLeft) * lineDailyRate * unreturnedContainers;
    } else if (lineDaysLeft <= 2) {
      lineDetentionProjected = lineDailyRate * unreturnedContainers * 2;
    }
  }

  // 3. Delivery Order (DO) Validity Watchdog
  const doValidityDaysLeft = shipment.doValidityDate ? getDaysDifference(shipment.doValidityDate) : null;
  const isDoExpiringSoon = doValidityDaysLeft !== null && doValidityDaysLeft <= 2 && containersAtPort > 0;
  const isDoExpired = doValidityDaysLeft !== null && doValidityDaysLeft < 0 && containersAtPort > 0;

  // 4. Overall Loss Prevention Risk Assessment
  let overallRisk = 'SAFE'; // SAFE | APPROACHING | CRITICAL | OVERDUE | COMPLETED
  let riskMessage = 'All free days within safe operational window.';

  const isFullyCompleted = totalContainers > 0 && unreturnedContainers === 0 && shipment.customsStatus === 'Empties Returned';

  if (isFullyCompleted) {
    overallRisk = 'COMPLETED';
    riskMessage = 'Containers returned empty to depot. Security deposit eligible for refund.';
  } else if (portStorageIncurred > 0 || lineDetentionIncurred > 0 || isDoExpired) {
    overallRisk = 'OVERDUE';
    if (portStorageIncurred > 0 && lineDetentionIncurred > 0) {
      riskMessage = `ACCUMULATING LOSS: Port Storage ($${portStorageIncurred.toFixed(0)}) & Line Detention ($${lineDetentionIncurred.toFixed(0)}) active!`;
    } else if (portStorageIncurred > 0) {
      riskMessage = `ACCUMULATING LOSS: Port Storage incurred ($${portStorageIncurred.toFixed(0)}). Expedite gate-out immediately!`;
    } else if (lineDetentionIncurred > 0) {
      riskMessage = `ACCUMULATING LOSS: Line Detention incurred ($${lineDetentionIncurred.toFixed(0)}). Return empties to yard!`;
    } else {
      riskMessage = 'DO HAS EXPIRED! Terminal gate will reject trucks until line revalidates DO.';
    }
  } else if (
    (portDaysLeft !== null && portDaysLeft <= 2 && containersAtPort > 0) ||
    (lineDaysLeft !== null && lineDaysLeft <= 2 && unreturnedContainers > 0) ||
    isDoExpiringSoon
  ) {
    overallRisk = 'CRITICAL';
    if (portDaysLeft !== null && portDaysLeft <= 1 && containersAtPort > 0) {
      riskMessage = `CRITICAL: Port storage starts in ${portDaysLeft === 0 ? 'TODAY' : '1 day'}! Pay port dues & dispatch trucks.`;
    } else if (isDoExpiringSoon) {
      riskMessage = `CRITICAL: DO validity expires in ${doValidityDaysLeft} days! Gate-out must happen before expiry.`;
    } else {
      riskMessage = `CRITICAL: Line detention starts in ${lineDaysLeft} days. Return empty containers now.`;
    }
  } else if (
    (portDaysLeft !== null && portDaysLeft <= 4 && containersAtPort > 0) ||
    (lineDaysLeft !== null && lineDaysLeft <= 4 && unreturnedContainers > 0)
  ) {
    overallRisk = 'APPROACHING';
    riskMessage = `ATTENTION: Port free time has ${portDaysLeft} days left. Complete customs inspection and duty payment.`;
  }

  const totalIncurredPenalty = portStorageIncurred + lineDetentionIncurred;
  const totalProjectedExposure = portStorageProjected + lineDetentionProjected;

  return {
    totalContainers,
    containersAtPort,
    unreturnedContainers,
    portExpiryDate,
    portDaysLeft,
    portStorageIncurred,
    lineExpiryDate,
    lineDaysLeft,
    lineDetentionIncurred,
    doValidityDaysLeft,
    isDoExpiringSoon,
    isDoExpired,
    overallRisk,
    riskMessage,
    totalIncurredPenalty,
    totalProjectedExposure
  };
};

// High-level aggregates across all shipments for the command center
export const calculateFleetRiskRadar = (shipments = []) => {
  let totalShipments = shipments.length;
  let activeShipments = 0;
  let totalContainers = 0;
  let containersInPort = 0;
  let unreturnedContainers = 0;

  let totalIncurredLoss = 0;
  let totalAtRiskContainers = 0;
  let doExpiringCount = 0;
  let urgentInspectionCount = 0;
  let depositRefundsDue = 0;
  let depositTotalDueAmount = 0;

  shipments.forEach(s => {
    const metrics = calculateDetentionMetrics(s);
    totalContainers += metrics.totalContainers;
    containersInPort += metrics.containersAtPort;
    unreturnedContainers += metrics.unreturnedContainers;
    totalIncurredLoss += metrics.totalIncurredPenalty;

    if (s.customsStatus !== 'Empties Returned' && s.customsStatus !== 'Archived') {
      activeShipments++;
    }

    if (metrics.overallRisk === 'CRITICAL' || metrics.overallRisk === 'OVERDUE') {
      totalAtRiskContainers += (metrics.containersAtPort + metrics.unreturnedContainers);
    }

    if (metrics.isDoExpiringSoon || metrics.isDoExpired) {
      doExpiringCount++;
    }

    if (s.customsStatus === 'Under Inspection') {
      urgentInspectionCount++;
    }

    if (s.doSecurityDeposit && s.doSecurityDeposit.status === 'Deposited') {
      depositRefundsDue++;
      depositTotalDueAmount += parseFloat(s.doSecurityDeposit.amount || 0);
    }
  });

  return {
    totalShipments,
    activeShipments,
    totalContainers,
    containersInPort,
    unreturnedContainers,
    totalIncurredLoss,
    totalAtRiskContainers,
    doExpiringCount,
    urgentInspectionCount,
    depositRefundsDue,
    depositTotalDueAmount
  };
};
