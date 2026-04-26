export interface FertiliserApplication {
  id?: number | string;
  event_id: number | string;
  fertiliser_type: string;
  amount_applied: number;
  nitrogen_content?: number;
  phosphorus_content?: number;
  is_protected_urea?: boolean;
  buffer_zone_confirmed?: boolean;
  evidence_of_control?: string;
  updated_at?: string;
  is_deleted?: boolean;
}
