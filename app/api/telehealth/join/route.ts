
import { validatePatientJoin } from '@/lib/services/telehealthService';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }
    
    const userAgent = request.headers.get('user-agent') || undefined;
    const result = await validatePatientJoin(body.token, userAgent);
    
    return NextResponse.json({ 
      joinUrl: result.joinUrl,
      sessionSummary: {
        appointmentStartTime: result.session.appointmentStartTime,
        status: result.session.status
      }
    });
  } catch (error: any) {
    let status = 500;
    if (error.message === 'INVALID_TOKEN' || error.message === 'TOKEN_EXPIRED') status = 403;
    if (error.message === 'SESSION_INACTIVE' || error.message === 'SESSION_ENDED') status = 403;
    
    return NextResponse.json({ error: error.message }, { status });
  }
}
