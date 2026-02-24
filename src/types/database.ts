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
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type PageStatus = 'text_ready' | 'complete' | 'failed';

export interface Page {
  id: string;
  book_id: string;
  page_number: number;
  text: string;
  illustration_url: string | null;
  status: PageStatus;
  created_at: string;
  updated_at: string;
}
