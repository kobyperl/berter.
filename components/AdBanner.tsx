
import React, { useEffect, useState, useRef } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
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
  
  // Filtering Logic
  useEffect(() => {
    if (!systemAds) return;

    const filtered = systemAds.filter(ad => {
        if (!ad.isActive) return false;
        
        // 1. Global Ads always show
        if (ad.targetCategories.includes('Global')) return true;

        // 2. Context Match (Multi-category support)
        if (contextCategories.length > 0) {
            const hasContextMatch = ad.targetCategories.some(cat => contextCategories.includes(cat));
            if (hasContextMatch) return true;
        }

        // 3. Personal Targeting
        if (currentUser) {
            if (ad.targetCategories.includes(currentUser.mainField)) return true;
            if (currentUser.interests && currentUser.interests.length > 0 && ad.targetInterests && ad.targetInterests.length > 0) {
                const hasInterestOverlap = ad.targetInterests.some(interest => 
                    currentUser.interests?.some(userInterest => userInterest.includes(interest) || interest.includes(userInterest))
                );
                if (hasInterestOverlap) return true;
            }
        }
        return false;
    });

    setRelevantAds(filtered);
  }, [contextCategories, systemAds, currentUser]);

  // Continuous Auto-Scroll Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const scrollLoop = () => {
        if (scrollContainerRef.current && !isPaused && relevantAds.length > 0) {
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
  }, [relevantAds.length, isPaused]);


  const manualScroll = (direction: 'left' | 'right') => {
      if (scrollContainerRef.current) {
          const scrollAmount = 340; 
          scrollContainerRef.current.scrollBy({
              left: direction === 'left' ? -scrollAmount : scrollAmount,
              behavior: 'smooth'
          });
      }
  };

  if (relevantAds.length === 0) return null;

  return (
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
                        className="flex-shrink-0 w-full sm:w-[480px] snap-center bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden flex flex-row h-32 hover:shadow-md transition-shadow duration-300 relative"
                    >
                            {/* Animated Progress Bar indicating movement */}
                            {!isPaused && (
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
                                    <a 
                                        href={ad.linkUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-bold text-black hover:text-slate-700 flex items-center gap-1 hover:underline"
                                    >
                                        {ad.ctaText}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                    </div>
                  );
              })}
          </div>
      </div>
    </div>
  );
};
