
import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Loader2,
  Calendar,
  CheckCircle2,
  X,
  Edit3,
  Save,
  RefreshCw,
  Star,
  ChevronLeft,
  Trash2,
  Building2,
  Globe,
  Tag,
  Database,
  Cloud
} from 'lucide-react';
import { format } from 'date-fns';

// REPLACE THIS with your actual Client ID from Google Cloud Console
// Example: "123456789-abc.apps.googleusercontent.com"
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
  
  const [editForm, setEditForm] = useState({
    title: '', authors: '', description: '', pageCount: '', publisher: '', publishedDate: '', language: '', categories: ''
  });

  const [user, setUser] = useState<GoogleUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

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

  useEffect(() => {
    localStorage.setItem('bookshelf_data', JSON.stringify(books));
  }, [books]);

  const handleGoogleLogin = () => {
    // @ts-ignore
    if (!window.google || !window.google.accounts) {
      alert("Google Identity Services script hasn't loaded yet. Please refresh the page.");
      return;
    }

    if (CLIENT_ID.startsWith("YOUR_GOOGLE")) {
      alert("Please configure a valid Google Client ID in App.tsx to use Cloud Sync.");
      return;
    }

    // @ts-ignore
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      callback: (response: any) => {
        if (response.access_token) {
          setGoogleToken(response.access_token);
          localStorage.setItem('google_access_token', response.access_token);
          
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
      error_callback: (err: any) => {
        console.error("Login error", err);
        alert("Login failed: " + err.message);
      }
    });

    client.requestAccessToken();
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
      alert("Sync failed. You may need to reconnect your Google account.");
      setGoogleToken(null);
      localStorage.removeItem('google_access_token');
    }
  };

  const handleAddBook = async (bookData: Partial<Book>) => {
    setLoadingMessage("Curating your book...");
    try {
      setLoadingMessage("Generating Gemini AI insights...");
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
        publisher: bookData.publisher,
        publishedDate: bookData.publishedDate,
        language: bookData.language,
        categories: bookData.categories,
        pageCount: bookData.pageCount,
        description: bookData.description,
      };
      
      setBooks(prev => {
        const existing = prev.find(b => b.isbn === newBook.isbn && newBook.isbn !== 'Unknown');
        if (existing) return prev;
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

  const handleManualSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    if (isPossibleIsbn(query)) {
      setLoadingMessage("Fetching book details...");
      const data = await fetchBookByIsbn(query);
      if (data) await handleAddBook(data);
      else alert("No book found for this ISBN.");
      setLoadingMessage(null);
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

  // Fix: Added missing handleScan function to process barcode scans
  const handleScan = async (isbn: string) => {
    setIsScannerOpen(false);
    setLoadingMessage("Fetching book details...");
    try {
      const data = await fetchBookByIsbn(isbn);
      if (data) {
        await handleAddBook(data);
      } else {
        alert(`No book found for ISBN: ${isbn}`);
      }
    } catch (err) {
      console.error("Scan processing error:", err);
      alert("Failed to process scanned ISBN.");
    } finally {
      setLoadingMessage(null);
    }
  };

  const isPossibleIsbn = (query: string) => {
    const clean = query.replace(/[^0-9X]/gi, '');
    return clean.length >= 10 && clean.length <= 13;
  };

  const filteredBooks = books.filter(b => 
    b.shelf === activeShelf && 
    (b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     b.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
     b.isbn.includes(searchQuery))
  );

  const startEditing = () => {
    if (!selectedBook) return;
    setEditForm({
      title: selectedBook.title,
      authors: selectedBook.authors.join(', '),
      description: selectedBook.description || '',
      pageCount: selectedBook.pageCount?.toString() || '',
      publisher: selectedBook.publisher || '',
      publishedDate: selectedBook.publishedDate || '',
      language: selectedBook.language || '',
      categories: selectedBook.categories?.join(', ') || ''
    });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedBook) return;
    const updated = {
      ...selectedBook,
      title: editForm.title,
      authors: editForm.authors.split(',').map(a => a.trim()).filter(Boolean),
      description: editForm.description,
      pageCount: editForm.pageCount ? parseInt(editForm.pageCount, 10) : undefined,
      publisher: editForm.publisher,
      publishedDate: editForm.publishedDate,
      language: editForm.language,
      categories: editForm.categories.split(',').map(c => c.trim()).filter(Boolean)
    };
    setBooks(prev => prev.map(b => b.id === selectedBook.id ? updated : b));
    setSelectedBook(updated);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-stone-50 overflow-hidden shadow-xl safe-pt">
      {/* Header */}
      <header className="px-6 pt-6 pb-6 bg-white border-b border-stone-100 flex-shrink-0 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-serif text-stone-800 tracking-tight">Bookshelf</h1>
            <div className="flex items-center gap-2 mt-0.5">
               <p className="text-stone-400 text-xs">Library Pro</p>
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
                  <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 shadow-sm ${isSyncing ? 'bg-white' : 'bg-emerald-500'}`}>
                    {isSyncing ? <RefreshCw size={10} className="animate-spin text-emerald-600" /> : <CheckCircle2 size={10} className="text-white" />}
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700">Sync</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2">
                <Cloud size={16} className="text-stone-400" />
                <span className="text-xs font-bold text-stone-600">Sync Sheets</span>
              </div>
            )}
          </button>
        </div>

        <div className="relative mt-4 flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
            <input 
              type="text"
              placeholder="Search library or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
              className="w-full pl-11 pr-10 py-3 bg-stone-50 rounded-2xl text-sm border border-stone-100 focus:outline-none focus:border-stone-300 transition-all shadow-inner"
            />
          </div>
          <button onClick={handleManualSearch} className="flex items-center justify-center bg-stone-900 text-white px-5 rounded-2xl shadow-lg active:scale-95 transition-transform">
            <Search size={20} />
          </button>
        </div>

        <div className="flex mt-6 bg-stone-100 p-1 rounded-2xl">
          <button onClick={() => setActiveShelf('want-to-read')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeShelf === 'want-to-read' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}>
            <Bookmark size={14} fill={activeShelf === 'want-to-read' ? "currentColor" : "none"} />
            To Read ({books.filter(b => b.shelf === 'want-to-read').length})
          </button>
          <button onClick={() => setActiveShelf('read')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${activeShelf === 'read' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-400'}`}>
            <BookOpen size={14} fill={activeShelf === 'read' ? "currentColor" : "none"} />
            Read ({books.filter(b => b.shelf === 'read').length})
          </button>
        </div>
      </header>

      {/* Book List */}
      <main className="flex-grow overflow-y-auto px-6 py-6 no-scrollbar pb-32">
        {loadingMessage ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-stone-300" />
            <p className="text-xs font-bold animate-pulse">{loadingMessage}</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-30">
            <Library size={64} strokeWidth={1} className="mb-4" />
            <p className="text-sm font-bold">Your shelf is quiet...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onRemove={setBookToDelete}
                onToggleShelf={() => {
                  const target = book.shelf === 'read' ? 'want-to-read' : 'read';
                  setBooks(prev => prev.map(b => b.id === book.id ? {...b, shelf: target, dateRead: target === 'read' ? new Date().toISOString() : undefined} : b));
                }}
                onClick={(b) => { setSelectedBook(b); setIsEditing(false); }}
              />
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 safe-pb">
        <button onClick={() => setIsScannerOpen(true)} className="flex items-center gap-3 px-8 py-5 bg-stone-900 text-white rounded-full shadow-2xl active:scale-95 transition-transform">
          <ScanLine size={24} className="text-emerald-400" />
          <span className="font-bold text-sm tracking-wider uppercase">Scan ISBN Barcode</span>
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
            <p className="text-stone-400 text-sm mb-8">Remove "{bookToDelete.title}" from your library?</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setBooks(prev => prev.filter(b => b.id !== bookToDelete.id)); setBookToDelete(null); }} className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold shadow-lg shadow-red-100">Delete</button>
              <button onClick={() => setBookToDelete(null)} className="w-full py-4 text-stone-400 font-bold">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Book Detail Overlay (Full metadata restored) */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end">
           <div className="w-full bg-white rounded-t-[40px] p-8 max-h-[90vh] overflow-y-auto no-scrollbar safe-pb">
              <div className="w-12 h-1.5 bg-stone-200 rounded-full mx-auto mb-8" onClick={() => setSelectedBook(null)} />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex-grow">
                  {isEditing ? (
                    <div className="space-y-3 pr-4">
                      <input type="text" value={editForm.title} onChange={e => setEditForm(p => ({...p, title: e.target.value}))} placeholder="Title" className="w-full text-2xl font-serif text-stone-800 border-b border-stone-200 focus:outline-none focus:border-indigo-500 py-1" />
                      <input type="text" value={editForm.authors} onChange={e => setEditForm(p => ({...p, authors: e.target.value}))} placeholder="Authors" className="w-full text-stone-500 italic border-b border-stone-200 focus:outline-none focus:border-indigo-500 py-1 text-sm" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-serif text-stone-800 leading-tight mb-1">{selectedBook.title}</h2>
                      <p className="text-stone-500 italic text-sm">by {selectedBook.authors.join(', ')}</p>
                    </>
                  )}
                </div>
                {!isEditing && <button onClick={startEditing} className="p-2 text-stone-300"><Edit3 size={20} /></button>}
              </div>

              <div className="flex flex-col sm:flex-row gap-6 mb-8">
                 <img src={selectedBook.coverUrl} className="w-28 rounded-xl shadow-xl border border-stone-100 mx-auto sm:mx-0" />
                 <div className="flex-1 space-y-4">
                    {!isEditing && (
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(s => (
                           <button key={s} onClick={() => setBooks(prev => prev.map(b => b.id === selectedBook.id ? {...b, rating: s} : b))}><Star size={24} className={ (selectedBook.rating || 0) >= s ? 'fill-amber-400 text-amber-400' : 'text-stone-200'} /></button>
                        ))}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-2 text-stone-500 text-xs">
                       {isEditing ? (
                         <div className="space-y-2">
                            <input type="text" value={editForm.publisher} onChange={e => setEditForm(p => ({...p, publisher: e.target.value}))} placeholder="Publisher" className="w-full p-2 bg-stone-50 rounded-lg" />
                            <input type="text" value={editForm.language} onChange={e => setEditForm(p => ({...p, language: e.target.value}))} placeholder="Language" className="w-full p-2 bg-stone-50 rounded-lg" />
                            <input type="number" value={editForm.pageCount} onChange={e => setEditForm(p => ({...p, pageCount: e.target.value}))} placeholder="Pages" className="w-full p-2 bg-stone-50 rounded-lg" />
                         </div>
                       ) : (
                         <>
                            {selectedBook.publisher && <div className="flex items-center gap-2"><Building2 size={14} className="text-stone-300"/> <span>{selectedBook.publisher} ({selectedBook.publishedDate})</span></div>}
                            {selectedBook.language && <div className="flex items-center gap-2"><Globe size={14} className="text-stone-300"/> <span className="uppercase">{selectedBook.language}</span></div>}
                            {selectedBook.pageCount && <div className="flex items-center gap-2"><BookOpen size={14} className="text-stone-300"/> <span>{selectedBook.pageCount} pages</span></div>}
                         </>
                       )}
                    </div>
                 </div>
              </div>

              {selectedBook.geminiSummary && !isEditing && (
                <div className="bg-gradient-to-br from-indigo-50/50 to-stone-50 p-6 rounded-3xl mb-8 border border-indigo-100">
                   <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest mb-3"><Sparkles size={14} /> Gemini Summary</div>
                   <p className="text-sm text-stone-700 leading-relaxed font-medium">"{selectedBook.geminiSummary}"</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {isEditing ? (
                  <div className="flex gap-3">
                    <button onClick={handleSaveEdit} className="flex-1 py-4 bg-stone-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2"><Save size={18} /> Save</button>
                    <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-stone-100 text-stone-500 rounded-2xl font-bold">Cancel</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => setSelectedBook(null)} className="w-full py-5 bg-stone-900 text-white rounded-2xl font-bold shadow-xl shadow-stone-100">Close</button>
                    <button onClick={() => setBookToDelete(selectedBook)} className="w-full py-4 text-red-400 font-bold text-sm">Remove from Collection</button>
                  </>
                )}
              </div>
           </div>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="fixed inset-0 z-[60] bg-stone-50 flex flex-col safe-pt">
           <header className="px-6 py-6 flex items-center gap-4 bg-white border-b">
              <button onClick={() => setSearchResults(null)} className="p-2"><ChevronLeft /></button>
              <h2 className="text-xl font-bold font-serif">Cloud Search</h2>
           </header>
           <div className="flex-grow overflow-y-auto p-6 grid grid-cols-2 gap-4 no-scrollbar">
              {searchResults.map((res, i) => (
                <div key={i} onClick={() => handleAddBook(res)} className="bg-white p-3 rounded-2xl shadow-sm border border-stone-100 active:scale-95 transition-transform">
                   <img src={res.coverUrl} className="w-full aspect-[2/3] object-cover rounded-xl mb-3 shadow-md" />
                   <h3 className="text-xs font-bold truncate mb-1">{res.title}</h3>
                   <p className="text-[10px] text-stone-400 truncate mb-2">{res.authors?.join(', ')}</p>
                   <div className="flex justify-end"><Plus size={16} className="text-indigo-500" /></div>
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
