
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
  const [users, setUsers] = useState<UserProfile[]>([]);

  // --- Data State ---
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: CATEGORIES,
      pendingCategories: [],
      approvedInterests: COMMON_INTERESTS,
      pendingInterests: [],
      categoryHierarchy: {}
  });

  // --- Email Helper ---
  const triggerEmailNotification = async (type: 'welcome' | 'chat_alert' | 'smart_match', to: string, data: any) => {
      if (!to) return;
      try {
          await fetch('/api/emails/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, to, data })
          });
      } catch (err) {
          console.error("Email trigger error:", err);
      }
  };

  // --- Combined Messages (Calculated for UI) ---
  const messages = useMemo(() => {
    if (!authUid) return [];
    
    // מיזוג הודעות ששלחתי והודעות שקיבלתי
    const combined = [...sentMessages, ...receivedMessages];
    const uniqueMap = new Map<string, Message>();
    
    combined.forEach(m => {
        // וודא שיש ID למסמך כדי למנוע דריסה
        if (m.id) uniqueMap.set(m.id, m);
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [sentMessages, receivedMessages, authUid]);

  // --- Auth Listeners ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
          setAuthUid(firebaseUser.uid);
      } else {
          setAuthUid(null);
          setCurrentUser(null);
          setSentMessages([]);
          setReceivedMessages([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authUid) return;
    const unsubscribeUserDoc = db.collection("users").doc(authUid).onSnapshot((docSnap) => {
        if (docSnap.exists) setCurrentUser(docSnap.data() as UserProfile);
    }, (err) => console.error("User doc error:", err));
    return () => unsubscribeUserDoc();
  }, [authUid]);

  useEffect(() => {
    let unsubscribeUsers = () => {};
    if (currentUser?.role === 'admin') {
        unsubscribeUsers = db.collection("users").onSnapshot((snapshot) => {
          const fetched: UserProfile[] = [];
          snapshot.forEach((doc) => fetched.push({ ...(doc.data() as any), id: doc.id }));
          setUsers(fetched);
        });
    }

    const unsubscribeOffers = db.collection("offers").onSnapshot((snapshot) => {
      const fetched: BarterOffer[] = [];
      snapshot.forEach((doc) => fetched.push({ ...(doc.data() as any), id: doc.id }));
      setOffers(fetched);
      setIsLoading(false); 
    });

    const unsubscribeAds = db.collection("systemAds").onSnapshot((snapshot) => {
      const fetched: SystemAd[] = [];
      snapshot.forEach((doc) => fetched.push({ ...(doc.data() as any), id: doc.id }));
      setSystemAds(fetched);
    });

    // PRIVACY: האזנה מסוננת שתואמת את ה-Security Rules
    let unsubscribeSent = () => {};
    let unsubscribeReceived = () => {};

    if (authUid) {
        // האזנה רק להודעות ששלחתי (מותר לפי Rules)
        unsubscribeSent = db.collection("messages")
            .where("senderId", "==", authUid)
            .onSnapshot((snap) => {
                const msgs: Message[] = [];
                snap.forEach(doc => msgs.push({ ...(doc.data() as any), id: doc.id }));
                setSentMessages(msgs);
            }, (err) => console.error("Sent messages query blocked by rules or missing index:", err));

        // האזנה רק להודעות שקיבלתי (מותר לפי Rules)
        unsubscribeReceived = db.collection("messages")
            .where("receiverId", "==", authUid)
            .onSnapshot((snap) => {
                const msgs: Message[] = [];
                snap.forEach(doc => msgs.push({ ...(doc.data() as any), id: doc.id }));
                setReceivedMessages(msgs);
            }, (err) => console.error("Received messages query blocked by rules:", err));
    }

    return () => {
      unsubscribeUsers(); unsubscribeOffers(); unsubscribeAds();
      unsubscribeSent(); unsubscribeReceived();
    };
  }, [currentUser?.role, authUid]);

  // --- Messaging Logic ---
  const handleSendMessage = async (receiverId: string, receiverName: string, subject: string, content: string) => {
    const authenticatedUid = auth.currentUser?.uid;
    if (!authenticatedUid) {
        alert("עליך להתחבר כדי לשלוח הודעה.");
        return;
    }
    
    // יצירת מזהה מסמך חדש מראש
    const messageDoc = db.collection("messages").doc();
    const newMessage: Message = {
      id: messageDoc.id, 
      senderId: authenticatedUid, 
      receiverId, 
      senderName: currentUser?.name || 'משתמש', 
      receiverName, 
      subject, 
      content, 
      timestamp: new Date().toISOString(), 
      isRead: false
    };

    try { 
        // שמירה ל-Firestore. החוק יאשר רק אם senderId == ה-UID המחובר
        await messageDoc.set(newMessage);
        
        // התראה במייל לנמען
        const recipientSnap = await db.collection("users").doc(receiverId).get();
        if (recipientSnap.exists) {
            const recipient = recipientSnap.data() as UserProfile;
            if (recipient.email) {
                triggerEmailNotification('chat_alert', recipient.email, {
                    userName: recipient.name,
                    senderName: currentUser?.name || 'משתמש מהאתר'
                });
            }
        }
    } catch (e: any) { 
        console.error("Firestore Message Send Failed:", e);
        if (e.code === 'permission-denied') {
            alert("שגיאת אבטחה: השרת דחה את שליחת ההודעה. נסה להתחבר מחדש.");
        } else {
            alert("חלה שגיאה בשליחת ההודעה.");
        }
    }
  };

  const handleMarkAsRead = async (id: string) => {
      if (!authUid) return;
      try {
          // חוק ה-Update מאפשר רק למקבל ההודעה לעדכן
          await db.collection("messages").doc(id).update({ isRead: true });
      } catch (e) {
          console.error("Mark as read failed (possibly not authorized):", e);
      }
  };

  // --- Auth Handlers ---
  const handleLogout = async () => { 
    try {
      setSentMessages([]);
      setReceivedMessages([]);
      setCurrentUser(null);
      setAuthUid(null);
      await auth.signOut(); 
    } catch (e) { console.error("Logout error:", e); }
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
            portfolioImages: newUser.portfolioImages || [],
            expertise: newUser.expertise || ExpertiseLevel.MID,
            mainField: newUser.mainField || 'כללי', 
            interests: newUser.interests || [],
            joinedAt: new Date().toISOString()
        };
        await db.collection("users").doc(uid).set(userProfile);
        setCurrentUser(userProfile);
        setIsAuthModalOpen(false);
        triggerEmailNotification('welcome', userProfile.email!, { userName: userProfile.name });
        setTimeout(() => setIsPostRegisterPromptOpen(true), 1000);
    } catch (error: any) { alert(error.message); }
  };

  const handleLogin = async (email: string, pass: string) => {
    try { 
        setSentMessages([]);
        setReceivedMessages([]);
        await auth.signInWithEmailAndPassword(email, pass); 
        setIsAuthModalOpen(false); 
    } catch (error: any) { alert(error.message); }
  };

  // --- UI State ---
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
      if (searchQuery && !o.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (locationInput && !o.location.toLowerCase().includes(locationInput.toLowerCase())) return false;
      if (durationFilter !== 'all' && o.durationType !== durationFilter) return false;
      return true;
    }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [offers, searchQuery, locationInput, durationFilter, authUid, currentUser]);

  const unreadCount = messages.filter(m => m.receiverId === authUid && !m.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AccessibilityToolbar />
      <Navbar 
        currentUser={currentUser}
        onOpenCreateModal={() => { if(!authUid){ setIsAuthModalOpen(true); return; } setIsCreateModalOpen(true); }}
        onOpenMessages={() => { if(!authUid){ setIsAuthModalOpen(true); return; } setIsMessagingModalOpen(true); }}
        onOpenAuth={() => { setAuthStartOnRegister(false); setIsAuthModalOpen(true); }}
        onOpenProfile={() => { setSelectedProfile(currentUser); setIsProfileModalOpen(true); }}
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
        adminPendingCount={offers.filter(o => o.status === 'pending').length}
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
            selectedCategories={selectedCategories} toggleCategory={(cat) => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
            displayedCategories={availableCategories} handleResetFilters={() => {setSearchQuery(''); setKeywordInput(''); setLocationInput(''); setDurationFilter('all'); setSelectedCategories([]);}}
            searchQuery={searchQuery} locationFilter={locationInput} keywordFilter={keywordInput}
        />

        {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-brand-500 animate-spin" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredOffers.map((offer) => (
                <OfferCard 
                    key={offer.id} offer={offer} 
                    onContact={(p) => { setSelectedProfile(p); setInitialMessageSubject(offer.title); setIsMessagingModalOpen(true); }} 
                    onUserClick={(p) => { setSelectedProfile(p); setIsProfileModalOpen(true); }} 
                    onRate={async (id, score) => {
                        const ratings = [...(offer.ratings || []), { userId: authUid!, score }];
                        const avg = ratings.reduce((a,b) => a+b.score, 0) / ratings.length;
                        await db.collection("offers").doc(id).update({ ratings, averageRating: avg });
                    }} 
                    currentUserId={authUid || undefined} viewMode={viewMode}
                    onDelete={(id) => db.collection("offers").doc(id).delete()}
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
            onApproveUpdate={(id) => {}} onRejectUpdate={(id) => {}}
            offers={offers} onDeleteOffer={(id) => db.collection("offers").doc(id).delete()}
            onBulkDelete={() => {}} onApproveOffer={(id) => db.collection("offers").doc(id).update({status:'active'})}
            onEditOffer={(o) => { setEditingOffer(o); setIsCreateModalOpen(true); }}
            availableCategories={availableCategories} availableInterests={availableInterests}
            pendingCategories={taxonomy.pendingCategories || []} pendingInterests={taxonomy.pendingInterests || []}
            onAddCategory={() => {}} onAddInterest={() => {}} onDeleteCategory={() => {}} onDeleteInterest={() => {}}
            onApproveCategory={() => {}} onRejectCategory={() => {}} onReassignCategory={() => {}} 
            onApproveInterest={() => {}} onRejectInterest={() => {}} onEditCategory={() => {}} onEditInterest={() => {}}
            ads={systemAds} onAddAd={(ad) => db.collection("systemAds").doc(ad.id).set(ad)}
            onEditAd={(ad) => db.collection("systemAds").doc(ad.id).set(ad)}
            onDeleteAd={(id) => db.collection("systemAds").doc(id).delete()}
            onViewProfile={(u) => { setSelectedProfile(u); setIsProfileModalOpen(true); }}
          />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} />
      <MessagingModal isOpen={isMessagingModalOpen} onClose={() => setIsMessagingModalOpen(false)} currentUser={authUid || 'guest'} messages={messages} onSendMessage={handleSendMessage} onMarkAsRead={handleMarkAsRead} recipientProfile={selectedProfile} initialSubject={initialMessageSubject} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} profile={selectedProfile} currentUser={currentUser} userOffers={offers.filter(o => o.profileId === selectedProfile?.id)} onDeleteOffer={(id) => db.collection("offers").doc(id).delete()} onUpdateProfile={async (p) => { await db.collection("users").doc(p.id).set(p); }} onContact={(p) => { setSelectedProfile(p); setIsMessagingModalOpen(true); }} availableCategories={availableCategories} availableInterests={availableInterests} />
      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onAddOffer={(o) => db.collection("offers").doc(o.id).set(o)} currentUser={currentUser || {id:'guest'} as UserProfile} editingOffer={editingOffer} onUpdateOffer={(o) => db.collection("offers").doc(o.id).set(o)} />
      <EmailCenterModal isOpen={isEmailCenterOpen} onClose={() => setIsEmailCenterOpen(false)} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} onOpenAuth={() => setIsAuthModalOpen(true)} />
      <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} onStartSearching={() => {}} />
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
      <PostRegisterPrompt isOpen={isPostRegisterPromptOpen} onClose={() => setIsPostRegisterPromptOpen(false)} onStartOffer={() => setIsCreateModalOpen(true)} userName={currentUser?.name || ''} />
      <ProfessionalismPrompt isOpen={isProfessionalismPromptOpen} onClose={() => setIsProfessionalismPromptOpen(false)} onEditProfile={() => setIsProfileModalOpen(true)} />
      <CookieConsentModal />
    </div>
  );
};
