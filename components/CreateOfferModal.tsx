
import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Loader2, Tag, Clock, Repeat, CheckCircle, Calendar, AlertTriangle, Mic, Square } from 'lucide-react';
import { optimizeOfferDescription } from '../services/geminiService';
import { BarterOffer, UserProfile } from '../types';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddOffer: (offer: BarterOffer) => void;
  onUpdateOffer?: (offer: BarterOffer) => void;
  currentUser: UserProfile;
  editingOffer?: BarterOffer | null; // Optional prop for editing
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddOffer, 
    onUpdateOffer,
    currentUser, 
    editingOffer 
}) => {
  const [step, setStep] = useState(1);
  const [roughText, setRoughText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // Success feedback
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState(''); // Text being spoken but not finalized
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false); // Track recording state for callbacks

  const [formData, setFormData] = useState<{
      title: string;
      offeredService: string;
      requestedService: string;
      description: string;
      location: string;
      tags: string;
      durationType: 'one-time' | 'ongoing';
      expirationDate: string;
  }>({
    title: '',
    offeredService: '',
    requestedService: '',
    description: '',
    location: '',
    tags: '',
    durationType: 'one-time',
    expirationDate: ''
  });

  // Pre-fill form if editing
  useEffect(() => {
    if (editingOffer && isOpen) {
        setFormData({
            title: editingOffer.title,
            offeredService: editingOffer.offeredService,
            requestedService: editingOffer.requestedService,
            description: editingOffer.description,
            location: editingOffer.location,
            tags: editingOffer.tags.join(', '),
            durationType: editingOffer.durationType,
            expirationDate: editingOffer.expirationDate || ''
        });
        setStep(2); // Skip AI step when editing
    } else if (isOpen && !editingOffer) {
        // Reset if opening fresh
        setStep(1);
        setRoughText('');
        setFormData({
            title: '',
            offeredService: '',
            requestedService: '',
            description: '',
            location: '',
            tags: '',
            durationType: 'one-time',
            expirationDate: ''
        });
    }
  }, [editingOffer, isOpen]);

  // Cleanup speech recognition on unmount or close
  useEffect(() => {
      return () => {
          isRecordingRef.current = false;
          if (recognitionRef.current) {
              recognitionRef.current.stop();
          }
      };
  }, []);

  const toggleRecording = () => {
      if (isRecording) {
          isRecordingRef.current = false;
          recognitionRef.current?.stop();
          setIsRecording(false);
          return;
      }

      // Browser compatibility check
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert("הדפדפן שלך אינו תומך בזיהוי דיבור. נסה להשתמש ב-Chrome.");
          return;
      }

      try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'he-IL'; // Hebrew
          // Use false to process sentence-by-sentence manually, preventing duplication bugs on mobile
          recognition.continuous = false; 
          recognition.interimResults = true; 

          recognition.onstart = () => {
              setIsRecording(true);
              isRecordingRef.current = true;
              setInterimText('');
          };

          recognition.onresult = (event: any) => {
              let finalTranscript = '';
              let interimTranscript = '';

              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) {
                      finalTranscript += event.results[i][0].transcript;
                  } else {
                      interimTranscript += event.results[i][0].transcript;
                  }
              }

              if (finalTranscript) {
                  setRoughText(prev => {
                      const spacer = (prev.length > 0 && !prev.endsWith(' ')) ? ' ' : '';
                      return prev + spacer + finalTranscript.trim();
                  });
              }
              setInterimText(interimTranscript);
          };

          recognition.onerror = (event: any) => {
              // Ignore 'no-speech' errors as we restart automatically, but handle permissions
              if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                  console.error("Speech recognition error", event.error);
                  isRecordingRef.current = false;
                  setIsRecording(false);
                  alert("אין גישה למיקרופון. אנא בדוק הגדרות דפדפן.");
              }
          };

          recognition.onend = () => {
              // Manual Continuous Loop: If still "recording", restart the engine
              if (isRecordingRef.current) {
                  try {
                      recognition.start();
                  } catch (e) {
                      // Safety catch if start fails
                      setIsRecording(false);
                      isRecordingRef.current = false;
                  }
              } else {
                  setIsRecording(false);
                  setInterimText('');
              }
          };

          recognitionRef.current = recognition;
          recognition.start();
      } catch (e) {
          console.error("Failed to start recognition", e);
          setIsRecording(false);
          isRecordingRef.current = false;
      }
  };

  if (!isOpen) return null;

  // Improved Input Styles
  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl p-3.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm";

  const handleAiAssist = async () => {
    // Commit any interim text if exists before sending
    const textToSend = roughText + (interimText ? ' ' + interimText : '');
    
    if (!textToSend.trim()) return;
    setIsAiLoading(true);
    
    // Simulate parsing rough text into structured fields via Gemini
    const result = await optimizeOfferDescription(textToSend);
    
    setIsAiLoading(false);
    
    if (result) {
        setFormData(prev => ({
            ...prev,
            title: result.title,
            description: result.description,
            offeredService: result.offeredService,
            requestedService: result.requestedService,
            location: result.location || 'כל הארץ', // Default location if AI returns empty or null
            tags: result.tags.join(', '),
            // Auto-detect duration from AI, fallback to 'one-time' if unclear
            durationType: result.durationType === 'ongoing' ? 'ongoing' : 'one-time',
            expirationDate: result.expirationDate || '' // Auto-filled from AI if deadline detected
        }));
        setStep(2);
    } else {
        setFormData(prev => ({
            ...prev,
            description: textToSend,
            title: "הצעה חדשה",
            offeredService: "שירות מוצע",
            requestedService: "שירות מבוקש",
            location: "כל הארץ"
        }));
        setStep(2);
    }
  };

  const handlePublish = () => {
    const isAdmin = currentUser.role === 'admin';
    
    // Construct valid fields to avoid 'undefined' errors in Firestore
    const commonFields = {
        title: formData.title,
        offeredService: formData.offeredService,
        requestedService: formData.requestedService,
        location: formData.location || 'כל הארץ',
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        durationType: formData.durationType,
        // Only include expirationDate if one-time AND it has a value.
        // Using spread to conditionally add property.
        ...(formData.durationType === 'one-time' && formData.expirationDate ? { expirationDate: formData.expirationDate } : {})
    };

    if (editingOffer && onUpdateOffer) {
        // Update existing offer
        const updatedOffer: BarterOffer = {
            ...editingOffer,
            ...commonFields,
            // Reset ratings on edit
            ratings: [],
            averageRating: 0
        };
        
        // Explicitly remove expirationDate from object if switching to ongoing
        if (formData.durationType === 'ongoing') {
            delete (updatedOffer as any).expirationDate;
        }

        onUpdateOffer(updatedOffer);
        onClose();
    } else {
        // Create new offer
        const newOffer: BarterOffer = {
            id: Date.now().toString(),
            profileId: currentUser.id,
            profile: currentUser,
            ...commonFields,
            // Admin offers are active immediately. User offers are pending.
            status: isAdmin ? 'active' : 'pending',
            createdAt: new Date().toISOString(),
            ratings: [],
            averageRating: 0
        };
        
        onAddOffer(newOffer);
        
        // Show success message before closing (Only for users or if pending)
        if (!isAdmin) {
            setShowSuccess(true);
        } else {
            onClose();
        }
    }
  };

  if (showSuccess) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-75">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">ההצעה נשלחה לאישור!</h3>
                <p className="text-slate-600 mb-6">
                    המודעה שלך הועברה לבדיקת מנהל המערכת ותפורסם באתר לאחר אישור.
                </p>
                <button 
                    onClick={() => {
                        setShowSuccess(false);
                        onClose();
                    }}
                    className="bg-brand-600 text-white font-bold py-3 px-8 rounded-xl w-full"
                >
                    מצוין, תודה
                </button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg leading-6 font-bold text-slate-900" id="modal-title">
                    {editingOffer ? 'עריכת הצעה' : (step === 1 ? 'מה תרצה להחליף?' : 'עריכת ההצעה')}
                </h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {step === 1 ? (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        היעזר ב-AI כדי לנסח הצעה מקצועית. נא לכתוב או להקליט בשפה חופשית מה את/ה נותן/ת, מה את/ה מחפש/ת, <strong>ואם יש דד-ליין או מיקום ספציפי</strong>.
                    </p>
                    
                    <div className="relative">
                        <textarea 
                            className="w-full bg-white border border-slate-300 rounded-xl p-4 pb-10 text-slate-900 placeholder-slate-400 text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none transition-all min-h-[140px] shadow-sm"
                            placeholder='דוגמה: "אני בונה אתרים ומחפש ייעוץ משפטי עד סוף החודש בתל אביב..."'
                            value={roughText + (isRecording && interimText ? ' ' + interimText : '')}
                            onChange={(e) => {
                                setRoughText(e.target.value);
                                // If user types manually, clear interim to avoid duplication if recording resumes
                                setInterimText('');
                            }}
                        ></textarea>
                        
                        {/* Recording Button - Updated Colors (Mint Green) */}
                        <button 
                            type="button"
                            onClick={toggleRecording}
                            className={`absolute bottom-3 left-3 p-2 rounded-full transition-all shadow-sm flex items-center justify-center z-10 ${
                                isRecording 
                                ? 'bg-brand-500 text-white animate-pulse' 
                                : 'bg-slate-100 text-slate-500 hover:text-brand-600 hover:bg-brand-50 border border-slate-200'
                            }`}
                            title={isRecording ? 'עצור הקלטה' : 'הקלט הצעה קולית'}
                        >
                            {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                        </button>
                        
                        {isRecording && (
                            <span className="absolute bottom-4 left-14 text-xs text-brand-600 font-medium animate-pulse flex items-center gap-1">
                                <span className="w-2 h-2 bg-brand-500 rounded-full"></span>
                                מקליט...
                            </span>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleAiAssist}
                        disabled={(!roughText && !interimText) || isAiLoading}
                        className="w-full bg-brand-600 text-white border-2 border-brand-700 rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-all font-bold text-base shadow-sm hover:shadow-md active:scale-95"
                    >
                        {isAiLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Sparkles className="w-5 h-5" />
                        )}
                        <span>נסח ומלא פרטים אוטומטית</span>
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">או</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>
                     
                     <button 
                        onClick={() => setStep(2)}
                        className="w-full bg-white text-slate-700 border border-slate-300 rounded-xl py-3 text-sm font-bold hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
                    >
                        דלג ומלא לבד
                    </button>
                </div>
            ) : (
                <form className="space-y-4">
                    
                    {/* Duration Type Selection */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-3">סוג התקשרות</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div 
                                onClick={() => setFormData({...formData, durationType: 'one-time'})}
                                className={`cursor-pointer rounded-lg p-3 border transition-all ${
                                    formData.durationType === 'one-time' 
                                    ? 'bg-white border-brand-500 shadow-sm ring-1 ring-brand-500' 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className={`w-4 h-4 ${formData.durationType === 'one-time' ? 'text-brand-600' : 'text-slate-500'}`} />
                                    <span className={`font-bold text-sm ${formData.durationType === 'one-time' ? 'text-brand-700' : 'text-slate-700'}`}>חד פעמי</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-snug">
                                    פרויקט מוגדר בזמן (למשל: בניית אתר)
                                </p>
                            </div>

                            <div 
                                onClick={() => setFormData({...formData, durationType: 'ongoing', expirationDate: ''})}
                                className={`cursor-pointer rounded-lg p-3 border transition-all ${
                                    formData.durationType === 'ongoing' 
                                    ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' 
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Repeat className={`w-4 h-4 ${formData.durationType === 'ongoing' ? 'text-blue-600' : 'text-slate-500'}`} />
                                    <span className={`font-bold text-sm ${formData.durationType === 'ongoing' ? 'text-blue-700' : 'text-slate-700'}`}>מתמשך</span>
                                </div>
                                <p className="text-xs text-slate-500 leading-snug">
                                    ריטיינר או שירות קבוע לאורך זמן
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Expiration Date - Only visible for One-time */}
                    {formData.durationType === 'one-time' && (
                        <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                             <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                תאריך יעד לביצוע (אופציונלי)
                             </label>
                             <input 
                                type="date"
                                className={inputClassName}
                                value={formData.expirationDate}
                                onChange={(e) => setFormData({...formData, expirationDate: e.target.value})}
                                min={new Date().toISOString().split('T')[0]} // Min date is today
                             />
                             <p className="text-[10px] text-slate-500 mt-1 mr-1">
                                 המודעה תוסר אוטומטית מהלוח לאחר תאריך זה.
                             </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">כותרת ההצעה</label>
                        <input 
                            type="text" 
                            className={inputClassName}
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1.5">מה אני נותן</label>
                             <input type="text" className={inputClassName} value={formData.offeredService} onChange={(e) => setFormData({...formData, offeredService: e.target.value})} />
                        </div>
                        <div>
                             <label className="block text-xs font-bold text-slate-700 mb-1.5">מה אני מחפש</label>
                             <input type="text" className={inputClassName} value={formData.requestedService} onChange={(e) => setFormData({...formData, requestedService: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">תגיות (מופרד בפסיקים)</label>
                        <div className="relative">
                            <Tag className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                            <input 
                                type="text" 
                                className={`${inputClassName} pr-10`}
                                placeholder="לדוגמה: דיגיטל, ספורט, עיצוב"
                                value={formData.tags}
                                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">מיקום</label>
                        <input 
                            type="text" 
                            className={inputClassName}
                            placeholder="לדוגמה: תל אביב, זום, כל הארץ"
                            value={formData.location}
                            onChange={(e) => setFormData({...formData, location: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">פירוט מלא</label>
                        <textarea 
                            className={`${inputClassName} h-28 resize-none`}
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        ></textarea>
                    </div>

                    {/* Warning about rating reset on edit */}
                    {editingOffer && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
                             <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                             <p className="text-xs text-amber-800">
                                 <strong>שים לב:</strong> שמירת השינויים תאפס את הדירוגים הקיימים להצעה זו, כדי לשמור על אמינות המערכת.
                             </p>
                        </div>
                    )}

                    <button 
                        type="button" 
                        onClick={handlePublish}
                        className="w-full bg-brand-600 text-white rounded-xl py-3.5 font-bold hover:bg-brand-700 transition-colors shadow-sm mt-2"
                    >
                        {editingOffer ? 'שמור שינויים (איפוס דירוג)' : (currentUser.role === 'admin' ? 'פרסם מידית (מנהל)' : 'שלח הצעה לאישור')}
                    </button>
                </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
