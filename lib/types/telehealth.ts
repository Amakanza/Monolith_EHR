
export type TelehealthProvider = 'zoom' | 'google_meet' | 'microsoft_teams' | 'jitsi' | 'custom';
export type TelehealthStatus = 'scheduled' | 'live' | 'ended' | 'cancelled';
export type JoinActorType = 'patient' | 'staff';
export type JoinStatus = 'success' | 'denied' | 'error';

export interface TelehealthSession {
  id: string;
  clinicId: string;
  appointmentId: string;
  patientId: string;
  clinicianId: string;
  
  provider: TelehealthProvider;
  joinUrl: string;
  hostUrl: string | null;
  meetingId: string | null;
  passcode: string | null;
  
  patientJoinToken: string | null;
  patientJoinExpiresAt: string | null;
  isActive: boolean;
  
  status: TelehealthStatus;
  startedAt: string | null;
  endedAt: string | null;
  
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Joins
  patientName?: string;
  clinicianName?: string;
  appointmentStartTime?: string;
}

export interface TelehealthJoinLog {
  id: string;
  clinicId: string;
  sessionId: string;
  joinedAt: string;
  actorType: JoinActorType;
  actorUserId: string | null;
  patientTokenUsed: string | null;
  ipHash: string | null;
  userAgent: string | null;
  status: JoinStatus;
  error: string | null;
  
  // Joins
  actorName?: string;
}

// Inputs

export interface CreateTelehealthSessionInput {
  appointmentId: string;
  provider: TelehealthProvider;
  joinUrl: string;
  hostUrl?: string;
  meetingId?: string;
  passcode?: string;
  patientJoinEnabled?: boolean;
  patientJoinExpiresAt?: string | null;
}

export interface UpdateTelehealthSessionInput {
  joinUrl?: string;
  hostUrl?: string;
  status?: TelehealthStatus;
  isActive?: boolean;
  patientJoinExpiresAt?: string | null;
  // Regenerate token flag?
  regenerateToken?: boolean; 
}

export interface ListSessionsQuery {
  clinicId?: string;
  clinicianId?: string;
  patientId?: string;
  status?: TelehealthStatus;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}
