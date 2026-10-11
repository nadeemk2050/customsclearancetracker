// Authentication & Multi-Tenant Company Management Service
import { 
  db, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  onSnapshot, 
  initFirebaseAuth 
} from '../firebase/config';

const LOCAL_SESSION_KEY = 'cct_pro_active_session';
const LOCAL_COMPANIES_KEY = 'cct_pro_companies_db';

// Cross-browser/tab fast synchronization channel
const companyBus = typeof window !== 'undefined' && window.BroadcastChannel 
  ? new BroadcastChannel('cct_companies_bus') 
  : null;

// Pre-seeded demonstration CHA company for instant testing
const DEFAULT_DEMO_COMPANY = {
  companyId: 'cha_al_mumtaz',
  companyName: 'AL MUMTAZ CUSTOMS CLEARING LLC',
  adminUsername: 'admin',
  adminEmail: 'admin@almumtaz.ae',
  adminPassword: '123',
  phone: '+971 4 397 8888',
  country: 'United Arab Emirates',
  createdAt: new Date().toISOString(),
  teamMembers: [
    {
      id: 'tm_1',
      name: 'Tariq Al-Mansoor',
      username: 'tariq',
      phone: '+971 50 882 1923',
      role: 'Senior Customs Broker',
      password: '123',
      status: 'Active',
      createdAt: '2026-10-01'
    },
    {
      id: 'tm_2',
      name: 'Suresh Kumar',
      username: 'suresh',
      phone: '+971 55 491 8234',
      role: 'Port Terminal Runner',
      password: '123',
      status: 'Active',
      createdAt: '2026-10-03'
    },
    {
      id: 'tm_3',
      name: 'Fatima Al-Zahra',
      username: 'fatima',
      phone: '+971 52 119 2948',
      role: 'Documentation Specialist',
      password: '123',
      status: 'Active',
      createdAt: '2026-10-05'
    }
  ]
};

// Retrieve all local companies
export const getLocalCompanies = () => {
  try {
    const raw = localStorage.getItem(LOCAL_COMPANIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn('Error reading local companies:', err);
  }
  const initial = [DEFAULT_DEMO_COMPANY];
  localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(initial));
  return initial;
};

// Save companies to local storage and broadcast to other open tabs/windows
const saveLocalCompanies = (companies) => {
  localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(companies));
  if (companyBus) {
    try {
      companyBus.postMessage({ type: 'COMPANIES_UPDATED', list: companies });
    } catch {}
  }
};

// Get current active session
export const getCurrentSession = () => {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    return null;
  }
  return null;
};

// Logout
export const logout = () => {
  localStorage.removeItem(LOCAL_SESSION_KEY);
};

// Set session
export const setCurrentSession = (session) => {
  if (session) {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  }
};

// Cloud sync helper: Bidirectional merge with Firebase Firestore directory
export const refreshCompaniesFromCloud = async () => {
  try {
    await initFirebaseAuth();
    const dirRef = doc(db, 'cct_shipments', 'companies_directory');
    const snap = await getDoc(dirRef);
    const local = getLocalCompanies();
    const cloudList = snap.exists() && Array.isArray(snap.data()?.list) ? snap.data().list : [];

    // Create unified map of all companies
    const map = new Map();
    // Default demo company always present
    map.set(DEFAULT_DEMO_COMPANY.companyId, DEFAULT_DEMO_COMPANY);
    
    // Merge cloud companies
    cloudList.forEach(c => map.set(c.companyId, c));

    // Merge any locally registered companies (e.g. PAKOCEAN2 created in another browser tab)
    let needsCloudSync = false;
    local.forEach(c => {
      if (!map.has(c.companyId)) {
        map.set(c.companyId, c);
        needsCloudSync = true;
      } else {
        const existing = map.get(c.companyId);
        const memberMap = new Map();
        (existing.teamMembers || []).forEach(m => memberMap.set(String(m.username || '').toLowerCase(), m));
        (c.teamMembers || []).forEach(m => {
          const uKey = String(m.username || '').toLowerCase();
          if (!memberMap.has(uKey)) {
            memberMap.set(uKey, m);
            needsCloudSync = true;
          }
        });
        existing.teamMembers = Array.from(memberMap.values());
        map.set(c.companyId, existing);
      }
    });

    const merged = Array.from(map.values());
    saveLocalCompanies(merged);

    // If local has companies not yet in cloud, immediately sync them up to Firebase
    if (needsCloudSync || !snap.exists()) {
      try {
        await setDoc(dirRef, { list: merged, updatedAt: new Date().toISOString() }, { merge: true });
      } catch {}
    }

    return merged;
  } catch {
    // Offline-safe fallback
  }
  return getLocalCompanies();
};

