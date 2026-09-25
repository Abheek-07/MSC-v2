import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { getAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx';
    const eventId = searchParams.get('event_id');

    const supabase = getAdminClient();
    let query = supabase
      .from('registrations')
      .select('*, events(title)')
      .order('created_at', { ascending: false });

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: rawRows, error } = await query;
    if (error) throw error;

    const data = (rawRows || []).map((r: any) => ({
      name: r.form_data?.full_name || r.form_data?.name || r.lead_email.split('@')[0],
      email: r.lead_email,
      regNum: r.form_data?.registration_number || r.form_data?.reg_num || 'N/A',
      phone: r.form_data?.phone || 'N/A',
      college: r.form_data?.college || 'SRM University AP',
      event: r.events?.title || 'SYNORA',
      status: (r.status || 'confirmed').toUpperCase(),
      checkedIn: r.checked_in ? 'YES' : 'NO',
      team: r.team_data?.team_name || 'Individual',
      registeredAt: new Date(r.created_at).toLocaleString(),
    }));

    if (format === 'csv') {
      const csv = Papa.unparse(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="MSC_Registrations_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Microsoft Student Community SRM AP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Registrations');

    sheet.columns = [
      { header: 'Full Name', key: 'name', width: 22 },
      { header: 'Official Email', key: 'email', width: 26 },
      { header: 'Registration Number', key: 'regNum', width: 20 },
      { header: 'Phone Number', key: 'phone', width: 16 },
      { header: 'College / University', key: 'college', width: 24 },
      { header: 'Event Title', key: 'event', width: 32 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Checked In', key: 'checkedIn', width: 12 },
      { header: 'Team Name', key: 'team', width: 20 },
      { header: 'Registered At', key: 'registeredAt', width: 22 },
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0067B8' },
    };

    data.forEach((row: Record<string, any>) => {
      sheet.addRow(row);
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="MSC_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err: any) {
    console.error('[Excel export error]:', err);
    return NextResponse.json({ error: 'Failed to generate spreadsheet: ' + err.message }, { status: 500 });
  }
}
