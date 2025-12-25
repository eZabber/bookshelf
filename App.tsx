
import React, { useState, useEffect, useCallback } from 'react';
import { Book, ShelfType, GoogleUser } from './types';
import BookScanner from './components/BookScanner';
import BookCard from './components/BookCard';
import { fetchBookByIsbn, searchBooksByQuery } from './services/bookService';
import { getBookInsights } from './services/geminiService';
import { syncToGoogleSheets } from './services/googleSheetsService';
import { 
  Library, 
  Search, 
  ScanLine, 
  Plus, 
  BookOpen, 
  Bookmark, 
  User, 
  Settings,
  Sparkles,
  ChevronRight,
  Database,
  Loader2,
  Calendar,
  CheckCircle2,
  X,
  SearchCode,
  ArrowRight,
  Edit3,
  Save,
  RefreshCw,
  Star,
  ExternalLink,
  ChevronLeft,
  Trash2,
  AlertCircle,
  Building2,
  Globe,
  Tag,
  CloudCheck,
  CloudOff
} from 'lucide-react';
import { format } from 'date-fns';

// Constants for Google Auth - Note: ClientID would normally be an env var
const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"; 

const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [activeShelf, setActiveShelf] = useState<ShelfType>('want-to-read');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchResults, setSearchResults] = useState<Partial<Book>[] | null>(null);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  
  const [detailSearchIsbn, setDetailSearchIsbn] = useState('');
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  const [editForm, setEditForm] = useState({
    title: '', authors: '', description: '', pageCount: '', publisher: '', publishedDate: '', language: '', categories: ''
  });

  const [user, setUser] = useState<GoogleUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('bookshelf_data');
    if (saved) {
      try { setBooks(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    const savedUser = localStorage.getItem('bookshelf_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    
    const savedToken = localStorage.getItem('google_access_token');
    if (savedToken) setGoogleToken(savedToken);
  }, []);

  // Auto-sync effect
  useEffect(() => {
    localStorage.setItem('bookshelf_data', JSON.stringify(books));
    if (googleToken && books.length > 0) {
       // Debounced sync could go here
    }
  }, [books, googleToken]);

  const handleGoogleLogin = () => {
    // In a real app, you'd use the GIS library initialized in index.html
    // For this environment, we'll simulate the successful flow which then 
    // uses the real Google Sheets API service we created.
    
    // @ts-ignore
    const client = window.google?.accounts?.oauth2?.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (response: any) => {
        if (response.access_token) {
          setGoogleToken(response.access_token);
          localStorage.setItem('google_access_token', response.access_token);
          // Fetch user info
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
          })
          .then(res => res.json())
          .then(userInfo => {
            const newUser = { name: userInfo.name, email: userInfo.email, picture: userInfo.picture };
            setUser(newUser);
            localStorage.setItem('bookshelf_user', JSON.stringify(newUser));
            handleSyncToSheets(response.access_token);
          });
        }
      },
    });

    if (client) {
      client.requestAccessToken();
    } else {
      // Fallback for demo/dev if Google Client not loaded
      alert("Google Login requires a valid Client ID. Configure it in App.tsx to enable real Sheets sync.");
    }
  };

  const handleSyncToSheets = async (tokenOverride?: string) => {
    const token = tokenOverride || googleToken;
    if (!token) {
      handleGoogleLogin();
      return;
    }

    setIsSyncing(true);
    const success = await syncToGoogleSheets(token, books);
    setIsSyncing(false);
    
    if (success) {
      setLastSync(new Date().toLocaleTimeString());
    } else {
      alert("Sync failed. Your login might have expired.");
      setGoogleToken(null);
    }
  };

  const handleAddBook = async (bookData: Partial<Book>) => {
    setLoadingMessage("Adding to your shelf...");
    try {
      setLoadingMessage("Generating AI insights...");
      const insights = await getBookInsights(bookData.title || '', bookData.authors?.[0] || '');
      
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        isbn: bookData.isbn || 'Unknown',
        title: bookData.title || 'Unknown Title',
        authors: bookData.authors || ['Unknown Author'],
        coverUrl: bookData.coverUrl || `https://picsum.photos/seed/${bookData.isbn}/200/300`,
        shelf: activeShelf,
        dateAdded: new Date().toISOString(),
        dateRead: activeShelf === 'read' ? new Date().toISOString() : undefined,
        geminiSummary: insights,
        ...bookData
      };
      
      setBooks(prev => {
        const existing = prev.find(b => b.isbn === newBook.isbn && newBook.isbn !== 'Unknown');
        if (existing) {
          alert("This book is already on your shelf!");
          return prev;
        }
        return [newBook, ...prev];
      });
      setSelectedBook(newBook);
      setSearchResults(null);
      setSearchQuery('');
    } catch (err) {
      console.error(err);
      alert("Failed to add book.");
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleScan = async (isbn: string) => {
    setIsScannerOpen(false);
    setLoadingMessage("Fetching book details...");
    const data = await fetchBookByIsbn(isbn);
    if (data) {
      await handleAddBook(data);
    } else {
      alert("No book found for this ISBN.");
      setLoadingMessage(null);
    }
  };

  const isPossibleIsbn = (query: string) => {
    const clean = query.replace(/[^0-9X]/gi, '');
    return clean.length >= 10 && clean.length <= 13;
  };

  const handleManualSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    if (isPossibleIsbn(query)) {
      await handleScan(query);
    } else {
      setLoadingMessage(`Searching for "${query}"...`);
      try {
        const results = await searchBooksByQuery(query);
        if (results && results.length > 0) setSearchResults(results);
        else alert("No books found.");
      } catch (e) {
        alert("Search failed.");
      } finally {
        setLoadingMessage(null);
      }
    }
  };

  const filteredBooks = books.filter(b => 
    b.shelf === activeShelf && 
    (b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     b.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
     b.isbn.includes(searchQuery))
  );

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-stone-50 overflow-hidden shadow-xl safe-pt">
      {/* Header */}
      <header className="px-6 pt-6 pb-6 bg-white border-b border-stone-100 flex-shrink-0 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Bookshelf</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-stone-400 text-xs">Cloud Library</p>
               {lastSync && <span className="text-[10px] text-emerald-500 font-bold">• Synced {lastSync}</span>}
            </div>
          </div>
          <button 
            onClick={user ? () => handleSyncToSheets() : handleGoogleLogin}
            className={`flex items-center gap-2 p-1 rounded-full transition-all border ${user ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50 border-stone-200'}`}
          >
            {user ? (
              <div className="flex items-center gap-2 pr-3 pl-1">
                <div className="relative">
                  <img src={user.picture} className="w-8 h-8 rounded-full border border-emerald-200" alt="avatar" />
                  {isSyncing ? (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <RefreshCw size={10} className="animate-spin text-emerald-600" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 shadow-sm">
                      <CheckCircle2 size={10} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold text-emerald-700">Cloud Sync</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2">
                <Database size={16} className="text-stone-400" />
                <span className="text-xs font-bold text-stone-600">Connect Sheets</span>
              </div>
            )}
          </button>
        </div>

        <div className="relative mt-4 flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
            <input 
              type="text"
              placeholder="Search library or add new..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              className="w-full pl-11 pr-10 py-3 bg-stone-50 rounded-2xl text-sm border border-stone-100 focus:outline-none focus:border-stone-300 transition-all"
            />
          </div>
          <button 
            onClick={handleManualSearch}
            className="flex items-center justify-center bg-stone-900 text-white px-5 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            <Search size={20} />
          </button>
        </div>

        <div className="flex mt-6 bg-stone-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveShelf('want-to-read')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeShelf === 'want-to-read' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}
          >
            <Bookmark size={14} fill={activeShelf === 'want-to-read' ? "currentColor" : "none"} />
            To Read ({books.filter(b => b.shelf === 'want-to-read').length})
          </button>
          <button 
            onClick={() => setActiveShelf('read')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeShelf === 'read' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}
          >
            <BookOpen size={14} fill={activeShelf === 'read' ? "currentColor" : "none"} />
            Finished ({books.filter(b => b.shelf === 'read').length})
          </button>
        </div>
      </header>

      {/* Book List */}
      <main className="flex-grow overflow-y-auto px-6 py-6 no-scrollbar pb-32">
        {loadingMessage ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400 space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-stone-100 border-t-indigo-500 animate-spin"></div>
            <p className="text-xs font-bold animate-pulse">{loadingMessage}</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-40">
            <Library size={64} strokeWidth={1} className="text-stone-300 mb-4" />
            <p className="text-sm font-bold text-stone-400">Your shelf is quiet...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onRemove={() => setBookToDelete(book)}
                onToggleShelf={() => {
                  const target = book.shelf === 'read' ? 'want-to-read' : 'read';
                  setBooks(prev => prev.map(b => b.id === book.id ? {...b, shelf: target, dateRead: target === 'read' ? new Date().toISOString() : undefined} : b));
                }}
                onClick={setSelectedBook}
              />
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 safe-pb">
        <button 
          onClick={() => setIsScannerOpen(true)}
          className="flex items-center gap-3 px-8 py-5 bg-stone-900 text-white rounded-full shadow-2xl active:scale-95 transition-transform"
        >
          <ScanLine size={24} className="text-emerald-400" />
          <span className="font-bold text-sm tracking-wider">SCAN ISBN</span>
        </button>
      </div>

      {/* Delete Confirmation */}
      {bookToDelete && (
        <div className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xs rounded-3xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="font-bold text-lg mb-2">Delete Book?</h3>
            <p className="text-stone-400 text-sm mb-8">Remove "{bookToDelete.title}" from your personal collection?</p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => {
                  setBooks(prev => prev.filter(b => b.id !== bookToDelete.id));
                  setBookToDelete(null);
                }}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold"
              >
                Delete
              </button>
              <button onClick={() => setBookToDelete(null)} className="w-full py-4 text-stone-400 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Overlay (simplified for brevitiy) */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
           <div className="w-full bg-white rounded-t-[40px] p-8 max-h-[85vh] overflow-y-auto no-scrollbar safe-pb">
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-8" onClick={() => setSelectedBook(null)} />
              
              <div className="flex gap-6 mb-8">
                 <img src={selectedBook.coverUrl} className="w-28 rounded-xl shadow-xl border border-stone-100" />
                 <div className="flex-1">
                    <h2 className="text-2xl font-serif text-stone-800 leading-tight mb-1">{selectedBook.title}</h2>
                    <p className="text-stone-500 italic text-sm">by {selectedBook.authors.join(', ')}</p>
                    <div className="mt-4 flex gap-2">
                        {[1,2,3,4,5].map(s => (
                           <Star key={s} size={20} className={(selectedBook.rating || 0) >= s ? 'fill-amber-400 text-amber-400' : 'text-stone-200'} />
                        ))}
                    </div>
                 </div>
              </div>

              {selectedBook.geminiSummary && (
                <div className="bg-indigo-50/50 p-6 rounded-3xl mb-8 border border-indigo-100">
                   <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-3">
                      <Sparkles size={14} /> AI Insights
                   </div>
                   <p className="text-sm text-stone-700 leading-relaxed italic">"{selectedBook.geminiSummary}"</p>
                </div>
              )}

              <button 
                onClick={() => setSelectedBook(null)}
                className="w-full py-5 bg-stone-100 text-stone-600 rounded-2xl font-bold"
              >
                Done
              </button>
           </div>
        </div>
      )}

      {searchResults && (
        <div className="fixed inset-0 z-[60] bg-stone-50 flex flex-col safe-pt">
           <header className="px-6 py-6 flex items-center gap-4 bg-white border-b">
              <button onClick={() => setSearchResults(null)}><ChevronLeft /></button>
              <h2 className="text-xl font-bold">Search Results</h2>
           </header>
           <div className="flex-grow overflow-y-auto p-6 grid grid-cols-2 gap-4">
              {searchResults.map((res, i) => (
                <div key={i} onClick={() => handleAddBook(res)} className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100">
                   <img src={res.coverUrl} className="w-full aspect-[2/3] object-cover rounded-xl mb-3" />
                   <h3 className="text-xs font-bold truncate">{res.title}</h3>
                   <Plus size={16} className="mt-2 text-indigo-500" />
                </div>
              ))}
           </div>
        </div>
      )}

      {isScannerOpen && <BookScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
    </div>
  );
};

export default App;
