
import React, { useState, useEffect } from 'react';
import { Tag, Save, CheckCircle, Search, Plus, X, Briefcase, Heart, Lightbulb, EyeOff, RotateCcw } from 'lucide-react';
import { BarterOffer, TagMapping } from '../types';
import { db } from '../services/firebaseConfig';
import firebase from '../services/firebaseConfig';

interface TagManagerProps {
  offers: BarterOffer[];
  availableCategories: string[]; // Occupations (Blue)
  availableInterests: string[]; // Interests (Green)
  onAddCategory: (category: string) => void;
  onAddInterest: (interest: string) => void;
}

export const TagManager: React.FC<TagManagerProps> = ({ 
    offers, 
    availableCategories, 
    availableInterests,
    onAddCategory,
    onAddInterest
}) => {
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagMappings, setTagMappings] = useState<Record<string, TagMapping>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Selection State
  const [selectedOccupations, setSelectedOccupations] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newCatInput, setNewCatInput] = useState('');
  const [newIntInput, setNewIntInput] = useState('');

  // Fetch mappings on mount
  useEffect(() => {
    const fetchMappings = async () => {
      try {
        const doc = await db.collection('system').doc('taxonomy').get();
        if (doc.exists) {
          const data = doc.data();
          setTagMappings(data?.tagMappings || {});
        }
      } catch (error) {
        console.error("Error fetching tag mappings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMappings();
  }, []);

  // Calculate tags list (Mapped vs Unmapped)
  useEffect(() => {
    if (isLoading) return;
    const uniqueTags = new Set<string>();
    offers.forEach(offer => {
      [...(offer.giving_tags || []), ...(offer.receiving_tags || []), ...(offer.tags || [])].forEach(t => {
        if (t && t.trim()) uniqueTags.add(t.trim());
      });
    });
    setAllTags(Array.from(uniqueTags).sort());
  }, [offers, isLoading]);

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    const existing = tagMappings[tag];
    if (existing) {
        setSelectedOccupations(existing.mappedCategories || []);
        setSelectedInterests(existing.mappedInterests || []);
    } else {
        setSelectedOccupations([]);
        setSelectedInterests([]);
    }
  };

  const toggleOccupation = (cat: string) => {
    setSelectedOccupations(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const toggleInterest = (int: string) => {
    setSelectedInterests(prev => prev.includes(int) ? prev.filter(i => i !== int) : [...prev, int]);
  };

  const handleSaveMapping = async () => {
    if (!selectedTag) return;

    try {
      const mappingData: TagMapping = {
          tagName: selectedTag,
          mappedCategories: selectedOccupations,
          mappedInterests: selectedInterests,
          isHidden: false
      };

      const newMappings = { ...tagMappings, [selectedTag]: mappingData };
      
      await db.collection('system').doc('taxonomy').update({
        tagMappings: newMappings
      });
      
      setTagMappings(newMappings);
      setSelectedTag(null);
    } catch (error) {
      console.error("Error saving mapping:", error);
      alert("שגיאה בשמירת המיפוי");
    }
  };

  const handleHideTag = async () => {
      if (!selectedTag) return;
      if (!window.confirm(`האם להסתיר את התגית "${selectedTag}" ממסך הניהול? (היא עדיין תופיע בהצעות מקוריות)`)) return;

      try {
          const mappingData: TagMapping = {
              tagName: selectedTag,
              mappedCategories: [],
              mappedInterests: [],
              isHidden: true
          };
          const newMappings = { ...tagMappings, [selectedTag]: mappingData };
          await db.collection('system').doc('taxonomy').update({
              tagMappings: newMappings
          });
          setTagMappings(newMappings);
          setSelectedTag(null);
      } catch (error) {
          console.error("Error hiding tag:", error);
      }
  };

  const handleUnhideTag = async (tag: string) => {
      try {
          const mappingData: TagMapping = {
              tagName: tag,
              mappedCategories: [],
              mappedInterests: [],
              isHidden: false
          };
          const newMappings = { ...tagMappings, [tag]: mappingData };
          await db.collection('system').doc('taxonomy').update({
              tagMappings: newMappings
          });
          setTagMappings(newMappings);
          handleSelectTag(tag); // Select it after unhiding
      } catch (error) { console.error(error); }
  };

  const handleAddNewOccupation = () => {
      const val = newCatInput.trim();
      if(val && !availableCategories.includes(val)) {
          onAddCategory(val);
          toggleOccupation(val);
          setNewCatInput('');
      }
  };

  const handleAddNewInterest = () => {
      const val = newIntInput.trim();
      if(val && !availableInterests.includes(val)) {
          onAddInterest(val);
          toggleInterest(val);
          setNewIntInput('');
      }
  };

  // Inheritance Logic (Find similar tag)
  const getSuggestion = (tag: string) => {
    const mappedTags = Object.keys(tagMappings);
    // Simple substring match for "Smart Suggestion" - exclude self and hidden
    const match = mappedTags.find(mapped => 
      (tag.includes(mapped) || mapped.includes(tag)) && 
      tag !== mapped &&
      !tagMappings[mapped].isHidden &&
      (tagMappings[mapped].mappedCategories?.length > 0 || tagMappings[mapped].mappedInterests?.length > 0)
    );
    return match;
  };

  const handleInherit = (sourceTag: string) => {
    const sourceMap = tagMappings[sourceTag];
    if (sourceMap) {
      setSelectedOccupations(sourceMap.mappedCategories || []);
      setSelectedInterests(sourceMap.mappedInterests || []);
    }
  };

  const filteredTags = allTags.filter(t => {
      // Allow searching for hidden tags to unhide them if explicitly searched
      if (tagMappings[t]?.isHidden && searchTerm && t.includes(searchTerm)) return true;
      if (tagMappings[t]?.isHidden) return false;
      return t.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden relative">
      
      {/* Left Column: Tag List */}
      <div className={`w-full md:w-1/3 flex flex-col border-l border-slate-200 bg-white h-full ${selectedTag ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0">
            <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text" 
                    className="w-full bg-white border border-slate-300 rounded-xl pl-3 pr-10 py-3 text-sm focus:outline-none focus:border-indigo-500 shadow-sm"
                    placeholder="חפש תגית..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2 min-h-0 pb-4 md:pb-2 overscroll-contain">
            {filteredTags.length === 0 && (
                <div className="text-center py-10 text-slate-400">אין תגיות להצגה</div>
            )}
            {filteredTags.map(tag => {
                const mapping = tagMappings[tag];
                const isHidden = mapping?.isHidden;
                const isMapped = mapping && !isHidden && (mapping.mappedCategories?.length > 0 || mapping.mappedInterests?.length > 0);
                
                return (
                    <div 
                        key={tag} 
                        onClick={() => isHidden ? handleUnhideTag(tag) : handleSelectTag(tag)}
                        className={`p-3 rounded-lg cursor-pointer transition-all border flex justify-between items-center ${
                            selectedTag === tag 
                            ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-200' 
                            : isMapped 
                                ? 'bg-indigo-50/30 border-indigo-100 text-slate-600' 
                                : isHidden 
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 italic'
                                    : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm'
                        }`}
                    >
                        <span className={`font-bold text-sm ${isMapped ? 'opacity-80' : ''}`}>{tag} {isHidden && '(מוסתר)'}</span>
                        {isMapped && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {isHidden && <EyeOff className="w-4 h-4 text-slate-400" />}
                    </div>
                );
            })}
        </div>
      </div>

      {/* Right Column: Work Area */}
      <div className={`flex-1 flex flex-col bg-slate-50 relative h-full ${!selectedTag ? 'hidden md:flex' : 'flex'}`}>
         {selectedTag ? (
             <div className="flex flex-col h-full w-full">
                 {/* Mobile Header */}
                 <div className="md:hidden p-4 bg-white border-b border-slate-200 flex items-center gap-3 shrink-0">
                     <button onClick={() => setSelectedTag(null)} className="p-2 bg-slate-100 rounded-full"><X className="w-5 h-5"/></button>
                     <span className="font-bold text-lg">{selectedTag}</span>
                 </div>

                 <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 min-h-0 pb-24 md:pb-8">
                     
                     <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                             <h2 className="text-2xl font-black text-slate-800 hidden md:block">{selectedTag}</h2>
                             {tagMappings[selectedTag]?.isHidden && <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded">מוסתר</span>}
                         </div>
                         <button 
                            onClick={handleHideTag}
                            className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                         >
                             <EyeOff className="w-4 h-4" />
                             הסתר תגית (Blacklist)
                         </button>
                     </div>

                     {/* Suggestion Box */}
                     {getSuggestion(selectedTag) && (
                         <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2">
                             <div className="flex items-center gap-3">
                                 <Lightbulb className="w-5 h-5 text-amber-500" />
                                 <div className="text-xs text-amber-800">
                                     <strong>הצעה חכמה:</strong> זוהה דמיון לתגית "{getSuggestion(selectedTag)}".
                                 </div>
                             </div>
                             <button 
                                 onClick={() => handleInherit(getSuggestion(selectedTag)!)}
                                 className="text-amber-700 bg-white border border-amber-300 px-4 py-2 rounded-lg text-xs font-bold hover:bg-amber-100"
                             >
                                 העתק הגדרות
                             </button>
                         </div>
                     )}

                     {/* Occupations (Blue) */}
                     <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm">
                         <h4 className="text-blue-800 font-bold flex items-center gap-2 mb-4">
                             <Briefcase className="w-5 h-5" />
                             שיוך למקצועות (Occupations)
                         </h4>
                         <div className="flex flex-wrap gap-2 mb-4">
                             {availableCategories.map(cat => (
                                 <button
                                     key={cat}
                                     onClick={() => toggleOccupation(cat)}
                                     className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                         selectedOccupations.includes(cat)
                                         ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
                                         : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50'
                                     }`}
                                 >
                                     {cat}
                                 </button>
                             ))}
                         </div>
                         <div className="flex gap-2">
                             <input 
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="צור מקצוע חדש..."
                                value={newCatInput}
                                onChange={e => setNewCatInput(e.target.value)}
                             />
                             <button onClick={handleAddNewOccupation} disabled={!newCatInput.trim()} className="bg-blue-100 text-blue-700 px-4 rounded-lg font-bold disabled:opacity-50 hover:bg-blue-200 transition-colors"><Plus className="w-5 h-5"/></button>
                         </div>
                     </div>

                     {/* Interests (Green) */}
                     <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm">
                         <h4 className="text-green-800 font-bold flex items-center gap-2 mb-4">
                             <Heart className="w-5 h-5" />
                             שיוך לתחומי עניין (Interests)
                         </h4>
                         <div className="flex flex-wrap gap-2 mb-4">
                             {availableInterests.map(int => (
                                 <button
                                     key={int}
                                     onClick={() => toggleInterest(int)}
                                     className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                                         selectedInterests.includes(int)
                                         ? 'bg-green-600 text-white border-green-600 shadow-md transform scale-105'
                                         : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-green-50'
                                     }`}
                                 >
                                     {int}
                                 </button>
                             ))}
                         </div>
                         <div className="flex gap-2">
                             <input 
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                placeholder="צור תחום עניין חדש..."
                                value={newIntInput}
                                onChange={e => setNewIntInput(e.target.value)}
                             />
                             <button onClick={handleAddNewInterest} disabled={!newIntInput.trim()} className="bg-green-100 text-green-700 px-4 rounded-lg font-bold disabled:opacity-50 hover:bg-green-200 transition-colors"><Plus className="w-5 h-5"/></button>
                         </div>
                     </div>

                 </div>

                 {/* Footer Action - Fixed Bottom */}
                 <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 absolute bottom-0 left-0 right-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                     <button onClick={() => setSelectedTag(null)} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-colors hidden md:block">ביטול</button>
                     <button 
                         onClick={handleSaveMapping}
                         className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                     >
                         <Save className="w-5 h-5" />
                         שמור הגדרות
                     </button>
                 </div>
             </div>
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                 <div className="bg-white p-6 rounded-full mb-6 shadow-sm">
                     <Tag className="w-16 h-16 text-indigo-200" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-600 mb-2">מערכת ניהול תגיות</h3>
                 <p className="max-w-md">בחר תגית מהרשימה בצד ימין כדי למפות אותה לקטגוריות (מקצועות) או תחומי עניין.</p>
             </div>
         )}
      </div>
    </div>
  );
};
