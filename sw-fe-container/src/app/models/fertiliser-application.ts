export interface FertiliserApplication {
  id: number;
  event_id: number;
  fertiliser_type: string;
  amount_applied: number;
  nitrogen_content?: number;
  evidence_of_control?: string;
}
