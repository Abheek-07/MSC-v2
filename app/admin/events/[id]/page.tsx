'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Search,
  Download,
  Upload,
  Printer,
  QrCode,
  CheckCircle,
  X,
  CreditCard,
  FileSpreadsheet,
  FileText,
  UserCheck,
} from 'lucide-react';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { QRCodeSVG } from 'qrcode.react';

interface AttendeeRecord {
  id: string;
  hash_payload: string;
  lead_name: string;
  lead_email: string;
  reg_number: string;
  phone: string;
  college: string;
  status: 'confirmed' | 'pending_payment' | 'waitlisted' | 'cancelled';
  checked_in: boolean;
  team_name?: string;
  team_members?: Array<{ name: string; email: string; reg_number?: string }>;
  created_at: string;
}

export default function PerEventManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;

  const event = FALLBACK_EVENTS.find((e) => e.id === eventId) || FALLBACK_EVENTS[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<AttendeeRecord | null>(null);
  const [selectedTeamRoster, setSelectedTeamRoster] = useState<AttendeeRecord | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Initial event-scoped attendees
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([
    {
      id: 'reg-001',
      hash_payload: 'tkt-synora-001',
      lead_name: 'Alex Morgan',
      lead_email: 'alex.m@srmap.edu.in',
      reg_number: 'AP21110010123',
      phone: '+91 9876543210',
      college: 'SRM University AP',
      status: 'confirmed',
      checked_in: true,
      team_name: 'Azure Titans',
      team_members: [
        { name: 'Alex Morgan', email: 'alex.m@srmap.edu.in', reg_number: 'AP21110010123' },
        { name: 'Kiran Patel', email: 'kiran.p@srmap.edu.in', reg_number: 'AP21110010124' },
        { name: 'David Kim', email: 'david.k@srmap.edu.in', reg_number: 'AP21110010125' },
      ],
      created_at: '2026-09-20T10:15:00Z',
    },
    {
      id: 'reg-002',
      hash_payload: 'tkt-synora-002',
      lead_name: 'Priya Sharma',
      lead_email: 'priya.s@srmap.edu.in',
      reg_number: 'AP21110010456',
      phone: '+91 9876543211',
      college: 'SRM University AP',
      status: 'confirmed',
      checked_in: false,
      team_name: '',
      created_at: '2026-09-21T14:30:00Z',
    },
    {
      id: 'reg-003',
      hash_payload: 'tkt-synora-003',
      lead_name: 'Rahul Varma',
      lead_email: 'rahul.v@vit.ac.in',
      reg_number: '21BCE0452',
      phone: '+91 9876543212',
      college: 'VIT Vellore',
      status: 'confirmed',
      checked_in: false,
      team_name: 'Neural Racers',
      team_members: [
        { name: 'Rahul Varma', email: 'rahul.v@vit.ac.in', reg_number: '21BCE0452' },
        { name: 'Aakash Verma', email: 'aakash@vit.ac.in', reg_number: '21BCE0453' },
      ],
      created_at: '2026-09-22T09:45:00Z',
    },
    {
      id: 'reg-004',
      hash_payload: 'tkt-synora-004',
      lead_name: 'Sneha Kapur',
      lead_email: 'sneha.k@srmap.edu.in',
      reg_number: 'AP21110010890',
      phone: '+91 9876543213',
      college: 'SRM University AP',
      status: 'waitlisted',
      checked_in: false,
      team_name: '',
      created_at: '2026-09-23T11:20:00Z',
    },
  ]);

  // Toggle Attendance
  const toggleCheckIn = (id: string) => {
    setAttendees((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked_in: !item.checked_in } : item))
    );
  };

  // Filter attendees
  const filtered = attendees.filter((item) => {
    const matchesSearch =
      item.lead_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lead_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reg_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.team_name && item.team_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'checked_in'
        ? item.checked_in
        : statusFilter === 'unattended'
        ? !item.checked_in
        : item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const confirmedCount = attendees.filter((a) => a.status === 'confirmed').length;
  const checkedInCount = attendees.filter((a) => a.checked_in).length;

  // Export CSV
  const handleExportCSV = () => {
    const csvData = attendees.map((a) => ({
      'Registration ID': a.id,
      Name: a.lead_name,
      Email: a.lead_email,
      'Registration Number': a.reg_number,
      College: a.college,
      Phone: a.phone,
      Team: a.team_name || 'Individual',
      Status: a.status,
      'Checked In': a.checked_in ? 'YES' : 'NO',
      'Registered At': a.created_at,
    }));
    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug}-attendees-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Excel (.xlsx) using exceljs
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Microsoft Student Community SRM AP';
    const worksheet = workbook.addWorksheet('Attendees');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 14 },
      { header: 'Participant Name', key: 'name', width: 24 },
      { header: 'Email Address', key: 'email', width: 28 },
      { header: 'Reg Number', key: 'reg_number', width: 18 },
      { header: 'Institution', key: 'college', width: 24 },
      { header: 'Phone Number', key: 'phone', width: 18 },
      { header: 'Team Name', key: 'team', width: 20 },
      { header: 'Registration Status', key: 'status', width: 16 },
      { header: 'Admission Checked In', key: 'checked_in', width: 18 },
    ];

    // Style Header Row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0067B8' }, // Cobalt brand
    };

    attendees.forEach((a) => {
      worksheet.addRow({
        id: a.id,
        name: a.lead_name,
        email: a.lead_email,
        reg_number: a.reg_number,
        college: a.college,
        phone: a.phone,
        team: a.team_name || 'Individual',
        status: a.status.toUpperCase(),
        checked_in: a.checked_in ? 'YES' : 'NO',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug}-roster-${new Date().toISOString().slice(0, 10)}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle CSV Import
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedRows = results.data as any[];
        const newAttendees: AttendeeRecord[] = parsedRows.map((row, idx) => ({
          id: `imp-${Date.now()}-${idx}`,
          hash_payload: `tkt-${Date.now()}-${idx}`,
          lead_name: row['Name'] || row['lead_name'] || 'Imported Attendee',
          lead_email: row['Email'] || row['lead_email'] || 'attendee@srmap.edu.in',
          reg_number: row['Registration Number'] || row['reg_number'] || 'AP21110000000',
          phone: row['Phone'] || row['phone'] || '+91 9999999999',
          college: row['College'] || row['college'] || 'SRM University AP',
          status: 'confirmed',
          checked_in: false,
          team_name: row['Team'] || row['team_name'] || '',
          created_at: new Date().toISOString(),
        }));

        setAttendees((prev) => [...newAttendees, ...prev]);
        setIsImportModalOpen(false);
      },
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Navigation & Event Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Link href="/admin/events" style={{ fontSize: '13px', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowLeft size={14} /> Events Directory
            </Link>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Event Management</span>
          </div>

          <h1 style={{ fontSize: '26px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
            {event.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={14} />
              <span>{new Date(event.date_start).toLocaleDateString()}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={14} />
              <span>{event.location}</span>
            </div>
            <span className="fluent-badge badge-success">
              {event.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href={`/admin/events/${eventId}/scanner`}
            className="fluent-btn fluent-btn-primary"
            style={{ fontSize: '13px' }}
          >
            <QrCode size={16} /> Launch Camera Scanner
          </Link>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Upload size={14} /> Bulk CSV Import
          </button>

          <button
            onClick={handleExportExcel}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <FileSpreadsheet size={14} /> Excel (.xlsx)
          </button>

          <button
            onClick={handleExportCSV}
            className="fluent-btn fluent-btn-secondary"
            style={{ fontSize: '13px' }}
          >
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <div className="fluent-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Registrations</span>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-strong)', marginTop: '4px' }}>
            {attendees.length}
          </div>
        </div>

        <div className="fluent-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Confirmed Capacity</span>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--brand)', marginTop: '4px' }}>
            {confirmedCount} / {event.max_capacity}
          </div>
        </div>

        <div className="fluent-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Door Check-ins</span>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)', marginTop: '4px' }}>
            {checkedInCount}
          </div>
        </div>

        <div className="fluent-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Attendance Rate</span>
          <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--accent-strong)', marginTop: '4px' }}>
            {confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search attendees, email, reg no, team..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="fluent-input"
            style={{ paddingLeft: '36px', fontSize: '13px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filter:</span>
          {['all', 'confirmed', 'waitlisted', 'checked_in', 'unattended'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                background: statusFilter === f ? 'var(--brand)' : 'var(--bg-soft)',
                color: statusFilter === f ? '#ffffff' : 'var(--text-body)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 12px',
                fontSize: '12px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Registrations Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-rest)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-soft)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px 16px' }}>Participant</th>
                <th style={{ padding: '12px 16px' }}>Academic Coordinates</th>
                <th style={{ padding: '12px 16px' }}>Team &amp; Roster</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Turnstile Check-In</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No attendee records found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{record.lead_name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{record.lead_email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>{record.reg_number}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{record.college}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {record.team_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 500, color: 'var(--brand)' }}>{record.team_name}</span>
                          {record.team_members && record.team_members.length > 0 && (
                            <button
                              onClick={() => setSelectedTeamRoster(record)}
                              style={{
                                background: 'none',
                                border: '1px solid var(--border)',
                                borderRadius: '2px',
                                fontSize: '11px',
                                padding: '2px 6px',
                                cursor: 'pointer',
                                color: 'var(--text-muted)',
                              }}
                            >
                              Roster ({record.team_members.length})
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Solo Participant</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        className={`fluent-badge ${
                          record.status === 'confirmed'
                            ? 'badge-success'
                            : record.status === 'waitlisted'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {record.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        onClick={() => toggleCheckIn(record.id)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: record.checked_in ? '1px solid var(--success)' : '1px solid var(--border)',
                          background: record.checked_in ? 'var(--success-bg)' : 'var(--bg-soft)',
                          color: record.checked_in ? 'var(--success)' : 'var(--text-body)',
                        }}
                      >
                        <CheckCircle size={14} />
                        {record.checked_in ? 'Checked In' : 'Not Checked In'}
                      </button>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <button
                        onClick={() => setSelectedBadge(record)}
                        className="fluent-btn fluent-btn-secondary"
                        style={{ fontSize: '12px', padding: '4px 10px' }}
                      >
                        <Printer size={12} /> ID Badge
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Roster Modal */}
      {selectedTeamRoster && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              width: '100%',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--brand)" />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
                  Team Roster: {selectedTeamRoster.team_name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTeamRoster(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {selectedTeamRoster.team_members?.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 14px',
                    background: 'var(--bg-soft)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-strong)' }}>
                      {m.name} {idx === 0 && <span style={{ color: 'var(--brand)', fontSize: '11px' }}>(Lead)</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.email}</div>
                  </div>
                  {m.reg_number && (
                    <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-body)' }}>
                      {m.reg_number}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedTeamRoster(null)}
                className="fluent-btn fluent-btn-secondary"
                style={{ fontSize: '12px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ID Badge / Card Generator Modal */}
      {selectedBadge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '400px',
              width: '100%',
              background: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-lift)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Top Toolbar */}
            <div style={{ padding: '12px 16px', background: '#f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>Printable Attendee Badge</span>
              <button
                onClick={() => setSelectedBadge(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Physical Badge Body */}
            <div id="printable-badge" style={{ padding: '28px 24px', textAlign: 'center', color: '#111827' }}>
              {/* Badge Header Strip */}
              <div style={{ borderBottom: '2px solid #0067b8', paddingBottom: '12px', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0067b8', fontWeight: 700 }}>
                  Microsoft Student Community &bull; Chapter &apos;26
                </div>
                <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>
                  SRM University AP &bull; {event.title}
                </div>
              </div>

              {/* Attendee Name */}
              <h2 style={{ fontSize: '22px', fontWeight: 700, margin: '8px 0 4px 0', color: '#111827' }}>
                {selectedBadge.lead_name}
              </h2>
              <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '12px' }}>
                {selectedBadge.reg_number} &bull; {selectedBadge.college}
              </div>

              {selectedBadge.team_name ? (
                <div
                  style={{
                    display: 'inline-block',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '16px',
                  }}
                >
                  Team: {selectedBadge.team_name}
                </div>
              ) : (
                <div
                  style={{
                    display: 'inline-block',
                    background: '#f3f4f6',
                    color: '#4b5563',
                    padding: '4px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: '16px',
                  }}
                >
                  Individual Delegate
                </div>
              )}

              {/* High Contrast QR Code for Door Check-in */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                  <QRCodeSVG
                    value={`https://msc-srmap.in/admin/checkin/${selectedBadge.hash_payload}`}
                    size={140}
                    level="H"
                  />
                </div>
              </div>

              <div style={{ fontSize: '10px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Official Turnstile Entry Pass &bull; Scan for Admission
              </div>
            </div>

            {/* Print Action Footer */}
            <div style={{ padding: '12px 16px', background: '#f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setSelectedBadge(null)}
                className="fluent-btn fluent-btn-secondary"
                style={{ fontSize: '12px' }}
              >
                Dismiss
              </button>
              <button
                onClick={() => window.print()}
                className="fluent-btn fluent-btn-primary"
                style={{ fontSize: '12px' }}
              >
                <Printer size={14} /> Print Badge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      {isImportModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              background: 'var(--surface)',
              borderRadius: 'var(--radius-sm)',
              padding: '24px',
              boxShadow: 'var(--shadow-lift)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={18} color="var(--brand)" />
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-strong)', margin: 0 }}>
                  Bulk CSV Attendee Import
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.5, marginBottom: '16px' }}>
              Upload an external attendance roster CSV. Expected headers: <code>Name, Email, Registration Number, College, Phone, Team</code>.
            </p>

            <div
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '24px',
                textAlign: 'center',
                background: 'var(--bg-soft)',
                marginBottom: '20px',
              }}
            >
              <input
                type="file"
                accept=".csv"
                id="csv-file-input"
                onChange={handleCSVUpload}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="csv-file-input"
                className="fluent-btn fluent-btn-secondary"
                style={{ cursor: 'pointer', margin: '0 auto', display: 'inline-flex' }}
              >
                Choose CSV File
              </label>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                UTF-8 encoded comma-separated file
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="fluent-btn fluent-btn-secondary"
                style={{ fontSize: '12px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
