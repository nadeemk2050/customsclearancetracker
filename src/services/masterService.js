// Master Data Management Service (Offline-First Architecture)
// Shipping Lines, Consignees, Shippers, Ports, Cargo, Depots

import { db, doc, setDoc, onSnapshot } from '../firebase/config';

export const INITIAL_MASTERS = {
  shippingLines: [
    { id: 'sl_1', name: 'Hapag-Lloyd', scac: 'HLCU', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 85, contactEmail: 'imports@hapag-lloyd.com', phone: '+971 4 397 8888' },
    { id: 'sl_2', name: 'Maersk Line', scac: 'MAEU', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 90, contactEmail: 'uaecs@maersk.com', phone: '+971 4 332 5000' },
    { id: 'sl_3', name: 'MSC (Mediterranean Shipping Co)', scac: 'MSCU', defaultPortFreeDays: 7, defaultLineFreeDays: 21, defaultDetentionRate: 75, contactEmail: 'uae-info@msc.com', phone: '+971 4 381 2222' },
    { id: 'sl_4', name: 'CMA CGM', scac: 'CMDU', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 80, contactEmail: 'dxb.customerservice@cma-cgm.com', phone: '+971 4 402 1000' },
    { id: 'sl_5', name: 'COSCO Shipping', scac: 'COSU', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 70, contactEmail: 'import@cosco.ae', phone: '+971 4 393 8888' },
    { id: 'sl_6', name: 'Ocean Network Express (ONE)', scac: 'ONEY', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 80, contactEmail: 'me.cs@one-line.com', phone: '+971 4 804 0000' },
    { id: 'sl_7', name: 'Evergreen Marine', scac: 'EGLV', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 75, contactEmail: 'import@evergreen-shipping.ae', phone: '+971 4 359 5555' },
    { id: 'sl_8', name: 'Yang Ming', scac: 'YMLU', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 75, contactEmail: 'dxb@yangming.com', phone: '+971 4 352 2220' },
    { id: 'sl_9', name: 'HMM', scac: 'HMMU', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 80, contactEmail: 'uaecs@hmm21.com', phone: '+971 4 397 7770' },
    { id: 'sl_10', name: 'ZIM Integrated Shipping', scac: 'ZIMU', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 85, contactEmail: 'cs@zim.com', phone: '+971 4 311 0000' },
    { id: 'sl_11', name: 'Wan Hai Lines', scac: 'WHLC', defaultPortFreeDays: 5, defaultLineFreeDays: 14, defaultDetentionRate: 70, contactEmail: 'dxb_cs@wanhai.com', phone: '+971 4 351 1111' }
  ],

  consignees: [
    { id: 'con_1', name: 'MUMTAZ PLASTIC RECYCLING LLC', address: 'Plot 598-1120, Dubai Industrial City, Phase 2, Warehouse 4, Dubai, UAE', trn: '100294829100003', contactPerson: 'Mr. Mumtaz Ali', phone: '+971 50 123 4567', email: 'operations@mumtazplastic.com', destinationYard: 'Dubai Industrial City Yard, Warehouse 4' },
    { id: 'con_2', name: 'AL-FALAH GENERAL TRADING EST', address: 'Al-Kharj Road, Industrial Area 2, Street 18, Riyadh, Saudi Arabia', trn: '300184920100003', contactPerson: 'Tariq Al-Mansoor', phone: '+966 55 987 6543', email: 'import@alfalahtrading.sa', destinationYard: 'Riyadh Dry Port CFS Warehouse' },
    { id: 'con_3', name: 'EUROPEAN LOGISTICS HUB B.V.', address: 'Maasvlakte Rotterdam Port Distripark, Haven 9200, 3199 LK Rotterdam, Netherlands', trn: 'NL884910284B01', contactPerson: 'Jan De Vries', phone: '+31 10 789 0123', email: 'customs@eurohublogistics.nl', destinationYard: 'Rotterdam Distripark Warehouse' },
    { id: 'con_4', name: 'HINDUSTAN INDUSTRIAL FASTENERS PVT', address: 'Plot 44, Okhla Industrial Area Phase III, New Delhi 110020, India', trn: '07AAACH1234F1Z5', contactPerson: 'Rajesh Sharma', phone: '+91 98112 34567', email: 'imports@hindustanfasteners.in', destinationYard: 'Patparganj ICD Delhi Yard' }
  ],

  shippers: [
    { id: 'shp_1', name: 'POLYMER GLOBAL GMBH', country: 'Germany', address: 'Willy-Brandt-Strasse 45, 20457 Hamburg, Germany', contactPerson: 'Klaus Fischer', phone: '+49 40 3344 5566', email: 'exports@polymer-global.de' },
    { id: 'shp_2', name: 'SHANGHAI ELECTRO-TECH CORP', country: 'China', address: 'No. 888 Pudong South Road, Pudong New Area, Shanghai 200120, China', contactPerson: 'Chen Wei', phone: '+86 21 6888 9900', email: 'sales@shanghaielectro.cn' },
    { id: 'shp_3', name: 'ASEAN RUBBER EXPORTS PTE', country: 'Singapore / Malaysia', address: '10 Anson Road, #21-08 International Plaza, Singapore 079903', contactPerson: 'Tan Boon Kiat', phone: '+65 6222 3344', email: 'shipping@aseanrubber.sg' },
    { id: 'shp_4', name: 'SHANDONG METALS CO LTD', country: 'China', address: 'No. 126 Yan’an 3rd Road, Shinan District, Qingdao 266071, China', contactPerson: 'Liu Jin', phone: '+86 532 8585 1234', email: 'export@shandongmetals.cn' }
  ],

  ports: [
    { id: 'prt_1', name: 'Jebel Ali Port (AEJEA)', code: 'AEJEA', country: 'UAE', terminal: 'DP World Terminal 1 / 2 / 3 / 4', defaultPortFreeDays: 5, defaultPortDailyRate: 45 },
    { id: 'prt_2', name: 'Port of Rotterdam (NLRTM)', code: 'NLRTM', country: 'Netherlands', terminal: 'ECT Delta / RWG Maasvlakte', defaultPortFreeDays: 5, defaultPortDailyRate: 60 },
    { id: 'prt_3', name: 'Nhava Sheva JNPT (INNSA)', code: 'INNSA', country: 'India', terminal: 'JNPCT / NSICT / GTI / BMCT', defaultPortFreeDays: 5, defaultPortDailyRate: 40 },
    { id: 'prt_4', name: 'King Abdulaziz Port Dammam (SADMM)', code: 'SADMM', country: 'Saudi Arabia', terminal: 'Saudi Global Ports (SGP)', defaultPortFreeDays: 7, defaultPortDailyRate: 45 },
    { id: 'prt_5', name: 'Shanghai Port (CNSHA)', code: 'CNSHA', country: 'China', terminal: 'Yangshan Deepwater Port', defaultPortFreeDays: 7, defaultPortDailyRate: 50 },
    { id: 'prt_6', name: 'Hamburg Port (DEHAM)', code: 'DEHAM', country: 'Germany', terminal: 'HHLA Container Terminal Burchardkai', defaultPortFreeDays: 5, defaultPortDailyRate: 55 },
    { id: 'prt_7', name: 'Singapore Port (SGSIN)', code: 'SGSIN', country: 'Singapore', terminal: 'PSA Pasir Panjang / Tuas Port', defaultPortFreeDays: 5, defaultPortDailyRate: 50 },
    { id: 'prt_8', name: 'Port of Los Angeles (USLAX)', code: 'USLAX', country: 'USA', terminal: 'Pier 400 / APM Terminals', defaultPortFreeDays: 4, defaultPortDailyRate: 120 }
  ],

  cargoDescriptions: [
    { id: 'crg_1', description: 'POST INDUSTRIAL RECYCLED POLYPROPYLENE GRANULES', defaultHsCode: '3902.10.00', defaultDutyPercent: 5, defaultPackaging: 'Bags / Pallets' },
    { id: 'crg_2', description: 'PRECISION AIR CONDITIONING SPARE COMPRESSORS', defaultHsCode: '8414.30.00', defaultDutyPercent: 5, defaultPackaging: 'Wooden Crates' },
    { id: 'crg_3', description: 'NATURAL RUBBER SHEETS TSR20', defaultHsCode: '4001.22.00', defaultDutyPercent: 0, defaultPackaging: 'Bales' },
    { id: 'crg_4', description: 'STAINLESS STEEL FASTENERS & BOLTS', defaultHsCode: '7318.15.00', defaultDutyPercent: 7.5, defaultPackaging: 'Cartons' },
    { id: 'crg_5', description: 'CERAMIC TILES GLAZED PORCELAIN', defaultHsCode: '6907.21.00', defaultDutyPercent: 5, defaultPackaging: 'Boxes / Pallets' },
    { id: 'crg_6', description: 'PHOTOVOLTAIC SOLAR CELL PANELS', defaultHsCode: '8541.43.00', defaultDutyPercent: 0, defaultPackaging: 'Pallets' }
  ],

  depots: [
    { id: 'dpt_1', name: 'Hapag-Lloyd Inland Depot 4', shippingLine: 'Hapag-Lloyd', location: 'Dubai Industrial City, Yard 4', workingHours: '08:00 - 20:00' },
    { id: 'dpt_2', name: 'Maersk Maasvlakte Depot', shippingLine: 'Maersk Line', location: 'Maasvlakte 2 Haven 9100', workingHours: '24 Hours' },
    { id: 'dpt_3', name: 'MSC Al-Khafji Logistics Depot', shippingLine: 'MSC', location: 'Dammam Industrial Port Road', workingHours: '07:00 - 19:00' },
    { id: 'dpt_4', name: 'COSCO Concor Yard Nhava Sheva', shippingLine: 'COSCO Shipping', location: 'JNPT Dronagiri CFS Hub', workingHours: '24 Hours' }
  ],

  dealers: [
    {
      id: 'dlr_1',
      name: 'AL-ZAHRA TRADING & INVESTMENTS',
      contactPerson: 'Hassan Al-Zahra',
      phone: '+971 50 234 5678',
      email: 'hassan@alzahrainvest.com',
      address: 'Deira Business Hub, Suite 402, Dubai, UAE',
      trn: '100456789000003',
      notes: 'Principal investor/indentor for polymer and packaging materials'
    },
    {
      id: 'dlr_2',
      name: 'GLOBAL METALS & COMMODITIES INDENTORS',
      contactPerson: 'Suresh Patel',
      phone: '+971 55 876 5432',
      email: 'spatel@globalindentors.ae',
      address: 'JLT Cluster W, Office 1402, Dubai, UAE',
      trn: '100987654300003',
      notes: 'Industrial hardware and fastener supply financing'
    }
  ],

  lots: [
    {
      id: 'lot_1',
      lotNo: 'LOT-2026-001',
      dealerName: 'AL-ZAHRA TRADING & INVESTMENTS',
      description: 'Polymer Raw Granules Consignment Batch 1',
      notes: 'Mumtaz Plastic recycling line allocation'
    },
    {
      id: 'lot_2',
      lotNo: 'LOT-2026-002',
      dealerName: 'GLOBAL METALS & COMMODITIES INDENTORS',
      description: 'Precision Stainless Steel Fasteners Batch A',
      notes: 'Q4 Industrial Hardware allocation'
    }
  ]
};

