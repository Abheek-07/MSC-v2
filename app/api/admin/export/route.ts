import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import { FALLBACK_EVENTS } from '@/lib/data/mock-fallback';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xlsx';

    // In production, fetch live registrations from Supabase registrations table
    const mockData = [
      {
        name: 'Alex Morgan',
        email: 'alex.m@srmap.edu.in',
        regNum: 'AP21110010123',
        phone: '+91 9876543210',
        college: 'SRM University AP',
        event: "SYNORA '26 — National Hackathon",
        status: 'confirmed',
        checkedIn: 'YES',
        team: 'Azure Titans',
      },
      {
        name: 'Priya Sharma',
        email: 'priya.s@srmap.edu.in',
        regNum: 'AP21110010456',
        phone: '+91 9876543211',
        college: 'SRM University AP',
        event: "SYNORA '26 — National Hackathon",
        status: 'confirmed',
        checkedIn: 'NO',
        team: 'Binary Beats',
      },
      {
        name: 'Rahul K.',
        email: 'rahul.k@vit.ac.in',
        regNum: '21BCE1089',
        phone: '+91 9876543212',
        college: 'VIT Vellore',
        event: "SYNORA '26 — National Hackathon",
        status: 'confirmed',
        checkedIn: 'NO',
        team: 'Cloud Runners',
      },
      {
        name: 'Neha Verma',
        email: 'neha.v@srmap.edu.in',
        regNum: 'AP21110010789',
        phone: '+91 9876543213',
        college: 'SRM University AP',
        event: 'Azure Cloud & Distributed Systems BootCamp',
        status: 'confirmed',
        checkedIn: 'YES',
        team: 'Individual',
      },
    ];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Microsoft Student Community SRM AP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Registrations');

    // Styled header row
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
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0067B8' }, // Microsoft cobalt blue
    };

    mockData.forEach((row) => {
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
    return NextResponse.json({ error: 'Failed to generate spreadsheet' }, { status: 500 });
  }
}