// Real-time listener for companies directory across all devices
export const subscribeCloudCompanies = (onUpdate) => {
  // Listen to cross-tab BroadcastChannel
  if (companyBus) {
    companyBus.onmessage = (event) => {
      if (event.data?.type === 'COMPANIES_UPDATED' && Array.isArray(event.data?.list)) {
        onUpdate(event.data.list);
      }
    };
  }

  // Listen to Firestore real-time updates
  try {
    const dirRef = doc(db, 'cct_shipments', 'companies_directory');
    return onSnapshot(dirRef, (snap) => {
      if (snap.exists() && Array.isArray(snap.data()?.list)) {
        const cloudList = snap.data().list;
        const local = getLocalCompanies();
        const map = new Map();
        local.forEach(c => map.set(c.companyId, c));
        cloudList.forEach(c => map.set(c.companyId, c));
        const merged = Array.from(map.values());
        saveLocalCompanies(merged);
        onUpdate(merged);
      }
    }, () => {});
  } catch {
    return () => {};
  }
};

// Sync single company to shared cloud directory
const syncCompanyToCloudDirectory = async (companyData) => {
  try {
    await initFirebaseAuth();
    const dirRef = doc(db, 'cct_shipments', 'companies_directory');
    const snap = await getDoc(dirRef);
    const existing = snap.exists() && Array.isArray(snap.data()?.list) ? snap.data().list : [];
    const filtered = existing.filter(c => c.companyId !== companyData.companyId);
    filtered.push(companyData);
    await setDoc(dirRef, { list: filtered, updatedAt: new Date().toISOString() }, { merge: true });
    if (companyBus) {
      companyBus.postMessage({ type: 'COMPANIES_UPDATED', list: filtered });
    }
  } catch {
    // Offline-safe fallback
  }
};

// Sign Up New Main CHA Company Admin
export const signUpCompanyAdmin = async ({ companyName, username, email = '', password, phone = '', country = '' }) => {
  if (!companyName.trim() || !username.trim() || !password.trim()) {
    throw new Error('Please fill all required fields (Company Name, Username, and Password).');
  }

  const companies = getLocalCompanies();
  const cleanUsername = username.trim().toLowerCase();
  const cleanCompanyName = companyName.trim().toUpperCase();
  const cleanEmail = (email || '').trim().toLowerCase();

  // Check if username, email, or company already exists
  const existing = companies.find(c => 
    c.adminUsername.toLowerCase() === cleanUsername || 
    c.companyName.toUpperCase() === cleanCompanyName ||
    (cleanEmail && c.adminEmail && c.adminEmail.toLowerCase() === cleanEmail)
  );

  if (existing) {
    throw new Error('An account with this Company Name, Username, or Email already exists. Please choose another or login.');
  }

  const companyId = 'cha_' + cleanCompanyName.replace(/[^A-Z0-9]/gi, '_').toLowerCase() + '_' + Math.random().toString(36).substring(2, 6);

  const newCompany = {
    companyId,
    companyName: cleanCompanyName,
    adminUsername: cleanUsername,
    adminEmail: cleanEmail,
    adminPassword: password.trim(),
    phone,
    country,
    createdAt: new Date().toISOString(),
    teamMembers: []
  };

  const updatedCompanies = [...companies, newCompany];
  saveLocalCompanies(updatedCompanies);

  // Sync to Firestore quietly in authorized collection & directory
  try {
    const docRef = doc(db, 'cct_shipments', `company_${companyId}`);
    await setDoc(docRef, newCompany);
    await syncCompanyToCloudDirectory(newCompany);
  } catch {
    // Offline-first safe fallback
  }

  const session = {
    isLoggedIn: true,
    userType: 'admin',
    companyId: newCompany.companyId,
    companyName: newCompany.companyName,
    username: newCompany.adminUsername,
    email: newCompany.adminEmail,
    displayName: `${newCompany.adminUsername} (Admin)`,
    role: 'CHA Company Administrator'
  };

  setCurrentSession(session);
  return session;
};

