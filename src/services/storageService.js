// Data Storage and Synchronization Service (Firebase Firestore + Local Offline Persistence)
import { 
  db, 
  CCT_COLLECTION, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from '../firebase/config';

// Realistic sample datasets reflecting real-world international trade
export const INITIAL_CCT_DATA = [
  {
    id: 'CCT-2026-001',
    blNo: 'HLCUTOR260620111',
    shippingLine: 'Hapag-Lloyd',
    vessel: 'AL ZUBARA',
    voyage: '2604E',
    pol: 'Hamburg, Germany',
    pod: 'Jebel Ali Port (AEJEA)',
    finalDestination: 'Dubai Industrial City Yard',
    consignee: 'MUMTAZ PLASTIC RECYCLING LLC',
    shipper: 'POLYMER GLOBAL GMBH',
    cargoDescription: 'POST INDUSTRIAL RECYCLED POLYPROPYLENE GRANULES',
    totalPackages: '960 Bags / 24 Pallets',
    grossWeightKg: 52140,
    volumeCbm: 68.5,
    customsDeclarationNo: 'DXB-CUST-883921',
    customsDeclarationDate: '2026-10-08',
    hsCode: '3902.10.00',
    customsDutyAmount: 2607,
    customsVatAmount: 2737,
    customsStatus: 'Under Inspection',
    inspectionType: 'Red (Physical & Customs Lab Sampling)',
    doValidityDate: '2026-10-14',
    doSecurityDeposit: {
      amount: 2000,
      currency: 'USD',
      status: 'Deposited',
      receiptNo: 'HL-DEP-99410'
    },
    eta: '2026-10-06',
    ata: '2026-10-07',
    dischargeDate: '2026-10-08',
    portFreeDays: 5,
    lineFreeDays: 14,
    portStorageDailyRate: 50,
    lineDetentionDailyRate: 90,
    notes: 'Customs sample sent to Dubai Central Lab for polymer purity test. DO collected from Hapag-Lloyd Deira office.',
    documents: {
      commercialInvoice: true,
      packingList: true,
      originalBL: true,
      certificateOfOrigin: true,
      formEFTA: false,
      deliveryOrder: true,
      customsDeclaration: true,
      dutyPaymentReceipt: false,
      portGatePass: false,
      emptyReturnEIR: false
    },
    containers: [
      {
        id: 'c1',
        containerNo: 'HLXU8291048',
        sizeType: '40HC',
        sealNo: 'HL773192',
        dischargeDate: '2026-10-08',
        gateOutDate: '',
        deliveryDate: '',
        emptyReturnDepot: 'Hapag-Lloyd Inland Depot 4',
        emptyReturnDate: '',
        eirNumber: '',
        status: 'At Port (Full)'
      },
      {
        id: 'c2',
        containerNo: 'FSCU8083274',
        sizeType: '40HC',
        sealNo: 'HL773193',
        dischargeDate: '2026-10-08',
        gateOutDate: '',
        deliveryDate: '',
        emptyReturnDepot: 'Hapag-Lloyd Inland Depot 4',
        emptyReturnDate: '',
        eirNumber: '',
        status: 'At Port (Full)'
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CCT-2026-002',
    blNo: 'MEDUX94820155',
    shippingLine: 'MSC',
    vessel: 'MSC GULSUN',
    voyage: '2411W',
    pol: 'Shanghai, China',
    pod: 'King Abdulaziz Port Dammam',
    finalDestination: 'Riyadh Dry Port CFS',
    consignee: 'AL-FALAH GENERAL TRADING EST',
    shipper: 'SHANGHAI ELECTRO-TECH CORP',
    cargoDescription: 'PRECISION AIR CONDITIONING SPARE COMPRESSORS',
    totalPackages: '120 Wooden Crates',
    grossWeightKg: 18450,
    volumeCbm: 38.0,
    customsDeclarationNo: 'DMM-BOE-55102',
    customsDeclarationDate: '2026-10-05',
    hsCode: '8414.30.00',
    customsDutyAmount: 3690,
    customsVatAmount: 11070,
    customsStatus: 'Duty Paid',
    inspectionType: 'Yellow (Documentary Assessment Passed)',
    doValidityDate: '2026-10-12',
    doSecurityDeposit: {
      amount: 1500,
      currency: 'USD',
      status: 'Deposited',
      receiptNo: 'MSC-DEP-4418'
    },
    eta: '2026-10-04',
    ata: '2026-10-04',
    dischargeDate: '2026-10-05',
    portFreeDays: 7,
    lineFreeDays: 21,
    portStorageDailyRate: 45,
    lineDetentionDailyRate: 75,
    notes: 'Customs Duty & VAT settled via SADAD portal. Port token booked for transport dispatch tomorrow morning.',
    documents: {
      commercialInvoice: true,
      packingList: true,
      originalBL: true,
      certificateOfOrigin: true,
      formEFTA: true,
      deliveryOrder: true,
      customsDeclaration: true,
      dutyPaymentReceipt: true,
      portGatePass: true,
      emptyReturnEIR: false
    },
    containers: [
      {
        id: 'c3',
        containerNo: 'MSCU7391054',
        sizeType: '40GP',
        sealNo: 'MSC99302',
        dischargeDate: '2026-10-05',
        gateOutDate: '',
        deliveryDate: '',
        emptyReturnDepot: 'MSC Al-Khafji Logistics Depot',
        emptyReturnDate: '',
        eirNumber: '',
        status: 'At Port (Full)'
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CCT-2026-003',
    blNo: 'MAEU284910482',
    shippingLine: 'Maersk Line',
    vessel: 'MAERSK MC-KINNEY MOLLER',
    voyage: '2408S',
    pol: 'Tanjung Pelepas, Malaysia',
    pod: 'Port of Rotterdam',
    finalDestination: 'Rotterdam Distripark Warehouse',
    consignee: 'EUROPEAN LOGISTICS HUB B.V.',
    shipper: 'ASEAN RUBBER EXPORTS PTE',
    cargoDescription: 'NATURAL RUBBER SHEETS TSR20',
    totalPackages: '80 Bales',
    grossWeightKg: 40200,
    volumeCbm: 54.0,
    customsDeclarationNo: 'NL-AGS-991823',
    customsDeclarationDate: '2026-09-28',
    hsCode: '4001.22.00',
    customsDutyAmount: 0,
    customsVatAmount: 8442,
    customsStatus: 'Gate Out',
    inspectionType: 'Green Channel (Direct Release)',
    doValidityDate: '2026-10-06',
    doSecurityDeposit: {
      amount: 1000,
      currency: 'USD',
      status: 'Deposited',
      receiptNo: 'ML-GRT-2201'
    },
    eta: '2026-09-26',
    ata: '2026-09-27',
    dischargeDate: '2026-09-28',
    portFreeDays: 5,
    lineFreeDays: 14,
    portStorageDailyRate: 60,
    lineDetentionDailyRate: 85,
    notes: 'Containers gated out on Sept 30. Delivery completed at customer warehouse Oct 2. 1 empty returned, 1 pending return.',
    documents: {
      commercialInvoice: true,
      packingList: true,
      originalBL: true,
      certificateOfOrigin: true,
      formEFTA: true,
      deliveryOrder: true,
      customsDeclaration: true,
      dutyPaymentReceipt: true,
      portGatePass: true,
      emptyReturnEIR: false
    },
    containers: [
      {
        id: 'c4',
        containerNo: 'MRKU3920194',
        sizeType: '40HC',
        sealNo: 'ML8812',
        dischargeDate: '2026-09-28',
        gateOutDate: '2026-09-30',
        deliveryDate: '2026-10-02',
        emptyReturnDepot: 'Maersk Maasvlakte Depot',
        emptyReturnDate: '2026-10-04',
        eirNumber: 'EIR-NL-849102',
        status: 'Empty Returned (Safe)'
      },
      {
        id: 'c5',
        containerNo: 'MRKU4910283',
        sizeType: '40HC',
        sealNo: 'ML8813',
        dischargeDate: '2026-09-28',
        gateOutDate: '2026-09-30',
        deliveryDate: '2026-10-02',
        emptyReturnDepot: 'Maersk Maasvlakte Depot',
        emptyReturnDate: '',
        eirNumber: '',
        status: 'At Consignee (Unloading)'
      }
    ],
    updatedAt: new Date().toISOString()
  },
  {
    id: 'CCT-2026-004',
    blNo: 'COSU639201948',
    shippingLine: 'COSCO Shipping',
    vessel: 'COSCO SHIPPING SCORPIO',
    voyage: '032E',
    pol: 'Qingdao, China',
    pod: 'Nhava Sheva (JNPT Mumbai)',
    finalDestination: 'Patparganj ICD Delhi',
    consignee: 'HINDUSTAN INDUSTRIAL FASTENERS PVT',
    shipper: 'SHANDONG METALS CO LTD',
    cargoDescription: 'STAINLESS STEEL FASTENERS & BOLTS',
    totalPackages: '500 Cartons',
    grossWeightKg: 24500,
    volumeCbm: 29.0,
    customsDeclarationNo: 'IN-ICEGATE-774912',
    customsDeclarationDate: '2026-09-15',
    hsCode: '7318.15.00',
    customsDutyAmount: 4900,
    customsVatAmount: 4410,
    customsStatus: 'Empties Returned',
    inspectionType: 'Yellow (Documentary Assessment Passed)',
    doValidityDate: '2026-09-22',
    doSecurityDeposit: {
      amount: 1200,
      currency: 'USD',
      status: 'Claimed',
      receiptNo: 'COS-DEP-7731'
    },
    eta: '2026-09-14',
    ata: '2026-09-15',
    dischargeDate: '2026-09-16',
    portFreeDays: 5,
    lineFreeDays: 14,
    portStorageDailyRate: 40,
    lineDetentionDailyRate: 70,
    notes: 'Fully cleared and delivered. All containers returned to Nhava Sheva depot with valid EIR. Security deposit refund submitted to COSCO accounts.',
    documents: {
      commercialInvoice: true,
      packingList: true,
      originalBL: true,
      certificateOfOrigin: true,
      formEFTA: false,
      deliveryOrder: true,
      customsDeclaration: true,
      dutyPaymentReceipt: true,
      portGatePass: true,
      emptyReturnEIR: true
    },
    containers: [
      {
        id: 'c6',
        containerNo: 'CSNU1029482',
        sizeType: '20GP',
        sealNo: 'COS8812',
        dischargeDate: '2026-09-16',
        gateOutDate: '2026-09-18',
        deliveryDate: '2026-09-21',
        emptyReturnDepot: 'COSCO Concor Yard Nhava Sheva',
        emptyReturnDate: '2026-09-23',
        eirNumber: 'EIR-IN-994182',
        status: 'Empty Returned (Safe)'
      }
    ],
    updatedAt: new Date().toISOString()
  }
];

const LOCAL_STORAGE_KEY = 'cct_pro_shipments_db';

// Load from LocalStorage
export const getLocalShipments = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed reading local storage, using initial mock data:', err);
  }
  // Store default dataset if empty
  saveLocalShipments(INITIAL_CCT_DATA);
  return INITIAL_CCT_DATA;
};

// Save to LocalStorage
export const saveLocalShipments = (shipments) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(shipments));
  } catch (err) {
    console.error('Failed writing to local storage:', err);
  }
};

