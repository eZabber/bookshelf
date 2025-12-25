
import React from 'react';
import { Book } from '../types';
// Fixed: Added Clock to imports
import { Calendar, Trash2, CheckCircle, Bookmark, Star, BookText, Building2, Globe, Tag, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface BookCardProps {
  book: Book;
  onRemove: (id: string) => void;
  onToggleShelf: (id: string) => void;
  onClick: (book: Book) => void;
}

const BookCard: React.FC<BookCardProps> = ({ book, onRemove, onToggleShelf, onClick }) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(book.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleShelf(book.id);
  };

  return (
    <div 
      className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-stone-100 active:scale-[0.98] transition-all relative group cursor-pointer"
      onClick={() => onClick(book)}
    >
      <div className="relative flex-shrink-0 w-24 h-36 rounded-lg overflow-hidden shadow-md bg-stone-100">
        <img 
          src={book.coverUrl} 
          alt={book.title} 
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {book.shelf === 'read' && (
          <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-1 shadow-sm border border-white/20">
            <CheckCircle size={14} />
          </div>
        )}
      </div>

      <div className="flex flex-col flex-grow min-w-0">
        <div className="mb-2">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-stone-800 leading-tight truncate text-sm sm:text-base flex-1">{book.title}</h3>
            {book.rating ? (
              <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-lg border border-amber-100 shrink-0">
                <Star size={10} className="fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-700">{book.rating}</span>
              </div>
            ) : null}
          </div>
          <p className="text-xs text-stone-500 truncate mt-0.5">by {book.authors.join(', ')}</p>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
          {book.publisher && (
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 truncate">
              <Building2 size={12} className="shrink-0 text-stone-300" />
              <span className="truncate">{book.publisher}</span>
            </div>
          )}
          {book.publishedDate && (
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 truncate">
              <Calendar size={12} className="shrink-0 text-stone-300" />
              <span>{book.publishedDate}</span>
            </div>
          )}
          {book.pageCount && (
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 truncate">
              <BookText size={12} className="shrink-0 text-stone-300" />
              <span>{book.pageCount} pgs</span>
            </div>
          )}
          {book.language && (
            <div className="flex items-center gap-1.5 text-[10px] text-stone-400 truncate uppercase">
              <Globe size={12} className="shrink-0 text-stone-300" />
              <span>{book.language}</span>
            </div>
          )}
        </div>

        {book.categories && book.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {book.categories.slice(0, 2).map((cat, idx) => (
              <span key={idx} className="px-1.5 py-0.5 bg-stone-50 border border-stone-100 text-stone-400 text-[9px] font-medium rounded-md uppercase tracking-wider truncate max-w-[80px]">
                {cat}
              </span>
            ))}
            {book.categories.length > 2 && <span className="text-[9px] text-stone-300">+{book.categories.length - 2}</span>}
          </div>
        )}
        
        <div className="mt-auto flex items-end justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-[9px] text-stone-400 font-medium uppercase tracking-tight">
              {/* Fixed: Clock icon is now correctly imported */}
              <Clock size={10} />
              <span>Added {format(new Date(book.dateAdded), 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div className="flex gap-2">
             <button 
              onClick={handleToggle}
              className={`p-2 rounded-xl transition-all active:scale-90 ${book.shelf === 'read' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-600'}`}
              title={book.shelf === 'read' ? 'Move to To-Read' : 'Mark as Finished'}
            >
              {book.shelf === 'read' ? <Bookmark size={18} /> : <CheckCircle size={18} />}
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 bg-stone-50 text-stone-300 hover:text-red-400 rounded-xl transition-all active:scale-90"
              title="Delete Book"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
