
import React, { useState, useEffect, useRef } from 'react';
import { Filter, Search, MapPin, Clock, Repeat, X as XIcon, ArrowUpDown, LayoutGrid, List as ListIcon, ChevronUp, ChevronDown } from 'lucide-react';

interface FilterBarProps {
  keywordInput: string;
  setKeywordInput: (val: string) => void;
  locationInput: string;
  setLocationInput: (val: string) => void;
  durationFilter: 'all' | 'one-time' | 'ongoing';
  setDurationFilter: (val: 'all' | 'one-time' | 'ongoing') => void;
  sortBy: 'newest' | 'rating' | 'deadline';
  setSortBy: (val: 'newest' | 'rating' | 'deadline') => void;
  viewMode: 'grid' | 'compact';
  setViewMode: (val: 'grid' | 'compact') => void;
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  displayedCategories: string[];
  handleResetFilters: () => void;
  // We pass these to trigger the auto-scroll inside the component
  searchQuery: string;
  locationFilter: string;
  keywordFilter: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  keywordInput, setKeywordInput,
  locationInput, setLocationInput,
  durationFilter, setDurationFilter,
  sortBy, setSortBy,
  viewMode, setViewMode,
  selectedCategories, toggleCategory,
  displayedCategories, handleResetFilters,
  searchQuery, locationFilter, keywordFilter
}) => {
  const [isSticky, setIsSticky] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  
  const isStickyRef = useRef(isSticky);
  const isFilterOpenRef = useRef(isFilterOpen);
  const openStartScrollY = useRef(0);
  const lastToggleTimeRef = useRef(0);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => { isStickyRef.current = isSticky; }, [isSticky]);
  useEffect(() => { isFilterOpenRef.current = isFilterOpen; }, [isFilterOpen]);

  // Handle Sticky Logic
  useEffect(() => {
    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;
      const currentScrollY = window.scrollY;
      const stickyOffset = filterBarRef.current ? filterBarRef.current.offsetTop - 64 : 600;
      const isNowSticky = currentScrollY >= stickyOffset - 2;

      if (isNowSticky !== isStickyRef.current) {
        setIsSticky(isNowSticky);
        isStickyRef.current = isNowSticky; 
      }

      if (isNowSticky && isFilterOpenRef.current) {
          if (Date.now() - lastToggleTimeRef.current < 500) return;
          const scrollDistance = Math.abs(currentScrollY - openStartScrollY.current);
          if (scrollDistance > 60) {
              setIsFilterOpen(false);
              isFilterOpenRef.current = false;
          }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle Auto-Scroll on Filter Change
  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    const scrollToFilters = () => {
        if (!filterBarRef.current) return;
        const stickyThreshold = filterBarRef.current.offsetTop - 64;
        const targetY = stickyThreshold - 20;
        if (window.scrollY > stickyThreshold) {
            isProgrammaticScroll.current = true;
            window.scrollTo({ top: Math.max(0, targetY), behavior: 'auto' });
            openStartScrollY.current = Math.max(0, targetY);
            lastToggleTimeRef.current = Date.now();
            setTimeout(() => { isProgrammaticScroll.current = false; }, 100);
        }
    };
    setTimeout(scrollToFilters, 0);
  }, [selectedCategories, searchQuery, durationFilter, sortBy, keywordFilter, locationFilter]);

  const toggleStickyBar = () => {
      const currentScrollY = window.scrollY;
      if (isStickyRef.current || currentScrollY > 60) {
          const newState = !isFilterOpenRef.current;
          setIsFilterOpen(newState);
          isFilterOpenRef.current = newState;
          lastToggleTimeRef.current = Date.now(); 
          if (newState) openStartScrollY.current = currentScrollY;
      }
  };

  return (
    <div 
      ref={filterBarRef}
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 mb-8 sticky top-16 z-30 ${isSticky ? 'py-2 px-3 sm:px-4 cursor-pointer' : 'p-3 sm:p-6'}`}
      onClick={toggleStickyBar}
    >
        <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 items-start lg:items-center justify-between">
             <div className="flex items-center justify-between w-full lg:w-auto shrink-0">
                 <div className={`flex items-center gap-2 select-none ${isSticky ? 'flex-1 lg:flex-none' : ''}`}>
                    <div className="bg-brand-100 p-2 rounded-lg text-brand-700 shrink-0"><Filter className="w-5 h-5" /></div>
                    <span className={`font-bold text-slate-800 whitespace-nowrap ${isSticky ? 'text-sm' : ''}`}>
                        {isSticky ? 'סינון' : (
                            <>
                                <span className="lg:hidden">סינון</span>
                                <span className="hidden lg:inline">סינון הצעות</span>
                            </>
                        )}
                    </span>
                    {isSticky && <div className="text-slate-400 mr-2">{isFilterOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</div>}
                 </div>
                 <div className="flex lg:hidden items-center gap-2 overflow-x-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                     <div className="flex items-center gap-2 bg-white border border-slate-300 p-1 rounded-xl h-[42px]">
                        <div className="relative group flex items-center h-full">
                            <ArrowUpDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
                            <select className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8 pl-2 h-full outline-none appearance-none w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                                <option value="newest">מודעות חדשות</option>
                                <option value="deadline">מסתיימות בקרוב</option>
                                <option value="rating">הכי מומלצות</option>
                            </select>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 h-[42px] shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('compact')} className={`p-1.5 rounded-md transition-all ${viewMode === 'compact' ? 'bg-slate-100 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon className="w-4 h-4" /></button>
                     </div>
                 </div>
             </div>

             <div 
                className={`flex flex-col lg:flex-row gap-2 w-full lg:w-auto lg:justify-end items-center ${(!isSticky || isFilterOpen) ? 'flex' : 'hidden lg:flex'}`}
             >
                 {(!isSticky || isFilterOpen) && (
                     <div 
                        className={`flex flex-col lg:flex-row gap-2 w-full lg:w-auto items-center ${isSticky ? 'animate-in fade-in slide-in-from-top-2' : ''}`}
                     >
                         <div className="relative group w-full lg:w-44">
                             <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                                type="text" 
                                className="w-full pl-3 pr-9 h-[42px] bg-white border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none transition-all shadow-sm" 
                                placeholder="חיפוש חופשי..." 
                                value={keywordInput} 
                                onChange={(e) => setKeywordInput(e.target.value)} 
                                onClick={(e) => e.stopPropagation()} 
                            />
                         </div>
                         <div className="relative group w-full lg:w-44">
                             <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                             <input 
                                type="text" 
                                className="w-full pl-3 pr-9 h-[42px] bg-white border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none transition-all shadow-sm" 
                                placeholder="חיפוש לפי עיר..." 
                                value={locationInput} 
                                onChange={(e) => setLocationInput(e.target.value)} 
                                onClick={(e) => e.stopPropagation()} 
                            />
                         </div>
                         <div className="flex flex-row gap-2 w-full lg:w-auto">
                            <div className="flex-1 sm:flex-none flex bg-white p-1 rounded-xl border border-slate-300 justify-center h-[42px] items-center" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setDurationFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all h-full flex items-center justify-center ${durationFilter === 'all' ? 'bg-slate-100 shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>הכל</button>
                                <button onClick={() => setDurationFilter('one-time')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all h-full flex items-center justify-center gap-1 ${durationFilter === 'one-time' ? 'bg-slate-100 shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}><Clock className="w-3 h-3" /><span className="hidden xl:inline">חד פעמי</span><span className="xl:hidden">פרויקט</span></button>
                                <button onClick={() => setDurationFilter('ongoing')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all h-full flex items-center justify-center gap-1 ${durationFilter === 'ongoing' ? 'bg-slate-100 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Repeat className="w-3 h-3" /><span className="hidden xl:inline">מתמשך</span><span className="xl:hidden">ריטיינר</span></button>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleResetFilters(); }} 
                                className="flex items-center justify-center gap-1 px-3 h-[42px] text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium text-xs border border-transparent hover:border-red-200 shrink-0" 
                                title="נקה את כל הסינונים"
                            >
                                <XIcon className="w-4 h-4" />
                            </button>
                         </div>
                     </div>
                 )}

                 <div 
                    className="hidden lg:flex items-center gap-2 ml-2"
                    onClick={(e) => e.stopPropagation()} 
                 >
                     <div className="flex items-center gap-2 bg-white border border-slate-300 p-1 rounded-xl h-[42px]">
                        <div className="relative group flex items-center h-full">
                            <ArrowUpDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
                            <select className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8 pl-2 h-full outline-none appearance-none hover:text-brand-600 transition-colors" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                                <option value="newest">מודעות חדשות</option>
                                <option value="deadline">מסתיימות בקרוב</option>
                                <option value="rating">הכי מומלצות</option>
                            </select>
                        </div>
                     </div>
                     <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 h-[42px] shrink-0">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                        <button onClick={() => setViewMode('compact')} className={`p-1.5 rounded-md transition-all ${viewMode === 'compact' ? 'bg-slate-100 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon className="w-4 h-4" /></button>
                     </div>
                 </div>

             </div>
        </div>
        {(!isSticky || isFilterOpen) && (
            <div 
                className={isSticky ? 'animate-in fade-in slide-in-from-top-2' : ''}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-px bg-slate-100 my-2 sm:my-3 w-full"></div>
                <div className="relative w-full overflow-hidden">
                    <div className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide select-none">
                        <button onClick={() => toggleCategory('הכל')} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCategories.length === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>הכל</button>
                        {displayedCategories.map(category => (
                            <button key={category} onClick={() => toggleCategory(category)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-2 ${selectedCategories.includes(category) ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>{category}</button>
                        ))}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