// Live Firestore Listener with Local Storage synchronization
export const subscribeToShipments = (onData, onError) => {
  // 1. Immediately emit local cached data for instantaneous UI load
  const cached = getLocalShipments();
  onData(cached);

  // 2. Attach live Firestore listener
  try {
    const colRef = collection(db, CCT_COLLECTION);
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteShipments = [];
          snapshot.forEach((docSnap) => {
            remoteShipments.push({ id: docSnap.id, ...docSnap.data() });
          });
          // Sort by creation or update date descending
          remoteShipments.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
          saveLocalShipments(remoteShipments);
          onData(remoteShipments);
        } else {
          // If remote collection is currently empty, push initial dataset up to Firestore
          console.log('CCT Firestore collection is empty. Seeding initial records...');
          seedInitialDataToFirestore();
        }
      },
      (error) => {
        console.warn('Firestore real-time sync error (falling back to local cache):', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Firestore initialization fallback:', err);
    return () => {};
  }
};

// Seed initial data to Firestore
export const seedInitialDataToFirestore = async () => {
  try {
    for (const item of INITIAL_CCT_DATA) {
      const docRef = doc(db, CCT_COLLECTION, item.id);
      await setDoc(docRef, item);
    }
    console.log('Seeded initial CCT records to Firestore.');
  } catch (err) {
    console.warn('Failed seeding to Firestore (working offline):', err);
  }
};