const getMastersKey = (companyId = 'cha_al_mumtaz') => `cct_pro_masters_${companyId}`;

// 1. OFFLINE-FIRST: Load Masters from local storage immediately
export const getLocalMasters = (companyId = 'cha_al_mumtaz') => {
  try {
    const raw = localStorage.getItem(getMastersKey(companyId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...INITIAL_MASTERS,
          ...parsed,
          dealers: parsed.dealers && parsed.dealers.length > 0 ? parsed.dealers : INITIAL_MASTERS.dealers,
          lots: parsed.lots && parsed.lots.length > 0 ? parsed.lots : INITIAL_MASTERS.lots
        };
      }
    }
  } catch (err) {
    console.warn('Error reading local masters:', err);
  }
  saveLocalMasters(INITIAL_MASTERS, companyId);
  return INITIAL_MASTERS;
};

// 2. OFFLINE-FIRST: Save Masters to local PC storage immediately
export const saveLocalMasters = (masters, companyId = 'cha_al_mumtaz') => {
  try {
    localStorage.setItem(getMastersKey(companyId), JSON.stringify(masters));
  } catch (err) {
    console.error('Failed writing masters to local storage:', err);
  }
};

// 3. OFFLINE-FIRST: Subscribe to Masters — local first, then live cloud updates
// Any master added or edited by one team member reaches every teammate instantly.
export const subscribeToMasters = (companyId = 'cha_al_mumtaz', onData) => {
  // Emit local instantly
  const local = getLocalMasters(companyId);
  onData(local);

  let unsubscribe = () => {};

  try {
    const docRef = doc(db, 'cct_shipments', `masters_${companyId}`);
    unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          // First device for this company: publish the starting master data
          setDoc(docRef, { ...local, updatedAt: new Date().toISOString() }).catch(() => {});
          return;
        }

        const remoteData = docSnap.data();
        const merged = {
          ...INITIAL_MASTERS,
          ...remoteData,
          dealers: remoteData?.dealers && remoteData.dealers.length > 0
            ? remoteData.dealers
            : (local.dealers || INITIAL_MASTERS.dealers),
          lots: remoteData?.lots && remoteData.lots.length > 0
            ? remoteData.lots
            : (local.lots || INITIAL_MASTERS.lots)
        };
        saveLocalMasters(merged, companyId);
        onData(merged);
      },
      (err) => {
        console.warn('[Cloud Sync] Masters listener:', err?.message || err);
      }
    );
  } catch (err) {
    console.warn('[Cloud Sync] Masters listener unavailable:', err?.message || err);
  }

  return () => {
    try {
      unsubscribe();
    } catch {
      // ignore
    }
  };
};

// 4. OFFLINE-FIRST: Persist Masters (Writes locally first, then single cloud write)
export const persistMasters = async (newMasters, companyId = 'cha_al_mumtaz') => {
  saveLocalMasters(newMasters, companyId);
  try {
    const docRef = doc(db, 'cct_shipments', `masters_${companyId}`);
    await setDoc(docRef, { ...newMasters, updatedAt: new Date().toISOString() });
  } catch {
    // Offline mode is completely supported
  }
  return newMasters;
};
