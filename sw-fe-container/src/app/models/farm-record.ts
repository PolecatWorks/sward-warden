export interface FarmRecord {
  id?: number;
  farm_id?: number;
  agricultural_area: number;
  manure_storage_capacity: number;
  year: number;
  updated_at?: string;
  is_deleted?: boolean;
}
