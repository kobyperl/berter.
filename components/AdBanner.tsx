
import React, { useEffect, useState, useRef } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SystemAd, UserProfile } from '../types';

interface AdBannerProps {
  contextCategories: string[]; // Changed from single string to array
  systemAds: SystemAd[];
  currentUser: UserProfile | null;
}

export const AdBanner: React.FC<AdBannerProps> = ({ contextCategories, systemAds, currentUser }) => {
  const [relevantAds, setRelevantAds] = useState<SystemAd[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // State for the Expanded Ad Modal
  const [expandedAd, setExpandedAd] = useState<SystemAd | null>(null);
  
  // Filtering & Sorting Logic
  useEffect(() => {
    if (!systemAds) return;

    // 1. Filter: Determine which ads are eligible to be shown at all
    const filtered = systemAds.filter(ad => {
        if (!ad.isActive) return false;
        
        // Always show Global
        if (ad.targetCategories.includes('Global')) return true;

        // Show if matches Context (Search filters)
        if (contextCategories.length > 0) {
            const hasContextMatch = ad.targetCategories.some(cat => contextCategories.includes(cat));
            if (hasContextMatch) return true;
        }

        // Show if matches User Profile
        if (currentUser) {
            // Match Profession (Usage Category)
            if (ad.targetCategories.includes(currentUser.mainField)) return true;
            
            // Match Interests (Subject Category)
            if (ad.targetInterests && ad.targetInterests.length > 0 && currentUser.interests) {
                const hasInterestOverlap = ad.targetInterests.some(interest => 
                    currentUser.interests?.some(userInterest => userInterest.includes(interest) || interest.includes(userInterest))
                );
                if (hasInterestOverlap) return true;
            }
        }
        return false;
    });

    // 2. Sort: Explicit Priority Order
    // Priority 1: Usage Category (Profession) - Score 30
    // Priority 2: Subject Category (Interests) - Score 20
    // Priority 3: General (Global) - Score 10
    const sorted = filtered.sort((a, b) => {
        const getPriorityScore = (ad: SystemAd) => {
            let score = 0; 

            // Base Score: Global (General)
            if (ad.targetCategories.includes('Global')) {
                score = 10;
            }

            if (currentUser) {
                // Higher Score: Subject Category (Interests)
                if (ad.targetInterests && ad.targetInterests.length > 0 && currentUser.interests) {
                     const hasInterestOverlap = ad.targetInterests.some(interest => 
                        currentUser.interests?.some(userInterest => userInterest.includes(interest) || interest.includes(userInterest))
                    );
                    if (hasInterestOverlap) {
                        score = 20; // Overrides Global
                    }
                }

                // Highest Score: Usage Category (Profession)
                if (ad.targetCategories.includes(currentUser.mainField)) {
                    score = 30; // Overrides Interest & Global
                }
            }
            
            return score;
        };

        // Sort descending (30 -> 20 -> 10 -> 0)
        return getPriorityScore(b) - getPriorityScore(a);
    });

    setRelevantAds(sorted);
  }, [contextCategories, systemAds, currentUser]);

  // Continuous Auto-Scroll Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const scrollLoop = () => {
        if (scrollContainerRef.current && !isPaused && relevantAds.length > 0 && !expandedAd) {
            const container = scrollContainerRef.current;
            const maxScrollLeft = container.scrollWidth - container.clientWidth;
            const cardWidth = 340; 
            
            // RTL Handling: in some browsers scrollLeft is negative or 0 is rightmost.
            // We use standard positive logic and check tolerance.
            
            if (Math.abs(container.scrollLeft) >= maxScrollLeft - 10) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                 container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
            }
        }
    };

    if (relevantAds.length > 0) {
        intervalId = setInterval(scrollLoop, 3500);
    }

    return () => clearInterval(intervalId);
  }, [relevantAds.length, isPaused, expandedAd]);


  const manualScroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
          const scrollAmount = 340; 
          scrollContainerRef.current.scrollBy({
              left: direction === 'left' ? -scrollAmount : scrollAmount,
              behavior: 'smooth'
          });
      }
  };

  const handleOpenLink = (url: string) => {
      window.open(url, '_blank');
  };

  if (relevantAds.length === 0) return null;

  return (
    <>
        <div 
            className="w-full my-6 relative group"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl opacity-50 -z-10"></div>

        <div className="relative z-10 px-2 sm:px-0">
            
            {relevantAds.length > 1 && (
                <>
                    <button 
                        onClick={() => manualScroll('right')}
                        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-8 h-8 bg-white shadow-md rounded-full items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => manualScroll('left')}
                        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-8 h-8 bg-white shadow-md rounded-full items-center justify-center text-slate-500 hover:text-slate-800 hover:scale-105 transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                </>
            )}

            <div 
                ref={scrollContainerRef}
                className="flex overflow-x-auto gap-4 pb-2 px-1 snap-x snap-mandatory no-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
            >
                {relevantAds.map((ad) => {
                    return (
                        <div 
                            key={ad.id} 
                            onClick={() => setExpandedAd(ad)}
                            className="flex-shrink-0 w-full sm:w-[480px] snap-center bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden flex flex-row h-32 hover:shadow-md transition-shadow duration-300 relative cursor-pointer"
                        >
                                {/* Animated Progress Bar indicating movement */}
                                {!isPaused && !expandedAd && (
                                    <div className="absolute bottom-0 left-0 h-0.5 bg-brand-400 z-20 animate-[progress_3.5s_linear_infinite] w-full origin-right opacity-50"></div>
                                )}

                                <div className="w-32 sm:w-40 h-full relative overflow-hidden flex-shrink-0">
                                    <img 
                                        src={ad.imageUrl} 
                                        alt={ad.title} 
                                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>

                                <div className="flex-1 p-3 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">{ad.title}</h3>
                                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{ad.description}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {ad.subLabel || ''}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation(); // Stop banner click from opening modal if clicking direct link
                                                handleOpenLink(ad.linkUrl);
                                            }}
                                            className="text-xs font-bold text-black hover:text-slate-700 flex items-center gap-1 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                        >
                                            {ad.ctaText}
                                            <ExternalLink className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                        </div>
                    );
                })}
            </div>
        </div>
        </div>

        {/* Expanded Ad Modal */}
        {expandedAd && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
                {/* Backdrop - Click to Close */}
                <div 
                    className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
                    onClick={() => setExpandedAd(null)}
                />
                
                {/* Modal Content - Click to Open Link */}
                <div 
                    className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 cursor-pointer group"
                    onClick={() => handleOpenLink(expandedAd.linkUrl)}
                >
                    {/* Close Button - Stop Propagation so it doesn't open link */}
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpandedAd(null);
                        }}
                        className="absolute top-3 left-3 z-20 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Square Image */}
                    <div className="aspect-square w-full relative overflow-hidden bg-slate-100">
                        <img 
                            src={expandedAd.imageUrl} 
                            alt={expandedAd.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                        
                        {expandedAd.subLabel && (
                             <span className="absolute top-4 right-4 bg-black/30 backdrop-blur-md text-white text-xs px-2 py-1 rounded-lg border border-white/10">
                                {expandedAd.subLabel}
                             </span>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="p-6 text-center relative -mt-10 z-10">
                        <div className="bg-white rounded-xl p-6 shadow-lg border border-slate-100">
                             <h3 className="text-2xl font-bold text-slate-900 mb-3">{expandedAd.title}</h3>
                             <p className="text-slate-600 mb-6 leading-relaxed text-sm">
                                {expandedAd.description}
                             </p>
                             
                             <button className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 text-lg">
                                {expandedAd.ctaText}
                                <ExternalLink className="w-5 h-5" />
                             </button>
                             <p className="text-xs text-slate-400 mt-3 animate-pulse">
                                לחץ כאן למעבר לאתר
                             </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};
