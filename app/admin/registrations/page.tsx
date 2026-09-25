'use client';

import React, { useState } from 'react';
import {
  Search,
  Download,
  Upload,
  UserPlus,
  CheckCircle,
  Clock,
  Printer,
  FileSpreadsheet,
  FileText,
  X,
  CreditCard,
} from 'lucide-react';
import Papa from 'papaparse';

interface RegistrationRecord {
  id: string;
  lead_name: string;
  lead_email: string;
  reg_number: string;
  phone: string;
  college: string;
  event_title: string;
  status: 'confirmed' | 'pending_payment' | 'waitlisted' | 'cancelled';
  checked_in: boolean;
  team_name?: string;
  created_at: string;
}

export default function AdminRegistrationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<RegistrationRecord | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Initial mock / live registration records
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([
    {
      id: 'reg-001',
      lead_name: 'Alex Morgan',
      lead_email: 'alex.m@srmap.edu.in',
      reg_number: 'AP21110010123',
      phone: '+91 9876543210',
      college: 'SRM University AP',
      event_title: "SYNORA '26 — National Hackathon",
      status: 'confirmed',
      checked_in: true,
      team_name: 'Azure Titans',
      created_at: '2026-09-20T10:15:00Z',
    },
    {
      id: 'reg-002',
      lead_name: 'Priya Sharma',
      lead_email: 'priya.s@srmap.edu.in',
      reg_number: 'AP21110010456',
      phone: '+91 9876543211',
      college: 'SRM University AP',
      event_title: "SYNORA '26 — National Hackathon",
      status: 'confirmed',
      checked_in: false,
      team_name: 'Binary Beats',
      created_at: '2026-09-21T14:30:00Z',
    },
    {
      id: 'reg-003',
      lead_name: 'Rahul K.',
      lead_email: 'rahul.k@vit.ac.in',
      reg_number: '21BCE1089',
      phone: '+91 9876543212',
      college: 'VIT Vellore',
      event_title: "SYNORA '26 — National Hackathon",
      status: 'confirmed',
      checked_in: false,
      team_name: 'Cloud Runners',
      created_at: '2026-09-22T09:45:00Z',
    },
    {
      id: 'reg-004',
      lead_name: 'Neha Verma',
      lead_email: 'neha.v@srmap.edu.in',
      reg_number: 'AP21110010789',
      phone: '+91 9876543213',
      college: 'SRM University AP',
      event_title: 'Azure Cloud & Distributed Systems BootCamp',
      status: 'confirmed',
      checked_in: true,
      created_at: '2026-09-23T11:20:00Z',
    },
    {
      id: 'reg-005',
      lead_name: 'Vikram Joshi',
      lead_email: 'vikram.j@srmap.edu.in',
      reg_number: 'AP21110010999',
      phone: '+91 9876543214',
      college: 'SRM University AP',
      event_title: 'Azure Cloud & Distributed Systems BootCamp',
      status: 'pending_payment',
      checked_in: false,
      created_at: '2026-09-24T16:00:00Z',
    },
  ]);

  // Form states for at-the-door manual registration
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualRegNum, setManualRegNum] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCollege, setManualCollege] = useState('SRM University AP');

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.lead_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reg_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.team_name && r.team_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleManualRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const newReg: RegistrationRecord = {
      id: `reg-${Date.now()}`,
      lead_name: manualName,
      lead_email: manualEmail,
      reg_number: manualRegNum,
      phone: manualPhone,
      college: manualCollege,
      event_title: "SYNORA '26 — National Hackathon",
      status: 'confirmed',
      checked_in: true, // Walk-in checked in immediately
      created_at: new Date().toISOString(),
    };
    setRegistrations([newReg, ...registrations]);
    setIsManualModalOpen(false);
    setManualName('');
    setManualEmail('');
    setManualRegNum('');
    setManualPhone('');
  };

  // CSV Import via PapaParse
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const imported: RegistrationRecord[] = results.data.map((row: any, i) => ({
          id: `imp-${Date.now()}-${i}`,
          lead_name: row.Name || row.name || 'Imported Participant',
          lead_email: row.Email || row.email || `imported-${i}@srmap.edu.in`,
          reg_number: row.RegNum || row.reg_num || 'AP0000000000',
          phone: row.Phone || row.phone || '',
          college: row.College || row.college || 'SRM University AP',
          event_title: "SYNORA '26 — National Hackathon",
          status: 'confirmed',
          checked_in: false,
          created_at: new Date().toISOString(),
        }));
        setRegistrations([...imported, ...registrations]);
      },
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csv = Papa.unparse(
      registrations.map((r) => ({
        Name: r.lead_name,
        Email: r.lead_email,
        RegistrationNumber: r.reg_number,
        Phone: r.phone,
        College: r.college,
        Event: r.event_title,
        Status: r.status,
        CheckedIn: r.checked_in ? 'YES' : 'NO',
        Team: r.team_name || 'Individual',
        RegisteredAt: r.created_at,
      }))
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MSC_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live Excel (.xlsx) export via API route /api/admin/export?format=xlsx
  const handleExportXLSX = () => {
    window.location.href = '/api/admin/export?format=xlsx';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-strong)' }}>
            Registrations, Badges &amp; Exports
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Manage attendee ledger, at-the-door walk-ins, badge printing, and spreadsheet exports.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="fluent-btn fluent-btn-primary"
            style={{ fontSize: '13px' }}
          >
            <UserPlus size={15} /> At-The-Door Walk-In
          </button>

          <label
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '13px', cursor: 'pointer' }}
          >
            <Upload size={14} /> Import CSV
            <input type="file" accept=".csv" onChange={handleCSVImport} style={{ display: 'none' }} />
          </label>

          <button
            onClick={handleExportCSV}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <FileText size={14} /> Export CSV
          </button>

          <button
            onClick={handleExportXLSX}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <FileSpreadsheet size={14} color="var(--success)" /> Export Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          alignItems: 'center',
          boxShadow: 'var(--shadow-rest)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search by attendee name, email, reg number, or team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="fluent-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="fluent-input"
            style={{ width: '150px' }}
          >
            <option value="all">All Registrations</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="waitlisted">Waitlisted</option>
          </select>
        </div>
      </div>

      {/* Registrations Table */}
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
              <th style={{ padding: '12px 16px' }}>Attendee</th>
              <th style={{ padding: '12px 16px' }}>Reg Number &amp; College</th>
              <th style={{ padding: '12px 16px' }}>Event</th>
              <th style={{ padding: '12px 16px' }}>Team</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Turnstile Check-In</th>
              <th style={{ padding: '12px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegistrations.map((r) => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 16px' }}>
                  <strong style={{ color: 'var(--text-strong)', display: 'block' }}>{r.lead_name}</strong>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.lead_email}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ color: 'var(--text-strong)' }}>{r.reg_number}</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.college}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>{r.event_title}</td>
                <td style={{ padding: '14px 16px' }}>{r.team_name || 'Individual'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    className={`fluent-badge ${
                      r.status === 'confirmed'
                        ? 'badge-success'
                        : r.status === 'pending_payment'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button
                    onClick={() => {
                      setRegistrations(
                        registrations.map((item) =>
                          item.id === r.id ? { ...item, checked_in: !item.checked_in } : item
                        )
                      );
                    }}
                    style={{
                      background: r.checked_in ? 'var(--success-bg)' : 'var(--bg-soft)',
                      color: r.checked_in ? 'var(--success)' : 'var(--text-muted)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {r.checked_in ? 'Checked In' : 'Not Checked In'}
                  </button>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button
                    onClick={() => setSelectedBadge(r)}
                    className="fluent-btn fluent-btn-secondary"
                    style={{ padding: '4px 10px', fontSize: '12px', gap: '4px' }}
                  >
                    <CreditCard size={13} /> Badge
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ID-CARD / BADGE GENERATION MODAL */}
      {selectedBadge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '420px',
              width: '100%',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lift)',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)' }}>
                Printable Attendee Badge
              </h3>
              <button
                onClick={() => setSelectedBadge(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Printable Badge Preview */}
            <div
              id="printable-badge"
              style={{
                border: '2px solid #0067b8',
                borderRadius: '6px',
                padding: '24px',
                background: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                marginBottom: '20px',
              }}
            >
              <div style={{ borderBottom: '2px solid #dceef8', paddingBottom: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: '#0067b8', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
                  MICROSOFT STUDENT COMMUNITY
                </span>
                <div style={{ fontSize: '12px', color: '#616161' }}>SRM University AP &bull; Chapter &apos;26</div>
              </div>

              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: '#0067b8',
                  color: '#ffffff',
                  fontSize: '28px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                {selectedBadge.lead_name.charAt(0)}
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#17253d', margin: '0 0 4px 0' }}>
                {selectedBadge.lead_name}
              </h2>
              <span style={{ fontSize: '13px', color: '#0067b8', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                {selectedBadge.team_name ? `Team: ${selectedBadge.team_name}` : 'Individual Participant'}
              </span>

              <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', fontSize: '12px', margin: '14px 0' }}>
                <div><strong>Reg:</strong> {selectedBadge.reg_number}</div>
                <div><strong>College:</strong> {selectedBadge.college}</div>
              </div>

              <span style={{ fontSize: '11px', color: '#616161', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {selectedBadge.event_title}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedBadge(null)}
                className="fluent-btn fluent-btn-secondary"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="fluent-btn fluent-btn-primary"
                style={{ gap: '6px' }}
              >
                <Printer size={15} /> Print Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AT-THE-DOOR MANUAL REGISTRATION MODAL */}
      {isManualModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lift)',
              padding: '32px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-strong)' }}>
                Manual Walk-in Registration
              </h2>
              <button
                onClick={() => setIsManualModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleManualRegistration} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Attendee Name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="fluent-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="attendee@srmap.edu.in"
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  className="fluent-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AP21110010..."
                    value={manualRegNum}
                    onChange={(e) => setManualRegNum(e.target.value)}
                    className="fluent-input"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="fluent-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                  College Name
                </label>
                <input
                  type="text"
                  value={manualCollege}
                  onChange={(e) => setManualCollege(e.target.value)}
                  className="fluent-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="fluent-btn fluent-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="fluent-btn fluent-btn-primary">
                  Confirm &amp; Check In Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
