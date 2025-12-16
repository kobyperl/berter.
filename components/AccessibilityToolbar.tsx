
import React, { useState, useEffect } from 'react';
import { Accessibility, X, Type, Eye, Link as LinkIcon, Sun, Moon, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

export const AccessibilityToolbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLightBackground, setIsLightBackground] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [readableFont, setReadableFont] = useState(false);

  // Apply changes to the DOM
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;

    // Font Size (Applied to HTML to leverage REM units)
    html.style.fontSize = `${fontSize}%`;

    // Grayscale
    if (isGrayscale) body.classList.add('acc-grayscale');
    else body.classList.remove('acc-grayscale');

    // High Contrast
    if (isHighContrast) body.classList.add('acc-high-contrast');
    else body.classList.remove('acc-high-contrast');

    // Light Background (Reverse Contrast)
    if (isLightBackground) body.classList.add('acc-light-bg');
    else body.classList.remove('acc-light-bg');

    // Highlight Links
    if (highlightLinks) body.classList.add('acc-highlight-links');
    else body.classList.remove('acc-highlight-links');

    // Readable Font
    if (readableFont) body.classList.add('acc-readable-font');
    else body.classList.remove('acc-readable-font');

  }, [fontSize, isGrayscale, isHighContrast, isLightBackground, highlightLinks, readableFont]);

  const resetAll = () => {
    setFontSize(100);
    setIsGrayscale(false);
    setIsHighContrast(false);
    setIsLightBackground(false);
    setHighlightLinks(false);
    setReadableFont(false);
  };

  const toggleOpen = () => setIsOpen(!isOpen);

  // Prevent closing when clicking inside the toolbar
  const handleToolbarClick = (e: React.MouseEvent) => {
      e.stopPropagation();
  };

  return (
    <>
      {/* Floating Toggle Button - Smaller size (w-12 h-12) and explicit z-index */}
      {/* "accessibility-protected-btn" class used in index.css to prevent overrides */}
      <button
        onClick={toggleOpen}
        className="accessibility-protected-btn fixed bottom-4 left-4 z-[100] bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg hover:bg-blue-700 transition-transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 flex items-center justify-center"
        aria-label="פתח תפריט נגישות"
        title="תפריט נגישות"
      >
        <Accessibility className="w-6 h-6" />
      </button>

      {/* Toolbar Menu */}
      {/* "accessibility-protected-menu" class used in index.css to prevent overrides */}
      {isOpen && (
        <div 
            className="accessibility-protected-menu fixed bottom-20 left-4 z-[100] w-72 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
            onClick={handleToolbarClick}
            role="dialog"
            aria-label="כלי נגישות"
        >
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <Accessibility className="w-4 h-4 text-blue-600" />
                    עזרים לנגישות
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar">
                
                {/* Font Size Control */}
                <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-500 block">גודל טקסט</span>
                    <div className="flex bg-slate-100 rounded-lg p-1">
                        <button 
                            onClick={() => setFontSize(prev => Math.max(100, prev - 10))}
                            className="flex-1 py-2 flex justify-center hover:bg-white rounded-md transition-colors disabled:opacity-50"
                            disabled={fontSize <= 100}
                            title="הקטן טקסט"
                        >
                            <ZoomOut className="w-5 h-5 text-slate-700" />
                        </button>
                        <div className="w-px bg-slate-200 mx-1"></div>
                        <span className="flex-1 py-2 text-center text-sm font-bold text-slate-700">{fontSize}%</span>
                        <div className="w-px bg-slate-200 mx-1"></div>
                        <button 
                            onClick={() => setFontSize(prev => Math.min(200, prev + 10))}
                            className="flex-1 py-2 flex justify-center hover:bg-white rounded-md transition-colors"
                            title="הגדל טקסט"
                        >
                            <ZoomIn className="w-5 h-5 text-slate-700" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    <button 
                        onClick={() => setIsGrayscale(!isGrayscale)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-right transition-all ${isGrayscale ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-medium">גווני אפור</span>
                    </button>

                    <button 
                        onClick={() => { setIsHighContrast(!isHighContrast); setIsLightBackground(false); }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-right transition-all ${isHighContrast ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                        <Moon className="w-4 h-4" />
                        <span className="text-xs font-medium">ניגודיות גבוהה (כהה)</span>
                    </button>

                    <button 
                        onClick={() => { setIsLightBackground(!isLightBackground); setIsHighContrast(false); }}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-right transition-all ${isLightBackground ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                        <Sun className="w-4 h-4" />
                        <span className="text-xs font-medium">רקע בהיר</span>
                    </button>

                    <button 
                        onClick={() => setHighlightLinks(!highlightLinks)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-right transition-all ${highlightLinks ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                        <LinkIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">הדגשת קישורים</span>
                    </button>

                    <button 
                        onClick={() => setReadableFont(!readableFont)}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-right transition-all ${readableFont ? 'bg-blue-50 border-blue-500 text-blue-800 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                    >
                        <Type className="w-4 h-4" />
                        <span className="text-xs font-medium">פונט קריא</span>
                    </button>
                </div>

                <div className="pt-2 border-t border-slate-100">
                    <button 
                        onClick={resetAll}
                        className="w-full flex items-center justify-center gap-2 p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-bold"
                    >
                        <RotateCcw className="w-3 h-3" />
                        אפס הגדרות
                    </button>
                </div>
            </div>
        </div>
      )}
    </>
  );
};
