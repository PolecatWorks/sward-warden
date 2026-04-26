export interface Field {
  id?: number | string;
  farm_id: number | string;
  name: string;
  area_hectares: number;
  land_use?: string;
  updated_at?: string;
  is_deleted?: boolean;
}
