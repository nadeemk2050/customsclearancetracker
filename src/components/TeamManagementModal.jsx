import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Phone, 
  KeyRound, 
  User, 
  Briefcase, 
  X, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck, 
  Building2,
  Lock
} from 'lucide-react';
import { 
  getCompanyTeamMembers, 
  saveCompanyTeamMember, 
  removeCompanyTeamMember 
} from '../services/authService';

export const TeamManagementModal = ({ isOpen, onClose, currentSession }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    username: '',
    role: 'Customs Clearance Specialist',
    password: '',
    status: 'Active'
  });

  const companyId = currentSession?.companyId || 'cha_al_mumtaz';
  const companyName = currentSession?.companyName || 'AL MUMTAZ CUSTOMS CLEARING LLC';

  // Load team members whenever modal opens
  useEffect(() => {
    if (isOpen && companyId) {
      const list = getCompanyTeamMembers(companyId);
      setTeamMembers(list);
      setEditingId(null);
      resetForm();
    }
  }, [isOpen, companyId]);

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      username: '',
      role: 'Customs Clearance Specialist',
      password: '',
      status: 'Active'
    });
    setEditingId(null);
  };

  const handleEditClick = (member) => {
    setEditingId(member.id);
    setFormData({
      name: member.name || '',
      phone: member.phone || '',
      username: member.username || '',
      role: member.role || 'Customs Clearance Specialist',
      password: member.password || '',
      status: member.status || 'Active'
    });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleDeleteClick = async (memberId, memberName) => {
    if (window.confirm(`Are you sure you want to remove team member "${memberName}"?`)) {
      try {
        const updated = await removeCompanyTeamMember(companyId, memberId);
        setTeamMembers(updated);
        setSuccessMsg(`Team member "${memberName}" removed.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        setErrorMsg(err.message || 'Error removing team member');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.name.trim() || !formData.username.trim() || !formData.password.trim()) {
      setErrorMsg('Please fill in Member Name, Username, and Password.');
      return;
    }

    try {
      const memberToSave = {
        ...formData,
        id: editingId || undefined
      };
      const updated = await saveCompanyTeamMember(companyId, memberToSave);
      setTeamMembers(updated);
      setSuccessMsg(editingId ? 'Team member updated successfully!' : 'New team member assigned successfully!');
      resetForm();
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save team member.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" style={{ zIndex: 1200 }}>
      <div 
        className="modal-container"
        style={{ 
          maxWidth: '850px', 
          width: '95%', 
          maxHeight: '90vh', 
          display: 'flex', 
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}>
              <Users size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                  Assign & Manage Team Members
                </h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)'
                }}>
                  CHA Staff Directory
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', fontSize: '0.8rem', color: '#94a3b8' }}>
                <Building2 size={13} color="#38bdf8" />
                <span style={{ fontWeight: 600, color: '#cbd5e1' }}>{companyName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              padding: '6px',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informational Dual-Password Notice */}
        <div style={{
          background: '#eff6ff',
          borderBottom: '1px solid #bfdbfe',
          padding: '10px 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8rem',
          color: '#1e40af'
        }}>
          <ShieldCheck size={18} color="#2563eb" style={{ flexShrink: 0 }} />
          <div>
            <strong>Administrator Master Access Active:</strong> All team members assigned here can log in using their own password. Furthermore, the <strong>CHA Principal Administrator password</strong> can also log into any member's account directly!
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {successMsg && (
            <div style={{
              padding: '10px 14px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#065f46',
              borderRadius: '8px',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div style={{
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#991b1b',
              borderRadius: '8px',
              fontSize: '0.825rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form to Assign or Edit Team Member */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={16} color="#2563eb" />
                <span>{editingId ? 'Edit Team Member Details' : 'Assign New Team Member'}</span>
              </h4>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Cancel Edit (Add New)
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div>
                <label className="dossier-field-label">Full Member Name *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="text"
                    className="dossier-input-control"
                    style={{ paddingLeft: '32px', fontSize: '0.825rem' }}
                    placeholder="e.g. Tariq Al-Mansoor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dossier-field-label">Telephone / Mobile *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    className="dossier-input-control"
                    style={{ paddingLeft: '32px', fontSize: '0.825rem' }}
                    placeholder="e.g. +971 50 882 1923"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dossier-field-label">Assigned Role *</label>
                <div style={{ position: 'relative' }}>
                  <Briefcase size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <select
                    className="dossier-select-control"
                    style={{ paddingLeft: '32px', fontSize: '0.825rem' }}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Senior Customs Broker">Senior Customs Broker</option>
                    <option value="Port Terminal Runner">Port Terminal Runner</option>
                    <option value="Documentation Specialist">Documentation Specialist</option>
                    <option value="Customs Clearance Specialist">Customs Clearance Specialist</option>
                    <option value="Operations Manager">Operations Manager</option>
                    <option value="Billing & Accounts">Billing & Accounts</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="dossier-field-label">Login Username *</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="text"
                    className="dossier-input-control font-mono"
                    style={{ paddingLeft: '32px', fontSize: '0.825rem' }}
                    placeholder="e.g. tariq"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="dossier-field-label">Member Password *</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    required
                    type="text"
                    className="dossier-input-control font-mono"
                    style={{ paddingLeft: '32px', fontSize: '0.825rem' }}
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '38px', fontSize: '0.825rem', justifyContent: 'center' }}
                >
                  <UserPlus size={15} />
                  <span>{editingId ? 'Update Member' : 'Assign Member'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Directory of Assigned Team Members */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                Active Assigned Team ({teamMembers.length})
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Company Account: <strong>{companyName}</strong>
              </span>
            </div>

            {teamMembers.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                fontSize: '0.85rem'
              }}>
                No team members assigned yet. Use the form above to add your customs staff.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      transition: 'border-color 150ms'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                        color: '#0369a1',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                            {member.name}
                          </span>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#f1f5f9',
                            color: '#475569',
                            border: '1px solid #e2e8f0'
                          }}>
                            {member.role}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', fontSize: '0.775rem', color: '#64748b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <User size={12} color="#94a3b8" />
                            Username: <strong style={{ color: '#0284c7' }}>{member.username}</strong>
                          </span>
                          {member.phone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} color="#94a3b8" />
                              {member.phone}
                            </span>
                          )}
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Lock size={12} color="#94a3b8" />
                            Pwd: <span style={{ fontFamily: 'monospace' }}>••••</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleEditClick(member)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '5px 10px', fontSize: '0.75rem', gap: '4px' }}
                        title="Edit member"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(member.id, member.name)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '5px 10px', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fca5a5' }}
                        title="Remove member"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary btn-sm"
            style={{ padding: '8px 20px' }}
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
