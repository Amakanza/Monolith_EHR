
export interface DashboardMetrics {
  activePatients: number;
  newPatientsInRange: number;
  appointmentsByStatus: {
    booked: number;
    completed: number;
    cancelled: number;
    no_show: number;
  };
  invoicesTotals: {
    totalCents: number;
    paidCents: number;
    balanceCents: number;
  };
  notesCreated: number;
}

export interface AuditEvent {
  id: string;
  clinicId: string;
  actorUserId: string;
  actorRole: string | null;
  eventType: string;
  entityType: string;
  entityId: string | null;
  metadata: any;
  createdAt: string;
  
  // Joins
  actorName?: string;
}

export interface DateRangeQuery {
  clinicId?: string;
  from?: string; // ISO date string YYYY-MM-DD
  to?: string;   // ISO date string YYYY-MM-DD
}

export interface AuditLogQuery extends DateRangeQuery {
  eventType?: string;
  actorUserId?: string;
  limit?: number;
  offset?: number;
}
