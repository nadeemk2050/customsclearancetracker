import React, { useState } from 'react';
import { 
  Ship, 
  Building2, 
  Users, 
  Lock, 
  User, 
  Phone, 
  Globe, 
  ShieldCheck, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle,
  KeyRound,
  ShieldAlert,
  Mail
} from 'lucide-react';
import { 
  signUpCompanyAdmin, 
  loginCompanyAdmin, 
  loginTeamMember, 
  getLocalCompanies,
  refreshCompaniesFromCloud,
  subscribeCloudCompanies 
} from '../services/authService';

export const LoginPage = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('adminLogin'); // adminLogin | adminSignup | teamLogin
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState(() => getLocalCompanies());

  // Admin Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    companyName: '',
    username: '',
    email: '',
    password: '',
    phone: '',
    country: 'United Arab Emirates'
  });

  // Admin Login Form State
  const [adminLoginData, setAdminLoginData] = useState({
    usernameOrCompany: '',
    password: ''
  });

  // Team Member Login Form State
  const [teamLoginData, setTeamLoginData] = useState({
    companyNameOrId: '',
    username: '',
    password: ''
  });

  // Auto-refresh registered companies on mount and listen in real-time
  React.useEffect(() => {
    refreshCompaniesFromCloud().then(updated => {
      if (updated && updated.length > 0) setCompanies(updated);
    }).catch(() => {});

    const unsubscribe = subscribeCloudCompanies((updated) => {
      if (updated && updated.length > 0) setCompanies(updated);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleAdminSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await signUpCompanyAdmin(signUpData);
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await loginCompanyAdmin(adminLoginData);
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const session = await loginTeamMember(teamLoginData);
      onLoginSuccess(session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill for Demo Testing
  const handleQuickDemoAdmin = () => {
    setAdminLoginData({
      usernameOrCompany: 'admin',
      password: '123'
    });
    setActiveTab('adminLogin');
  };

  const handleQuickDemoTeam = () => {
    setTeamLoginData({
      companyNameOrId: 'AL MUMTAZ CUSTOMS CLEARING LLC',
      username: 'tariq',
      password: '123'
    });
    setActiveTab('teamLogin');
  };

  const handleQuickDemoDeveloper = () => {
    setAdminLoginData({
      usernameOrCompany: 'nadeemalsaham@gmail.com',
      password: '123'
    });
    setActiveTab('adminLogin');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #091224 0%, #0f1c3f 50%, #172554 100%)',
      padding: '1.5rem',
      fontFamily: 'var(--font-sans)'
    }}>
      <div style={{
        maxWidth: '1050px',
        width: '100%',
        background: '#ffffff',
        borderRadius: '20px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
        display: 'grid',
        gridTemplateColumns: '42% 58%',
        overflow: 'hidden'
      }}>
        {/* Left Side: Brand Showcase */}
        <div style={{
          background: 'linear-gradient(145deg, #0a1128 0%, #10214d 60%, #1e3a8a 100%)',
          color: '#ffffff',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)'
              }}>
                <Ship size={26} color="#ffffff" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
                  CustomsTrack <span style={{ color: '#38bdf8' }}>PRO</span>
                </h1>
                <span className="brand-badge" style={{ marginTop: '2px', display: 'inline-block' }}>
                  CHA Enterprise Suite
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '2rem' }}>
              The end-to-end Customs Clearing Agency management system designed to eliminate port terminal storage charges and container line detention.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={18} color="#38bdf8" />
                <span style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 600 }}>
                  Multi-Tenant CHA Company Cloud Isolation
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert size={18} color="#f59e0b" />
                <span style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 600 }}>
                  Automated Dual-Clock Demurrage Prevention
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={18} color="#10b981" />
                <span style={{ fontSize: '0.8rem', color: '#f1f5f9', fontWeight: 600 }}>
                  Role-Based Team Member Management
                </span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '1.5rem', marginTop: '2rem' }}>
            <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              Quick Demo Access:
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Demo Admin (admin / 123)
              </button>
              <button
                type="button"
                onClick={handleQuickDemoTeam}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Demo Team (tariq / 123)
              </button>
              <button
                type="button"
                onClick={handleQuickDemoDeveloper}
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.25))',
                  border: '1px solid #f59e0b',
                  color: '#fbbf24',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  fontWeight: 800
                }}
              >
                ⚡ Developer Powers (nadeemalsaham@gmail.com)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Authentication Forms */}
        <div style={{ padding: '3rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          {/* Top Auth Mode Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '1.75rem',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('adminLogin'); setError(''); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'adminLogin' ? '#ffffff' : 'transparent',
                color: activeTab === 'adminLogin' ? '#1d4ed8' : '#64748b',
                boxShadow: activeTab === 'adminLogin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms'
              }}
            >
              🏢 CHA Admin Login
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('adminSignup'); setError(''); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'adminSignup' ? '#ffffff' : 'transparent',
                color: activeTab === 'adminSignup' ? '#1d4ed8' : '#64748b',
                boxShadow: activeTab === 'adminSignup' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms'
              }}
            >
              ✨ Sign Up Company
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('teamLogin'); setError(''); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: activeTab === 'teamLogin' ? '#ffffff' : 'transparent',
                color: activeTab === 'teamLogin' ? '#1d4ed8' : '#64748b',
                boxShadow: activeTab === 'teamLogin' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 150ms'
              }}
            >
              👥 Team Login
            </button>
          </div>

          {error && (
            <div style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              borderRadius: '8px',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. CHA ADMIN LOGIN */}
          {activeTab === 'adminLogin' && (
            <form onSubmit={handleAdminLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  CHA Principal Administrator Login
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
                  Sign in with your master CHA company account credentials.
                </p>
              </div>

              <div>
                <label className="dossier-field-label">CHA Company Name, Admin Username, or Official Email *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="text"
                    className="dossier-input-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. admin@almumtaz.ae, falcon_admin, or AL MUMTAZ"
                    value={adminLoginData.usernameOrCompany}
                    onChange={(e) => setAdminLoginData({ ...adminLoginData, usernameOrCompany: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dossier-field-label">Admin Master Password *</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="password"
                    className="dossier-input-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Enter your master password"
                    value={adminLoginData.password}
                    onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: '8px', padding: '12px', width: '100%', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Administrator'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* 2. CHA COMPANY SIGN UP */}
          {activeTab === 'adminSignup' && (
            <form onSubmit={handleAdminSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Register New CHA Company Account
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
                  Establish your firm's dedicated customs clearance & demurrage tracking cloud database.
                </p>
              </div>

              <div>
                <label className="dossier-field-label">Customs House Agent (CHA) Company Name *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="text"
                    className="dossier-input-control font-bold uppercase"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. FALCON CARGO & CUSTOMS CLEARING LLC"
                    value={signUpData.companyName}
                    onChange={(e) => setSignUpData({ ...signUpData, companyName: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="dossier-field-label">Admin Username *</label>
                  <input
                    required
                    type="text"
                    className="dossier-input-control"
                    placeholder="e.g. falcon_admin"
                    value={signUpData.username}
                    onChange={(e) => setSignUpData({ ...signUpData, username: e.target.value })}
                  />
                </div>
                <div>
                  <label className="dossier-field-label">Admin Master Password *</label>
                  <input
                    required
                    type="password"
                    className="dossier-input-control"
                    placeholder="Create secure password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dossier-field-label">Official Business Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="email"
                    className="dossier-input-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. admin@falconcargo.com or operations@mumtaz.ae"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="dossier-field-label">Office Phone Number</label>
                  <input
                    type="text"
                    className="dossier-input-control"
                    placeholder="e.g. +971 4 397 8888"
                    value={signUpData.phone}
                    onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="dossier-field-label">Country / Primary Port</label>
                  <input
                    type="text"
                    className="dossier-input-control"
                    placeholder="e.g. UAE / Jebel Ali"
                    value={signUpData.country}
                    onChange={(e) => setSignUpData({ ...signUpData, country: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: '6px', padding: '12px', width: '100%', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <span>{loading ? 'Creating Account...' : 'Create CHA Company Account'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* 3. TEAM MEMBER LOGIN */}
          {activeTab === 'teamLogin' && (() => {
            const selectedCompanyObj = companies.find(c => {
              const raw = (teamLoginData.companyNameOrId || '').trim().toLowerCase();
              const clean = raw.replace(/[^a-z0-9]/g, '');
              if (!clean) return false;
              const cName = String(c.companyName || '').toLowerCase();
              const cId = String(c.companyId || '').toLowerCase();
              return cName === raw || cId === raw || cName.replace(/[^a-z0-9]/g, '') === clean;
            });

            // Gather all team members across all companies if auto-detect
            const allMembers = [];
            companies.forEach(c => {
              (c.teamMembers || []).forEach(m => {
                allMembers.push({ ...m, compName: c.companyName });
              });
            });

            return (
              <form onSubmit={handleTeamLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Assigned Team Member Login
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0' }}>
                    Log in with your assigned team username. Administrator master password is also accepted!
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="dossier-field-label" style={{ margin: 0 }}>CHA Company</label>
                    <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                      ⚡ Auto-detection enabled
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Dropdown for registered companies */}
                    <select
                      className="dossier-input-control"
                      value={teamLoginData.companyNameOrId}
                      onChange={(e) => setTeamLoginData({ ...teamLoginData, companyNameOrId: e.target.value })}
                      style={{ fontWeight: 600, color: teamLoginData.companyNameOrId ? '#0f172a' : '#64748b' }}
                    >
                      <option value="">✨ Auto-Detect Company (Leave Blank)</option>
                      {companies.map((c) => (
                        <option key={c.companyId} value={c.companyName}>
                          🏢 {c.companyName} {c.teamMembers?.length ? `(${c.teamMembers.length} staff)` : ''}
                        </option>
                      ))}
                    </select>

                    {/* Or free-form input */}
                    <div style={{ position: 'relative' }}>
                      <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input
                        type="text"
                        className="dossier-input-control"
                        style={{ paddingLeft: '38px', fontSize: '0.8rem' }}
                        placeholder="Or type company name here (case-insensitive)"
                        value={teamLoginData.companyNameOrId}
                        onChange={(e) => setTeamLoginData({ ...teamLoginData, companyNameOrId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="dossier-field-label" style={{ margin: 0 }}>Team Member Username *</label>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Case-insensitive</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      required
                      type="text"
                      className="dossier-input-control"
                      style={{ paddingLeft: '38px' }}
                      placeholder="e.g. nadeem or tariq"
                      value={teamLoginData.username}
                      onChange={(e) => setTeamLoginData({ ...teamLoginData, username: e.target.value })}
                    />
                  </div>

                  {/* Quick-fill pills for assigned team members */}
                  {(selectedCompanyObj ? selectedCompanyObj.teamMembers : allMembers)?.length > 0 && (
                    <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>Quick Pick:</span>
                      {(selectedCompanyObj ? selectedCompanyObj.teamMembers : allMembers.slice(0, 5)).map((m) => (
                        <button
                          key={m.id || m.username}
                          type="button"
                          onClick={() => {
                            setTeamLoginData(prev => ({
                              ...prev,
                              username: m.username,
                              companyNameOrId: m.compName || prev.companyNameOrId
                            }));
                          }}
                          style={{
                            background: teamLoginData.username.toLowerCase() === String(m.username).toLowerCase() ? '#dbeafe' : '#f1f5f9',
                            border: teamLoginData.username.toLowerCase() === String(m.username).toLowerCase() ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                            color: teamLoginData.username.toLowerCase() === String(m.username).toLowerCase() ? '#1d4ed8' : '#334155',
                            borderRadius: '12px',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          👤 {m.username}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="dossier-field-label" style={{ margin: 0 }}>Password *</label>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Team or Admin Password</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      required
                      type="password"
                      className="dossier-input-control"
                      style={{ paddingLeft: '38px' }}
                      placeholder="Assigned password or Admin master password"
                      value={teamLoginData.password}
                      onChange={(e) => setTeamLoginData({ ...teamLoginData, password: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  fontSize: '0.73rem',
                  color: '#166534',
                  lineHeight: 1.4
                }}>
                  💡 <strong>No Special Company ID Needed:</strong> Pick your firm or leave Company blank to auto-detect. Size does not matter for password, username, or company name. Admin master password is also accepted!
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ marginTop: '4px', padding: '12px', width: '100%', fontSize: '0.9rem', justifyContent: 'center' }}
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In as Team Member'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
