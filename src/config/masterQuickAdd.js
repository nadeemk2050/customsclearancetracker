// Field definitions for creating master records inline from the BL form dropdowns.

export const MASTER_QUICK_ADD = {
  dealers: {
    label: 'dealer',
    panelTitle: 'Dealers (Investors / Indentors)',
    idPrefix: 'dlr',
    nameKey: 'name',
    fields: [
      { key: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Hassan Al-Zahra' },
      { key: 'phone', label: 'Phone', placeholder: '+971 50 000 0000' },
      { key: 'email', label: 'Email', placeholder: 'name@company.com' },
      { key: 'address', label: 'Address', placeholder: 'Office / warehouse address' },
      { key: 'trn', label: 'TRN / Tax Number', placeholder: '100xxxxxxxxxxxxx' }
    ]
  },
  shippingLines: {
    label: 'shipping line',
    panelTitle: 'Shipping Lines / Carriers',
    idPrefix: 'sl',
    nameKey: 'name',
    fields: [
      { key: 'scac', label: 'SCAC / Carrier Code', placeholder: 'e.g. HLCU' },
      { key: 'defaultPortFreeDays', label: 'Default Port Free Storage Days', type: 'number', inputMode: 'numeric', placeholder: '5' },
      { key: 'defaultLineFreeDays', label: 'Default Line D&D Free Days', type: 'number', inputMode: 'numeric', placeholder: '14' }
    ]
  },
  vessels: {
    label: 'vessel',
    panelTitle: 'Vessels',
    idPrefix: 'vsl',
    nameKey: 'name',
    fields: [
      { key: 'voyage', label: 'Usual Voyage No.', placeholder: 'e.g. 2604E' },
      { key: 'shippingLine', label: 'Shipping Line', type: 'select', options: [] }
    ]
  },
  ports: {
    label: 'port',
    panelTitle: 'Ports (POL / POD)',
    idPrefix: 'prt',
    nameKey: 'name',
    fields: [
      { key: 'code', label: 'UN / LOCODE', placeholder: 'e.g. AEJEA' },
      { key: 'country', label: 'Country', placeholder: 'e.g. UAE' },
      { key: 'terminal', label: 'Terminal', placeholder: 'e.g. DP World Terminal 2' },
      { key: 'defaultPortFreeDays', label: 'Default Storage Free Days', type: 'number', inputMode: 'numeric', placeholder: '5' }
    ]
  },
  consignees: {
    label: 'consignee',
    panelTitle: 'Consignees (Importers)',
    idPrefix: 'con',
    nameKey: 'name',
    fields: [
      { key: 'address', label: 'Delivery Address', placeholder: 'Warehouse / plot address' },
      { key: 'destinationYard', label: 'Destination Yard', placeholder: 'Final delivery yard' },
      { key: 'trn', label: 'TRN / Tax Number', placeholder: '100xxxxxxxxxxxxx' },
      { key: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Mr. Mumtaz Ali' },
      { key: 'phone', label: 'Phone', placeholder: '+971 50 000 0000' }
    ]
  },
  shippers: {
    label: 'shipper',
    panelTitle: 'Shippers (Exporters)',
    idPrefix: 'shp',
    nameKey: 'name',
    fields: [
      { key: 'country', label: 'Country', placeholder: 'e.g. Germany' },
      { key: 'address', label: 'Address', placeholder: 'Supplier address' },
      { key: 'contactPerson', label: 'Contact Person', placeholder: 'e.g. Klaus Fischer' },
      { key: 'phone', label: 'Phone', placeholder: '+49 40 000 000' }
    ]
  },
  cargoDescriptions: {
    label: 'cargo description',
    panelTitle: 'Cargo Descriptions & HS Codes',
    idPrefix: 'crg',
    nameKey: 'description',
    fields: [
      { key: 'defaultHsCode', label: 'Default HS Code', placeholder: 'e.g. 3902.10.00' },
      { key: 'defaultPackaging', label: 'Default Packaging', placeholder: 'e.g. Bags / Pallets' },
      { key: 'defaultDutyPercent', label: 'Default Duty %', type: 'number', inputMode: 'decimal', placeholder: '5' }
    ]
  },
  depots: {
    label: 'empty return depot',
    panelTitle: 'Empty Return Depots',
    idPrefix: 'dpt',
    nameKey: 'name',
    fields: [
      { key: 'shippingLine', label: 'Shipping Line', type: 'select', options: [] },
      { key: 'location', label: 'Location / Yard', placeholder: 'e.g. Dubai Industrial City, Yard 4' },
      { key: 'workingHours', label: 'Gate Working Hours', placeholder: 'e.g. 08:00 - 20:00' }
    ]
  }
};

export const buildMasterRecord = (category, draft) => {
  const config = MASTER_QUICK_ADD[category] || {};
  const nameKey = config.nameKey || 'name';
  const fields = config.fields || [];
  const { name, ...extras } = draft;
  const record = {
    id: `${config.idPrefix || 'mst'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    [nameKey]: name
  };

  Object.entries(extras).forEach(([key, value]) => {
    const field = fields.find((item) => item.key === key);
    let cleaned = typeof value === 'string' ? value.trim() : value;
    if (cleaned === undefined || cleaned === null || cleaned === '') return;
    if (field?.type === 'number') {
      const numeric = Number(cleaned);
      if (Number.isFinite(numeric)) cleaned = numeric;
    }
    record[key] = cleaned;
  });

  return record;
};

export const masterRecordName = (category, record) => {
  const nameKey = (MASTER_QUICK_ADD[category] || {}).nameKey || 'name';
  return record?.[nameKey] || record?.name || record?.description || '';
};
