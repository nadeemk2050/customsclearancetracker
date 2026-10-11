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
  ShieldAlert
} from 'lucide-react';
import { signUpCompanyAdmin, loginCompanyAdmin, loginTeamMember, getLocalCompanies } from '../services/authService';

export const LoginPage = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState('adminLogin'); // adminLogin | adminSignup | teamLogin
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin Sign Up Form State
  const [signUpData, setSignUpData] = useState({
    companyName: '',
    username: '',
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

  const companies = getLocalCompanies();

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
                <label className="dossier-field-label">CHA Company Name or Admin Username *</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="text"
                    className="dossier-input-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. AL MUMTAZ CUSTOMS or admin"
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
                  <label className="dossier-field-label">Admin Password *</label>
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
          {activeTab === 'teamLogin' && (
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
                <label className="dossier-field-label">CHA Company Name or ID (Optional)</label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="dossier-input-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. AL MUMTAZ CUSTOMS (or leave blank to search)"
                    value={teamLoginData.companyNameOrId}
                    onChange={(e) => setTeamLoginData({ ...teamLoginData, companyNameOrId: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dossier-field-label">Team Member Username *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="text"
                    className="dossier-input-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="e.g. tariq or suresh"
                    value={teamLoginData.username}
                    onChange={(e) => setTeamLoginData({ ...teamLoginData, username: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dossier-field-label">Password * (Team or Admin Master Password)</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="password"
                    className="dossier-input-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Enter assigned password or admin password"
                    value={teamLoginData.password}
                    onChange={(e) => setTeamLoginData({ ...teamLoginData, password: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ marginTop: '8px', padding: '12px', width: '100%', fontSize: '0.9rem', justifyContent: 'center' }}
              >
                <span>{loading ? 'Authenticating...' : 'Sign In as Team Member'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
