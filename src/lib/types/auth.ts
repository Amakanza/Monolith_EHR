
export interface DBUserProfile {
  id: string;
  full_name: string | null;
  created_at: string;
  active_clinic_id?: string | null;
}
