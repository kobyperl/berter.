
import React, { useState, useEffect, useMemo } from 'react';
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
    default: return 'אירעה שגיאה בתהליך האימות.';
  }
};

const OfferSkeleton = () => (
    <div className="bg-white rounded-xl border border-slate-200 h-[420px] flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 flex-1 space-y-4">
            <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-full skeleton shrink-0" />
                <div className="space-y-2 flex-1"><div className="h-3 w-2/3 skeleton rounded" /><div className="h-2 w-1/3 skeleton rounded" /></div>
            </div>
            <div className="h-6 w-full skeleton rounded-md" />
            <div className="h-20 w-full skeleton rounded-lg" />
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
  const [messagesMap, setMessagesMap] = useState<Record<string, Message>>({});
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
      if (firebaseUser) {
          setAuthUid(firebaseUser.uid);
      } else {
          setAuthUid(null);
          setCurrentUser(null);
          setMessagesMap({});
          setIsAuthChecking(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch current user document once UID is known
  useEffect(() => {
    if (!authUid) return;
    const unsubscribeUserDoc = db.collection("users").doc(authUid).onSnapshot(
      (docSnap) => {
        if (docSnap.exists) {
            setCurrentUser({ ...docSnap.data() as UserProfile, id: docSnap.id });
        }
        setIsAuthChecking(false); 
      },
      (error) => {
        console.warn("User profile read restricted:", error.message);
        setIsAuthChecking(false);
      }
    );
    return () => unsubscribeUserDoc();
  }, [authUid]);

  // --- Public Data & Taxonomy ---
  useEffect(() => {
    // Offers (Public)
    const unsubscribeOffers = db.collection("offers")
      .onSnapshot(
        (snapshot) => {
          const fetched: BarterOffer[] = [];
          snapshot.forEach((doc) => fetched.push({ ...doc.data() as BarterOffer, id: doc.id }));
          // Sort in memory to avoid missing index errors during permissions debugging
          fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOffers(fetched);
          setIsOffersLoading(false);
        },
        (error) => {
          console.warn("Offers access restricted:", error.message);
          setIsOffersLoading(false);
        }
      );

    // Ads (Public)
    const unsubscribeAds = db.collection("systemAds").onSnapshot(
      (snapshot) => {
        const fetched: SystemAd[] = [];
        snapshot.forEach((doc) => fetched.push({ ...doc.data() as SystemAd, id: doc.id }));
        setSystemAds(fetched);
      },
      (error) => console.warn("Ads access restricted:", error.message)
    );

    // Taxonomy (Public)
    const unsubscribeTaxonomy = db.collection("system").doc("taxonomy").onSnapshot(
      (docSnap) => {
        if (docSnap.exists) setTaxonomy(docSnap.data() as SystemTaxonomy);
      },
      (error) => console.warn("Taxonomy access restricted:", error.message)
    );

    return () => { unsubscribeOffers(); unsubscribeAds(); unsubscribeTaxonomy(); };
  }, []);

  // --- User Private Messages (SECURE SYNC) ---
  useEffect(() => {
    if (!authUid) { setMessagesMap({}); return; }

    const handleMessageUpdate = (snapshot: firebase.firestore.QuerySnapshot) => {
        setMessagesMap(prev => {
            const newMap = { ...prev };
            snapshot.forEach(doc => {
                newMap[doc.id] = { ...doc.data() as Message, id: doc.id };
            });
            return newMap;
        });
    };

    const handleError = (err: any) => {
        // Only log if it's not a standard cancellation on sign-out
        if (authUid) console.warn("Messages sync restricted:", err.message);
    };

    // Listen only to my messages (Security Rules Compliant)
    const unsubSent = db.collection("messages")
        .where("senderId", "==", authUid)
        .onSnapshot(handleMessageUpdate, handleError);

    const unsubReceived = db.collection("messages")
        .where("receiverId", "==", authUid)
        .onSnapshot(handleMessageUpdate, handleError);

    return () => { unsubSent(); unsubReceived(); };
  }, [authUid]);

  // --- Admin Data (Gaurded) ---
  useEffect(() => {
    // Only attempt to read users collection if user doc explicitly states 'admin'
    if (!currentUser || currentUser.role !== 'admin') { 
        setUsers([]); 
        return; 
    }

    const unsubscribeUsers = db.collection("users").onSnapshot(
      (snapshot) => {
        const fetched: UserProfile[] = [];
        snapshot.forEach((doc) => fetched.push({ ...doc.data() as UserProfile, id: doc.id }));
        setUsers(fetched);
      },
      (error) => console.warn("Admin users sync restricted:", error.message)
    );
    return () => unsubscribeUsers();
  }, [currentUser?.role, authUid]); 

  // --- Computed ---
  const messages = useMemo(() => {
      return Object.values(messagesMap).sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }, [messagesMap]);

  const availableInterests = useMemo(() => {
      const fromDB = taxonomy.approvedInterests || [];
      return Array.from(new Set([...COMMON_INTERESTS, ...fromDB])).sort();
  }, [taxonomy.approvedInterests]);

  const availableCategories = useMemo(() => {
      const fromDB = taxonomy.approvedCategories || [];
      return Array.from(new Set([...CATEGORIES, ...fromDB])).sort();
  }, [taxonomy.approvedCategories]);

  // --- UI State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BarterOffer | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authStartOnRegister, setAuthStartOnRegister] = useState(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
  const [durationFilter, setDurationFilter] = useState<'all' | 'one-time' | 'ongoing'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'deadline'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // --- Handlers with Permission Safety ---

  const handleRegister = async (newUser: Partial<UserProfile>, pass: string) => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(newUser.email!, pass);
        const uid = userCredential.user!.uid;
        await db.collection("users").doc(uid).set({ 
            ...newUser, id: uid, role: newUser.email === ADMIN_EMAIL ? 'admin' : 'user', joinedAt: new Date().toISOString() 
        });
        setIsAuthModalOpen(false);
    } catch (error: any) { alert(translateAuthError(error.code)); throw error; }
  };

  const handleLogin = async (email: string, pass: string) => { 
      try { 
          await auth.signInWithEmailAndPassword(email, pass); 
          setIsAuthModalOpen(false); 
      } catch (error: any) { 
          alert(translateAuthError(error.code)); 
          throw error; 
      } 
  };
  
  const handleLogout = async () => { await auth.signOut(); };
  
  const handleAddOffer = async (newOffer: BarterOffer) => { 
    if (!authUid) { alert("יש להתחבר כדי לפרסם הצעה"); return; }
    db.collection("offers").doc(newOffer.id).set(newOffer)
      .catch(err => { console.error("Permission error on publish:", err); alert("אין הרשאה לפרסם. וודא שאתה מחובר."); });
  };

  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      const isMine = authUid && offer.profileId === authUid;
      const isAdmin = currentUser?.role === 'admin';
      if (offer.status !== 'active' && !isMine && !isAdmin) return false; 
      
      const q = searchQuery.toLowerCase();
      if (searchQuery && !((offer.title||'').toLowerCase().includes(q) || (offer.description||'').toLowerCase().includes(q))) return false;
      
      if (durationFilter !== 'all' && offer.durationType !== durationFilter) return false;
      if (selectedCategories.length > 0) {
          const matchesCat = selectedCategories.some(cat => (offer.tags || []).includes(cat) || (offer.offeredService || '').includes(cat));
          if (!matchesCat) return false;
      }
      return true;
    });
  }, [offers, authUid, currentUser?.role, searchQuery, durationFilter, selectedCategories]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AccessibilityToolbar />
      <Navbar 
        currentUser={currentUser}
        onOpenCreateModal={() => { if(!authUid){ setAuthStartOnRegister(true); setIsAuthModalOpen(true); return; } setEditingOffer(null); setIsCreateModalOpen(true); }}
        onOpenMessages={() => { if(!authUid){ setIsAuthModalOpen(true); return; } setIsMessagingModalOpen(true); }}
        onOpenAuth={() => { setAuthStartOnRegister(false); setIsAuthModalOpen(true); }}
        onOpenProfile={() => { setSelectedProfile(currentUser); setIsProfileModalOpen(true); }}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
        adminPendingCount={offers.filter(o => o.status === 'pending').length + users.filter(u => u.pendingUpdate).length}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        unreadCount={messages.filter(m => m.receiverId === authUid && !m.isRead).length}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        activeFeed={viewFilter}
        onNavigate={setViewFilter}
      />
      
      {viewFilter === 'all' && <Hero currentUser={currentUser} onOpenWhoIsItFor={() => setIsWhoIsItForOpen(true)} onOpenSearchTips={() => setIsSearchTipsOpen(true)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <AdBanner contextCategories={selectedCategories} systemAds={systemAds} currentUser={currentUser} />
        
        <FilterBar 
            keywordInput={searchQuery} setKeywordInput={setSearchQuery}
            locationInput="" setLocationInput={()=>{}}
            durationFilter={durationFilter} setDurationFilter={setDurationFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            viewMode={viewMode} setViewMode={setViewMode}
            selectedCategories={selectedCategories} toggleCategory={c => setSelectedCategories(prev => c === 'הכל' ? [] : (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))}
            displayedCategories={availableCategories} handleResetFilters={() => {setSearchQuery(''); setDurationFilter('all'); setSelectedCategories([]);}}
            searchQuery={searchQuery} locationFilter="" keywordFilter={searchQuery}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isOffersLoading ? [1,2,3,4,5,6].map(i => <OfferSkeleton key={i} />) : (
                <>
                    {filteredOffers.map((offer) => (
                        <OfferCard 
                            key={offer.id} offer={offer} 
                            onContact={p => { setSelectedProfile(p); setInitialMessageSubject(offer.title); setIsMessagingModalOpen(true); }} 
                            onUserClick={p => { setSelectedProfile(p); setIsProfileModalOpen(true); }} 
                            currentUserId={authUid || undefined} viewMode={viewMode}
                            onDelete={id => db.collection("offers").doc(id).delete().catch(e => console.error("Delete restricted:", e.message))}
                            onEdit={o => { setEditingOffer(o); setIsCreateModalOpen(true); }}
                        />
                    ))}
                    <div onClick={() => setIsCreateModalOpen(true)} className="cursor-pointer border-2 border-dashed border-brand-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-all group">
                        <div className="bg-brand-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><Plus className="w-8 h-8 text-brand-600" /></div>
                        <h3 className="text-xl font-bold text-slate-800">פרסם הצעה חדשה</h3>
                    </div>
                </>
            )}
        </div>
      </main>

      <Footer onOpenAccessibility={() => setIsAccessibilityOpen(true)} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      
      {isAdminDashboardOpen && (
          <AdminDashboardModal 
            isOpen={isAdminDashboardOpen} onClose={() => setIsAdminDashboardOpen(false)}
            users={users} currentUser={currentUser} 
            onDeleteUser={id => db.collection("users").doc(id).delete().catch(e => console.error(e))}
            onApproveUpdate={id => {
                const u = users.find(x => x.id === id);
                if (u?.pendingUpdate) db.collection("users").doc(id).update({ ...u.pendingUpdate, pendingUpdate: firebase.firestore.FieldValue.delete() }).catch(e => console.error(e));
            }} 
            onRejectUpdate={id => db.collection("users").doc(id).update({ pendingUpdate: firebase.firestore.FieldValue.delete() }).catch(e => console.error(e))}
            offers={offers} onDeleteOffer={id => db.collection("offers").doc(id).delete().catch(e => console.error(e))}
            onBulkDelete={date => {
                offers.filter(o => new Date(o.createdAt) < new Date(date)).forEach(o => db.collection("offers").doc(o.id).delete().catch(e => console.error(e)));
            }} 
            onApproveOffer={id => db.collection("offers").doc(id).update({status:'active'}).catch(e => console.error(e))}
            onEditOffer={o => { setEditingOffer(o); setIsCreateModalOpen(true); }}
            availableCategories={availableCategories} availableInterests={availableInterests}
            pendingCategories={taxonomy.pendingCategories || []} pendingInterests={taxonomy.pendingInterests || []}
            categoryHierarchy={taxonomy.categoryHierarchy}
            onAddCategory={cat => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(cat) }).catch(e => console.error(e))} 
            onAddInterest={int => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(int) }).catch(e => console.error(e))} 
            onDeleteCategory={cat => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayRemove(cat) }).catch(e => console.error(e))} 
            onDeleteInterest={int => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayRemove(int) }).catch(e => console.error(e))}
            onApproveCategory={cat => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(cat), pendingCategories: firebase.firestore.FieldValue.arrayRemove(cat) }).catch(e => console.error(e))}
            onRejectCategory={cat => db.collection("system").doc("taxonomy").update({ pendingCategories: firebase.firestore.FieldValue.arrayRemove(cat) }).catch(e => console.error(e))}
            onReassignCategory={(oldC, newC) => db.collection("system").doc("taxonomy").update({ pendingCategories: firebase.firestore.FieldValue.arrayRemove(oldC), approvedCategories: firebase.firestore.FieldValue.arrayUnion(newC) }).catch(e => console.error(e))}
            onApproveInterest={int => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(int), pendingInterests: firebase.firestore.FieldValue.arrayRemove(int) }).catch(e => console.error(e))}
            onRejectInterest={int => db.collection("system").doc("taxonomy").update({ pendingInterests: firebase.firestore.FieldValue.arrayRemove(int) }).catch(e => console.error(e))}
            onEditCategory={(oldN, newN, parent) => {
                db.collection("system").doc("taxonomy").update({ 
                    approvedCategories: firebase.firestore.FieldValue.arrayRemove(oldN),
                    [`categoryHierarchy.${newN}`]: parent || firebase.firestore.FieldValue.delete()
                }).catch(e => console.error(e));
                db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(newN) }).catch(e => console.error(e));
            }}
            onEditInterest={(oldN, newN) => { 
                db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayRemove(oldN) }).catch(e => console.error(e)); 
                db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(newN) }).catch(e => console.error(e)); 
            }}
            ads={systemAds} onAddAd={ad => db.collection("systemAds").doc(ad.id).set(ad).catch(e => console.error(e))}
            onEditAd={ad => db.collection("systemAds").doc(ad.id).set(ad).catch(e => console.error(e))}
            onDeleteAd={id => db.collection("systemAds").doc(id).delete().catch(e => console.error(e))}
            onViewProfile={u => { setSelectedProfile(u); setIsProfileModalOpen(true); }}
          />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      
      <MessagingModal 
        isOpen={isMessagingModalOpen} 
        onClose={() => setIsMessagingModalOpen(false)} 
        currentUser={authUid || 'guest'} 
        messages={messages} 
        onSendMessage={(rid, rn, s, c) => {
            if (!authUid) return;
            db.collection("messages").add({ 
                senderId: authUid, 
                receiverId: rid, 
                senderName: currentUser?.name, 
                receiverName: rn, 
                subject: s, 
                content: c, 
                timestamp: new Date().toISOString(), 
                isRead: false 
            }).catch(e => console.error("Message send failed:", e.message));
        }} 
        onMarkAsRead={id => {
            if (!authUid) return;
            db.collection("messages").doc(id).update({ isRead: true }).catch(e => {
                // Silently handle if update fails (e.g. race condition on sign-out)
                if (authUid) console.warn("Mark as read failed:", e.message);
            });
        }} 
        recipientProfile={selectedProfile} 
        initialSubject={initialMessageSubject} 
      />

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} profile={selectedProfile} currentUser={currentUser} userOffers={offers.filter(o => o.profileId === selectedProfile?.id)} onDeleteOffer={id => db.collection("offers").doc(id).delete().catch(e => console.error(e))} onUpdateProfile={async p => db.collection("users").doc(p.id).set(p, {merge:true}).catch(e => console.error(e))} onContact={p => { setSelectedProfile(p); setIsMessagingModalOpen(true); }} availableCategories={availableCategories} availableInterests={availableInterests} onOpenCreateOffer={p => { setSelectedProfile(p); setIsCreateModalOpen(true); }} />
      
      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingOffer(null); }} onAddOffer={handleAddOffer} currentUser={currentUser || {id:'guest'} as UserProfile} editingOffer={editingOffer} onUpdateOffer={o => db.collection("offers").doc(o.id).set(o).catch(e => console.error(e))} />
      
      <EmailCenterModal isOpen={isEmailCenterOpen} onClose={() => setIsEmailCenterOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} onOpenAuth={() => setIsAuthModalOpen(true)} />
      <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} onStartSearching={() => {}} />
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
      <CookieConsentModal />
    </div>
  );
};
