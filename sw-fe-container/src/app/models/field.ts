export interface Field {
  id?: number;
  farm_id: number;
  name: string;
  area_hectares: number;
  land_use?: string;
  geometry_wkt?: string;
  updated_at?: string;
  is_deleted?: boolean;
  image_url?: string;
}
