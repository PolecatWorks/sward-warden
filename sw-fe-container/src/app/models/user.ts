export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  description?: string;
  is_suspended?: boolean;
  modules?: string[] | null;
}
