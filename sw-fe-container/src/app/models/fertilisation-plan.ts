export interface FertilisationPlan {
  id?: number;
  farm_id: number;
  year: number;
  plan_content: string;
  derogation_status: boolean;
  chemical_p_grassland: boolean;
  high_p_manure: boolean;
  anaerobic_digestate: boolean;
}
