
import { finalizeClinicalNote } from '@/lib/services/noteService';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await finalizeClinicalNote(id);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('FINALIZED') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
