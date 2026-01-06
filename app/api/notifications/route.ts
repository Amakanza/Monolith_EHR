
import { listMyNotifications, getUnreadNotificationCount } from '@/lib/services/communicationsService';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get('countOnly') === 'true';
    
    if (countOnly) {
      const count = await getUnreadNotificationCount();
      return NextResponse.json({ count });
    }

    const result = await listMyNotifications();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
