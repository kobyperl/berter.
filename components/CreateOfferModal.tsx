
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
  editingOffer?: BarterOffer | null; 
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddOffer, 
    onUpdateOffer,
    currentUser, 
    editingOffer 
}) => {
  // Define isAdmin in the component scope to fix the "Cannot find name 'isAdmin'" error in JSX.
  const isAdmin = currentUser?.role === 'admin';
  const [step, setStep] = useState(1);
  const [roughText, setRoughText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); 
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState(''); 
  
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false); 

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
        setStep(2);
    } else if (isOpen && !editingOffer) {
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

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          alert("הדפדפן שלך אינו תומך בזיהוי דיבור.");
          return;
      }

      try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'he-IL';
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
                  if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                  else interimTranscript += event.results[i][0].transcript;
              }
              if (finalTranscript) {
                  setRoughText(prev => {
                      const spacer = (prev.length > 0 && !prev.endsWith(' ')) ? ' ' : '';
                      return prev + spacer + finalTranscript.trim();
                  });
              }
              setInterimText(interimTranscript);
          };

          recognition.onerror = () => {
              isRecordingRef.current = false;
              setIsRecording(false);
          };

          recognition.onend = () => {
              if (isRecordingRef.current) {
                  try { recognition.start(); } catch (e) { setIsRecording(false); isRecordingRef.current = false; }
              } else {
                  setIsRecording(false);
                  setInterimText('');
              }
          };

          recognitionRef.current = recognition;
          recognition.start();
      } catch (e) {
          setIsRecording(false);
          isRecordingRef.current = false;
      }
  };

  const handleAiAssist = async () => {
    const textToSend = roughText + (interimText ? ' ' + interimText : '');
    if (!textToSend.trim()) return;
    setIsAiLoading(true);
    const result = await optimizeOfferDescription(textToSend);
    setIsAiLoading(false);
    
    if (result) {
        setFormData(prev => ({
            ...prev,
            title: result.title,
            description: result.description,
            offeredService: result.offeredService,
            requestedService: result.requestedService,
            location: result.location || 'כל הארץ',
            tags: result.tags.join(', '),
            durationType: result.durationType === 'ongoing' ? 'ongoing' : 'one-time',
            expirationDate: result.expirationDate || ''
        }));
        setStep(2);
    } else {
        setFormData(prev => ({ ...prev, description: textToSend, title: "הצעה חדשה", offeredService: "שירות מוצע", requestedService: "שירות מבוקש", location: "כל הארץ" }));
        setStep(2);
    }
  };

  const handlePublish = () => {
    // בדיקה קריטית: משתמש אורח לא יכול לפרסם
    if (!currentUser || currentUser.id === 'guest') {
        alert("נראה שיצאת מהחשבון. יש להתחבר מחדש כדי לפרסם.");
        return;
    }

    const commonFields = {
        title: formData.title,
        offeredService: formData.offeredService,
        requestedService: formData.requestedService,
        location: formData.location || 'כל הארץ',
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        durationType: formData.durationType,
        ...(formData.durationType === 'one-time' && formData.expirationDate ? { expirationDate: formData.expirationDate } : {})
    };

    if (editingOffer && onUpdateOffer) {
        const updatedOffer: BarterOffer = {
            ...editingOffer,
            ...commonFields,
            ratings: editingOffer.ratings || [],
            averageRating: editingOffer.averageRating || 0
        };
        if (formData.durationType === 'ongoing') delete (updatedOffer as any).expirationDate;
        onUpdateOffer(updatedOffer);
        onClose();
    } else {
        const newOffer: BarterOffer = {
            id: Date.now().toString(),
            profileId: currentUser.id, // שימוש ב-ID המהימן של המשתמש המחובר
            profile: currentUser,
            ...commonFields,
            status: isAdmin ? 'active' : 'pending',
            createdAt: new Date().toISOString(),
            ratings: [],
            averageRating: 0
        };
        onAddOffer(newOffer);
        if (!isAdmin) setShowSuccess(true);
        else onClose();
    }
  };

  if (showSuccess) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900 bg-opacity-75">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-600" /></div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">ההצעה נשלחה לאישור!</h3>
                <p className="text-slate-600 mb-6">המודעה שלך הועברה לבדיקת מנהל המערכת ותפורסם באתר לאחר אישור.</p>
                <button onClick={() => { setShowSuccess(false); onClose(); }} className="bg-brand-600 text-white font-bold py-3 px-8 rounded-xl w-full">מצוין, תודה</button>
            </div>
        </div>
      );
  }

  if (!isOpen) return null;
  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl p-3.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all shadow-sm";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-slate-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-xl text-right overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg leading-6 font-bold text-slate-900">{editingOffer ? 'עריכת הצעה' : (step === 1 ? 'מה תרצה להחליף?' : 'עריכת ההצעה')}</h3><button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full"><X className="w-5 h-5" /></button></div>
            {step === 1 ? (
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">היעזר ב-AI כדי לנסח הצעה מקצועית. נא לכתוב או להקליט בשפה חופשית מה את/ה נותן/ת ומה את/ה מחפש/ת.</p>
                    <div className="relative">
                        <textarea className="w-full bg-white border border-slate-300 rounded-xl p-4 pb-10 text-slate-900 text-sm focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none transition-all min-h-[140px] shadow-sm" placeholder='דוגמה: "אני בונה אתרים ומחפש ייעוץ משפטי בתל אביב..."' value={roughText + (isRecording && interimText ? ' ' + interimText : '')} onChange={(e) => { setRoughText(e.target.value); setInterimText(''); }}></textarea>
                        <button type="button" onClick={toggleRecording} className={`absolute bottom-3 left-3 p-2 rounded-full transition-all shadow-sm ${isRecording ? 'bg-brand-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:text-brand-600 border border-slate-200'}`}>{isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}</button>
                    </div>
                    <button onClick={handleAiAssist} disabled={(!roughText && !interimText) || isAiLoading} className="w-full bg-brand-600 text-white border-2 border-brand-700 rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 transition-all font-bold shadow-sm">{isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}<span>נסח ומלא פרטים אוטומטית</span></button>
                    <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-200"></div><span className="flex-shrink-0 mx-4 text-slate-400 text-xs">או</span><div className="flex-grow border-t border-slate-200"></div></div>
                    <button onClick={() => setStep(2)} className="w-full bg-white text-slate-700 border border-slate-300 rounded-xl py-3 text-sm font-bold hover:bg-slate-50 transition-colors">מלא לבד</button>
                </div>
            ) : (
                <form className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 mb-3">סוג התקשרות</label>
                        <div className="grid grid-cols-2 gap-3">
                            <div onClick={() => setFormData({...formData, durationType: 'one-time'})} className={`cursor-pointer rounded-lg p-3 border transition-all ${formData.durationType === 'one-time' ? 'bg-white border-brand-500 ring-1 ring-brand-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}><div className="flex items-center gap-2 mb-1"><Clock className={`w-4 h-4 ${formData.durationType === 'one-time' ? 'text-brand-600' : 'text-slate-500'}`} /><span className="font-bold text-sm">חד פעמי</span></div></div>
                            <div onClick={() => setFormData({...formData, durationType: 'ongoing', expirationDate: ''})} className={`cursor-pointer rounded-lg p-3 border transition-all ${formData.durationType === 'ongoing' ? 'bg-white border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}><div className="flex items-center gap-2 mb-1"><Repeat className={`w-4 h-4 ${formData.durationType === 'ongoing' ? 'text-blue-600' : 'text-slate-500'}`} /><span className="font-bold text-sm">מתמשך</span></div></div>
                        </div>
                    </div>
                    {formData.durationType === 'one-time' && (
                        <div className="animate-in fade-in slide-in-from-top-1"><label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />תאריך יעד לביצוע (אופציונלי)</label><input type="date" className={inputClassName} value={formData.expirationDate} onChange={(e) => setFormData({...formData, expirationDate: e.target.value})} min={new Date().toISOString().split('T')[0]} /></div>
                    )}
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">כותרת ההצעה</label><input type="text" className={inputClassName} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">מה אני נותן</label><input type="text" className={inputClassName} value={formData.offeredService} onChange={(e) => setFormData({...formData, offeredService: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">מה אני מחפש</label><input type="text" className={inputClassName} value={formData.requestedService} onChange={(e) => setFormData({...formData, requestedService: e.target.value})} /></div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">תגיות (מופרד בפסיקים)</label><div className="relative"><Tag className="w-4 h-4 absolute right-3 top-3 text-slate-400" /><input type="text" className={`${inputClassName} pr-10`} placeholder="לדוגמה: דיגיטל, ספורט" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} /></div></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">מיקום</label><input type="text" className={inputClassName} placeholder="לדוגמה: תל אביב, זום" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
                    <div><label className="block text-xs font-bold text-slate-700 mb-1.5">פירוט מלא</label><textarea className={`${inputClassName} h-28 resize-none`} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea></div>
                    {editingOffer && (<div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2"><AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" /><p className="text-xs text-amber-800">שמירת השינויים תאפס את הדירוגים הקיימים להצעה זו.</p></div>)}
                    <button type="button" onClick={handlePublish} className="w-full bg-brand-600 text-white rounded-xl py-3.5 font-bold hover:bg-brand-700 shadow-sm mt-2">{editingOffer ? 'שמור שינויים' : (isAdmin ? 'פרסם מידית' : 'שלח הצעה לאישור')}</button>
                </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
