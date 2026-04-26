export interface Farm {
  id?: number | string;
  user_id?: number;
  name: string;
  location: string;
  has_derogation?: boolean;
  updated_at?: string;
}
