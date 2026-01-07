
import { createAttachmentUploadUrl } from '@/lib/services/noteService';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ noteId: string }> }
) {
  try {
    const { noteId } = await params;
    const body = await request.json();
    const result = await createAttachmentUploadUrl({
      noteId,
      fileName: body.fileName,
      contentType: body.contentType
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
