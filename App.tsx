
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

export const App: React.FC = () => {
  // --- Data State ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);

  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: [],
      pendingCategories: [],
      approvedInterests: [],
      pendingInterests: [],
      categoryHierarchy: {}
  });

  // --- Email Trigger Helper ---
  const triggerEmailNotification = async (type: 'welcome' | 'chat_alert' | 'smart_match', to: string, data: any) => {
      try {
          console.log(`[Email System] Triggering ${type} to ${to}...`);
          const response = await fetch('/api/emails/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, to, data })
          });
          if (!response.ok) {
              console.error("[Email System] API Error");
          }
      } catch (err) {
          console.error("[Email System] Network Error:", err);
      }
  };

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      setAuthUid(firebaseUser ? firebaseUser.uid : null);
      if (!firebaseUser) {
          setCurrentUser(null);
          setUsers([]);
          setMessages([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync Current User Data
  useEffect(() => {
    if (!authUid) return;
    const unsubscribeUserDoc = db.collection("users").doc(authUid).onSnapshot((docSnap) => {
        if (docSnap.exists) {
            setCurrentUser(docSnap.data() as UserProfile);
        }
    });
    return () => unsubscribeUserDoc();
  }, [authUid]);

  // --- Main Data Loading ---
  useEffect(() => {
    let unsubscribeUsers = () => {};
    if (currentUser?.role === 'admin') {
        unsubscribeUsers = db.collection("users").onSnapshot((snapshot) => {
          const fetchedUsers: UserProfile[] = [];
          snapshot.forEach((doc) => fetchedUsers.push(doc.data() as UserProfile));
          setUsers(fetchedUsers);
        });
    }

    const unsubscribeOffers = db.collection("offers").onSnapshot((snapshot) => {
      const fetchedOffers: BarterOffer[] = [];
      snapshot.forEach((doc) => fetchedOffers.push(doc.data() as BarterOffer));
      setOffers(fetchedOffers);
      setIsLoading(false); 
    });

    const unsubscribeAds = db.collection("systemAds").onSnapshot((snapshot) => {
      const fetchedAds: SystemAd[] = [];
      snapshot.forEach((doc) => fetchedAds.push(doc.data() as SystemAd));
      setSystemAds(fetchedAds);
    });

    // PRIVACY: Load only messages where current user is involved
    let unsubscribeSent = () => {};
    let unsubscribeReceived = () => {};

    if (authUid) {
        const mergeMessages = (newMsgs: Message[], source: 'sent' | 'received') => {
            setMessages(prev => {
                const otherSourceMsgs = source === 'sent' 
                    ? prev.filter(m => m.receiverId === authUid) 
                    : prev.filter(m => m.senderId === authUid);
                const all = [...otherSourceMsgs, ...newMsgs];
                return Array.from(new Map(all.map(m => [m.id, m])).values());
            });
        };

        unsubscribeSent = db.collection("messages").where("senderId", "==", authUid).onSnapshot((snapshot) => {
                const msgs: Message[] = [];
                snapshot.forEach(doc => msgs.push(doc.data() as Message));
                mergeMessages(msgs, 'sent');
            });

        unsubscribeReceived = db.collection("messages").where("receiverId", "==", authUid).onSnapshot((snapshot) => {
                const msgs: Message[] = [];
                snapshot.forEach(doc => msgs.push(doc.data() as Message));
                mergeMessages(msgs, 'received');
            });
    }

    const unsubscribeTaxonomy = db.collection("system_metadata").doc("taxonomy").onSnapshot((docSnap) => {
        if (docSnap.exists) setTaxonomy(docSnap.data() as SystemTaxonomy);
    });

    return () => {
      unsubscribeUsers(); unsubscribeOffers(); unsubscribeAds();
      unsubscribeSent(); unsubscribeReceived(); unsubscribeTaxonomy();
    };
  }, [currentUser?.role, authUid]); 

  // --- Computed Lists ---
  const availableInterests = React.useMemo(() => {
    return Array.from(new Set([...(taxonomy.approvedInterests || COMMON_INTERESTS)])).sort();
  }, [taxonomy.approvedInterests]);

  const availableCategories = React.useMemo(() => {
    return Array.from(new Set([...(taxonomy.approvedCategories || CATEGORIES)])).sort();
  }, [taxonomy.approvedCategories]);

  // --- Handlers ---
  const handleLogout = async () => { 
    await auth.signOut(); 
    setMessages([]);
  };

  const handleRegister = async (newUser: Partial<UserProfile>, pass: string) => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(newUser.email!, pass);
        const uid = userCredential.user!.uid;
        const userProfile: UserProfile = {
            id: uid,
            name: newUser.name || 'משתמש חדש',
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

        if (userProfile.email) {
            triggerEmailNotification('welcome', userProfile.email, { userName: userProfile.name });
        }
        setTimeout(() => setIsPostRegisterPromptOpen(true), 1000);
    } catch (error: any) { alert(`שגיאה: ${error.message}`); }
  };

  const handleLogin = async (email: string, pass: string) => {
    try { await auth.signInWithEmailAndPassword(email, pass); setIsAuthModalOpen(false); } 
    catch (error: any) { alert("שגיאה בהתחברות: " + error.message); }
  };

  const handleSendMessage = async (receiverId: string, receiverName: string, subject: string, content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(), senderId: authUid || 'guest', receiverId, 
      senderName: currentUser?.name || 'אורח', receiverName, 
      subject, content, timestamp: new Date().toISOString(), isRead: false
    };
    try { 
        await db.collection("messages").doc(newMessage.id).set(newMessage);
        const recipientSnap = await db.collection("users").doc(receiverId).get();
        if (recipientSnap.exists) {
            const recipientData = recipientSnap.data() as UserProfile;
            if (recipientData.email) {
                triggerEmailNotification('chat_alert', recipientData.email, {
                    userName: recipientData.name,
                    senderName: currentUser?.name || 'משתמש'
                });
            }
        }
    } catch (error) { console.error(error); }
  };

  const handleAddOffer = async (newOffer: BarterOffer) => {
    try { 
        await db.collection("offers").doc(newOffer.id).set(newOffer);
        if (!sessionStorage.getItem('prof_prompt_shown')) {
            setTimeout(() => { setIsProfessionalismPromptOpen(true); sessionStorage.setItem('prof_prompt_shown', 'true'); }, 1500);
        }
    } catch (error) { alert("שגיאה בפרסום"); }
  };

  const handleDeleteOffer = async (offerId: string) => {
      try { await db.collection("offers").doc(offerId).delete(); } catch (e) {}
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
      try {
          if (currentUser?.role === 'admin') {
              await db.collection("users").doc(updated.id).set(updated, { merge: true });
          } else {
              await db.collection("users").doc(updated.id).update({ pendingUpdate: updated });
          }
      } catch (e) { alert("שגיאה בעדכון"); }
  };

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

  const handleResetFilters = () => {
      setSearchQuery(''); setKeywordInput(''); setLocationInput(''); setDurationFilter('all'); setSelectedCategories([]);
  };

  const toggleCategory = (category: string) => {
      if (category === 'הכל') { setSelectedCategories([]); return; }
      setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const handleContact = (profile: UserProfile, subject: string = '') => {
    if (!authUid) { setIsAuthModalOpen(true); return; }
    setSelectedProfile(profile); setInitialMessageSubject(subject); setIsMessagingModalOpen(true);
  };

  const handleViewProfile = (profile: UserProfile) => {
    setSelectedProfile(profile); setProfileForceEditMode(false); setIsProfileModalOpen(true);
  };

  const handleOpenCreate = (targetUser?: UserProfile) => {
    if (!authUid) { setAuthStartOnRegister(true); setIsAuthModalOpen(true); return; }
    setEditingOffer(null); setTargetUserForOffer(targetUser || currentUser); setIsCreateModalOpen(true);
  };

  const handleRateOffer = async (offerId: string, rating: number) => {
    if (!authUid) return;
    try {
        const offer = offers.find(o => o.id === offerId);
        if (!offer) return;
        const newRatings = [...(offer.ratings || []), { userId: authUid, score: rating }];
        const avg = newRatings.reduce((a,b) => a + b.score, 0) / newRatings.length;
        await db.collection("offers").doc(offerId).update({ ratings: newRatings, averageRating: avg });
    } catch (e) {}
  };

  const filteredOffers = React.useMemo(() => {
    return offers.filter(offer => {
      if (offer.status !== 'active' && offer.profileId !== authUid && currentUser?.role !== 'admin') return false;
      if (searchQuery && !offer.title.includes(searchQuery)) return false;
      if (locationInput && !offer.location.includes(locationInput)) return false;
      if (durationFilter !== 'all' && offer.durationType !== durationFilter) return false;
      if (selectedCategories.length > 0 && !selectedCategories.some(c => offer.tags.includes(c))) return false;
      return true;
    });
  }, [offers, searchQuery, locationInput, durationFilter, selectedCategories, authUid, currentUser]);

  const unreadCount = messages.filter(m => m.receiverId === authUid && !m.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AccessibilityToolbar />
      <Navbar 
        currentUser={currentUser}
        onOpenCreateModal={() => handleOpenCreate()}
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
            selectedCategories={selectedCategories} toggleCategory={toggleCategory}
            displayedCategories={availableCategories} handleResetFilters={handleResetFilters}
            searchQuery={searchQuery} locationFilter={locationFilter} keywordFilter={keywordFilter}
        />

        {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-brand-500 animate-spin" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredOffers.map((offer) => (
                <OfferCard 
                    key={offer.id} offer={offer} 
                    onContact={(profile) => handleContact(profile, offer.title)} 
                    onUserClick={(profile) => handleViewProfile(profile)} 
                    onRate={handleRateOffer} 
                    currentUserId={authUid || undefined} viewMode={viewMode}
                    onDelete={handleDeleteOffer}
                    onEdit={(o) => { setEditingOffer(o); setIsCreateModalOpen(true); }}
                />
              ))}
              <div onClick={() => handleOpenCreate()} className="cursor-pointer border-2 border-dashed border-brand-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-all group">
                   <div className="bg-brand-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><Plus className="w-8 h-8 text-brand-600" /></div>
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
            onApproveUpdate={(id) => db.collection("users").doc(id).get().then(s => { const d = s.data(); if(d?.pendingUpdate) db.collection("users").doc(id).set({...d, ...d.pendingUpdate, pendingUpdate: null}) })}
            onRejectUpdate={(id) => db.collection("users").doc(id).update({pendingUpdate: null})}
            offers={offers} onDeleteOffer={handleDeleteOffer}
            onBulkDelete={(t) => {}} onApproveOffer={(id) => db.collection("offers").doc(id).update({status:'active'})}
            onEditOffer={(o) => { setEditingOffer(o); setIsCreateModalOpen(true); }}
            availableCategories={availableCategories} availableInterests={availableInterests}
            pendingCategories={taxonomy.pendingCategories || []} pendingInterests={taxonomy.pendingInterests || []}
            onAddCategory={(c) => db.collection("system_metadata").doc("taxonomy").update({approvedCategories: firebase.firestore.FieldValue.arrayUnion(c)})}
            onAddInterest={(i) => db.collection("system_metadata").doc("taxonomy").update({approvedInterests: firebase.firestore.FieldValue.arrayUnion(i)})}
            onDeleteCategory={(c) => {}} onDeleteInterest={(i) => {}}
            onApproveCategory={(c) => {}} onRejectCategory={(c) => {}}
            onReassignCategory={(o,n) => {}} onApproveInterest={(i) => {}} onRejectInterest={(i) => {}}
            onEditCategory={(o,n,p) => {}} onEditInterest={(o,n) => {}}
            ads={systemAds} onAddAd={(ad) => db.collection("systemAds").doc(ad.id).set(ad)}
            onEditAd={(ad) => db.collection("systemAds").doc(ad.id).set(ad)}
            onDeleteAd={(id) => db.collection("systemAds").doc(id).delete()}
            onViewProfile={(u) => handleViewProfile(u)}
          />
      )}

      {isEmailCenterOpen && <EmailCenterModal isOpen={isEmailCenterOpen} onClose={() => setIsEmailCenterOpen(false)} />}
      <PostRegisterPrompt isOpen={isPostRegisterPromptOpen} onClose={() => setIsPostRegisterPromptOpen(false)} onStartOffer={() => handleOpenCreate()} userName={currentUser?.name || ''} />
      <ProfessionalismPrompt isOpen={isProfessionalismPromptOpen} onClose={() => setIsProfessionalismPromptOpen(false)} onEditProfile={() => { setIsProfessionalismPromptOpen(false); if (currentUser) { handleViewProfile(currentUser); setProfileForceEditMode(true); } }} />
      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setTargetUserForOffer(null); }} onAddOffer={handleAddOffer} currentUser={targetUserForOffer || currentUser || { id:'guest', name:'אורח', avatarUrl:'', role:'user', expertise:ExpertiseLevel.JUNIOR, mainField:'', portfolioUrl:'' } as UserProfile} editingOffer={editingOffer} onUpdateOffer={(o) => db.collection("offers").doc(o.id).set(o)} />
      <MessagingModal isOpen={isMessagingModalOpen} onClose={() => setIsMessagingModalOpen(false)} currentUser={authUid || 'guest'} messages={messages} onSendMessage={handleSendMessage} onMarkAsRead={(id) => db.collection("messages").doc(id).update({isRead: true})} recipientProfile={selectedProfile} initialSubject={initialMessageSubject} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => { setIsProfileModalOpen(false); setProfileForceEditMode(false); }} profile={selectedProfile} currentUser={currentUser} userOffers={offers.filter(o => o.profileId === selectedProfile?.id)} onDeleteOffer={handleDeleteOffer} onUpdateProfile={handleUpdateProfile} onContact={(p) => handleContact(p)} availableCategories={availableCategories} availableInterests={availableInterests} startInEditMode={profileForceEditMode} onOpenCreateOffer={(p) => { setIsProfileModalOpen(false); handleOpenCreate(p); }} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} onOpenAuth={() => { setAuthStartOnRegister(true); setIsAuthModalOpen(true); }} />
      <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} onStartSearching={() => window.scrollTo({ top: 600, behavior: 'smooth' })} />
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
      <CookieConsentModal />
    </div>
  );
};
