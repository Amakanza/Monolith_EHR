
import { getClinicalNoteById, updateClinicalNote } from '@/lib/services/noteService';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const result = await getClinicalNoteById(noteId);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('NOT_FOUND') ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const body = await request.json();
    const result = await updateClinicalNote(noteId, body);
    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message.includes('FINALIZED') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
