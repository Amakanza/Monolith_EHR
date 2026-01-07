
import { getDashboardStats } from '@/lib/server/services/dashboard.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
