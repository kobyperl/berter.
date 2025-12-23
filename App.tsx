
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

export const App: React.FC = () => {
  // --- Auth State ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // --- Unified Messaging State ---
  const [messagesMap, setMessagesMap] = useState<Record<string, Message>>({});

  // --- Data State ---
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: CATEGORIES,
      pendingCategories: [],
      approvedInterests: COMMON_INTERESTS,
      pendingInterests: [],
      categoryHierarchy: {}
  });

  // איחוד הודעות ממוין (לפי זמן יורד - החדש ביותר למעלה)
  const messages = useMemo(() => {
    const list = Object.values(messagesMap) as Message[];
    return list.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [messagesMap]);

  // --- Auth Listeners ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
          setAuthUid(firebaseUser.uid);
      } else {
          setAuthUid(null);
          setCurrentUser(null);
          setMessagesMap({});
          setIsAuthLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authUid) return;
    const unsubscribeUserDoc = db.collection("users").doc(authUid).onSnapshot((docSnap) => {
        if (docSnap.exists) {
            const data = docSnap.data() as UserProfile;
            setCurrentUser({ ...data, id: docSnap.id });
        }
        setIsAuthLoading(false);
    }, (err) => {
        setIsAuthLoading(false);
    });
    return () => unsubscribeUserDoc();
  }, [authUid]);

  // --- Robust Messaging Listener ---
  useEffect(() => {
    // קריטי: לא מפעילים מאזינים אם ה-UID ריק או 'guest' כדי למנוע שגיאות הרשאה
    const currentUid = auth.currentUser?.uid || authUid;
    if (!currentUid || currentUid === 'guest' || currentUid === 'null') {
        return;
    }

    const updateMessages = (snap: firebase.firestore.QuerySnapshot) => {
        setMessagesMap(prev => {
            const newMap = { ...prev };
            snap.forEach(doc => {
                newMap[doc.id] = { ...(doc.data() as Message), id: doc.id };
            });
            return newMap;
        });
    };

    // המאזינים משתמשים ב-currentUid המאומת והמיון שתואם לאינדקס
    const unsubSent = db.collection("messages")
        .where("senderId", "==", currentUid)
        .orderBy("timestamp", "desc")
        .onSnapshot(updateMessages, (e) => {
            if (e.code === 'permission-denied') console.warn("Sent messages: Permission denied");
        });

    const unsubReceived = db.collection("messages")
        .where("receiverId", "==", currentUid)
        .orderBy("timestamp", "desc")
        .onSnapshot(updateMessages, (e) => {
            if (e.code === 'permission-denied') console.warn("Received messages: Permission denied");
        });

    return () => { 
        unsubSent(); 
        unsubReceived(); 
    };
  }, [authUid]);

  // --- Data Listeners ---
  useEffect(() => {
    const unsubOffers = db.collection("offers").onSnapshot((snapshot) => {
      const fetched: BarterOffer[] = [];
      snapshot.forEach((doc) => {
          const data = doc.data() as BarterOffer;
          const profileId = String(data.profileId || data.profile?.id || '').trim();
          fetched.push({ ...data, id: doc.id, profileId });
      });
      setOffers(fetched);
      setIsLoading(false); 
    });

    const unsubAds = db.collection("systemAds").onSnapshot((snapshot) => {
      const fetched: SystemAd[] = [];
      snapshot.forEach((doc) => fetched.push({ ...(doc.data() as any), id: doc.id }));
      setSystemAds(fetched);
    });

    const unsubTaxonomy = db.collection("system").doc("taxonomy").onSnapshot((doc) => {
        if (doc.exists) setTaxonomy(prev => ({ ...prev, ...doc.data() }));
    });

    return () => { unsubOffers(); unsubAds(); unsubTaxonomy(); };
  }, []);

  // Admin User List
  useEffect(() => {
      if (currentUser?.role !== 'admin') { setUsers([]); return; }
      const unsubUsers = db.collection("users").onSnapshot(snap => {
          const uList: UserProfile[] = [];
          snap.forEach(doc => uList.push({ ...(doc.data() as UserProfile), id: doc.id }));
          setUsers(uList);
      });
      return () => unsubUsers();
  }, [currentUser?.role]);

  // --- Handlers ---
  const handleSendMessage = async (receiverId: string, receiverName: string, subject: string, content: string) => {
    const currentUid = auth.currentUser?.uid || authUid;
    if (!currentUid) { alert("יש להתחבר כדי לשלוח הודעה"); return; }
    
    const cleanReceiverId = String(receiverId).trim();
    if (!cleanReceiverId || cleanReceiverId === 'undefined' || cleanReceiverId === 'null' || cleanReceiverId === 'guest') {
        alert("תקלה: לא ניתן לזהות את הנמען. נסה לרענן את המודעה.");
        return;
    }

    const newMessage = {
      senderId: currentUid,
      receiverId: cleanReceiverId,
      senderName: currentUser?.name || 'משתמש Barter',
      receiverName: receiverName || 'משתמש',
      subject: subject || 'צ\'אט ברטר',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      isRead: false
    };

    try {
        await db.collection("messages").add(newMessage);
    } catch (e: any) {
        alert(`שגיאת אבטחה ב-Firebase: ${e.message}`);
    }
  };

  const handleMarkAsRead = async (id: string) => {
      if (!authUid) return;
      try { await db.collection("messages").doc(id).update({ isRead: true }); } catch (e) {}
  };

  const handleLogout = async () => { 
    setMessagesMap({});
    setUsers([]);
    setCurrentUser(null);
    setAuthUid(null);
    setIsAuthLoading(true);
    await auth.signOut(); 
  };

  const handleRegister = async (newUser: Partial<UserProfile>, pass: string) => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(newUser.email!, pass);
        const uid = userCredential.user!.uid;
        const userProfile: UserProfile = {
            id: uid,
            name: newUser.name || 'משתמש',
            email: newUser.email,
            role: newUser.email === ADMIN_EMAIL ? 'admin' : 'user',
            avatarUrl: newUser.avatarUrl || `https://ui-avatars.com/api/?name=${newUser.name}&background=random`,
            portfolioUrl: newUser.portfolioUrl || '',
            expertise: newUser.expertise || ExpertiseLevel.MID,
            mainField: newUser.mainField || 'כללי', 
            interests: newUser.interests || [],
            joinedAt: new Date().toISOString()
        };
        await db.collection("users").doc(uid).set(userProfile);
        setCurrentUser(userProfile);
        setIsAuthModalOpen(false);
        setTimeout(() => setIsPostRegisterPromptOpen(true), 1000);
    } catch (error: any) { alert(error.message); }
  };

  const handleLogin = async (email: string, pass: string) => {
    try { 
        setMessagesMap({});
        await auth.signInWithEmailAndPassword(email, pass); 
        setIsAuthModalOpen(false); 
    } catch (error: any) { alert(error.message); }
  };

  // UI Control
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BarterOffer | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authStartOnRegister, setAuthStartOnRegister] = useState(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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
  const [durationFilter, setDurationFilter] = useState<'all' | 'one-time' | 'ongoing'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'deadline'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const availableCategories = useMemo(() => Array.from(new Set([...taxonomy.approvedCategories])).sort(), [taxonomy.approvedCategories]);
  const availableInterests = useMemo(() => Array.from(new Set([...taxonomy.approvedInterests])).sort(), [taxonomy.approvedInterests]);

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      if (o.status !== 'active' && o.profileId !== authUid && currentUser?.role !== 'admin') return false;
      if (selectedCategories.length > 0 && !selectedCategories.includes('הכל')) {
          const matches = selectedCategories.some(cat => o.title.toLowerCase().includes(cat.toLowerCase()) || o.offeredService.toLowerCase().includes(cat.toLowerCase()));
          if (!matches) return false;
      }
      if (searchQuery && !o.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (locationInput && !o.location.toLowerCase().includes(locationInput.toLowerCase())) return false;
      if (durationFilter !== 'all' && o.durationType !== durationFilter) return false;
      return true;
    }).sort((a,b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
        return 0;
    });
  }, [offers, searchQuery, locationInput, durationFilter, authUid, currentUser, selectedCategories, sortBy]);

  const unreadCount = messages.filter(m => m.receiverId === authUid && !m.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AccessibilityToolbar />
      <Navbar 
        currentUser={currentUser}
        onOpenCreateModal={() => { if(!authUid){ setAuthStartOnRegister(true); setIsAuthModalOpen(true); return; } setIsCreateModalOpen(true); }}
        onOpenMessages={() => { if(!authUid){ setIsAuthModalOpen(true); return; } setIsMessagingModalOpen(true); }}
        onOpenAuth={() => { setAuthStartOnRegister(false); setIsAuthModalOpen(true); }}
        onOpenProfile={() => { setSelectedProfile(currentUser); setIsProfileModalOpen(true); }}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
        adminPendingCount={offers.filter(o => o.status === 'pending').length + (users.filter(u => u.pendingUpdate).length)}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        unreadCount={unreadCount}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        activeFeed={viewFilter}
        onNavigate={(feed) => setViewFilter(feed)}
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
            selectedCategories={selectedCategories} toggleCategory={(cat) => setSelectedCategories(prev => cat === 'הכל' ? [] : (prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]))}
            displayedCategories={availableCategories} handleResetFilters={() => {setSearchQuery(''); setKeywordInput(''); setLocationInput(''); setDurationFilter('all'); setSelectedCategories([]);}}
            searchQuery={searchQuery} locationFilter={locationInput} keywordFilter={keywordInput}
        />

        {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-brand-500 animate-spin" /></div>
        ) : (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2" : "space-y-4 pt-2 max-w-4xl mx-auto"}>
              {filteredOffers.map((offer) => (
                <OfferCard 
                    key={offer.id} offer={offer} 
                    onContact={(p) => { 
                        const safeId = String(offer.profileId || p.id || '').trim();
                        setSelectedProfile({ ...p, id: safeId }); 
                        setInitialMessageSubject(offer.title); 
                        setIsMessagingModalOpen(true); 
                    }} 
                    onUserClick={(p) => { 
                        const safeId = String(offer.profileId || p.id || '').trim();
                        setSelectedProfile({ ...p, id: safeId }); 
                        setIsProfileModalOpen(true); 
                    }} 
                    onRate={async (id, score) => {
                        const currentUid = auth.currentUser?.uid || authUid;
                        if (!currentUid) return;
                        const ratings = [...(offer.ratings || []), { userId: currentUid, score }];
                        const avg = ratings.reduce((a,b) => a+b.score, 0) / ratings.length;
                        await db.collection("offers").doc(id).update({ ratings, averageRating: avg });
                    }} 
                    currentUserId={authUid || undefined} viewMode={viewMode}
                    onDelete={(id) => { if(window.confirm('מחק?')) db.collection("offers").doc(id).delete() }}
                    onEdit={(o) => { setEditingOffer(o); setIsCreateModalOpen(true); }}
                />
              ))}
              <div onClick={() => setIsCreateModalOpen(true)} className="cursor-pointer border-2 border-dashed border-brand-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-all">
                   <Plus className="w-8 h-8 text-brand-600 mb-4" />
                   <h3 className="text-xl font-bold text-slate-800">פרסם הצעה חדשה</h3>
              </div>
            </div>
        )}
      </main>

      <Footer onOpenAccessibility={() => setIsAccessibilityOpen(true)} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      
      {isAdminDashboardOpen && (
          <AdminDashboardModal 
            isOpen={isAdminDashboardOpen} onClose={() => setIsAdminDashboardOpen(false)}
            users={users} currentUser={currentUser} 
            onDeleteUser={(id) => db.collection("users").doc(id).delete()}
            onApproveUpdate={(id) => {
                const u = users.find(x => x.id === id);
                if (u?.pendingUpdate) db.collection("users").doc(id).update({ ...u.pendingUpdate, pendingUpdate: firebase.firestore.FieldValue.delete() });
            }} 
            onRejectUpdate={(id) => db.collection("users").doc(id).update({ pendingUpdate: firebase.firestore.FieldValue.delete() })}
            offers={offers} onDeleteOffer={(id) => db.collection("offers").doc(id).delete()}
            onBulkDelete={(date) => {
                offers.filter(o => new Date(o.createdAt) < new Date(date)).forEach(o => db.collection("offers").doc(o.id).delete());
            }} 
            onApproveOffer={(id) => db.collection("offers").doc(id).update({status:'active'})}
            onEditOffer={(o) => { setEditingOffer(o); setIsCreateModalOpen(true); }}
            availableCategories={availableCategories} availableInterests={availableInterests}
            pendingCategories={taxonomy.pendingCategories || []} pendingInterests={taxonomy.pendingInterests || []}
            onAddCategory={(cat) => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(cat) })} 
            onAddInterest={(int) => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(int) })} 
            onDeleteCategory={(cat) => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayRemove(cat) })} 
            onDeleteInterest={(int) => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayRemove(int) })}
            onApproveCategory={(cat) => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(cat), pendingCategories: firebase.firestore.FieldValue.arrayRemove(cat) })}
            onRejectCategory={(cat) => db.collection("system").doc("taxonomy").update({ pendingCategories: firebase.firestore.FieldValue.arrayRemove(cat) })}
            onReassignCategory={(oldC, newC) => db.collection("system").doc("taxonomy").update({ pendingCategories: firebase.firestore.FieldValue.arrayRemove(oldC) })}
            onApproveInterest={(int) => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(int), pendingInterests: firebase.firestore.FieldValue.arrayRemove(int) })}
            onRejectInterest={(int) => db.collection("system").doc("taxonomy").update({ pendingInterests: firebase.firestore.FieldValue.arrayRemove(int) })}
            onEditCategory={(oldN, newN) => { db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayRemove(oldN) }); db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(newN) }); }}
            onEditInterest={(oldN, newN) => { db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayRemove(oldN) }); db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(newN) }); }}
            ads={systemAds} onAddAd={(ad) => db.collection("systemAds").doc(ad.id).set(ad)}
            onEditAd={(ad) => db.collection("systemAds").doc(ad.id).set(ad)}
            onViewProfile={(u) => { setSelectedProfile(u); setIsProfileModalOpen(true); }}
            onDeleteAd={(id) => db.collection("systemAds").doc(id).delete()}
          />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      
      <MessagingModal 
          isOpen={isMessagingModalOpen} 
          onClose={() => setIsMessagingModalOpen(false)} 
          currentUser={authUid || 'guest'} 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          onMarkAsRead={handleMarkAsRead} 
          recipientProfile={selectedProfile} 
          initialSubject={initialMessageSubject} 
      />

      <ProfileModal 
          isOpen={isProfileModalOpen} 
          onClose={() => setIsProfileModalOpen(false)} 
          profile={selectedProfile} 
          currentUser={currentUser} 
          userOffers={offers.filter(o => String(o.profileId).trim() === String(selectedProfile?.id || '').trim())} 
          onDeleteOffer={(id) => db.collection("offers").doc(id).delete()} 
          onUpdateProfile={async (p) => { await db.collection("users").doc(p.id).set(p); }} 
          onContact={(p) => { setSelectedProfile(p); setIsMessagingModalOpen(true); }} 
          availableCategories={availableCategories} 
          availableInterests={availableInterests} 
          onOpenCreateOffer={(p) => { setSelectedProfile(p); setIsCreateModalOpen(true); }} 
      />

      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingOffer(null); }} onAddOffer={(o) => { db.collection("offers").doc(o.id).set(o); setTimeout(() => setIsProfessionalismPromptOpen(true), 1000); }} currentUser={currentUser || {id:'guest'} as UserProfile} editingOffer={editingOffer} onUpdateOffer={(o) => db.collection("offers").doc(o.id).set(o)} />
      <EmailCenterModal isOpen={isEmailCenterOpen} onClose={() => setIsEmailCenterOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} onOpenAuth={() => setIsAuthModalOpen(true)} />
      <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} onStartSearching={() => {}} />
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
      <PostRegisterPrompt isOpen={isPostRegisterPromptOpen} onClose={() => setIsPostRegisterPromptOpen(false)} onStartOffer={() => { setIsPostRegisterPromptOpen(false); setIsCreateModalOpen(true); }} userName={currentUser?.name || ''} />
      <ProfessionalismPrompt isOpen={isProfessionalismPromptOpen} onClose={() => setIsProfessionalismPromptOpen(false)} onEditProfile={() => { setIsProfessionalismPromptOpen(false); setSelectedProfile(currentUser); setIsProfileModalOpen(true); }} />
      <CookieConsentModal />
    </div>
  );
};
