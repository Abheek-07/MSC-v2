'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<RegistrationRecord | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);

  const fetchRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from('registrations')
        .select('*, events(title)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: RegistrationRecord[] = data.map((r: any) => ({
          id: r.id,
          lead_name: r.form_data?.full_name || r.form_data?.name || r.lead_email.split('@')[0],
          lead_email: r.lead_email,
          reg_number: r.form_data?.registration_number || r.form_data?.reg_num || 'N/A',
          phone: r.form_data?.phone || 'N/A',
          college: r.form_data?.college || 'SRM University AP',
          event_title: r.events?.title || 'SYNORA',
          status: r.status,
          checked_in: r.checked_in,
          team_name: r.team_data?.team_name || '',
          created_at: r.created_at,
        }));
        setRegistrations(mapped);
      }
    } catch (err) {
      console.error('Failed to load registrations:', err);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleToggleCheckin = async (id: string, currentVal: boolean) => {
    setRegistrations(registrations.map((item) => (item.id === id ? { ...item, checked_in: !currentVal } : item)));
    await supabase.from('registrations').update({ checked_in: !currentVal }).eq('id', id);
  };

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

  const handleManualRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: firstEvent } = await supabase.from('events').select('id, title').limit(1).single();
    if (!firstEvent) {
      alert('Please create an event first.');
      return;
    }

    const { error } = await supabase.from('registrations').insert({
      event_id: firstEvent.id,
      lead_email: manualEmail,
      status: 'confirmed',
      checked_in: true,
      form_data: {
        full_name: manualName,
        registration_number: manualRegNum,
        phone: manualPhone,
        college: manualCollege,
      },
    });

    if (!error) {
      await fetchRegistrations();
      setIsManualModalOpen(false);
      setManualName('');
      setManualEmail('');
      setManualRegNum('');
      setManualPhone('');
    } else {
      alert('Failed to register: ' + error.message);
    }
  };

  // CSV Import via PapaParse
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: firstEvent } = await supabase.from('events').select('id, title').limit(1).single();
    if (!firstEvent) {
      alert('Please create an event first before importing registrations.');
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];
        const toInsert = rows.map((row, i) => ({
          event_id: firstEvent.id,
          lead_email: row.Email || row.email || `imported-${Date.now()}-${i}@srmap.edu.in`,
          status: 'confirmed',
          checked_in: false,
          form_data: {
            full_name: row.Name || row.name || 'Imported Participant',
            registration_number: row.RegNum || row.reg_num || 'AP0000000000',
            phone: row.Phone || row.phone || '',
            college: row.College || row.college || 'SRM University AP',
          },
          team_data: (row.Team || row.team) ? { team_name: row.Team || row.team } : null,
        }));

        if (toInsert.length > 0) {
          const { error } = await supabase.from('registrations').insert(toInsert);
          if (error) {
            alert('Failed to import into database: ' + error.message);
          } else {
            await fetchRegistrations();
          }
        }
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
                    onClick={() => handleToggleCheckin(r.id, r.checked_in)}
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
