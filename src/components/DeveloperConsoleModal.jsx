import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Terminal, 
  Building2, 
  Users, 
  Trash2, 
  Lock, 
  Unlock, 
  KeyRound, 
  Eye, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Database,
  Cpu
} from 'lucide-react';
import { 
  getLocalCompanies, 
  refreshCompaniesFromCloud,
  devDeleteCompany,
  devZeroAllCompanies,
  devToggleCompanyStatus,
  devDeleteTeamMember,
  devResetCompanyPassword,
  devSwitchActiveCompany
} from '../services/authService';
import { requestActionPassword } from '../utils/securityGate';

export const DeveloperConsoleModal = ({ isOpen, onClose, currentSession, onSessionChange }) => {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [expandedCompId, setExpandedCompId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password reset inline state
  const [resetPwdCompId, setResetPwdCompId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const list = await refreshCompaniesFromCloud();
      setCompanies(list);
    } catch {
      setCompanies(getLocalCompanies());
    } finally {
      setLoading(false);
    }
  };

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  const notifyError = (err) => {
    setError(err);
    setTimeout(() => setError(''), 4000);
  };

  const handleDeleteCompany = async (companyId, companyName) => {
    if (!requestActionPassword(`permanently delete company "${companyName}" and all of its data`)) return;
    if (window.confirm(`⚠️ DEVELOPER ACTION: Are you sure you want to PERMANENTLY DELETE company "${companyName}" and all its team members? This cannot be undone.`)) {
      setLoading(true);
      try {
        const updated = await devDeleteCompany(companyId);
        setCompanies(updated);
        notify(`Company "${companyName}" deleted permanently from cloud and local storage.`);
      } catch (err) {
        notifyError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleZeroAllCompanies = async () => {
    if (!requestActionPassword('zero / delete ALL companies in the entire database')) return;
    const confirmation = window.prompt(
      '⚠️ CRITICAL DEVELOPER RESET ⚠️\n\nAre you sure you want to ZERO / DELETE ALL COMPANIES and all their team members from the entire database to start 100% from scratch?\n\nType "ZERO" in capital letters to confirm:'
    );
    if (confirmation === 'ZERO') {
      setLoading(true);
      try {
        const updated = await devZeroAllCompanies();
        setCompanies(updated);
        notify('💥 All companies have been wiped from the database. System is at zero companies.');
      } catch (err) {
        notifyError(err.message);
      } finally {
        setLoading(false);
      }
    } else if (confirmation !== null) {
      notifyError('Action cancelled. Confirmation word "ZERO" was not typed.');
    }
  };

  const handleToggleStatus = async (companyId, currentStatus, companyName) => {
    const nextStatus = currentStatus === 'Revoked' ? 'Active' : 'Revoked';
    const actionLabel = nextStatus === 'Revoked' ? 'REVOKE / SUSPEND' : 'ALLOW';
    if (window.confirm(`Developer Action: Do you want to ${actionLabel} access for company "${companyName}"?`)) {
      try {
        const updated = await devToggleCompanyStatus(companyId, nextStatus);
        setCompanies(updated);
        notify(`Company "${companyName}" status set to "${nextStatus}".`);
      } catch (err) {
        notifyError(err.message);
      }
    }
  };

  const handleDeleteMember = async (companyId, memberId, memberName) => {
    if (!requestActionPassword(`remove team member "${memberName}"`)) return;
    if (window.confirm(`Developer Action: Remove team member "${memberName}"?`)) {
      try {
        await devDeleteTeamMember(companyId, memberId);
        await loadCompanies();
        notify(`Team member "${memberName}" removed.`);
      } catch (err) {
        notifyError(err.message);
      }
    }
  };

  const handleSaveResetPassword = async (companyId) => {
    if (!newPassword.trim()) return;
    try {
      await devResetCompanyPassword(companyId, newPassword);
      await loadCompanies();
      setResetPwdCompId(null);
      setNewPassword('');
      notify('Company Admin master password updated successfully.');
    } catch (err) {
      notifyError(err.message);
    }
  };

  const handleSwitchWorkspace = (companyId) => {
    try {
      const newSession = devSwitchActiveCompany(companyId);
      if (onSessionChange) onSessionChange(newSession);
      notify(`Workspace switched to ${newSession.companyName}.`);
      onClose();
    } catch (err) {
      notifyError(err.message);
    }
  };

  if (!isOpen) return null;

  const filteredCompanies = companies.filter(c => {
    const q = search.toLowerCase();
    const cName = String(c.companyName || '').toLowerCase();
    const uName = String(c.adminUsername || '').toLowerCase();
    const email = String(c.adminEmail || '').toLowerCase();
    return cName.includes(q) || uName.includes(q) || email.includes(q);
  });

  const totalMembers = companies.reduce((acc, c) => acc + (c.teamMembers?.length || 0), 0);

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="modal-box"
        style={{ 
          maxWidth: '980px', 
          width: '95%', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          background: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '18px',
          color: '#f8fafc',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.35)'
            }}>
              <Terminal size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Developer Control Center
                </h2>
                <span style={{
                  background: '#f59e0b22',
                  border: '1px solid #f59e0b66',
                  color: '#fbbf24',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.05em'
                }}>
                  SUPER-ADMIN
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '2px 0 0' }}>
                Master operator: <strong style={{ color: '#38bdf8' }}>nadeemalsaham@gmail.com</strong> — Global Company & Access Governance
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleZeroAllCompanies}
              disabled={loading}
              className="btn btn-sm"
              style={{
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                border: '1px solid #ef4444',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)'
              }}
              title="Delete all companies and team members to restart from scratch"
            >
              <Trash2 size={13} />
              <span>Zero All Companies</span>
            </button>
            <button
              onClick={loadCompanies}
              disabled={loading}
              className="btn btn-outline btn-sm text-slate-300"
              style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              title="Refresh from cloud"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Status / Alert Bar */}
        {message && (
          <div style={{ padding: '8px 1.5rem', background: '#064e3b', color: '#a7f3d0', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div style={{ padding: '8px 1.5rem', background: '#7f1d1d', color: '#fecaca', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Global Metrics Bar */}
        <div style={{
          padding: '1rem 1.75rem',
          background: '#0b1329',
          borderBottom: '1px solid #1e293b',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px'
        }}>
          <div style={{ background: '#111c38', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total CHA Companies</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>{companies.length}</div>
          </div>
          <div style={{ background: '#111c38', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Assigned Staff</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>{totalMembers}</div>
          </div>
          <div style={{ background: '#111c38', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Active Firm Accounts</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a78bfa', marginTop: '2px' }}>
              {companies.filter(c => c.status !== 'Revoked').length}
            </div>
          </div>
          <div style={{ background: '#111c38', padding: '10px 14px', borderRadius: '10px', border: '1px solid #1e293b' }}>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Cloud Backend Status</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Connected & Synced
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ padding: '0.75rem 1.75rem', borderBottom: '1px solid #1e293b', background: '#0b1329' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search companies by name, administrator username, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                background: '#15203b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 12px 8px 38px',
                color: '#ffffff',
                fontSize: '0.825rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Companies List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredCompanies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#111c38', borderRadius: '12px', border: '1px dashed #334155' }}>
              <Building2 size={42} color="#64748b" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 800, margin: '0 0 6px' }}>
                {search ? `No companies matching "${search}"` : 'Database is Zeroed (0 Companies)'}
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', maxWidth: '440px', margin: '0 auto 16px', lineHeight: 1.5 }}>
                {search ? 'Try clearing your search query.' : 'All companies have been completely removed. You can now register brand new CHA companies from scratch on the Sign Up tab.'}
              </p>
            </div>
          ) : (
            filteredCompanies.map((comp) => {
              const isExpanded = expandedCompId === comp.companyId;
              const isRevoked = comp.status === 'Revoked';
              const isCurrent = currentSession?.companyId === comp.companyId;

              return (
                <div 
                  key={comp.companyId}
                  style={{
                    background: '#111c38',
                    border: isRevoked ? '1px solid #ef444455' : isCurrent ? '1px solid #3b82f6' : '1px solid #1e293b',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'border-color 150ms'
                  }}
                >
                  {/* Company Row Summary */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '240px' }}>
                      <button
                        onClick={() => setExpandedCompId(isExpanded ? null : comp.companyId)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f8fafc' }}>
                            {comp.companyName}
                          </span>
                          {isRevoked ? (
                            <span style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#f87171', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                              SUSPENDED / REVOKED
                            </span>
                          ) : (
                            <span style={{ background: '#10b98122', border: '1px solid #10b981', color: '#34d399', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                              ACTIVE
                            </span>
                          )}
                          {isCurrent && (
                            <span style={{ background: '#3b82f622', border: '1px solid #3b82f6', color: '#60a5fa', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px' }}>
                              ACTIVE WORKSPACE
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span>Admin: <strong style={{ color: '#cbd5e1' }}>{comp.adminUsername}</strong></span>
                          {comp.adminEmail && <span>Email: <strong style={{ color: '#cbd5e1' }}>{comp.adminEmail}</strong></span>}
                          <span>Staff Count: <strong style={{ color: '#38bdf8' }}>{comp.teamMembers?.length || 0}</strong></span>
                          <span>ID: <code style={{ color: '#64748b', fontSize: '0.68rem' }}>{comp.companyId}</code></span>
                        </div>
                      </div>
                    </div>

                    {/* Developer Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Jump to Workspace */}
                      <button
                        onClick={() => handleSwitchWorkspace(comp.companyId)}
                        className="btn btn-outline btn-sm text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10"
                        style={{ fontSize: '0.72rem', padding: '5px 9px' }}
                        title="Inspect this company's dossiers and shipments"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>

                      {/* Reset Password */}
                      <button
                        onClick={() => setResetPwdCompId(resetPwdCompId === comp.companyId ? null : comp.companyId)}
                        className="btn btn-outline btn-sm text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                        style={{ fontSize: '0.72rem', padding: '5px 9px' }}
                        title="Reset administrator master password"
                      >
                        <KeyRound size={13} />
                        <span>Password</span>
                      </button>

                      {/* Toggle Revoke / Allow */}
                      <button
                        onClick={() => handleToggleStatus(comp.companyId, comp.status, comp.companyName)}
                        className={`btn btn-sm ${isRevoked ? 'btn-success text-emerald-300' : 'btn-outline text-amber-400 border-amber-500/40'}`}
                        style={{ fontSize: '0.72rem', padding: '5px 9px' }}
                        title={isRevoked ? 'Restore access for this firm' : 'Suspend / Revoke access for this firm'}
                      >
                        {isRevoked ? <Unlock size={13} /> : <Lock size={13} />}
                        <span>{isRevoked ? 'Allow Access' : 'Revoke'}</span>
                      </button>

                      {/* Delete Company */}
                      <button
                        onClick={() => handleDeleteCompany(comp.companyId, comp.companyName)}
                        className="btn btn-outline btn-sm text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
                        style={{ fontSize: '0.72rem', padding: '5px 9px' }}
                        title="Permanently delete company from cloud and local database"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Inline Password Reset Box */}
                  {resetPwdCompId === comp.companyId && (
                    <div style={{ padding: '10px 1.25rem', background: '#0b1329', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 600 }}>New Master Password:</span>
                      <input
                        type="text"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{
                          background: '#15203b',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          width: '180px'
                        }}
                      />
                      <button
                        onClick={() => handleSaveResetPassword(comp.companyId)}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                      >
                        Save Password
                      </button>
                      <button
                        onClick={() => setResetPwdCompId(null)}
                        className="btn btn-outline btn-sm text-slate-400"
                        style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Expanded Team Members Drawer */}
                  {isExpanded && (
                    <div style={{ padding: '10px 1.25rem 1.25rem', background: '#0b1329', borderTop: '1px solid #1e293b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                          Assigned Staff Directory ({comp.teamMembers?.length || 0})
                        </span>
                      </div>

                      {(!comp.teamMembers || comp.teamMembers.length === 0) ? (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                          No team members registered under this firm yet.
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                          {comp.teamMembers.map((member) => (
                            <div 
                              key={member.id || member.username}
                              style={{
                                background: '#111c38',
                                border: '1px solid #1e293b',
                                borderRadius: '8px',
                                padding: '8px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f1f5f9' }}>
                                  {member.name || member.username}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                                  User: <code style={{ color: '#38bdf8' }}>{member.username}</code> | Role: {member.role || 'Staff'}
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                                  Pwd: {member.password ? '••••' : 'Admin Master'} {member.phone ? `| Tel: ${member.phone}` : ''}
                                </div>
                              </div>

                              <button
                                onClick={() => handleDeleteMember(comp.companyId, member.id, member.name || member.username)}
                                className="btn btn-outline btn-sm text-rose-400 hover:bg-rose-500/20 p-1"
                                title="Delete this team member"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.75rem',
          background: '#090d16',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Actions committed here write universally to Firebase Cloud and sync live across all active devices.
          </span>
          <button
            onClick={onClose}
            className="btn btn-outline btn-sm text-slate-300"
          >
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
};
