// Typed Read-Model Schema & Aggregation Definitions
// Decouples read calculations from React render cycles

export const ENTITY_COLLECTIONS = {
  SHIPMENTS: 'shipments',
  MASTERS: 'masters',
  TEAMS: 'teams',
  INVOICES: 'invoices',
  PARTIES: 'parties'
};

export const AGGREGATE_VIEWS = {
  FLEET_RISK_RADAR: 'fleet_risk_radar',
  CONTAINER_STATUS_SUMMARY: 'container_status_summary',
  EXPIRING_FREE_TIME: 'expiring_free_time'
};
