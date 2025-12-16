import React, { useState, useEffect, useMemo } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  arrayUnion,
  arrayRemove,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './services/firebaseConfig';
import { 
  UserProfile, 
  BarterOffer, 
  SystemAd, 
  Message, 
  ExpertiseLevel,
  SystemTaxonomy
} from './types';
import { ADMIN_EMAIL, CATEGORIES, COMMON_INTERESTS } from './constants';

// Components
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AdBanner } from './components/AdBanner';
import { OfferCard } from './components/OfferCard';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { CreateOfferModal } from './components/CreateOfferModal';
import { MessagingModal } from './components/MessagingModal';
import { ProfileModal } from './components/ProfileModal';
import { UsersListModal } from './components/UsersListModal';
import { AdminOffersModal } from './components/AdminOffersModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { AdminAdManager } from './components/AdminAdManager';
import { WhoIsItForModal } from './components/WhoIsItForModal';
import { SearchTipsModal } from './components/SearchTipsModal';
import { CookieConsentModal } from './components/CookieConsentModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { AdminAnalyticsModal } from './components/AdminAnalyticsModal';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { EmailCenterModal } from './components/EmailCenterModal';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Taxonomy State
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: CATEGORIES,
      pendingCategories: [],
      approvedInterests: COMMON_INTERESTS,
      pendingInterests: []
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFeed, setActiveFeed] = useState<'all' | 'for_you'>('all');
  
  // Modals
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModeRegister, setAuthModeRegister] = useState(false);
  const [isCreateOfferModalOpen, setIsCreateOfferModalOpen] = useState(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [isUsersListModalOpen, setIsUsersListModalOpen] = useState(false);
  const [isAdminOffersModalOpen, setIsAdminOffersModalOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isAdminAdManagerOpen, setIsAdminAdManagerOpen] = useState(false);
  const [isWhoIsItForOpen, setIsWhoIsItForOpen] = useState(false);
  const [isSearchTipsOpen, setIsSearchTipsOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isAdminAnalyticsOpen, setIsAdminAnalyticsOpen] = useState(false);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isEmailCenterOpen, setIsEmailCenterOpen] = useState(false);
  
  // Edit State
  const [editingOffer, setEditingOffer] = useState<BarterOffer | null>(null);
  const [msgRecipient, setMsgRecipient] = useState<UserProfile | null>(null);

  // --- Initialization ---

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setCurrentUser(userDoc.data() as UserProfile);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
     // Taxonomy
     const unsubTax = onSnapshot(doc(db, "system", "taxonomy"), (docSnap) => {
         if (docSnap.exists()) {
             setTaxonomy(docSnap.data() as SystemTaxonomy);
         } else {
             // Initialize taxonomy if missing
             setDoc(doc(db, "system", "taxonomy"), {
                 approvedCategories: CATEGORIES,
                 pendingCategories: [],
                 approvedInterests: COMMON_INTERESTS,
                 pendingInterests: []
             });
         }
     });

     // Users
     const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
         setUsers(snapshot.docs.map(d => d.data() as UserProfile));
     });

     // Offers
     const qOffers = query(collection(db, "offers"), orderBy("createdAt", "desc"));
     const unsubOffers = onSnapshot(qOffers, (snapshot) => {
         setOffers(snapshot.docs.map(d => d.data() as BarterOffer));
     });

     // Ads
     const unsubAds = onSnapshot(collection(db, "ads"), (snapshot) => {
         setSystemAds(snapshot.docs.map(d => d.data() as SystemAd));
     });

     // Messages (if logged in)
     let unsubMessages = () => {};
     if (auth.currentUser) {
        const qMsgs = query(collection(db, "messages"), orderBy("timestamp", "asc"));
        unsubMessages = onSnapshot(qMsgs, (snapshot) => {
            const allMsgs = snapshot.docs.map(d => d.data() as Message);
            const myMsgs = allMsgs.filter(m => m.senderId === auth.currentUser?.uid || m.receiverId === auth.currentUser?.uid);
            setMessages(myMsgs);
        });
     }

     return () => {
         unsubTax();
         unsubUsers();
         unsubOffers();
         unsubAds();
         unsubMessages();
     };
  }, [currentUser?.id]);

  // --- Helpers ---

  const checkForNewCategory = async (category: string) => {
      if (!category) return;
      if (!taxonomy.approvedCategories.includes(category) && !taxonomy.pendingCategories.includes(category)) {
          await updateDoc(doc(db, "system", "taxonomy"), {
              pendingCategories: arrayUnion(category)
          });
      }
  };

  const checkForNewInterests = async (interests: string[]) => {
      if (!interests || interests.length === 0) return;
      const newInterests = interests.filter(i => 
          !taxonomy.approvedInterests.includes(i) && !taxonomy.pendingInterests?.includes(i)
      );
      if (newInterests.length > 0) {
          await updateDoc(doc(db, "system", "taxonomy"), {
              pendingInterests: arrayUnion(...newInterests)
          });
      }
  };

  // --- Handlers ---

  const handleRegister = async (newUser: Partial<UserProfile>, pass: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, newUser.email!, pass);
        const uid = userCredential.user.uid;
        
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
            joinedAt: new Date().toISOString(),
            showInterests: true,
            allowDirectContact: true
        };
        
        await setDoc(doc(db, "users", uid), userProfile);
        
        if (newUser.mainField) await checkForNewCategory(newUser.mainField);
        if (newUser.interests) await checkForNewInterests(newUser.interests);
        
        setIsAuthModalOpen(false);
        
        // Trigger Welcome Email
        fetch('/api/emails/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                type: 'welcome',
                to: newUser.email,
                data: { userName: newUser.name }
            })
        }).catch(err => console.warn('Failed to send welcome email', err));

        if (!userProfile.portfolioUrl && (!userProfile.portfolioImages || userProfile.portfolioImages.length === 0)) {
            setIsCompleteProfileModalOpen(true);
        }
    } catch (error: any) { alert(`שגיאה בהרשמה: ${error.message}`); }
  };

  const handleLogin = async (email: string, pass: string) => {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsAuthModalOpen(false);
  };

  const handleLogout = async () => {
      await signOut(auth);
      setCurrentUser(null);
  };

  const handleCompleteProfile = async (data: { portfolioUrl: string; portfolioImages: string[] }) => {
      if (!currentUser) return;
      await updateDoc(doc(db, "users", currentUser.id), data);
      setIsCompleteProfileModalOpen(false);
  };

  // Offers
  const handleAddOffer = async (offer: BarterOffer) => {
      await setDoc(doc(db, "offers", offer.id), offer);
      setIsCreateOfferModalOpen(false);
  };

  const handleUpdateOffer = async (offer: BarterOffer) => {
      await setDoc(doc(db, "offers", offer.id), offer);
      setIsCreateOfferModalOpen(false);
      setEditingOffer(null);
  };

  const handleDeleteOffer = async (offerId: string) => {
      await deleteDoc(doc(db, "offers", offerId));
  };

  const handleRateOffer = async (offerId: string, rating: number) => {
      if (!currentUser) return;
      const offerRef = doc(db, "offers", offerId);
      const offer = offers.find(o => o.id === offerId);
      if (offer) {
          const newRatings = [...offer.ratings, { userId: currentUser.id, score: rating }];
          const avg = newRatings.reduce((a, b) => a + b.score, 0) / newRatings.length;
          await updateDoc(offerRef, { ratings: newRatings, averageRating: avg });
      }
  };

  // Profile Update
  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
      if (!currentUser) return;
      
      if (currentUser.role === 'admin') {
          await updateDoc(doc(db, "users", updatedProfile.id), updatedProfile);
      } else {
          await updateDoc(doc(db, "users", currentUser.id), {
              pendingUpdate: updatedProfile
          });
      }
      
      if (updatedProfile.mainField) await checkForNewCategory(updatedProfile.mainField);
      if (updatedProfile.interests) await checkForNewInterests(updatedProfile.interests);
  };

  // Admin Actions
  const handleDeleteUser = async (userId: string) => {
      if (window.confirm("בטוח שברצונך למחוק משתמש זה?")) {
          await deleteDoc(doc(db, "users", userId));
      }
  };

  const handleApproveUserUpdate = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user && user.pendingUpdate) {
          await updateDoc(doc(db, "users", userId), {
              ...user.pendingUpdate,
              pendingUpdate: null // clear pending
          } as any);
      }
  };

  const handleRejectUserUpdate = async (userId: string) => {
      await updateDoc(doc(db, "users", userId), {
          pendingUpdate: null
      });
  };

  const handleApproveOffer = async (offerId: string) => {
      await updateDoc(doc(db, "offers", offerId), { status: 'active' });
  };

  const handleBulkDeleteOffers = async (dateThreshold: string) => {
      const date = new Date(dateThreshold);
      const toDelete = offers.filter(o => new Date(o.createdAt) < date);
      for (const o of toDelete) {
          await deleteDoc(doc(db, "offers", o.id));
      }
  };

  // Taxonomy Admin Actions
  const handleAddCategory = async (cat: string) => {
      await updateDoc(doc(db, "system", "taxonomy"), { approvedCategories: arrayUnion(cat) });
  };
  const handleDeleteCategory = async (cat: string) => {
      await updateDoc(doc(db, "system", "taxonomy"), { approvedCategories: arrayRemove(cat) });
  };
  const handleApproveCategory = async (cat: string) => {
      await updateDoc(doc(db, "system", "taxonomy"), {
          approvedCategories: arrayUnion(cat),
          pendingCategories: arrayRemove(cat)
      });
  };
  const handleRejectCategory = async (cat: string) => {
      await updateDoc(doc(db, "system", "taxonomy"), { pendingCategories: arrayRemove(cat) });
  };
  const handleReassignCategory = async (oldCat: string, newCat: string) => {
      const usersToUpdate = users.filter(u => u.mainField === oldCat);
      for (const u of usersToUpdate) {
          await updateDoc(doc(db, "users", u.id), { mainField: newCat });
      }
      await updateDoc(doc(db, "system", "taxonomy"), { pendingCategories: arrayRemove(oldCat) });
  };

  const handleAddInterest = async (int: string) => {
      await updateDoc(doc(db, "system", "taxonomy"), { approvedInterests: arrayUnion(int) });
  };
  const handleDeleteInterest = async (int: string) => {
      await updateDoc(doc(db, "system", "taxonomy"), { approvedInterests: arrayRemove(int) });
  };
  const handleApproveInterest = async (int: string) => {
      await updateDoc(doc(db, "system", "taxonomy"), {
          approvedInterests: arrayUnion(int),
          pendingInterests: arrayRemove(int)
      });
  };
  const handleRejectInterest = async (int: string) => {
      await updateDoc(doc(db, "system", "taxonomy"), { pendingInterests: arrayRemove(int) });
  };

  // --- NEW: Advanced Taxonomy Management ---
  const handleRenameItem = async (oldName: string, newName: string, type: 'category' | 'interest') => {
      try {
          const batch = writeBatch(db);
          const taxonomyRef = doc(db, "system", "taxonomy");
          
          if (type === 'category') {
              batch.update(taxonomyRef, { approvedCategories: arrayRemove(oldName) });
              batch.update(taxonomyRef, { approvedCategories: arrayUnion(newName) });

              const usersToUpdate = users.filter(u => u.mainField === oldName);
              usersToUpdate.forEach(u => {
                  batch.update(doc(db, "users", u.id), { mainField: newName });
              });
          } else {
              batch.update(taxonomyRef, { approvedInterests: arrayRemove(oldName) });
              batch.update(taxonomyRef, { approvedInterests: arrayUnion(newName) });

              const usersToUpdate = users.filter(u => u.interests?.includes(oldName));
              usersToUpdate.forEach(u => {
                  const newInterests = u.interests?.map(i => i === oldName ? newName : i) || [];
                  batch.update(doc(db, "users", u.id), { interests: newInterests });
              });
          }
          await batch.commit();
      } catch (e) {
          console.error("Rename failed", e);
          alert("שגיאה בשינוי השם");
      }
  };

  const handleMergeItems = async (source: string, target: string, type: 'category' | 'interest') => {
      try {
          const batch = writeBatch(db);
          const taxonomyRef = doc(db, "system", "taxonomy");

          if (type === 'category') {
              batch.update(taxonomyRef, { approvedCategories: arrayRemove(source) });
              const usersToUpdate = users.filter(u => u.mainField === source);
              usersToUpdate.forEach(u => {
                  batch.update(doc(db, "users", u.id), { mainField: target });
              });
          } else {
              batch.update(taxonomyRef, { approvedInterests: arrayRemove(source) });
              const usersToUpdate = users.filter(u => u.interests?.includes(source));
              usersToUpdate.forEach(u => {
                  const newInterests = (u.interests || []).filter(i => i !== source);
                  if (!newInterests.includes(target)) newInterests.push(target);
                  batch.update(doc(db, "users", u.id), { interests: newInterests });
              });
          }
          await batch.commit();
      } catch (e) {
          console.error("Merge failed", e);
          alert("שגיאה במיזוג");
      }
  };

  // Ads Admin
  const handleAddAd = async (ad: SystemAd) => {
      await setDoc(doc(db, "ads", ad.id), ad);
  };
  const handleEditAd = async (ad: SystemAd) => {
      await setDoc(doc(db, "ads", ad.id), ad);
  };
  const handleDeleteAd = async (adId: string) => {
      await deleteDoc(doc(db, "ads", adId));
  };
  const handleToggleAdStatus = async (adId: string, currentStatus: boolean) => {
      await updateDoc(doc(db, "ads", adId), { isActive: !currentStatus });
  };

  // Messages
  const handleSendMessage = async (receiverId: string, receiverName: string, subject: string, content: string) => {
      if (!currentUser) return;
      
      const newMessage: Message = {
          id: Date.now().toString(),
          senderId: currentUser.id,
          receiverId: receiverId,
          senderName: currentUser.name,
          receiverName: receiverName,
          subject,
          content,
          timestamp: new Date().toISOString(),
          isRead: false
      };
      
      await setDoc(doc(db, "messages", newMessage.id), newMessage);
      
      if (receiverId !== currentUser.id) {
        const receiver = users.find(u => u.id === receiverId);
        if (receiver?.email) {
            fetch('/api/emails/send', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    type: 'chat_alert',
                    to: receiver.email,
                    data: { userName: receiver.name, senderName: currentUser.name }
                })
            }).catch(e => console.error("Email alert failed", e));
        }
      }
  };

  const handleMarkAsRead = async (msgId: string) => {
      await updateDoc(doc(db, "messages", msgId), { isRead: true });
  };

  // --- Derived State ---
  const unreadCount = messages.filter(m => m.receiverId === currentUser?.id && !m.isRead).length;
  const adminPendingCount = (currentUser?.role === 'admin') 
      ? users.filter(u => u.pendingUpdate).length + offers.filter(o => o.status === 'pending').length + taxonomy.pendingCategories.length + (taxonomy.pendingInterests?.length || 0)
      : 0;

  const filteredOffers = useMemo(() => {
      let result = offers.filter(o => o.status === 'active');
      
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          result = result.filter(o => 
              o.title.toLowerCase().includes(q) || 
              o.description.toLowerCase().includes(q) ||
              o.offeredService.toLowerCase().includes(q) ||
              o.requestedService.toLowerCase().includes(q)
          );
      }

      if (activeFeed === 'for_you' && currentUser) {
          result = result.filter(o => {
              const matchesInterest = currentUser.interests?.some(i => o.tags.includes(i) || o.offeredService.includes(i));
              const matchesProfession = o.requestedService.includes(currentUser.mainField);
              return matchesInterest || matchesProfession;
          });
      }

      return result;
  }, [offers, searchQuery, activeFeed, currentUser]);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900" dir="rtl">
        <Navbar 
            currentUser={currentUser}
            onOpenCreateModal={() => {
                if (currentUser) {
                    setEditingOffer(null);
                    setIsCreateOfferModalOpen(true);
                } else {
                    setAuthModeRegister(true);
                    setIsAuthModalOpen(true);
                }
            }}
            onOpenMessages={() => {
                if(currentUser) setIsMessagingModalOpen(true);
                else setIsAuthModalOpen(true);
            }}
            onOpenAuth={() => {
                setAuthModeRegister(false);
                setIsAuthModalOpen(true);
            }}
            onOpenProfile={() => {
                setSelectedProfile(currentUser);
                setIsProfileModalOpen(true);
            }}
            onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
            onOpenEmailCenter={() => setIsEmailCenterOpen(true)}
            onLogout={handleLogout}
            unreadCount={unreadCount}
            adminPendingCount={adminPendingCount}
            onSearch={setSearchQuery}
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            activeFeed={activeFeed}
            onNavigate={setActiveFeed}
        />

        {!searchQuery && activeFeed === 'all' && (
            <Hero 
                currentUser={currentUser}
                onOpenWhoIsItFor={() => setIsWhoIsItForOpen(true)}
                onOpenSearchTips={() => setIsSearchTipsOpen(true)}
            />
        )}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AdBanner 
                contextCategories={searchQuery ? [searchQuery] : []}
                systemAds={systemAds}
                currentUser={currentUser}
            />

            {filteredOffers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOffers.map(offer => (
                        <OfferCard 
                            key={offer.id}
                            offer={offer}
                            onContact={(profile) => {
                                if (currentUser) {
                                    setMsgRecipient(profile);
                                    setIsMessagingModalOpen(true);
                                } else {
                                    setIsAuthModalOpen(true);
                                }
                            }}
                            onUserClick={(profile) => {
                                setSelectedProfile(profile);
                                setIsProfileModalOpen(true);
                            }}
                            onRate={handleRateOffer}
                            currentUserId={currentUser?.id}
                            onEdit={(offer) => {
                                setEditingOffer(offer);
                                setIsCreateOfferModalOpen(true);
                            }}
                            onDelete={handleDeleteOffer}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <h3 className="text-xl font-bold text-slate-700 mb-2">לא נמצאו הצעות תואמות</h3>
                    <p className="text-slate-500">נסה לשנות את מונחי החיפוש או עבור ללשונית "ראשי".</p>
                    <button onClick={() => { setSearchQuery(''); setActiveFeed('all'); }} className="mt-4 text-brand-600 font-bold hover:underline">
                        נקה סינון
                    </button>
                </div>
            )}
        </main>

        <Footer onOpenAccessibility={() => setIsAccessibilityOpen(true)} />
        <CookieConsentModal />

        {/* MODALS */}
        <AuthModal 
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
            onLogin={handleLogin}
            onRegister={handleRegister}
            startOnRegister={authModeRegister}
            availableCategories={taxonomy.approvedCategories}
            availableInterests={taxonomy.approvedInterests}
        />

        <CreateOfferModal 
            isOpen={isCreateOfferModalOpen}
            onClose={() => setIsCreateOfferModalOpen(false)}
            onAddOffer={handleAddOffer}
            onUpdateOffer={handleUpdateOffer}
            currentUser={currentUser!}
            editingOffer={editingOffer}
        />

        <MessagingModal 
            isOpen={isMessagingModalOpen}
            onClose={() => { setIsMessagingModalOpen(false); setMsgRecipient(null); }}
            currentUser={currentUser?.id || ''}
            messages={messages}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkAsRead}
            recipientProfile={msgRecipient}
        />

        <ProfileModal 
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            profile={selectedProfile}
            currentUser={currentUser}
            userOffers={offers.filter(o => o.profileId === selectedProfile?.id)}
            onDeleteOffer={handleDeleteOffer}
            onUpdateProfile={handleUpdateProfile}
            onContact={(profile) => {
                setIsProfileModalOpen(false);
                setMsgRecipient(profile);
                setIsMessagingModalOpen(true);
            }}
            onRate={handleRateOffer}
            availableCategories={taxonomy.approvedCategories}
            availableInterests={taxonomy.approvedInterests}
            onApproveUpdate={currentUser?.role === 'admin' ? handleApproveUserUpdate : undefined}
            onRejectUpdate={currentUser?.role === 'admin' ? handleRejectUserUpdate : undefined}
        />

        <AdminDashboardModal 
            isOpen={isAdminDashboardOpen}
            onClose={() => setIsAdminDashboardOpen(false)}
            users={users}
            currentUser={currentUser}
            onDeleteUser={handleDeleteUser}
            onApproveUpdate={handleApproveUserUpdate}
            onRejectUpdate={handleRejectUserUpdate}
            offers={offers}
            onDeleteOffer={handleDeleteOffer}
            onBulkDelete={handleBulkDeleteOffers}
            onApproveOffer={handleApproveOffer}
            onEditOffer={(offer) => {
                setIsAdminDashboardOpen(false);
                setEditingOffer(offer);
                setIsCreateOfferModalOpen(true);
            }}
            availableCategories={taxonomy.approvedCategories}
            availableInterests={taxonomy.approvedInterests}
            pendingCategories={taxonomy.pendingCategories}
            pendingInterests={taxonomy.pendingInterests || []}
            onAddCategory={handleAddCategory}
            onAddInterest={handleAddInterest}
            onDeleteCategory={handleDeleteCategory}
            onDeleteInterest={handleDeleteInterest}
            onApproveCategory={handleApproveCategory}
            onRejectCategory={handleRejectCategory}
            onReassignCategory={handleReassignCategory}
            onApproveInterest={handleApproveInterest}
            onRejectInterest={handleRejectInterest}
            // NEW PROPS PASSED HERE
            onRenameItem={handleRenameItem}
            onMergeItems={handleMergeItems}
            
            ads={systemAds}
            onAddAd={handleAddAd}
            onEditAd={handleEditAd}
            onDeleteAd={handleDeleteAd}
            onToggleAdStatus={handleToggleAdStatus} // Added toggle handler
            
            onViewProfile={(profile) => {
                setIsAdminDashboardOpen(false);
                setSelectedProfile(profile);
                setIsProfileModalOpen(true);
            }}
            messages={messages}
        />

        <EmailCenterModal 
            isOpen={isEmailCenterOpen}
            onClose={() => setIsEmailCenterOpen(false)}
        />

        <CompleteProfileModal 
            isOpen={isCompleteProfileModalOpen}
            onClose={() => setIsCompleteProfileModalOpen(false)}
            onSave={handleCompleteProfile}
        />

        <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
        <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} />
        <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} />
        <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
    </div>
  );
};