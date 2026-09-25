import { NextResponse } from 'next/server';

export async function GET() {
  const timestamp = new Date().toISOString();
  
  return NextResponse.json({
    status: 'healthy',
    platform: 'MSC SRM AP Production Platform',
    chapter: "CHAPTER '26",
    timestamp,
    services: {
      framework: 'Next.js 15 (App Router)',
      auth: 'Supabase Auth & RLS',
      payments: 'Razorpay',
      ratelimit: 'Upstash / In-Memory Sliding Window',
      resilience: 'Graceful Degradation Active',
    },
  });
}
