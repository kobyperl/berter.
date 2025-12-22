
import React, { useState, useEffect, useRef } from 'react';
// Core Components
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AdBanner } from './components/AdBanner';
import { OfferCard } from './components/OfferCard';
import { Footer } from './components/Footer';
import { FilterBar } from './components/FilterBar';

// Modals
import { CreateOfferModal } from './components/CreateOfferModal';
import { MessagingModal } from './components/MessagingModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { WhoIsItForModal } from './components/WhoIsItForModal';
import { SearchTipsModal } from './components/SearchTipsModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { CookieConsentModal } from './components/CookieConsentModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { PostRegisterPrompt } from './components/PostRegisterPrompt';
import { ProfessionalismPrompt } from './components/ProfessionalismPrompt'; 
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { EmailCenterModal } from './components/EmailCenterModal';

// Data & Types
import { CATEGORIES, COMMON_INTERESTS, ADMIN_EMAIL } from './constants';
import { Plus, Loader2 } from 'lucide-react';
import { Message, UserProfile, BarterOffer, ExpertiseLevel, SystemAd, SystemTaxonomy } from './types';

// Firebase
import firebase, { auth, db } from './services/firebaseConfig';

const translateAuthError = (code: string) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'האימייל הזה כבר רשום במערכת.';
    case 'auth/invalid-email': return 'כתובת האימייל אינה תקינה.';
    case 'auth/weak-password': return 'הסיסמה חלשה מדי (צריך לפחות 6 תווים).';
    case 'auth/user-not-found': return 'לא נמצא משתמש עם האימייל הזה.';
    case 'auth/wrong-password': return 'הסיסמה שהזנת שגויה.';
    case 'auth/network-request-failed': return 'בעיית תקשורת, בדוק את החיבור לאינטרנט.';
    case 'auth/too-many-requests': return 'יותר מדי ניסיונות כושלים. נסה שוב מאוחר יותר.';
    default: return 'אירעה שגיאה בתהליך האימות, נא לנסות שוב.';
  }
};

// --- Sub-component for Skeleton Loading ---
const OfferSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 h-[450px] flex flex-col overflow-hidden shadow-sm">
        <div className="p-5 flex-1 space-y-4">
            <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full skeleton shrink-0" />
                <div className="space-y-2 flex-1"><div className="h-3 w-2/3 skeleton rounded" /><div className="h-2 w-1/3 skeleton rounded" /></div>
            </div>
            <div className="h-6 w-full skeleton rounded-md" />
            <div className="h-20 w-full skeleton rounded-lg" />
            <div className="space-y-2"><div className="h-10 w-full skeleton rounded-lg" /><div className="h-10 w-full skeleton rounded-lg" /></div>
        </div>
        <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between items-center"><div className="h-4 w-24 skeleton rounded" /><div className="h-9 w-24 skeleton rounded-lg" /></div>
    </div>
);

