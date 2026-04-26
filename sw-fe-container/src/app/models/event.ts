export interface Event {
  id?: number | string;
  field_id: number | string;
  event_type: string;
  description: string;
  date: string;
  updated_at?: string;
  is_deleted?: boolean;
  mapp_number?: string;
  eppo_code?: string;
  bbch_growth_stage?: string;
}
