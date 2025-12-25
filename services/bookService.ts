
import { Book } from '../types';

/**
 * Sanitizes ISBN string to ensure only digits (and X for ISBN-10) are used
 */
const cleanIsbn = (isbn: string): string => {
  return isbn.replace(/[^0-9X]/gi, '').trim();
};

export const fetchBookByIsbn = async (isbn: string): Promise<Partial<Book> | null> => {
  const sanitizedIsbn = cleanIsbn(isbn);
  if (!sanitizedIsbn) return null;

  try {
    // 1. Try Finna.fi API
    console.log(`Fetching from Finna API: ${sanitizedIsbn}`);
    try {
      const finnaResponse = await fetch(`https://api.finna.fi/v1/search?lookfor=isbn:${sanitizedIsbn}&field[]=title&field[]=author&field[]=images&field[]=year&field[]=summary&field[]=publisher&field[]=languages&field[]=topics`);
      const finnaData = await finnaResponse.json();
      
      if (finnaData.resultCount > 0) {
        const record = finnaData.records[0];
        return {
          isbn: sanitizedIsbn,
          title: record.title,
          authors: record.author ? Object.keys(record.author) : (record.authors?.map((a: any) => a.name) || ['Unknown Author']),
          coverUrl: record.images?.[0] ? `https://api.finna.fi${record.images[0]}` : `https://covers.openlibrary.org/b/isbn/${sanitizedIsbn}-L.jpg`,
          publishedDate: record.year,
          publisher: record.publisher?.[0],
          language: record.languages?.[0],
          categories: record.topics?.flat() || [],
          description: record.summary?.[0] || '',
        };
      }
    } catch (e) {
      console.warn("Finna API fetch failed", e);
    }

    // 2. Try Open Library API
    const olResponse = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${sanitizedIsbn}&format=json&jscmd=data`);
    const olData = await olResponse.json();
    const olKey = `ISBN:${sanitizedIsbn}`;

    if (olData[olKey]) {
      const bookData = olData[olKey];
      return {
        isbn: sanitizedIsbn,
        title: bookData.title,
        authors: bookData.authors?.map((a: any) => a.name) || ['Unknown Author'],
        coverUrl: bookData.cover?.large || bookData.cover?.medium || `https://covers.openlibrary.org/b/isbn/${sanitizedIsbn}-L.jpg`,
        pageCount: bookData.number_of_pages,
        publishedDate: bookData.publish_date,
        publisher: bookData.publishers?.[0]?.name,
        language: bookData.languages?.[0]?.name,
        categories: bookData.subjects?.map((s: any) => s.name) || [],
        description: bookData.notes || '',
      };
    }

    // 3. Fallback to Google Books API
    const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${sanitizedIsbn}`);
    const gbData = await gbResponse.json();

    if (gbData.totalItems > 0) {
      const volume = gbData.items[0].volumeInfo;
      return {
        isbn: sanitizedIsbn,
        title: volume.title,
        authors: volume.authors || ['Unknown Author'],
        coverUrl: volume.imageLinks?.extraLarge || volume.imageLinks?.large || volume.imageLinks?.thumbnail || `https://picsum.photos/seed/${sanitizedIsbn}/200/300`,
        pageCount: volume.pageCount,
        publishedDate: volume.publishedDate,
        publisher: volume.publisher,
        language: volume.language,
        categories: volume.categories || [],
        description: volume.description || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching book data across providers:', error);
    return null;
  }
};

export const searchBooksByQuery = async (query: string): Promise<Partial<Book>[]> => {
  if (!query) return [];

  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
    const data = await response.json();

    if (!data.items) return [];

    return data.items.map((item: any) => {
      const info = item.volumeInfo;
      const isbns = info.industryIdentifiers?.filter((id: any) => id.type.startsWith('ISBN'));
      const isbn = isbns?.[0]?.identifier || 'Unknown';
      
      return {
        isbn,
        title: info.title || 'Unknown Title',
        authors: info.authors || ['Unknown Author'],
        coverUrl: info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || `https://picsum.photos/seed/${isbn}/200/300`,
        description: info.description || '',
        pageCount: info.pageCount,
        publishedDate: info.publishedDate,
        publisher: info.publisher,
        language: info.language,
        categories: info.categories || []
      };
    });
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
};