export const App: React.FC = () => {
  // --- Data State ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  
  // Loading States
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isOffersLoading, setIsOffersLoading] = useState(true);
  
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: [],
      pendingCategories: [],
      approvedInterests: [],
      pendingInterests: [],
      categoryHierarchy: {}
  });

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      setAuthUid(firebaseUser ? firebaseUser.uid : null);
      if (!firebaseUser) {
          setCurrentUser(null);
          setIsAuthChecking(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authUid) return;
    const unsubscribeUserDoc = db.collection("users").doc(authUid).onSnapshot((docSnap) => {
        if (docSnap.exists) setCurrentUser(docSnap.data() as UserProfile);
        else setCurrentUser(null);
        setIsAuthChecking(false); 
    }, (error) => {
        console.error("User fetch error:", error);
        setIsAuthChecking(false);
    });
    return () => unsubscribeUserDoc();
  }, [authUid]);

  // --- Public Data (Optimized with Limit) ---
  useEffect(() => {
    // Initial Load - Fetch last 50 active offers for instant display
    const unsubscribeOffers = db.collection("offers")
      .orderBy("createdAt", "desc")
      .limit(50)
      .onSnapshot((snapshot) => {
        const fetched: BarterOffer[] = [];
        snapshot.forEach((doc) => fetched.push(doc.data() as BarterOffer));
        setOffers(fetched);
        setIsOffersLoading(false);
      }, (err) => {
        console.error("Offers fetch error:", err);
        setIsOffersLoading(false);
      });

    const unsubscribeAds = db.collection("systemAds").onSnapshot((snapshot) => {
      const fetched: SystemAd[] = [];
      snapshot.forEach((doc) => fetched.push(doc.data() as SystemAd));
      setSystemAds(fetched);
    });

    const unsubscribeTaxonomy = db.collection("system_metadata").doc("taxonomy").onSnapshot((docSnap) => {
        if (docSnap.exists) setTaxonomy(docSnap.data() as SystemTaxonomy);
    });

    return () => { unsubscribeOffers(); unsubscribeAds(); unsubscribeTaxonomy(); };
  }, []);

  // --- Admin Data (Fires when role detected) ---
  useEffect(() => {
    if (currentUser?.role !== 'admin') { setUsers([]); return; }
    const unsubscribeUsers = db.collection("users").onSnapshot((snapshot) => {
      const fetched: UserProfile[] = [];
      snapshot.forEach((doc) => fetched.push(doc.data() as UserProfile));
      setUsers(fetched);
    });
    return () => unsubscribeUsers();
  }, [currentUser?.role]); 

  // --- User Private Data ---
  useEffect(() => {
    if (!currentUser?.id) { setMessages([]); return; }
    const unsubscribeMessages = db.collection("messages").onSnapshot((snapshot) => {
        const fetched: Message[] = [];
        snapshot.forEach((doc) => fetched.push(doc.data() as Message));
        setMessages(fetched);
    });
    return () => unsubscribeMessages();
  }, [currentUser?.id]);

  // --- Computed ---
  const availableInterests = React.useMemo(() => Array.from(new Set([...(taxonomy.approvedInterests || COMMON_INTERESTS)])).sort(), [taxonomy.approvedInterests]);
  const availableCategories = React.useMemo(() => Array.from(new Set([...(taxonomy.approvedCategories || CATEGORIES)])).sort(), [taxonomy.approvedCategories]);

  // --- UI State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BarterOffer | null>(null);
  const [targetUserForOffer, setTargetUserForOffer] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authStartOnRegister, setAuthStartOnRegister] = useState(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForceEditMode, setProfileForceEditMode] = useState(false);
  const [isPostRegisterPromptOpen, setIsPostRegisterPromptOpen] = useState(false);
  const [isProfessionalismPromptOpen, setIsProfessionalismPromptOpen] = useState(false); 
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isEmailCenterOpen, setIsEmailCenterOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isWhoIsItForOpen, setIsWhoIsItForOpen] = useState(false);
  const [isSearchTipsOpen, setIsSearchTipsOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false); 
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [initialMessageSubject, setInitialMessageSubject] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'all' | 'for_you'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [keywordFilter, setKeywordFilter] = useState<string>('');
  const [durationFilter, setDurationFilter] = useState<'all' | 'one-time' | 'ongoing'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'deadline'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  useEffect(() => { const timer = setTimeout(() => setLocationFilter(locationInput), 300); return () => clearTimeout(timer); }, [locationInput]);
  useEffect(() => { const timer = setTimeout(() => setKeywordFilter(keywordInput), 300); return () => clearTimeout(timer); }, [keywordInput]);

  const handleRegister = async (newUser: Partial<UserProfile>, pass: string) => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(newUser.email!, pass);
        const uid = userCredential.user!.uid;
        await db.collection("users").doc(uid).set({ id: uid, name: newUser.name || 'משתמש חדש', email: newUser.email, role: newUser.email === ADMIN_EMAIL ? 'admin' : 'user', avatarUrl: newUser.avatarUrl || '', portfolioUrl: newUser.portfolioUrl || '', portfolioImages: newUser.portfolioImages || [], expertise: newUser.expertise || ExpertiseLevel.MID, mainField: newUser.mainField || 'כללי', interests: newUser.interests || [], joinedAt: new Date().toISOString() });
        setIsAuthModalOpen(false);
        setTimeout(() => setIsPostRegisterPromptOpen(true), 1000);
    } catch (error: any) { alert(translateAuthError(error.code)); throw error; }
  };

  const handleLogin = async (email: string, pass: string) => { try { await auth.signInWithEmailAndPassword(email, pass); setIsAuthModalOpen(false); } catch (error: any) { alert(translateAuthError(error.code)); throw error; } };
  const handleLogout = async () => { await auth.signOut(); };
  const handleAddOffer = async (newOffer: BarterOffer) => { try { await db.collection("offers").doc(newOffer.id).set(newOffer); if (currentUser && newOffer.profileId === currentUser.id) { if (!sessionStorage.getItem('prof_prompt_shown')) { setTimeout(() => { setIsProfessionalismPromptOpen(true); sessionStorage.setItem('prof_prompt_shown', 'true'); }, 1500); } } } catch (error) { alert("שגיאה"); } };
  const handleContact = (profile: UserProfile, subject: string = '') => { if (!currentUser) { setAuthStartOnRegister(false); setIsAuthModalOpen(true); return; } setSelectedProfile(profile); setInitialMessageSubject(subject); setIsMessagingModalOpen(true); };
  const handleOpenCreate = (targetUser?: UserProfile) => { if (!currentUser) { setAuthStartOnRegister(true); setIsAuthModalOpen(true); return; } setEditingOffer(null); setTargetUserForOffer(targetUser || currentUser); setIsCreateModalOpen(true); setIsPostRegisterPromptOpen(false); };
  const handleUpdateProfile = async (updated: UserProfile) => { try { const isAdmin = currentUser?.role === 'admin'; if (isAdmin) { const { pendingUpdate, ...data } = updated; await db.collection("users").doc(updated.id).set({ ...data, pendingUpdate: firebase.firestore.FieldValue.delete() }, { merge: true }); } else { const { id, role, pendingUpdate, ...data } = updated; await db.collection("users").doc(updated.id).update({ pendingUpdate: data }); } } catch (e) { alert("שגיאה"); } };

  const filteredOffers = React.useMemo(() => {
    return offers.filter(offer => {
      const isMine = currentUser && offer.profileId === currentUser.id;
      const isAdmin = currentUser?.role === 'admin';
      if (offer.status !== 'active' && !isMine && !isAdmin) return false; 
      if (viewFilter === 'for_you' && currentUser) { const myProf = currentUser.mainField; if (!offer.requestedService.includes(myProf) && !(offer.tags && offer.tags.some(t => t === myProf))) return false; }
      const q = searchQuery.toLowerCase();
      if (searchQuery && !((offer.title||'').toLowerCase().includes(q) || (offer.description||'').toLowerCase().includes(q))) return false;
      if (keywordFilter && !((offer.title||'').toLowerCase().includes(keywordFilter.toLowerCase()) || (offer.description||'').toLowerCase().includes(keywordFilter.toLowerCase()))) return false;
      if (locationFilter && !(offer.location || '').toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (durationFilter !== 'all' && offer.durationType !== durationFilter) return false;
      if (selectedCategories.length > 0) { if (!selectedCategories.some(cat => (offer.tags || []).includes(cat) || (offer.offeredService || '').includes(cat))) return false; }
      return true;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [offers, currentUser, viewFilter, searchQuery, keywordFilter, locationFilter, durationFilter, selectedCategories]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AccessibilityToolbar />
      <Navbar 
        currentUser={currentUser}
        onOpenCreateModal={() => handleOpenCreate()}
        onOpenMessages={() => { if(!currentUser){ setIsAuthModalOpen(true); return; } setIsMessagingModalOpen(true); }}
        onOpenAuth={() => { setAuthStartOnRegister(false); setIsAuthModalOpen(true); }}
        onOpenProfile={() => { setSelectedProfile(currentUser); setProfileForceEditMode(false); setIsProfileModalOpen(true); }}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
        adminPendingCount={offers.filter(o => o.status === 'pending').length}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        unreadCount={messages.filter(m => m.receiverId === currentUser?.id && !m.isRead).length}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        activeFeed={viewFilter}
        onNavigate={setViewFilter}
      />
      
      {viewFilter === 'all' && <Hero currentUser={currentUser} onOpenWhoIsItFor={() => setIsWhoIsItForOpen(true)} onOpenSearchTips={() => setIsSearchTipsOpen(true)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <AdBanner contextCategories={selectedCategories} systemAds={systemAds} currentUser={currentUser} />
        
        <FilterBar 
            keywordInput={keywordInput} setKeywordInput={setKeywordInput}
            locationInput={locationInput} setLocationInput={setLocationInput}
            durationFilter={durationFilter} setDurationFilter={setDurationFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            viewMode={viewMode} setViewMode={setViewMode}
            selectedCategories={selectedCategories} toggleCategory={c => setSelectedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
            displayedCategories={availableCategories} handleResetFilters={() => {setSearchQuery(''); setKeywordFilter(''); setLocationFilter(''); setDurationFilter('all'); setSelectedCategories([]);}}
            searchQuery={searchQuery} locationFilter={locationFilter} keywordFilter={keywordFilter}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {isOffersLoading ? (
                // Show 6 Skeletons while loading
                [1,2,3,4,5,6].map(i => <OfferSkeleton key={i} />)
            ) : (
                <>
                    {filteredOffers.map((offer) => (
                        <OfferCard 
                            key={offer.id} offer={offer} 
                            onContact={p => handleContact(p, offer.title)} 
                            onUserClick={p => { setSelectedProfile(p); setIsProfileModalOpen(true); }} 
                            onRate={() => {}} currentUserId={currentUser?.id} viewMode={viewMode}
                            onDelete={id => db.collection("offers").doc(id).delete()}
                            onEdit={o => { setEditingOffer(o); setIsCreateModalOpen(true); }}
                        />
                    ))}
                    <div onClick={() => handleOpenCreate()} className="cursor-pointer border-2 border-dashed border-brand-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-all group min-h-[300px]">
                        <div className="bg-brand-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><Plus className="w-8 h-8 text-brand-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800">פרסם הצעה חדשה</h3>
                    </div>
                </>
            )}
        </div>
      </main>

      <Footer onOpenAccessibility={() => setIsAccessibilityOpen(true)} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      
      {isAdminDashboardOpen && <AdminDashboardModal isOpen={isAdminDashboardOpen} onClose={() => setIsAdminDashboardOpen(false)} users={users} currentUser={currentUser} onDeleteUser={id => db.collection("users").doc(id).delete()} onApproveUpdate={()=>{}} onRejectUpdate={()=>{}} offers={offers} onDeleteOffer={id=>db.collection("offers").doc(id).delete()} onBulkDelete={()=>{}} onApproveOffer={id=>db.collection("offers").doc(id).update({status:'active'})} onEditOffer={o=>{setEditingOffer(o); setIsCreateModalOpen(true);}} availableCategories={availableCategories} availableInterests={availableInterests} pendingCategories={taxonomy.pendingCategories || []} pendingInterests={taxonomy.pendingInterests || []} onAddCategory={()=>{}} onAddInterest={()=>{}} onDeleteCategory={()=>{}} onDeleteInterest={()=>{}} onApproveCategory={()=>{}} onRejectCategory={()=>{}} onReassignCategory={()=>{}} onApproveInterest={()=>{}} onRejectInterest={()=>{}} onEditCategory={()=>{}} onEditInterest={()=>{}} ads={systemAds} onAddAd={()=>{}} onEditAd={()=>{}} onDeleteAd={()=>{}} onViewProfile={p=>{setSelectedProfile(p); setIsProfileModalOpen(true);}} />}
      {isEmailCenterOpen && <EmailCenterModal isOpen={isEmailCenterOpen} onClose={() => setIsEmailCenterOpen(false)} />}
      <PostRegisterPrompt isOpen={isPostRegisterPromptOpen} onClose={() => setIsPostRegisterPromptOpen(false)} onStartOffer={() => handleOpenCreate()} userName={currentUser?.name || ''} />
      <ProfessionalismPrompt isOpen={isProfessionalismPromptOpen} onClose={() => setIsProfessionalismPromptOpen(false)} onEditProfile={() => { setIsProfessionalismPromptOpen(false); if (currentUser) { setSelectedProfile(currentUser); setProfileForceEditMode(true); setIsProfileModalOpen(true); }}} />
      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setTargetUserForOffer(null); }} onAddOffer={handleAddOffer} currentUser={targetUserForOffer || currentUser || {id:'guest', name:'אורח', avatarUrl:'', portfolioUrl:'', expertise:ExpertiseLevel.JUNIOR, mainField:''}} editingOffer={editingOffer} onUpdateOffer={o => db.collection("offers").doc(o.id).set(o)} />
      <MessagingModal isOpen={isMessagingModalOpen} onClose={() => setIsMessagingModalOpen(false)} currentUser={currentUser?.id || 'guest'} messages={messages} onSendMessage={(rid, rn, sub, cont) => db.collection("messages").add({senderId:currentUser?.id, receiverId:rid, senderName:currentUser?.name, receiverName:rn, subject:sub, content:cont, timestamp:new Date().toISOString(), isRead:false})} onMarkAsRead={id => db.collection("messages").doc(id).update({isRead:true})} recipientProfile={selectedProfile} initialSubject={initialMessageSubject} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => { setIsProfileModalOpen(false); setProfileForceEditMode(false); }} profile={selectedProfile} currentUser={currentUser} userOffers={offers.filter(o => o.profileId === selectedProfile?.id)} onDeleteOffer={id => db.collection("offers").doc(id).delete()} onUpdateProfile={handleUpdateProfile} onContact={p => handleContact(p)} availableCategories={availableCategories} availableInterests={availableInterests} startInEditMode={profileForceEditMode} onOpenCreateOffer={p => { setIsProfileModalOpen(false); handleOpenCreate(p); }} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} onOpenAuth={() => { setAuthStartOnRegister(true); setIsAuthModalOpen(true); }} />
      <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} onStartSearching={() => window.scrollTo({ top: 600, behavior: 'smooth' })} />
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
      <CookieConsentModal />
    </div>
  );
};