// Login Main CHA Company Admin (Accepts Username, Email, or Company Name)
export const loginCompanyAdmin = async ({ usernameOrCompany, password }) => {
  if (!usernameOrCompany.trim() || !password.trim()) {
    throw new Error('Please enter your Username / Email / Company Name and Password.');
  }

  let companies = getLocalCompanies();
  const query = usernameOrCompany.trim().toLowerCase();
  const cleanQuery = query.replace(/[^a-z0-9]/g, '');
  const pwd = password.trim().toLowerCase();

  // Master Developer Super-Admin Recognition (nadeemalsaham@gmail.com)
  if (query === 'nadeemalsaham@gmail.com' || query === 'nadeemalsaham' || cleanQuery === 'nadeemalsaham') {
    const firstComp = companies[0] || DEFAULT_DEMO_COMPANY;
    const session = {
      isLoggedIn: true,
      userType: 'developer',
      isDeveloper: true,
      companyId: firstComp.companyId,
      companyName: firstComp.companyName,
      username: 'nadeemalsaham',
      email: 'nadeemalsaham@gmail.com',
      displayName: 'Nadeem (System Developer)',
      role: 'System Developer & Super Administrator'
    };
    setCurrentSession(session);
    return session;
  }

  let found = companies.find(c => {
    const uMatch = c.adminUsername.toLowerCase() === query;
    const cMatch = c.companyName.toLowerCase() === query || 
                   c.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanQuery ||
                   c.companyName.toLowerCase().includes(query) ||
                   query.includes(c.companyName.toLowerCase());
    const eMatch = c.adminEmail && c.adminEmail.toLowerCase() === query;
    const pMatch = String(c.adminPassword || '').trim().toLowerCase() === pwd;
    return (uMatch || cMatch || eMatch) && pMatch;
  });

  if (!found) {
    // Try refreshing from cloud
    try {
      companies = await refreshCompaniesFromCloud();
      found = companies.find(c => {
        const uMatch = c.adminUsername.toLowerCase() === query;
        const cMatch = c.companyName.toLowerCase() === query || 
                       c.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanQuery ||
                       c.companyName.toLowerCase().includes(query) ||
                       query.includes(c.companyName.toLowerCase());
        const eMatch = c.adminEmail && c.adminEmail.toLowerCase() === query;
        const pMatch = String(c.adminPassword || '').trim().toLowerCase() === pwd;
        return (uMatch || cMatch || eMatch) && pMatch;
      });
    } catch {}
  }

  if (!found) {
    throw new Error('Invalid Admin credentials. Please check your username, email, or password.');
  }

  if (found.status === 'Revoked') {
    throw new Error(`This company account (${found.companyName}) has been suspended or revoked by the Developer Administrator.`);
  }

  const session = {
    isLoggedIn: true,
    userType: 'admin',
    companyId: found.companyId,
    companyName: found.companyName,
    username: found.adminUsername,
    email: found.adminEmail,
    displayName: `${found.adminUsername} (Admin)`,
    role: 'CHA Company Administrator'
  };

  setCurrentSession(session);
  return session;
};

