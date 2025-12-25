
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
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { EmailCenterModal } from './components/EmailCenterModal';
import { PostRegisterPrompt } from './components/PostRegisterPrompt';
import { ProfessionalismPrompt } from './components/ProfessionalismPrompt';

// Data & Types
import { CATEGORIES, COMMON_INTERESTS, ADMIN_EMAIL } from './constants';
import { Plus, Loader2, ChevronDown } from 'lucide-react';
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

export const App: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  
  // Split state for messages to strictly comply with Firestore Rules
  const [sentMessagesMap, setSentMessagesMap] = useState<Record<string, Message>>({});
  const [receivedMessagesMap, setReceivedMessagesMap] = useState<Record<string, Message>>({});
  
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isOffersLoading, setIsOffersLoading] = useState(true);
  
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: [], pendingCategories: [], approvedInterests: [], pendingInterests: [], categoryHierarchy: {}
  });

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
          setAuthUid(firebaseUser.uid);
      } else {
          setAuthUid(null);
          setCurrentUser(null);
          setSentMessagesMap({});
          setReceivedMessagesMap({});
          setIsAuthChecking(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // 2. Profile Sync
  useEffect(() => {
    if (!authUid) return;
    const unsub = db.collection("users").doc(authUid).onSnapshot(
      doc => {
        if (doc.exists) {
          setCurrentUser({ ...doc.data() as UserProfile, id: doc.id });
        }
        setIsAuthChecking(false);
      },
      err => { setIsAuthChecking(false); }
    );
    return () => unsub();
  }, [authUid]);

  // 3. Main Data Fetch
  useEffect(() => {
    const unsubOffers = db.collection("offers").onSnapshot(
        s => { 
            let f: any[] = []; 
            s.forEach(d => f.push({...d.data(), id: d.id})); 
            setOffers(f); 
            setIsOffersLoading(false); 
        },
        e => { setIsOffersLoading(false); }
    );
    const unsubAds = db.collection("systemAds").onSnapshot(
        s => { let f: any[] = []; s.forEach(d => f.push({...d.data(), id: d.id})); setSystemAds(f); }
    );
    const unsubTax = db.collection("system").doc("taxonomy").onSnapshot(
        d => d.exists && setTaxonomy(d.data() as SystemTaxonomy)
    );
    return () => { unsubOffers(); unsubAds(); unsubTax(); };
  }, [authUid]);

  // 4. Messaging Listener
  useEffect(() => {
    if (!authUid) {
        setSentMessagesMap({});
        setReceivedMessagesMap({});
        return;
    }

    const q1 = db.collection("messages").where("senderId", "==", authUid);
    const unsubSent = q1.onSnapshot(
        snapshot => {
            const msgs: Record<string, Message> = {};
            snapshot.forEach(doc => {
                msgs[doc.id] = { ...doc.data(), id: doc.id } as Message;
            });
            setSentMessagesMap(msgs);
        }, 
        error => console.error("Error reading sent messages (q1):", error)
    );

    const q2 = db.collection("messages").where("receiverId", "==", authUid);
    const unsubReceived = q2.onSnapshot(
        snapshot => {
            const msgs: Record<string, Message> = {};
            snapshot.forEach(doc => {
                msgs[doc.id] = { ...doc.data(), id: doc.id } as Message;
            });
            setReceivedMessagesMap(msgs);
        }, 
        error => console.error("Error reading received messages (q2):", error)
    );

    return () => {
        unsubSent();
        unsubReceived();
    };
  }, [authUid]);

  // 5. Admin Data Fetch
  useEffect(() => {
    if (!authUid || !currentUser || currentUser.role !== 'admin') return;
    const unsubUsers = db.collection("users").onSnapshot(
      s => { let f: any[] = []; s.forEach(d => f.push({...d.data(), id: d.id})); setUsers(f); }
    );
    return () => { unsubUsers(); };
  }, [authUid, currentUser?.role]);

  // 6. Smart Match Email Logic
  useEffect(() => {
      if (!currentUser || !offers.length || isOffersLoading) return;

      const checkSmartMatch = async () => {
          // Check if we should even run this (spam prevention)
          if (currentUser.lastSmartMatchSent) {
              const lastSent = new Date(currentUser.lastSmartMatchSent);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - lastSent.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              // Only send once every 7 days
              if (diffDays < 7) return; 
          }

          // Calculate "For You" Matches
          const myCategories = [currentUser.mainField, ...(currentUser.secondaryFields || [])];
          const myInterests = currentUser.interests || [];
          
          const relevantOffers = offers.filter(o => {
              if (o.profileId === currentUser.id || o.status !== 'active') return false;
              // Check if offer needs my skills (requested service matches my field)
              const requestedMatch = myCategories.some(cat => o.requestedService.includes(cat) || o.title.includes(cat));
              // Check if offer provides something I'm interested in (tags/service match my interests)
              const interestMatch = myInterests.some(int => o.tags.includes(int) || o.offeredService.includes(int));
              return requestedMatch || interestMatch;
          });

          // Trigger Email if Matches > 5
          if (relevantOffers.length >= 5) {
              try {
                  // Send Email
                  await fetch('/api/emails/send', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          type: 'smart_match',
                          to: currentUser.email,
                          data: { userName: currentUser.name }
                      })
                  });

                  // Update Timestamp
                  await db.collection("users").doc(currentUser.id).update({
                      lastSmartMatchSent: new Date().toISOString()
                  });
                  console.log("Smart match email sent successfully");
              } catch (e) {
                  console.error("Failed to send smart match email", e);
              }
          }
      };

      checkSmartMatch();
  }, [currentUser, offers, isOffersLoading]);


  // --- Computed ---
  const messages = useMemo(() => {
    const combinedMap = { ...sentMessagesMap, ...receivedMessagesMap };
    return Object.values(combinedMap).sort((a: Message, b: Message) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeB - timeA; 
    });
  }, [sentMessagesMap, receivedMessagesMap]);

  const availableInterests = useMemo(() => Array.from(new Set([...COMMON_INTERESTS, ...(taxonomy.approvedInterests || [])])).sort(), [taxonomy.approvedInterests]);
  const availableCategories = useMemo(() => Array.from(new Set([...CATEGORIES, ...(taxonomy.approvedCategories || [])])).sort(), [taxonomy.approvedCategories]);

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
  const [isPostRegisterPromptOpen, setIsPostRegisterPromptOpen] = useState(false);
  const [isProfessionalismPromptOpen, setIsProfessionalismPromptOpen] = useState(false);
  const [profileModalStartEdit, setProfileModalStartEdit] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [initialMessageSubject, setInitialMessageSubject] = useState<string>('');
  const [viewFilter, setViewFilter] = useState<'all' | 'for_you'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [durationFilter, setDurationFilter] = useState<'all' | 'one-time' | 'ongoing'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'deadline'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [visibleCount, setVisibleCount] = useState(12); // Performance: Render 12 cards initially for grid alignment (3x4 or 2x6)

  // --- Handlers ---
  const handleRegister = async (u: Partial<UserProfile>, p: string) => {
    try {
        const cred = await auth.createUserWithEmailAndPassword(u.email!, p);
        const uid = cred.user!.uid;
        const profileData = { ...u, id: uid, role: u.email === ADMIN_EMAIL ? 'admin' : 'user', joinedAt: new Date().toISOString() };
        await db.collection("users").doc(uid).set(profileData);
        
        // -----------------------
        // TRIGGER: Welcome Email
        // -----------------------
        if (u.email) {
            fetch('/api/emails/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'welcome',
                    to: u.email,
                    data: { userName: u.name || 'משתמש חדש' }
                })
            }).catch(err => console.error("Welcome email failed", err));
        }

        setIsAuthModalOpen(false);
        // Show the post-registration onboarding popup
        setIsPostRegisterPromptOpen(true);
    } catch (e: any) { 
        console.error("Registration Error:", e);
        if (e.code && e.code.startsWith('auth/')) {
            alert(translateAuthError(e.code));
        } else if (e.toString().includes("maximum allowed size") || e.code === 'invalid-argument') {
            alert("שגיאה ביצירת הפרופיל: התמונות שבחרת גדולות מדי. אנא נסה להירשם עם תמונה קלה יותר או פחות תמונות בגלריה.");
        } else {
            alert("אירעה שגיאה כללית בתהליך ההרשמה. אנא נסה שוב.");
        }
    }
  };

  const handleLogin = async (e: string, p: string) => { try { await auth.signInWithEmailAndPassword(e, p); setIsAuthModalOpen(false); } catch (e: any) { alert(translateAuthError(e.code)); } };
  const handleLogout = async () => { await auth.signOut(); };
  
  const handleAddOffer = async (o: BarterOffer) => { 
      if (!authUid) return; 
      try {
          await db.collection("offers").doc(o.id).set(o);
          // Only show professionalism prompt if it's not a bulk admin update or similar
          if (o.profileId === authUid) {
              setIsProfessionalismPromptOpen(true);
          }
      } catch (e) {
          console.error("Error adding offer:", e);
      }
  };

  const handleRate = async (offerId: string, rating: number) => {
      if (!authUid) return;
      const offerRef = db.collection("offers").doc(offerId);
      try {
          await db.runTransaction(async (transaction) => {
              const doc = await transaction.get(offerRef);
              if (!doc.exists) return;
              
              const data = doc.data() as BarterOffer;
              const ratings = data.ratings || [];
              const existingIndex = ratings.findIndex(r => r.userId === authUid);
              
              let newRatings = [...ratings];
              if (existingIndex > -1) {
                  newRatings[existingIndex] = { userId: authUid, score: rating };
              } else {
                  newRatings.push({ userId: authUid, score: rating });
              }
              
              const averageRating = newRatings.reduce((acc, curr) => acc + curr.score, 0) / newRatings.length;
              
              transaction.update(offerRef, {
                  ratings: newRatings,
                  averageRating: averageRating
              });
          });
      } catch (e) {
          console.error("Error rating offer:", e);
          alert("אירעה שגיאה בשמירת הדירוג.");
      }
  };

  const handleGlobalProfileUpdate = async (profileData: any) => {
      try {
          // 1. Update the User Document (This handles the merge and the pendingUpdate delete if present)
          await db.collection("users").doc(profileData.id).set(profileData, { merge: true });

          // 2. Update Offers
          // Create a "clean" object for the offers (snapshot).
          const cleanProfile = { ...profileData };
          delete cleanProfile.pendingUpdate; // Don't store pending state in offers
          delete cleanProfile.password; // Security cleanup just in case
          
          const offersSnap = await db.collection("offers").where("profileId", "==", profileData.id).get();
          const batch = db.batch();
          
          if (!offersSnap.empty) {
              offersSnap.forEach(doc => {
                  batch.update(doc.ref, { profile: cleanProfile });
              });
              await batch.commit();
          }
      } catch (e) {
          console.error("Global Update Error:", e);
          alert("אירעה שגיאה בעדכון הגורף של הפרופיל.");
      }
  };

  const filteredOffers = useMemo(() => {
    return offers.filter(o => {
      const isMine = authUid && o.profileId === authUid;
      const isAdmin = currentUser?.role === 'admin';
      if (o.status !== 'active' && !isMine && !isAdmin) return false; 
      const q = searchQuery.toLowerCase();
      if (searchQuery && !((o.title||'').toLowerCase().includes(q) || (o.description||'').toLowerCase().includes(q))) return false;
      if (durationFilter !== 'all' && o.durationType !== durationFilter) return false;
      if (selectedCategories.length > 0) {
          const matches = selectedCategories.some(c => (o.tags || []).includes(c) || (o.offeredService || '').includes(c));
          if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
        if (sortBy === 'deadline') {
            if (!a.expirationDate) return 1;
            if (!b.expirationDate) return -1;
            return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        }
        return 0;
    });
  }, [offers, authUid, currentUser?.role, searchQuery, durationFilter, selectedCategories, sortBy]);

  // Reset visible count when filters change to maintain fast perceived performance
  useEffect(() => {
      setVisibleCount(12);
  }, [searchQuery, durationFilter, selectedCategories, sortBy, viewFilter]);

  const visibleOffers = useMemo(() => {
      return filteredOffers.slice(0, visibleCount);
  }, [filteredOffers, visibleCount]);

  const handleLoadMore = () => {
      setVisibleCount(prev => prev + 12);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AccessibilityToolbar />
      <Navbar 
        currentUser={currentUser}
        onOpenCreateModal={() => { if(!authUid){ setAuthStartOnRegister(true); setIsAuthModalOpen(true); return; } setEditingOffer(null); setIsCreateModalOpen(true); }}
        onOpenMessages={() => { if(!authUid){ setIsAuthModalOpen(true); return; } setIsMessagingModalOpen(true); }}
        onOpenAuth={() => { setAuthStartOnRegister(false); setIsAuthModalOpen(true); }}
        onOpenProfile={() => { setSelectedProfile(currentUser); setProfileModalStartEdit(false); setIsProfileModalOpen(true); }}
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
            {isOffersLoading ? [1,2,3,4,5,6].map(i => <div key={i} className="h-64 bg-white rounded-xl skeleton"></div>) : (
                <>
                    {visibleOffers.map((o) => (
                        <OfferCard 
                            key={o.id} offer={o} 
                            onContact={p => { setSelectedProfile(p); setInitialMessageSubject(o.title); setIsMessagingModalOpen(true); }} 
                            onUserClick={p => { setSelectedProfile(p); setProfileModalStartEdit(false); setIsProfileModalOpen(true); }} 
                            currentUserId={authUid || undefined} viewMode={viewMode}
                            onRate={handleRate}
                            onDelete={(authUid === o.profileId || currentUser?.role === 'admin') ? id => db.collection("offers").doc(id).delete() : undefined}
                            onEdit={(authUid === o.profileId || currentUser?.role === 'admin') ? offer => { setEditingOffer(offer); setIsCreateModalOpen(true); } : undefined}
                        />
                    ))}
                    {visibleCount >= filteredOffers.length && (
                        <div onClick={() => setIsCreateModalOpen(true)} className="cursor-pointer border-2 border-dashed border-brand-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-all group">
                            <div className="bg-brand-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><Plus className="w-8 h-8 text-brand-600" /></div>
                            <h3 className="text-xl font-bold text-slate-800">פרסם הצעה חדשה</h3>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Load More Button */}
        {!isOffersLoading && visibleCount < filteredOffers.length && (
            <div className="mt-12 flex justify-center">
                <button 
                    onClick={handleLoadMore}
                    className="bg-white border border-slate-200 text-slate-700 px-8 py-3 rounded-full font-bold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center gap-2"
                >
                    <ChevronDown className="w-5 h-5 text-brand-600" />
                    טען עוד הצעות
                    <span className="text-xs text-slate-400 font-normal mr-1">({filteredOffers.length - visibleCount} נותרו)</span>
                </button>
            </div>
        )}
      </main>

      <Footer onOpenAccessibility={() => setIsAccessibilityOpen(true)} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      
      {isAdminDashboardOpen && (
          <AdminDashboardModal 
            isOpen={isAdminDashboardOpen} onClose={() => setIsAdminDashboardOpen(false)}
            users={users} currentUser={currentUser} 
            onDeleteUser={id => db.collection("users").doc(id).delete()}
            onApproveUpdate={id => {
                const u = users.find(x => x.id === id);
                if (u && u.pendingUpdate) {
                    const updatedProfile = { 
                        ...u, 
                        ...u.pendingUpdate, 
                        pendingUpdate: firebase.firestore.FieldValue.delete() 
                    };
                    handleGlobalProfileUpdate(updatedProfile);
                }
            }} 
            onRejectUpdate={id => db.collection("users").doc(id).update({ pendingUpdate: firebase.firestore.FieldValue.delete() })}
            offers={offers} onDeleteOffer={id => db.collection("offers").doc(id).delete()}
            onBulkDelete={date => {
                offers.filter(o => new Date(o.createdAt) < new Date(date)).forEach(o => db.collection("offers").doc(o.id).delete());
            }} 
            onApproveOffer={id => db.collection("offers").doc(id).update({status:'active'})}
            onEditOffer={o => { setEditingOffer(o); setIsCreateModalOpen(true); }}
            availableCategories={availableCategories} availableInterests={availableInterests}
            pendingCategories={taxonomy.pendingCategories || []} pendingInterests={taxonomy.pendingInterests || []}
            categoryHierarchy={taxonomy.categoryHierarchy}
            onAddCategory={cat => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(cat) })} 
            onAddInterest={int => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(int) })} 
            onDeleteCategory={cat => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayRemove(cat) })} 
            onDeleteInterest={int => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayRemove(int) })}
            onApproveCategory={cat => db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(cat), pendingCategories: firebase.firestore.FieldValue.arrayRemove(cat) })}
            onRejectCategory={cat => db.collection("system").doc("taxonomy").update({ pendingCategories: firebase.firestore.FieldValue.arrayRemove(cat) })}
            onReassignCategory={(oldC, newC) => db.collection("system").doc("taxonomy").update({ pendingCategories: firebase.firestore.FieldValue.arrayRemove(oldC), approvedCategories: firebase.firestore.FieldValue.arrayUnion(newC) })}
            onApproveInterest={int => db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(int), pendingInterests: firebase.firestore.FieldValue.arrayRemove(int) })}
            onRejectInterest={int => db.collection("system").doc("taxonomy").update({ pendingInterests: firebase.firestore.FieldValue.arrayRemove(int) })}
            onEditCategory={(oldN, newN, p) => {
                db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayRemove(oldN), [`categoryHierarchy.${newN}`]: p || firebase.firestore.FieldValue.delete() });
                db.collection("system").doc("taxonomy").update({ approvedCategories: firebase.firestore.FieldValue.arrayUnion(newN) });
            }}
            onEditInterest={(oldN, newN) => { 
                db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayRemove(oldN) }); 
                db.collection("system").doc("taxonomy").update({ approvedInterests: firebase.firestore.FieldValue.arrayUnion(newN) }); 
            }}
            ads={systemAds} onAddAd={ad => db.collection("systemAds").doc(ad.id).set(ad)}
            onEditAd={ad => db.collection("systemAds").doc(ad.id).set(ad)}
            onDeleteAd={id => db.collection("systemAds").doc(id).delete()}
            onViewProfile={u => { setSelectedProfile(u); setProfileModalStartEdit(false); setIsProfileModalOpen(true); }}
          />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(false)} />
      
      <MessagingModal 
        isOpen={isMessagingModalOpen} onClose={() => setIsMessagingModalOpen(false)} currentUser={authUid || 'guest'} messages={messages} 
        onSendMessage={(rid, rn, s, c) => {
            if (!authUid || !rid) return; 
            const msgData = { senderId: authUid, receiverId: rid, participantIds: [authUid, rid], senderName: currentUser?.name || 'משתמש', receiverName: rn, subject: s, content: c, timestamp: new Date().toISOString(), isRead: false };
            db.collection("messages").add(msgData);
            
            // -----------------------
            // TRIGGER: Chat Alert Email
            // -----------------------
            db.collection("users").doc(rid).get().then(doc => {
                const userData = doc.data() as UserProfile;
                if (userData && userData.email) {
                     fetch('/api/emails/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'chat_alert',
                            to: userData.email,
                            data: { 
                                userName: userData.name,
                                senderName: currentUser?.name || 'משתמש'
                            }
                        })
                    }).catch(err => console.error("Chat alert email failed", err));
                }
            });
        }} 
        onMarkAsRead={id => { if (!authUid) return; db.collection("messages").doc(id).update({ isRead: true }); }} 
        recipientProfile={selectedProfile} initialSubject={initialMessageSubject} 
      />

      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        profile={selectedProfile} 
        currentUser={currentUser} 
        userOffers={offers.filter(o => o.profileId === selectedProfile?.id)} 
        onDeleteOffer={id => db.collection("offers").doc(id).delete()} 
        onUpdateProfile={handleGlobalProfileUpdate} 
        onContact={p => { setSelectedProfile(p); setIsMessagingModalOpen(true); }} 
        onRate={handleRate}
        availableCategories={availableCategories} 
        availableInterests={availableInterests} 
        onOpenCreateOffer={p => { setSelectedProfile(p); setIsCreateModalOpen(true); }} 
        startInEditMode={profileModalStartEdit} 
      />
      
      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setEditingOffer(null); }} onAddOffer={handleAddOffer} currentUser={currentUser || {id:'guest'} as UserProfile} editingOffer={editingOffer} onUpdateOffer={o => db.collection("offers").doc(o.id).set(o)} />
      
      <PostRegisterPrompt 
        isOpen={isPostRegisterPromptOpen} 
        onClose={() => setIsPostRegisterPromptOpen(false)} 
        onStartOffer={() => { setIsPostRegisterPromptOpen(false); setIsCreateModalOpen(true); }} 
        userName={currentUser?.name || ''} 
      />

      <ProfessionalismPrompt 
        isOpen={isProfessionalismPromptOpen}
        onClose={() => setIsProfessionalismPromptOpen(false)}
        onEditProfile={() => { setIsProfessionalismPromptOpen(false); setSelectedProfile(currentUser); setProfileModalStartEdit(true); setIsProfileModalOpen(true); }}
        userName={currentUser?.name || ''}
      />

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
