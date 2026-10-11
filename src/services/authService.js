// Authentication & Multi-Tenant Company Management Service
import { db, doc, setDoc, getDocs, collection } from '../firebase/config';

const LOCAL_SESSION_KEY = 'cct_pro_active_session';
const LOCAL_COMPANIES_KEY = 'cct_pro_companies_db';

// Pre-seeded demonstration CHA company for instant testing
const DEFAULT_DEMO_COMPANY = {
  companyId: 'cha_al_mumtaz',
  companyName: 'AL MUMTAZ CUSTOMS CLEARING LLC',
  adminUsername: 'admin',
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

// Save companies to local storage
const saveLocalCompanies = (companies) => {
  localStorage.setItem(LOCAL_COMPANIES_KEY, JSON.stringify(companies));
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

// Sign Up New Main CHA Company Admin
export const signUpCompanyAdmin = async ({ companyName, username, password, phone = '', country = '' }) => {
  if (!companyName.trim() || !username.trim() || !password.trim()) {
    throw new Error('Please fill all required fields (Company Name, Username, and Password).');
  }

  const companies = getLocalCompanies();
  const cleanUsername = username.trim().toLowerCase();
  const cleanCompanyName = companyName.trim().toUpperCase();

  // Check if username or company already exists
  const existing = companies.find(c => 
    c.adminUsername.toLowerCase() === cleanUsername || 
    c.companyName.toUpperCase() === cleanCompanyName
  );

  if (existing) {
    throw new Error('An account with this Company Name or Admin Username already exists. Please choose another or login.');
  }

  const companyId = 'cha_' + cleanCompanyName.replace(/[^A-Z0-9]/gi, '_').toLowerCase() + '_' + Math.random().toString(36).substring(2, 6);

  const newCompany = {
    companyId,
    companyName: cleanCompanyName,
    adminUsername: cleanUsername,
    adminPassword: password.trim(),
    phone,
    country,
    createdAt: new Date().toISOString(),
    teamMembers: []
  };

  const updatedCompanies = [...companies, newCompany];
  saveLocalCompanies(updatedCompanies);

  // Sync to Firestore
  try {
    const docRef = doc(db, 'cct_companies', companyId);
    await setDoc(docRef, newCompany);
  } catch (err) {
    console.warn('Syncing company to Firestore note:', err);
  }

  const session = {
    isLoggedIn: true,
    userType: 'admin',
    companyId: newCompany.companyId,
    companyName: newCompany.companyName,
    username: newCompany.adminUsername,
    displayName: `${newCompany.adminUsername} (Admin)`,
    role: 'CHA Company Administrator'
  };

  setCurrentSession(session);
  return session;
};

// Login Main CHA Company Admin
export const loginCompanyAdmin = async ({ usernameOrCompany, password }) => {
  if (!usernameOrCompany.trim() || !password.trim()) {
    throw new Error('Please enter your Username / Company Name and Password.');
  }

  const companies = getLocalCompanies();
  const query = usernameOrCompany.trim().toLowerCase();
  const pwd = password.trim();

  const found = companies.find(c => 
    (c.adminUsername.toLowerCase() === query || c.companyName.toLowerCase() === query) &&
    c.adminPassword === pwd
  );

  if (!found) {
    throw new Error('Invalid Admin credentials. Please check your username/password.');
  }

  const session = {
    isLoggedIn: true,
    userType: 'admin',
    companyId: found.companyId,
    companyName: found.companyName,
    username: found.adminUsername,
    displayName: `${found.adminUsername} (Admin)`,
    role: 'CHA Company Administrator'
  };

  setCurrentSession(session);
  return session;
};

// Login Team Member
export const loginTeamMember = async ({ companyNameOrId, username, password }) => {
  if (!username.trim() || !password.trim()) {
    throw new Error('Please enter your Team Username and Password.');
  }

  const companies = getLocalCompanies();
  const queryCompany = (companyNameOrId || '').trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase();
  const pwd = password.trim();

  // Find matching company (or search across companies if company name not provided)
  let targetCompany = null;
  let targetMember = null;
  let isAdminOverride = false;

  for (const comp of companies) {
    if (queryCompany && comp.companyName.toLowerCase() !== queryCompany && comp.companyId !== queryCompany) {
      continue;
    }

    // Check if the administrator password was used to log into this team member account
    if (comp.adminPassword === pwd) {
      const member = (comp.teamMembers || []).find(m => m.username.toLowerCase() === cleanUsername);
      if (member) {
        targetCompany = comp;
        targetMember = member;
        isAdminOverride = true;
        break;
      }
    }

    // Check normal team member password
    const member = (comp.teamMembers || []).find(m => 
      m.username.toLowerCase() === cleanUsername && m.password === pwd
    );

    if (member) {
      targetCompany = comp;
      targetMember = member;
      break;
    }
  }

  if (!targetCompany || !targetMember) {
    throw new Error('Invalid Team Member credentials. Ensure your username, password, or CHA company name are correct.');
  }

  const session = {
    isLoggedIn: true,
    userType: 'team',
    companyId: targetCompany.companyId,
    companyName: targetCompany.companyName,
    username: targetMember.username,
    displayName: targetMember.name,
    role: targetMember.role || 'Team Member',
    isAdminOverride
  };

  setCurrentSession(session);
  return session;
};

// Retrieve Team Members for a given CHA Company
export const getCompanyTeamMembers = (companyId) => {
  const companies = getLocalCompanies();
  const comp = companies.find(c => c.companyId === companyId);
  return comp?.teamMembers || [];
};

// Assign / Update Team Member in CHA Company
export const saveCompanyTeamMember = async (companyId, memberData) => {
  const companies = getLocalCompanies();
  const compIndex = companies.findIndex(c => c.companyId === companyId);
  if (compIndex === -1) throw new Error('Company not found.');

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

  // Sync to Firestore
  try {
    const docRef = doc(db, 'cct_companies', companyId);
    await setDoc(docRef, updatedComp);
  } catch (err) {
    console.warn('Firestore team update note:', err);
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
    const docRef = doc(db, 'cct_companies', companyId);
    await setDoc(docRef, updatedComp);
  } catch (err) {
    console.warn('Firestore team delete note:', err);
  }

  return updatedMembers;
};
