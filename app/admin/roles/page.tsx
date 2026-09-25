'use client';

import React, { useState } from 'react';
import { Shield, ShieldAlert, UserCheck, Check, AlertCircle } from 'lucide-react';

interface MemberRoleRecord {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'core_member' | 'user';
  is_onboarded: boolean;
}

export default function AdminRolesPage() {
  const [members, setMembers] = useState<MemberRoleRecord[]>([
    {
      id: 'usr-1',
      email: 'msc.community@srmap.edu.in',
      full_name: 'Lead Admin',
      role: 'admin',
      is_onboarded: true,
    },
    {
      id: 'usr-2',
      email: 'jayanth.r@alumni.srmap.edu.in',
      full_name: 'Jayanth Ramakrishnan',
      role: 'admin',
      is_onboarded: true,
    },
    {
      id: 'usr-3',
      email: 'karthik.tech@srmap.edu.in',
      full_name: 'Karthik Rao',
      role: 'core_member',
      is_onboarded: true,
    },
    {
      id: 'usr-4',
      email: 'student.builder@srmap.edu.in',
      full_name: 'Alex Morgan',
      role: 'user',
      is_onboarded: true,
    },
  ]);

  const [message, setMessage] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'core_member' | 'user') => {
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role.');

      setMembers(members.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
      setMessage(`Successfully updated role to ${newRole}`);
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      // In local mode if endpoint unauthenticated, update local state
      setMembers(members.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));
      setMessage(`Updated role locally: ${newRole}`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)' }}>
          Member Role Management
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Assign operational privileges across Administrator, Core Member (Organizer), and General Member.
        </p>
      </div>

      {message && (
        <div style={{ padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Check size={16} /> {message}
        </div>
      )}

      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-rest)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', color: 'var(--text-strong)' }}>
              <th style={{ padding: '12px 16px' }}>Member Profile</th>
              <th style={{ padding: '12px 16px' }}>Current Privilege</th>
              <th style={{ padding: '12px 16px' }}>Onboarded</th>
              <th style={{ padding: '12px 16px' }}>Elevate / Demote</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <strong style={{ color: 'var(--text-strong)', display: 'block' }}>{m.full_name}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    className={`fluent-badge ${
                      m.role === 'admin'
                        ? 'badge-danger'
                        : m.role === 'core_member'
                        ? 'badge-info'
                        : 'badge-success'
                    }`}
                  >
                    {m.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {m.is_onboarded ? 'Yes' : 'Pending'}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.id, e.target.value as any)}
                    className="fluent-input"
                    style={{ width: '160px', fontSize: '12px' }}
                  >
                    <option value="user">User</option>
                    <option value="core_member">Core Member (Staff)</option>
                    <option value="admin">Administrator</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
