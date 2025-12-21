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
    isOpen, onClose, onAddOffer, onUpdateOffer, currentUser, editingOffer 
}) => {
  const [step, setStep] = useState(1);
  const [roughText, setRoughText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);

  const [formData, setFormData] = useState<{
      title: string; offeredService: string; requestedService: string; description: string; location: string; tags: string; durationType: 'one-time' | 'ongoing'; expirationDate: string;
  }>({
    title: '', offeredService: '', requestedService: '', description: '', location: '', tags: '', durationType: 'one-time', expirationDate: ''
  });

  useEffect(() => {
    if (editingOffer && isOpen) {
        setFormData({
            title: editingOffer.title, offeredService: editingOffer.offeredService, requestedService: editingOffer.requestedService,
            description: editingOffer.description, location: editingOffer.location, tags: editingOffer.tags.join(', '),
            durationType: editingOffer.durationType, expirationDate: editingOffer.expirationDate || ''
        });
        setStep(2);
    } else if (isOpen && !editingOffer) {
        setStep(1); setRoughText('');
        setFormData({ title: '', offeredService: '', requestedService: '', description: '', location: '', tags: '', durationType: 'one-time', expirationDate: '' });
    }
  }, [editingOffer, isOpen]);

  useEffect(() => {
      return () => { isRecordingRef.current = false; recognitionRef.current?.stop(); };
  }, []);

  const toggleRecording = () => {
      if (isRecording) { isRecordingRef.current = false; recognitionRef.current?.stop(); setIsRecording(false); return; }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) { alert("הדפדפן שלך אינו תומך בזיהוי דיבור."); return; }
      try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'he-IL'; recognition.continuous = false; recognition.interimResults = true; 
          recognition.onstart = () => { setIsRecording(true); isRecordingRef.current = true; setInterimText(''); };
          recognition.onresult = (event: any) => {
              let finalTranscript = ''; let interimTranscript = '';
              for (let i = event.resultIndex; i < event.results.length; ++i) {
                  if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                  else interimTranscript += event.results[i][0].transcript;
              }
              if (finalTranscript) setRoughText(prev => (prev.length > 0 && !prev.endsWith(' ')) ? prev + ' ' + finalTranscript.trim() : prev + finalTranscript.trim());
              setInterimText(interimTranscript);
          };
          recognition.onerror = (e: any) => { if (e.error === 'not-allowed') alert("אין גישה למיקרופון."); setIsRecording(false); isRecordingRef.current = false; };
          recognition.onend = () => { if (isRecordingRef.current) try { recognition.start(); } catch (e) { setIsRecording(false); isRecordingRef.current = false; } else { setIsRecording(false); setInterimText(''); } };
          recognitionRef.current = recognition; recognition.start();
      } catch (e) { setIsRecording(false); isRecordingRef.current = false; }
  };

  if (!isOpen) return null;

  const inputClassName = "w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl p-3.5 text-sm focus:border-brand-500 outline-none transition-all shadow-sm focus:ring-2 focus:ring-brand-50";

  const handleAiAssist = async () => {
    const textToSend = roughText + (interimText ? ' ' + interimText : '');
    if (!textToSend.trim()) return;
    setIsAiLoading(true);
    try {
        const result = await optimizeOfferDescription(textToSend);
        if (result) {
            setFormData(prev => ({ 
                ...prev, 
                title: result.title || '', 
                description: result.description || textToSend, 
                offeredService: result.offeredService || '', 
                requestedService: result.requestedService || '', 
                location: result.location || 'כל הארץ', 
                tags: Array.isArray(result.tags) ? result.tags.join(', ') : (result.tags || ''), 
                durationType: result.durationType === 'ongoing' ? 'ongoing' : 'one-time', 
                expirationDate: result.expirationDate || '' 
            }));
            setStep(2);
        } else {
            // Fallback if result is null but request completed
            setFormData(prev => ({ ...prev, description: textToSend, title: "הצעה חדשה", offeredService: "שירות מוצע", requestedService: "שירות מבוקש", location: "כל הארץ" }));
            setStep(2);
        }
    } catch (err) {
        console.error("AI Assistant Error:", err);
        setFormData(prev => ({ ...prev, description: textToSend, title: "הצעה חדשה" }));
        setStep(2);
    } finally {
        setIsAiLoading(false);
    }
  };

  const handlePublish = () => {
    const isAdmin = currentUser.role === 'admin';
    const commonFields = { title: formData.title, offeredService: formData.offeredService, requestedService: formData.requestedService, location: formData.location || 'כל הארץ', description: formData.description, tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean), durationType: formData.durationType, ...(formData.durationType === 'one-time' && formData.expirationDate ? { expirationDate: formData.expirationDate } : {}) };
    if (editingOffer && onUpdateOffer) {
        const updatedOffer: BarterOffer = { ...editingOffer, ...commonFields, ratings: [], averageRating: 0 };
        if (formData.durationType === 'ongoing') delete (updatedOffer as any).expirationDate;
        onUpdateOffer(updatedOffer); onClose();
    } else {
        const newOffer: BarterOffer = { id: Date.now().toString(), profileId: currentUser.id, profile: currentUser, ...commonFields, status: isAdmin ? 'active' : 'pending', createdAt: new Date().toISOString(), ratings: [], averageRating: 0 };
        onAddOffer(newOffer); if (!isAdmin) setShowSuccess(true); else onClose();
    }
  };

  if (showSuccess) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-2 sm:p-3">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center animate-in zoom-in shadow-2xl">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-600" /></div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">נשלח לאישור!</h3>
                <p className="text-slate-600 mb-6 text-sm">המודעה תפורסם באתר לאחר אישור מנהל.</p>
                <button onClick={() => { setShowSuccess(false); onClose(); }} className="bg-brand-600 text-white font-bold py-3 px-8 rounded-xl w-full shadow-lg">מעולה</button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="inline-block bg-white rounded-2xl text-right overflow-hidden shadow-2xl transform transition-all w-full max-w-lg relative z-10 max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-white shrink-0">
                <h3 className="text-lg font-bold text-slate-900">{editingOffer ? 'עריכת הצעה' : (step === 1 ? 'מה תרצה להחליף?' : 'עריכת פרטים')}</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-5 sm:p-8 bg-white overflow-y-auto custom-scrollbar flex-1">
                {step === 1 ? (
                    <div className="space-y-6">
                        <p className="text-sm text-slate-600 leading-relaxed">היעזר ב-AI כדי לנסח הצעה מקצועית. כתוב או הקלט בשפה חופשית מה את/ה נותן/ת ומה את/ה מחפש/ת.</p>
                        <div className="relative">
                            <textarea className="w-full bg-white border border-slate-300 rounded-xl p-4 pb-12 text-sm focus:border-brand-500 outline-none transition-all min-h-[140px] shadow-sm" placeholder='דוגמה: "אני בונה אתרים ומחפש ייעוץ משפטי לעסק שלי..."' value={roughText + (isRecording && interimText ? ' ' + interimText : '')} onChange={(e) => { setRoughText(e.target.value); setInterimText(''); }}></textarea>
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                {isRecording && <span className="text-[10px] text-brand-600 font-bold animate-pulse">מקליט...</span>}
                                <button type="button" onClick={toggleRecording} className={`p-2.5 rounded-full shadow-sm transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-500 hover:text-brand-600 border border-slate-200'}`}>{isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}</button>
                            </div>
                        </div>
                        <button type="button" onClick={handleAiAssist} disabled={(!roughText && !interimText) || isAiLoading} className="w-full bg-brand-600 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-brand-700 disabled:opacity-50 font-bold shadow-md transition-all active:scale-95">{isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} ייעל הצעה בעזרת AI</button>
                        <div className="relative flex py-2 items-center"><div className="flex-grow border-t border-slate-200"></div><span className="mx-4 text-slate-400 text-xs font-medium">או</span><div className="flex-grow border-t border-slate-200"></div></div>
                        <button type="button" onClick={() => setStep(2)} className="w-full bg-white text-slate-700 border border-slate-200 rounded-xl py-3 text-sm font-bold shadow-sm hover:bg-white transition-colors">דלג ומלא לבד</button>
                    </div>
                ) : (
                    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                        <div className="bg-white p-4 rounded-xl border border-slate-200"><label className="block text-xs font-bold text-slate-700 mb-3">סוג ההתקשרות</label><div className="grid grid-cols-2 gap-3"><div onClick={() => setFormData({...formData, durationType: 'one-time'})} className={`cursor-pointer rounded-lg p-3 border transition-all text-center ${formData.durationType === 'one-time' ? 'bg-white border-brand-500 shadow-sm ring-1 ring-brand-500' : 'bg-white border-slate-200 opacity-60'}`}><Clock className="w-4 h-4 mx-auto mb-1 text-slate-400" /><span className="text-xs font-bold">חד פעמי</span></div><div onClick={() => setFormData({...formData, durationType: 'ongoing', expirationDate: ''})} className={`cursor-pointer rounded-lg p-3 border transition-all text-center ${formData.durationType === 'ongoing' ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-slate-200 opacity-60'}`}><Repeat className="w-4 h-4 mx-auto mb-1 text-slate-400" /><span className="text-xs font-bold">מתמשך</span></div></div></div>
                        {formData.durationType === 'one-time' && (
                            <div className="animate-in fade-in slide-in-from-top-1"><label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> תאריך יעד (אופציונלי)</label><input type="date" className={inputClassName} value={formData.expirationDate} onChange={(e) => setFormData({...formData, expirationDate: e.target.value})} min={new Date().toISOString().split('T')[0]} /></div>
                        )}
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">כותרת ההצעה</label><input type="text" className={inputClassName} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-bold text-slate-700 mb-1.5">מה אני נותן</label><input type="text" className={inputClassName} value={formData.offeredService} onChange={(e) => setFormData({...formData, offeredService: e.target.value})} /></div>
                            <div><label className="block text-xs font-bold text-slate-700 mb-1.5">מה אני מחפש</label><input type="text" className={inputClassName} value={formData.requestedService} onChange={(e) => setFormData({...formData, requestedService: e.target.value})} /></div>
                        </div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">תגיות (מופרד בפסיקים)</label><div className="relative"><Tag className="w-4 h-4 absolute right-3 top-3 text-slate-400" /><input type="text" className={`${inputClassName} pr-10`} placeholder="למשל: בניית אתרים, וורדפרס" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} /></div></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">מיקום (עיר או 'זום')</label><input type="text" className={inputClassName} placeholder="למשל: תל אביב" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1.5">תיאור מלא</label><textarea className={`${inputClassName} h-24 resize-none`} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}></textarea></div>
                        {editingOffer && <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-center"><AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" /><p className="text-[10px] text-amber-800">שים לב: עריכת המודעה תאפס את הדירוגים שצברת עבורה.</p></div>}
                        <button type="button" onClick={handlePublish} className="w-full bg-brand-600 text-white rounded-xl py-3.5 font-bold shadow-md hover:bg-brand-700 transition-all active:scale-95 mt-2">
                            {editingOffer ? 'שמור שינויים' : (currentUser.role === 'admin' ? 'פרסם עכשיו' : 'שלח הצעה לאישור')}
                        </button>
                    </form>
                )}
            </div>
      </div>
    </div>
  );
};