// Save or Update a Shipment (Saves both to Firestore and LocalStorage)
export const persistShipment = async (shipment, existingList) => {
  const updatedShipment = {
    ...shipment,
    id: shipment.id || `CCT-${Date.now()}`,
    updatedAt: new Date().toISOString()
  };

  // Update local state first for instant responsiveness
  let updatedList;
  const exists = existingList.some(item => item.id === updatedShipment.id);
  if (exists) {
    updatedList = existingList.map(item => item.id === updatedShipment.id ? updatedShipment : item);
  } else {
    updatedList = [updatedShipment, ...existingList];
  }
  saveLocalShipments(updatedList);

  // Sync to Firestore
  try {
    const docRef = doc(db, CCT_COLLECTION, updatedShipment.id);
    await setDoc(docRef, updatedShipment);
  } catch (err) {
    console.warn('Could not sync update to Firestore (saved locally):', err);
  }

  return updatedList;
};

// Delete a Shipment
export const removeShipment = async (id, existingList) => {
  const updatedList = existingList.filter(item => item.id !== id);
  saveLocalShipments(updatedList);

  try {
    const docRef = doc(db, CCT_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('Could not sync delete to Firestore (removed locally):', err);
  }

  return updatedList;
};

// Export to JSON file (Backup)
export const exportToJsonFile = (shipments) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(shipments, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `CustomsTrack_Pro_Backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Export to CSV spreadsheet
export const exportToCsvFile = (shipments) => {
  const headers = [
    'BL Number',
    'Shipping Line',
    'Vessel',
    'Voyage',
    'Port of Discharge',
    'Consignee',
    'Cargo Description',
    'Containers',
    'Customs Status',
    'Declaration No',
    'Discharge Date',
    'Port Free Days',
    'Port Storage Status',
    'Line Free Days',
    'Line Detention Status',
    'DO Validity Date',
    'Deposit Status'
  ];

  const rows = shipments.map(s => {
    const containerList = (s.containers || []).map(c => `${c.containerNo} (${c.sizeType})`).join('; ');
    return [
      `"${s.blNo || ''}"`,
      `"${s.shippingLine || ''}"`,
      `"${s.vessel || ''}"`,
      `"${s.voyage || ''}"`,
      `"${s.pod || ''}"`,
      `"${s.consignee || ''}"`,
      `"${(s.cargoDescription || '').replace(/"/g, '""')}"`,
      `"${containerList}"`,
      `"${s.customsStatus || ''}"`,
      `"${s.customsDeclarationNo || ''}"`,
      `"${s.dischargeDate || ''}"`,
      `"${s.portFreeDays || ''}"`,
      `"${s.portDaysLeft !== undefined ? s.portDaysLeft + ' days left' : ''}"`,
      `"${s.lineFreeDays || ''}"`,
      `"${s.lineDaysLeft !== undefined ? s.lineDaysLeft + ' days left' : ''}"`,
      `"${s.doValidityDate || ''}"`,
      `"${s.doSecurityDeposit ? s.doSecurityDeposit.status : ''}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', encodedUri);
  downloadAnchor.setAttribute('download', `CustomsTrack_Pro_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