// Login Team Member (Case-Insensitive passwords, auto-company discovery, admin master password override)
export const loginTeamMember = async ({ companyNameOrId, username, password }) => {
  if (!username || !username.trim() || !password || !password.trim()) {
    throw new Error('Please enter your Team Username and Password.');
  }

  let companies = getLocalCompanies();
  const rawCompany = (companyNameOrId || '').trim();
  const cleanCompany = rawCompany.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanUsername = username.trim().toLowerCase();
  const cleanUsernameAlpha = cleanUsername.replace(/[^a-z0-9]/g, '');
  const pwd = password.trim().toLowerCase(); // 100% case-insensitive password

  const testCompanyForMember = (comp) => {
    const adminPwd = String(comp.adminPassword || '').trim().toLowerCase();
    const isAdminOverride = adminPwd === pwd;

    const member = (comp.teamMembers || []).find(m => {
      const u = String(m.username || '').trim().toLowerCase();
      const n = String(m.name || '').trim().toLowerCase();
      const uAlpha = u.replace(/[^a-z0-9]/g, '');
      const nAlpha = n.replace(/[^a-z0-9]/g, '');
      const mPwd = String(m.password || '').trim().toLowerCase();

      const userMatches = u === cleanUsername || n === cleanUsername || uAlpha === cleanUsernameAlpha || nAlpha === cleanUsernameAlpha;
      const pwdMatches = mPwd === pwd || isAdminOverride;

      return userMatches && pwdMatches;
    });

    if (member) {
      return { comp, member, isAdminOverride };
    }
    return null;
  };

  let targetMatch = null;

  // Pass 1: If company name/id was provided, check matching companies
  if (cleanCompany) {
    for (const comp of companies) {
      const cName = String(comp.companyName || '').trim().toLowerCase();
      const cId = String(comp.companyId || '').trim().toLowerCase();
      const cAlpha = cName.replace(/[^a-z0-9]/g, '');

      const isCompMatch = cName === rawCompany.toLowerCase() ||
                          cId === rawCompany.toLowerCase() ||
                          cAlpha === cleanCompany ||
                          (cleanCompany.length >= 3 && (cAlpha.includes(cleanCompany) || cleanCompany.includes(cAlpha)));

      if (isCompMatch) {
        targetMatch = testCompanyForMember(comp);
        if (targetMatch) break;
      }
    }
  }

  // Pass 2: Search ALL registered companies (Auto-Detect company by username & password!)
  if (!targetMatch) {
    for (const comp of companies) {
      targetMatch = testCompanyForMember(comp);
      if (targetMatch) break;
    }
  }

  // Pass 3: If still not found, refresh from cloud directory and re-try
  if (!targetMatch) {
    try {
      const refreshedCompanies = await refreshCompaniesFromCloud();
      for (const comp of refreshedCompanies) {
        targetMatch = testCompanyForMember(comp);
        if (targetMatch) break;
      }
    } catch {}
  }

  if (targetMatch) {
    const { comp, member, isAdminOverride } = targetMatch;
    const session = {
      isLoggedIn: true,
      userType: 'team',
      companyId: comp.companyId,
      companyName: comp.companyName,
      username: member.username,
      displayName: member.name || member.username,
      role: member.role || 'Team Member',
      isAdminOverride
    };

    setCurrentSession(session);
    return session;
  }

  // Helpful Diagnostics if Login Fails:
  // 1. Check if the username exists in ANY company
  const matchingUserCompanies = [];
  companies.forEach(c => {
    const m = (c.teamMembers || []).find(tm => {
      const u = String(tm.username || '').trim().toLowerCase();
      const n = String(tm.name || '').trim().toLowerCase();
      return u === cleanUsername || n === cleanUsername || u.replace(/[^a-z0-9]/g, '') === cleanUsernameAlpha;
    });
    if (m) {
      matchingUserCompanies.push({ company: c.companyName, member: m });
    }
  });

  if (matchingUserCompanies.length > 0) {
    const names = matchingUserCompanies.map(item => item.company).join(', ');
    throw new Error(`Username "${username}" exists under "${names}", but the password was incorrect. Please check your password or enter the Administrator master password.`);
  }

  // 2. Check if the specified company exists
  if (cleanCompany) {
    const existingComp = companies.find(c => {
      const cAlpha = String(c.companyName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return cAlpha === cleanCompany || (cleanCompany.length >= 3 && cAlpha.includes(cleanCompany));
    });

    if (existingComp) {
      const assignedUsernames = (existingComp.teamMembers || []).map(m => `"${m.username}"`).join(', ');
      throw new Error(`Team member "${username}" is not registered under ${existingComp.companyName}. Registered members: ${assignedUsernames || 'None assigned yet'}.`);
    } else {
      const availableComps = companies.map(c => `"${c.companyName}"`).slice(0, 3).join(', ');
      throw new Error(`Company "${rawCompany}" was not found. Available companies: ${availableComps}. Or leave Company field blank to auto-detect!`);
    }
  }

  throw new Error(`Team member "${username}" was not found. Please verify the username or leave Company Name blank to auto-detect.`);
};

// Retrieve Team Members for a given CHA Company
export const getCompanyTeamMembers = (companyId, companyName = '') => {
  const companies = getLocalCompanies();
  let comp = companies.find(c => c.companyId === companyId);
  if (!comp && companyName) {
    const clean = companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    comp = companies.find(c => c.companyName.toLowerCase().replace(/[^a-z0-9]/g, '') === clean);
  }
  if (comp) return comp.teamMembers || [];

  const fallback = companies.find(c => c.companyId === DEFAULT_DEMO_COMPANY.companyId);
  return fallback?.teamMembers || [];
};

// Assign / Update Team Member in CHA Company
export const saveCompanyTeamMember = async (companyId, memberData) => {
  const companies = getLocalCompanies();
  const cName = String(memberData.companyName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const session = getCurrentSession();
  const sessionCName = String(session?.companyName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  let compIndex = companies.findIndex(c => {
    const cIdMatch = c.companyId === companyId;
    const cleanComp = String(c.companyName || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameMatch = (cName && cleanComp === cName) || (sessionCName && cleanComp === sessionCName);
    return cIdMatch || nameMatch;
  });
  
  if (compIndex === -1) {
    // Graceful creation if company entry not found locally
    const newComp = {
      companyId: companyId || 'cha_' + Date.now(),
      companyName: memberData.companyName || session?.companyName || 'CHA Enterprise',
      adminUsername: session?.username || 'admin',
      adminPassword: '123',
      teamMembers: []
    };
    companies.push(newComp);
    compIndex = companies.length - 1;
  }

  const comp = companies[compIndex];
  const members = comp.teamMembers || [];

  const newMember = {
    ...memberData,
    id: memberData.id || 'tm_' + Date.now(),
    createdAt: memberData.createdAt || new Date().toISOString().split('T')[0]
  };

  const existingIdx = members.findIndex(m => m.id === newMember.id || m.username.toLowerCase() === newMember.username.toLowerCase());
  let updatedMembers;

  if (existingIdx !== -1) {
    updatedMembers = [...members];
    updatedMembers[existingIdx] = newMember;
  } else {
    updatedMembers = [...members, newMember];
  }

  const updatedComp = { ...comp, teamMembers: updatedMembers };
  companies[compIndex] = updatedComp;
  saveLocalCompanies(companies);

  // Sync to Firestore quietly in authorized collection & directory
  try {
    const docRef = doc(db, 'cct_shipments', `company_${companyId}`);
    await setDoc(docRef, updatedComp);
    await syncCompanyToCloudDirectory(updatedComp);
  } catch {
    // Offline-first safe fallback
  }

  return updatedMembers;
};

// Remove Team Member
export const removeCompanyTeamMember = async (companyId, memberId) => {
  const companies = getLocalCompanies();
  const compIndex = companies.findIndex(c => c.companyId === companyId);
  if (compIndex === -1) return [];

  const comp = companies[compIndex];
  const updatedMembers = (comp.teamMembers || []).filter(m => m.id !== memberId);

  const updatedComp = { ...comp, teamMembers: updatedMembers };
  companies[compIndex] = updatedComp;
  saveLocalCompanies(companies);

  try {
    const docRef = doc(db, 'cct_shipments', `company_${companyId}`);
    await setDoc(docRef, updatedComp);
    await syncCompanyToCloudDirectory(updatedComp);
  } catch {
    // Offline-first safe fallback
  }

  return updatedMembers;
};

// ==========================================
// DEVELOPER POWER FUNCTIONS (Super-Admin)
// ==========================================

// Developer Power: Delete Company globally
export const devDeleteCompany = async (companyId) => {
  const session = getCurrentSession();
  if (!session?.isDeveloper) throw new Error('Unauthorized: Developer privileges required.');

  let companies = getLocalCompanies();
  const filtered = companies.filter(c => c.companyId !== companyId);
  saveLocalCompanies(filtered);

  // Sync deletion to cloud directory
  try {
    await initFirebaseAuth();
    const dirRef = doc(db, 'cct_shipments', 'companies_directory');
    await setDoc(dirRef, { list: filtered, updatedAt: new Date().toISOString() });
    if (companyBus) companyBus.postMessage({ type: 'COMPANIES_UPDATED', list: filtered });
  } catch {}

  return filtered;
};

// Developer Power: Revoke / Allow Company access
export const devToggleCompanyStatus = async (companyId, newStatus) => {
  const session = getCurrentSession();
  if (!session?.isDeveloper) throw new Error('Unauthorized: Developer privileges required.');

  let companies = getLocalCompanies();
  const compIndex = companies.findIndex(c => c.companyId === companyId);
  if (compIndex === -1) throw new Error('Company not found.');

  companies[compIndex].status = newStatus; // 'Active' | 'Revoked'
  saveLocalCompanies(companies);

  try {
    await initFirebaseAuth();
    const dirRef = doc(db, 'cct_shipments', 'companies_directory');
    await setDoc(dirRef, { list: companies, updatedAt: new Date().toISOString() }, { merge: true });
    if (companyBus) companyBus.postMessage({ type: 'COMPANIES_UPDATED', list: companies });
  } catch {}

  return companies;
};

// Developer Power: Delete / Revoke any Team Member in any company
export const devDeleteTeamMember = async (companyId, memberId) => {
  const session = getCurrentSession();
  if (!session?.isDeveloper) throw new Error('Unauthorized: Developer privileges required.');

  let companies = getLocalCompanies();
  const comp = companies.find(c => c.companyId === companyId);
  if (!comp) throw new Error('Company not found.');

  comp.teamMembers = (comp.teamMembers || []).filter(m => m.id !== memberId);
  saveLocalCompanies(companies);

  try {
    await initFirebaseAuth();
    const dirRef = doc(db, 'cct_shipments', 'companies_directory');
    await setDoc(dirRef, { list: companies, updatedAt: new Date().toISOString() }, { merge: true });
    if (companyBus) companyBus.postMessage({ type: 'COMPANIES_UPDATED', list: companies });
  } catch {}

  return comp.teamMembers;
};

// Developer Power: Reset Admin Password for any company
export const devResetCompanyPassword = async (companyId, newPassword) => {
  const session = getCurrentSession();
  if (!session?.isDeveloper) throw new Error('Unauthorized: Developer privileges required.');

  let companies = getLocalCompanies();
  const comp = companies.find(c => c.companyId === companyId);
  if (!comp) throw new Error('Company not found.');

  comp.adminPassword = newPassword.trim();
  saveLocalCompanies(companies);

  try {
    await initFirebaseAuth();
    const dirRef = doc(db, 'cct_shipments', 'companies_directory');
    await setDoc(dirRef, { list: companies, updatedAt: new Date().toISOString() }, { merge: true });
    if (companyBus) companyBus.postMessage({ type: 'COMPANIES_UPDATED', list: companies });
  } catch {}

  return comp;
};

// Developer Power: Switch active company workspace
export const devSwitchActiveCompany = (companyId) => {
  const session = getCurrentSession();
  if (!session?.isDeveloper) throw new Error('Unauthorized: Developer privileges required.');

  const companies = getLocalCompanies();
  const target = companies.find(c => c.companyId === companyId);
  if (!target) throw new Error('Target company not found.');

  const updatedSession = {
    ...session,
    companyId: target.companyId,
    companyName: target.companyName
  };
  setCurrentSession(updatedSession);
  return updatedSession;
};

