export type BookTheme =
  | 'dinosaurs'
  | 'ninjas'
  | 'space'
  | 'underwater'
  | 'fairy_tale'
  | 'superheroes';

export type BookStatus = 'draft' | 'generating' | 'complete' | 'failed';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  theme: BookTheme;
  status: BookStatus;
  is_paid: boolean;
  child_name: string | null;
  child_age: number | null;
  photo_paths: string[] | null;
  created_at: string;
  updated_at: string;
}
