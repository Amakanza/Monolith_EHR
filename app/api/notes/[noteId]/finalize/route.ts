
import { finalizeClinicalNote } from '@/lib/services/noteService';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const result = await finalizeClinicalNote(noteId);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('FINALIZED') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
