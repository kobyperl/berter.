
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
  // --- Auth & Profile State ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // --- Core Data State ---
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: CATEGORIES,
      pendingCategories: [],
      approvedInterests: COMMON_INTERESTS,
      pendingInterests: [],
      categoryHierarchy: {}
  });

  // --- Email Trigger Helper ---
  const triggerEmailNotification = async (type: 'welcome' | 'chat_alert' | 'smart_match', to: string, data: any) => {
      if (!to) return;
      try {
          console.log(`[Email System] Requesting ${type} to ${to}`);
          const response = await fetch('/api/emails/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, to, data })
          });
          if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              console.error("[Email System] API error:", response.status, err);
          }
      } catch (err) {
          console.error("[Email System] Fetch error:", err);
      }
  };

  // --- Auth Handlers ---
  const handleLogout = async () => { 
    try {
      await auth.signOut(); 
      setCurrentUser(null);
      setAuthUid(null);
      setMessages([]);
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    try { 
      await auth.signInWithEmailAndPassword(email, pass); 
      setIsAuthModalOpen(false); 
    } catch (error: any) { 
      alert("שגיאה בהתחברות: " + error.message); 
    }
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
        setAuthUid(uid);
        setIsAuthModalOpen(false);

        // TRIGGER: Welcome Email to the NEW customer
        if (userProfile.email) {
            triggerEmailNotification('welcome', userProfile.email, { userName: userProfile.name });
        }
        
        setTimeout(() => setIsPostRegisterPromptOpen(true), 1000);
    } catch (error: any) { 
      alert(`שגיאה בהרשמה: ${error.message}`); 
    }
  };

  // --- Auth Listeners ---
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

  useEffect(() => {
    if (!authUid) return;
    const unsubscribeUserDoc = db.collection("users").doc(authUid).onSnapshot((docSnap) => {
        if (docSnap.exists) {
            setCurrentUser(docSnap.data() as UserProfile);
        }
    });
    return () => unsubscribeUserDoc();
  }, [authUid]);

  // --- Main Content Loading & Data Privacy ---
  useEffect(() => {
    // 1. Load Admin-only users list
    let unsubscribeUsers = () => {};
    if (currentUser?.role === 'admin') {
        unsubscribeUsers = db.collection("users").onSnapshot((snapshot) => {
          const fetchedUsers: UserProfile[] = [];
          snapshot.forEach((doc) => fetchedUsers.push(doc.data() as UserProfile));
          setUsers(fetchedUsers);
        });
    }

    // 2. Load Public Offers
    const unsubscribeOffers = db.collection("offers").onSnapshot((snapshot) => {
      const fetchedOffers: BarterOffer[] = [];
      snapshot.forEach((doc) => fetchedOffers.push(doc.data() as BarterOffer));
      setOffers(fetchedOffers);
      setIsLoading(false); 
    });

    // 3. Load System Ads
    const unsubscribeAds = db.collection("systemAds").onSnapshot((snapshot) => {
      const fetchedAds: SystemAd[] = [];
      snapshot.forEach((doc) => fetchedAds.push(doc.data() as SystemAd));
      setSystemAds(fetchedAds);
    });

    // 4. PRIVACY: Load ONLY messages where current user is involved (sender OR receiver)
    let unsubscribeSent = () => {};
    let unsubscribeReceived = () => {};

    if (authUid) {
        const mergeMessages = (newMsgs: Message[]) => {
            setMessages(prev => {
                const combined = [...prev, ...newMsgs];
                // Keep only unique messages and only those belonging to current user
                const uniqueMap = new Map(combined.map(m => [m.id, m]));
                return Array.from(uniqueMap.values()).filter(m => m.senderId === authUid || m.receiverId === authUid);
            });
        };

        unsubscribeSent = db.collection("messages")
            .where("senderId", "==", authUid)
            .onSnapshot((snapshot) => {
                const msgs: Message[] = [];
                snapshot.forEach(doc => msgs.push(doc.data() as Message));
                mergeMessages(msgs);
            });

        unsubscribeReceived = db.collection("messages")
            .where("receiverId", "==", authUid)
            .onSnapshot((snapshot) => {
                const msgs: Message[] = [];
                snapshot.forEach(doc => msgs.push(doc.data() as Message));
                mergeMessages(msgs);
            });
    }

    // 5. Load Taxonomy
    const unsubscribeTaxonomy = db.collection("system_metadata").doc("taxonomy").onSnapshot((docSnap) => {
        if (docSnap.exists) setTaxonomy(docSnap.data() as SystemTaxonomy);
    });

    return () => {
      unsubscribeUsers(); unsubscribeOffers(); unsubscribeAds();
      unsubscribeSent(); unsubscribeReceived(); unsubscribeTaxonomy();
    };
  }, [currentUser?.role, authUid]); 

  // --- Action Handlers ---
  const handleSendMessage = async (receiverId: string, receiverName: string, subject: string, content: string) => {
    if (!authUid) return;
    const newMessage: Message = {
      id: Date.now().toString(), senderId: authUid, receiverId, 
      senderName: currentUser?.name || 'אורח', receiverName, 
      subject, content, timestamp: new Date().toISOString(), isRead: false
    };
    try { 
        await db.collection("messages").doc(newMessage.id).set(newMessage);
        
        // TRIGGER: Chat Alert Email to the RECIPIENT customer
        const recipientSnap = await db.collection("users").doc(receiverId).get();
        if (recipientSnap.exists) {
            const recipientData = recipientSnap.data() as UserProfile;
            if (recipientData.email) {
                triggerEmailNotification('chat_alert', recipientData.email, {
                    userName: recipientData.name,
                    senderName: currentUser?.name || 'משתמש מהאתר'
                });
            }
        }
    } catch (error) { console.error("Error sending message:", error); }
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
      try { await db.collection("offers").doc(offerId).delete(); } catch (e) { console.error(e); }
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
      try {
          if (currentUser?.role === 'admin') {
              await db.collection("users").doc(updated.id).set(updated, { merge: true });
          } else {
              // Users updates are staged for approval
              await db.collection("users").doc(updated.id).update({ pendingUpdate: updated });
          }
      } catch (e) { alert("שגיאה בעדכון הפרופיל"); }
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
  const [durationFilter, setDurationFilter] = useState<'all' | 'one-time' | 'ongoing'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'deadline'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // --- Computed Views ---
  const availableInterests = useMemo(() => Array.from(new Set([...taxonomy.approvedInterests])).sort(), [taxonomy.approvedInterests]);
  const availableCategories = useMemo(() => Array.from(new Set([...taxonomy.approvedCategories])).sort(), [taxonomy.approvedCategories]);

  const filteredOffers = useMemo(() => {
    return offers.filter(offer => {
      // Visibility rules
      if (offer.status !== 'active' && offer.profileId !== authUid && currentUser?.role !== 'admin') return false;
      
      // Search filters
      if (searchQuery && !offer.title.toLowerCase().includes(searchQuery.toLowerCase()) && !offer.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (locationInput && !offer.location.toLowerCase().includes(locationInput.toLowerCase())) return false;
      if (keywordInput && !offer.title.toLowerCase().includes(keywordInput.toLowerCase())) return false;
      if (durationFilter !== 'all' && offer.durationType !== durationFilter) return false;
      if (selectedCategories.length > 0 && !selectedCategories.some(c => offer.tags.includes(c) || offer.offeredService.includes(c))) return false;
      
      return true;
    }).sort((a, b) => {
        if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [offers, searchQuery, locationInput, keywordInput, durationFilter, selectedCategories, authUid, currentUser, sortBy]);

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

  const toggleCategory = (category: string) => {
      if (category === 'הכל') { setSelectedCategories([]); return; }
      setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

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
                    onContact={(profile) => handleContact(profile, offer.title)} 
                    onUserClick={(profile) => handleViewProfile(profile)} 
                    onRate={async (id, score) => {
                        const offer = offers.find(o => o.id === id);
                        if (!offer || !authUid) return;
                        const ratings = [...(offer.ratings || []), { userId: authUid, score }];
                        const avg = ratings.reduce((a,b) => a+b.score, 0) / ratings.length;
                        await db.collection("offers").doc(id).update({ ratings, averageRating: avg });
                    }} 
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
            onApproveUpdate={(id) => {
                const u = users.find(x => x.id === id);
                if (u?.pendingUpdate) db.collection("users").doc(id).set({...u, ...u.pendingUpdate, pendingUpdate: null});
            }}
            onRejectUpdate={(id) => db.collection("users").doc(id).update({pendingUpdate: null})}
            offers={offers} onDeleteOffer={handleDeleteOffer}
            onBulkDelete={() => {}} onApproveOffer={(id) => db.collection("offers").doc(id).update({status:'active'})}
            onEditOffer={(o) => { setEditingOffer(o); setIsCreateModalOpen(true); }}
            availableCategories={availableCategories} availableInterests={availableInterests}
            pendingCategories={taxonomy.pendingCategories || []} pendingInterests={taxonomy.pendingInterests || []}
            onAddCategory={(c) => db.collection("system_metadata").doc("taxonomy").update({approvedCategories: firebase.firestore.FieldValue.arrayUnion(c)})}
            onAddInterest={(i) => db.collection("system_metadata").doc("taxonomy").update({approvedInterests: firebase.firestore.FieldValue.arrayUnion(i)})}
            onDeleteCategory={(c) => db.collection("system_metadata").doc("taxonomy").update({approvedCategories: firebase.firestore.FieldValue.arrayRemove(c)})}
            onDeleteInterest={(i) => db.collection("system_metadata").doc("taxonomy").update({approvedInterests: firebase.firestore.FieldValue.arrayRemove(i)})}
            onApproveCategory={(c) => db.collection("system_metadata").doc("taxonomy").update({approvedCategories: firebase.firestore.FieldValue.arrayUnion(c), pendingCategories: firebase.firestore.FieldValue.arrayRemove(c)})}
            onRejectCategory={(c) => db.collection("system_metadata").doc("taxonomy").update({pendingCategories: firebase.firestore.FieldValue.arrayRemove(c)})}
            onReassignCategory={() => {}} onApproveInterest={(i) => {}} onRejectInterest={(i) => {}}
            onEditCategory={() => {}} onEditInterest={() => {}}
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
