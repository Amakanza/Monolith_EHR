
export type NoteStatus = 'draft' | 'final';

export interface NoteTemplate {
  id: string;
  clinicId: string;
  name: string;
  templateJson: Record<string, any>; // For future schema expansion
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalNote {
  id: string;
  clinicId: string;
  patientId: string;
  appointmentId: string | null;
  templateId: string | null;
  
  title: string;
  noteDate: string; // YYYY-MM-DD
  
  // SOAP
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  
  additionalText: string | null;
  tags: string[] | null;
  
  status: NoteStatus;
  finalizedAt: string | null;
  finalizedBy: string | null;
  
  authorId: string;
  createdAt: string;
  updatedAt: string;

  // Joined fields
  authorName?: string;
  finalizerName?: string;
  templateName?: string;
}

export interface NoteAttachment {
  id: string;
  clinicId: string;
  noteId: string;
  patientId: string;
  bucket: string;
  objectPath: string;
  fileName: string;
  contentType: string | null;
  fileSizeBytes: number | null;
  uploadedBy: string;
  createdAt: string;
}

export interface ClinicalNoteWithAttachments {
  note: ClinicalNote;
  attachments: NoteAttachment[];
}

// --- Inputs ---

export interface CreateClinicalNoteInput {
  patientId: string;
  appointmentId?: string | null;
  templateId?: string | null;
  title: string;
  noteDate: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  additionalText?: string;
  tags?: string[];
}

export interface UpdateClinicalNoteInput {
  title?: string;
  noteDate?: string;
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  additionalText?: string;
  tags?: string[];
}

export interface CreateTemplateInput {
  name: string;
  templateJson?: Record<string, any>;
}

export interface UpdateTemplateInput {
  name?: string;
  templateJson?: Record<string, any>;
  isActive?: boolean;
}

export interface CreateAttachmentMetadataInput {
  noteId: string;
  fileName: string;
  objectPath: string;
  contentType?: string;
  fileSizeBytes?: number;
}
