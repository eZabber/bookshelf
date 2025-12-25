
import { Book } from '../types';

const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

export const syncToGoogleSheets = async (accessToken: string, books: Book[]) => {
  try {
    // 1. Find or Create Spreadsheet
    // In a real production app, you'd search Drive, but for this demo 
    // we assume the user might need to provide a Sheet ID or we create one.
    // We'll use a specific naming convention: 'Bookshelf_App_Data'
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    // First, let's try to find a sheet ID in localStorage
    let spreadsheetId = localStorage.getItem('google_spreadsheet_id');

    if (!spreadsheetId) {
      // Create new spreadsheet
      const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          properties: { title: 'My Gemini Bookshelf Data' }
        })
      });
      const data = await createResponse.json();
      spreadsheetId = data.spreadsheetId;
      if (spreadsheetId) localStorage.setItem('google_spreadsheet_id', spreadsheetId);
    }

    if (!spreadsheetId) throw new Error("Could not initialize spreadsheet");

    // 2. Prepare data rows
    // Columns: ID, ISBN, Title, Authors, Shelf, DateAdded, DateRead, Rating, Summary
    const values = [
      ['ID', 'ISBN', 'Title', 'Authors', 'Shelf', 'Date Added', 'Date Read', 'Rating', 'AI Summary'],
      ...books.map(b => [
        b.id,
        b.isbn,
        b.title,
        b.authors.join(', '),
        b.shelf,
        b.dateAdded,
        b.dateRead || '',
        b.rating || '',
        b.geminiSummary || ''
      ])
    ];

    // 3. Clear and Update the sheet (Sheet1)
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z1000?valueInputOption=RAW`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ values })
    });

    return true;
  } catch (error) {
    console.error("Google Sheets Sync Error:", error);
    return false;
  }
};
