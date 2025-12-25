
export interface Book {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  coverUrl: string;
  pageCount?: number;
  publishedDate?: string;
  publisher?: string;
  language?: string;
  categories?: string[];
  description?: string;
  shelf: 'read' | 'want-to-read';
  dateAdded: string;
  dateRead?: string;
  rating?: number;
  notes?: string;
  geminiSummary?: string;
}

export interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

export type ShelfType = 'read' | 'want-to-read';
