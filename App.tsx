import React, { useState, useEffect, useRef } from 'react';
// Core Components
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { AdBanner } from './components/AdBanner';
import { OfferCard } from './components/OfferCard';
import { Footer } from './components/Footer';

// Modals
import { CreateOfferModal } from './components/CreateOfferModal';
import { MessagingModal } from './components/MessagingModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { UsersListModal } from './components/UsersListModal';
import { AdminOffersModal } from './components/AdminOffersModal';
import { HowItWorksModal } from './components/HowItWorksModal';
import { WhoIsItForModal } from './components/WhoIsItForModal';
import { SearchTipsModal } from './components/SearchTipsModal';
import { AdminAdManager } from './components/AdminAdManager';
import { AdminAnalyticsModal } from './components/AdminAnalyticsModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { CookieConsentModal } from './components/CookieConsentModal';
import { CompleteProfileModal } from './components/CompleteProfileModal';

// Data & Types
import { CATEGORIES, COMMON_INTERESTS, ADMIN_EMAIL } from './constants';
import { Filter, MapPin, Clock, Repeat, Search, ChevronDown, ChevronUp, LayoutGrid, List as ListIcon, Plus, ArrowUpDown, X as XIcon, Loader2 } from 'lucide-react';
import { Message, UserProfile, BarterOffer, ExpertiseLevel, SystemAd, SystemTaxonomy } from './types';

// Firebase
import { auth, db } from './services/firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  deleteField,
  arrayUnion,
  arrayRemove,
  getDocs,
  query,
  where,
  writeBatch // Import writeBatch
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

export const App: React.FC = () => {
  // --- Data State ---
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // System Taxonomy State (Categories/Sectors)
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: [],
      pendingCategories: [],
      approvedInterests: [],
      pendingInterests: []
  });

  // --- Initial Data Loading from Firebase ---
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedUsers: UserProfile[] = [];
      snapshot.forEach((doc) => fetchedUsers.push(doc.data() as UserProfile));
      setUsers(fetchedUsers);
    });

    const unsubscribeOffers = onSnapshot(collection(db, "offers"), (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedOffers: BarterOffer[] = [];
      snapshot.forEach((doc) => fetchedOffers.push(doc.data() as BarterOffer));
      setOffers(fetchedOffers);
      setIsLoading(false);
    });

    const unsubscribeAds = onSnapshot(collection(db, "systemAds"), (snapshot: QuerySnapshot<DocumentData>) => {
      const fetchedAds: SystemAd[] = [];
      snapshot.forEach((doc) => fetchedAds.push(doc.data() as SystemAd));
      setSystemAds(fetchedAds);
    });

    const unsubscribeMessages = onSnapshot(collection(db, "messages"), (snapshot: QuerySnapshot<DocumentData>) => {
        const fetchedMessages: Message[] = [];
        snapshot.forEach((doc) => fetchedMessages.push(doc.data() as Message));
        setMessages(fetchedMessages);
    });

    // Listen to Taxonomy (Categories/Interests)
    const unsubscribeTaxonomy = onSnapshot(doc(db, "system_metadata", "taxonomy"), (docSnap) => {
        if (docSnap.exists()) {
            setTaxonomy(docSnap.data() as SystemTaxonomy);
        } else {
            // Initialize if not exists
            setDoc(doc(db, "system_metadata", "taxonomy"), {
                approvedCategories: CATEGORIES,
                pendingCategories: [],
                approvedInterests: COMMON_INTERESTS,
                pendingInterests: []
            });
        }
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOffers();
      unsubscribeAds();
      unsubscribeMessages();
      unsubscribeTaxonomy();
    };
  }, []);

  // --- Auth Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const foundUser = users.find(u => u.id === firebaseUser.uid);
        if (foundUser) setCurrentUser(foundUser);
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, [users]); 

  // --- Computed Lists ---
  const availableInterests = React.useMemo(() => {
    return Array.from(new Set([...(taxonomy.approvedInterests || COMMON_INTERESTS)])).sort();
  }, [taxonomy.approvedInterests]);

  const availableCategories = React.useMemo(() => {
    // Show both Approved and Pending (if user added them)
    return Array.from(new Set([...(taxonomy.approvedCategories || CATEGORIES)])).sort();
  }, [taxonomy.approvedCategories]);

  // --- UI State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<BarterOffer | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authStartOnRegister, setAuthStartOnRegister] = useState(false);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false);
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isAdminOffersOpen, setIsAdminOffersOpen] = useState(false);
  const [isAdManagerOpen, setIsAdManagerOpen] = useState(false);
  const [isAdminAnalyticsOpen, setIsAdminAnalyticsOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isWhoIsItForOpen, setIsWhoIsItForOpen] = useState(false);
  const [isSearchTipsOpen, setIsSearchTipsOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [initialMessageSubject, setInitialMessageSubject] = useState<string>('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [keywordFilter, setKeywordFilter] = useState<string>('');
  const [durationFilter, setDurationFilter] = useState<'all' | 'one-time' | 'ongoing'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'deadline'>('newest');

  // Sticky Filter
  const [isSticky, setIsSticky] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const lastScrollY = useRef(0);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  // --- Scroll & Sticky Logic ---
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const threshold = 100;

      if (currentScrollY > threshold) {
        if (!isSticky) {
          setIsSticky(true);
          setIsFilterOpen(false);
        }
      } else {
        if (isSticky) {
          setIsSticky(false);
          setIsFilterOpen(true);
        }
      }

      if (isSticky && isFilterOpen) {
          if (Math.abs(currentScrollY - lastScrollY.current) > 20) {
              setIsFilterOpen(false);
          }
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isSticky, isFilterOpen]);

  // --- Debounce Filters ---
  useEffect(() => {
    const timer = setTimeout(() => setLocationFilter(locationInput), 300);
    return () => clearTimeout(timer);
  }, [locationInput]);

  useEffect(() => {
    const timer = setTimeout(() => setKeywordFilter(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // --- Helper: Check for New Category ---
  const checkForNewCategory = async (category: string) => {
      if (!category) return;
      const trimmedCat = category.trim();
      // If category is not in approved list and not already in pending
      if (!taxonomy.approvedCategories.includes(trimmedCat) && !taxonomy.pendingCategories?.includes(trimmedCat)) {
          try {
              await updateDoc(doc(db, "system_metadata", "taxonomy"), {
                  pendingCategories: arrayUnion(trimmedCat)
              });
          } catch (error) {
              console.error("Error adding pending category", error);
          }
      }
  };

  // --- Helper: Check for New Interest ---
  const checkForNewInterest = async (interest: string) => {
      if (!interest) return;
      const trimmed = interest.trim();
      if (!taxonomy.approvedInterests.includes(trimmed) && !taxonomy.pendingInterests?.includes(trimmed)) {
          try {
              await updateDoc(doc(db, "system_metadata", "taxonomy"), {
                  pendingInterests: arrayUnion(trimmed)
              });
          } catch (e) { console.error(e); }
      }
  };

  // --- Handlers (FIREBASE IMPLEMENTATION) ---
  
  // Helper to update all offers for a user
  const updateOffersForUser = async (userId: string, newProfileData: UserProfile) => {
      const batch = writeBatch(db);
      const q = query(collection(db, "offers"), where("profileId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((docSnap) => {
          batch.update(docSnap.ref, { 
              profile: newProfileData // Use the new profile data
          });
      });
      await batch.commit();
  };

  const handleUpdateProfile = async (updatedProfileData: UserProfile) => {
      try {
          // Check for new category
          if (updatedProfileData.mainField) {
              await checkForNewCategory(updatedProfileData.mainField);
          }

          // Check for new interests
          if (updatedProfileData.interests && updatedProfileData.interests.length > 0) {
              for (const interest of updatedProfileData.interests) {
                  await checkForNewInterest(interest);
              }
          }

          const isAdmin = currentUser?.role === 'admin';
          
          if (isAdmin) {
              // Admin direct update:
              // 1. Clean pendingUpdate if it exists
              const { pendingUpdate, ...dataToSave } = updatedProfileData;
              const finalData = {
                  ...dataToSave,
                  pendingUpdate: deleteField()
              };
              
              // 2. Update User Document
              await setDoc(doc(db, "users", updatedProfileData.id), finalData, { merge: true });

              // 3. Update All Offers immediately
              await updateOffersForUser(updatedProfileData.id, finalData as UserProfile);

          } else {
              // User request update: save changes inside 'pendingUpdate' field.
              const { id, role, pendingUpdate: p, ...dataToUpdate } = updatedProfileData;
              await updateDoc(doc(db, "users", updatedProfileData.id), {
                  pendingUpdate: dataToUpdate
              });
          }
      } catch (error) {
          console.error("Error updating profile:", error);
          alert("שגיאה בעדכון הפרופיל");
      }
  };

  const handleApproveUserUpdate = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user || !user.pendingUpdate) return;

      // Check for new category in pending update
      if (user.pendingUpdate.mainField) {
         await checkForNewCategory(user.pendingUpdate.mainField);
      }
      // Check for new interests in pending update
      if (user.pendingUpdate.interests) {
         for (const interest of user.pendingUpdate.interests) {
            await checkForNewInterest(interest);
         }
      }

      // Merge pending updates into main profile
      const { pendingUpdate, ...baseUserData } = user;
      
      // Clean object for offers update (without deleteField())
      const cleanProfileData = {
          ...baseUserData,
          ...pendingUpdate
      } as UserProfile;
      delete cleanProfileData.pendingUpdate;

      // Data for User Doc update (with deleteField to clear pending)
      const finalUserData = {
          ...cleanProfileData,
          pendingUpdate: deleteField() 
      };

      try {
          // 1. Update User Document
          await setDoc(doc(db, "users", userId), finalUserData, { merge: true });

          // 2. Batch Update all User's Offers with new profile snapshot
          await updateOffersForUser(userId, cleanProfileData);

          if (selectedProfile?.id === userId) {
              setSelectedProfile(cleanProfileData);
          }
      } catch (error) { 
          console.error("Error approving update:", error); 
          alert("שגיאה באישור השינויים");
      }
  };

  const handleRejectUserUpdate = async (userId: string) => {
      try {
        await updateDoc(doc(db, "users", userId), { 
            pendingUpdate: deleteField() 
        });
        
        const user = users.find(u => u.id === userId);
        if (user && selectedProfile?.id === userId) {
             const originalUser = { ...user, pendingUpdate: undefined } as UserProfile;
             setSelectedProfile(originalUser);
        }
      } catch (error) { 
          console.error("Error rejecting update:", error);
          alert("שגיאה בדחיית השינויים");
      }
  };

  const handleRegister = async (newUser: Partial<UserProfile>, pass: string) => {
    try {
        // Check for new category
        if (newUser.mainField) {
            await checkForNewCategory(newUser.mainField);
        }
        // Check for new interests
        if (newUser.interests) {
            for (const interest of newUser.interests) {
                await checkForNewInterest(interest);
            }
        }

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
            joinedAt: new Date().toISOString()
        };
        await setDoc(doc(db, "users", uid), userProfile);
        setCurrentUser(userProfile);
        setIsAuthModalOpen(false);
        if (!userProfile.portfolioUrl && (!userProfile.portfolioImages || userProfile.portfolioImages.length === 0)) {
            setIsCompleteProfileModalOpen(true);
        }
    } catch (error: any) { alert(`שגיאה בהרשמה: ${error.message}`); }
  };

  // --- Admin Category Management Handlers ---
  const handleApproveCategory = async (category: string) => {
      try {
          await updateDoc(doc(db, "system_metadata", "taxonomy"), {
              approvedCategories: arrayUnion(category),
              pendingCategories: arrayRemove(category)
          });
      } catch (e) { console.error(e); }
  };

  const handleRejectCategory = async (category: string) => {
      try {
          // Just remove from pending
          await updateDoc(doc(db, "system_metadata", "taxonomy"), {
              pendingCategories: arrayRemove(category)
          });
      } catch (e) { console.error(e); }
  };

  const handleReassignCategory = async (oldCategory: string, newCategory: string) => {
      try {
          // 1. Find all users with old category
          const q = query(collection(db, "users"), where("mainField", "==", oldCategory));
          const querySnapshot = await getDocs(q);
          
          // 2. Batch update users
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => {
              batch.update(doc.ref, { mainField: newCategory });
          });
          await batch.commit();

          // 3. Remove old from pending
          await updateDoc(doc(db, "system_metadata", "taxonomy"), {
              pendingCategories: arrayRemove(oldCategory)
          });
          
          alert(`עודכנו ${querySnapshot.size} משתמשים. התחום הוסר מהרשימה הממתינה.`);

      } catch (e) { console.error("Error reassigning", e); alert("שגיאה בשינוי קטגוריה גורף"); }
  };

  // --- Admin Interest Management Handlers ---
  const handleApproveInterest = async (interest: string) => {
      try {
          await updateDoc(doc(db, "system_metadata", "taxonomy"), {
              approvedInterests: arrayUnion(interest),
              pendingInterests: arrayRemove(interest)
          });
      } catch (e) { console.error(e); }
  };

  const handleRejectInterest = async (interest: string) => {
      try {
          await updateDoc(doc(db, "system_metadata", "taxonomy"), {
              pendingInterests: arrayRemove(interest),
              approvedInterests: arrayRemove(interest)
          });
      } catch (e) { console.error(e); }
  };

  // --- Other Handlers ---
  const handleLogin = async (email: string, pass: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        setIsAuthModalOpen(false);
    } catch (error: any) { alert("שגיאה בהתחברות. בדוק את המייל והסיסמה."); }
  };

  const handleCompleteProfile = (data: { portfolioUrl: string, portfolioImages: string[] }) => {
    if (!currentUser) return;
    const updatedData: UserProfile = { ...currentUser, ...data };
    handleUpdateProfile(updatedData);
    setIsCompleteProfileModalOpen(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
  };

  const handleAddOffer = async (newOffer: BarterOffer) => {
    try { await setDoc(doc(db, "offers", newOffer.id), newOffer); } 
    catch (error) { alert("שגיאה בפרסום ההצעה"); }
  };

  const handleUpdateOffer = async (updatedOffer: BarterOffer) => {
      const isAdmin = currentUser?.role === 'admin';
      const offerToSave: BarterOffer = {
        ...updatedOffer,
        status: isAdmin ? updatedOffer.status : 'pending',
        ratings: [], 
        averageRating: 0
      };
      try { await setDoc(doc(db, "offers", updatedOffer.id), offerToSave, { merge: true }); } 
      catch (error) { console.error(error); }
  };
  
  const handleRateOffer = async (offerId: string, score: number) => {
    if (!currentUser) return;
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    const currentRatings = offer.ratings || [];
    const filteredRatings = currentRatings.filter(r => r.userId !== currentUser.id);
    const newRatings = [...filteredRatings, { userId: currentUser.id, score }];
    const total = newRatings.reduce((sum, r) => sum + r.score, 0);
    const average = parseFloat((total / newRatings.length).toFixed(1));
    try { await updateDoc(doc(db, "offers", offerId), { ratings: newRatings, averageRating: average }); } 
    catch (error) { console.error(error); }
  };

  const handleDeleteOffer = async (offerId: string) => {
      try { await deleteDoc(doc(db, "offers", offerId)); } catch (error) { console.error(error); }
  };

  const handleApproveOffer = async (offerId: string) => {
      try { await updateDoc(doc(db, "offers", offerId), { status: 'active' }); } catch (error) { console.error(error); }
  };

  const handleBulkDelete = async (dateThreshold: string) => {
      const threshold = new Date(dateThreshold);
      const toDelete = offers.filter(o => new Date(o.createdAt) < threshold);
      try { for (const offer of toDelete) await deleteDoc(doc(db, "offers", offer.id)); } 
      catch (error) { console.error(error); }
  };

  const handleSendMessage = async (receiverId: string, receiverName: string, subject: string, content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser?.id || 'guest',
      receiverId,
      senderName: currentUser?.name || 'אורח',
      receiverName,
      subject,
      content,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    try { await setDoc(doc(db, "messages", newMessage.id), newMessage); } catch (error) { console.error(error); }
  };

  const handleMarkAsRead = async (messageId: string) => {
      try { await updateDoc(doc(db, "messages", messageId), { isRead: true }); } catch (error) { console.error(error); }
  };

  // --- Ad Manager Handlers ---
  const handleAddAd = async (newAd: SystemAd) => { try { await setDoc(doc(db, "systemAds", newAd.id), newAd); } catch (error) { console.error(error); } };
  const handleEditAd = async (updatedAd: SystemAd) => { try { await setDoc(doc(db, "systemAds", updatedAd.id), updatedAd); } catch (error) { console.error(error); } };
  const handleDeleteAd = async (adId: string) => { try { await deleteDoc(doc(db, "systemAds", adId)); } catch (error) { console.error(error); } };

  // --- Contact & Modals ---
  const handleContact = (profile: UserProfile, offerTitle?: string) => {
    if (!currentUser) { setAuthStartOnRegister(false); setIsAuthModalOpen(true); return; }
    if (profile.id === currentUser.id) { alert("זוהי ההצעה שלך :)"); return; }
    setSelectedProfile(profile);
    setInitialMessageSubject(offerTitle ? `התעניינות ב: ${offerTitle}` : '');
    setIsMessagingModalOpen(true);
  };

  const handleViewProfile = (profile: UserProfile) => {
    setSelectedProfile(currentUser && profile.id === currentUser.id ? currentUser : profile);
    setIsProfileModalOpen(true);
  };

  const handleOpenCreate = () => {
    if (!currentUser) { setAuthStartOnRegister(true); setIsAuthModalOpen(true); return; }
    setEditingOffer(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenMessages = () => {
    if (!currentUser) { setAuthStartOnRegister(false); setIsAuthModalOpen(true); return; }
    setSelectedProfile(null);
    setInitialMessageSubject('');
    setIsMessagingModalOpen(true);
  };
  
  const toggleCategory = (category: string) => {
      if (category === 'הכל') { setSelectedCategories([]); return; }
      setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const handleResetFilters = () => {
      setSearchQuery(''); setKeywordFilter(''); setKeywordInput(''); setLocationFilter(''); setLocationInput(''); setDurationFilter('all'); setSelectedCategories([]);
  };

  // --- Filter & Sort Logic ---
  const filteredOffers = offers.filter(offer => {
    const isMine = currentUser && offer.profileId === currentUser.id;
    const isAdmin = currentUser?.role === 'admin';
    if (offer.status !== 'active' && !isMine && !isAdmin) return false; 

    // Defensive Extraction
    const title = offer.title || '';
    const offeredService = offer.offeredService || '';
    const requestedService = offer.requestedService || '';
    const description = offer.description || '';
    const location = offer.location || '';
    const tags = Array.isArray(offer.tags) ? offer.tags : [];
    const mainField = offer.profile?.mainField || '';

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(title.toLowerCase().includes(query) || offeredService.toLowerCase().includes(query) || requestedService.toLowerCase().includes(query) || description.toLowerCase().includes(query) || tags.some(t => (t || '').toLowerCase().includes(query)))) return false;
    }
    if (keywordFilter) {
        const query = keywordFilter.toLowerCase();
        if (!(title.toLowerCase().includes(query) || offeredService.toLowerCase().includes(query) || requestedService.toLowerCase().includes(query))) return false;
    }
    if (locationFilter && !location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (durationFilter !== 'all' && offer.durationType !== durationFilter) return false;
    if (selectedCategories.length > 0) {
        if (!(selectedCategories.includes(mainField) || tags.some(tag => selectedCategories.includes(tag || '')))) return false;
    }
    return true;
  }).sort((a, b) => {
      if (sortBy === 'deadline') {
          const aHasDate = !!a.expirationDate;
          const bHasDate = !!b.expirationDate;
          if (aHasDate && !bHasDate) return -1;
          if (!aHasDate && bHasDate) return 1;
          if (aHasDate && bHasDate) return new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime();
      } else if (sortBy === 'rating') {
          if (b.averageRating !== a.averageRating) return b.averageRating - a.averageRating;
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (dateA !== dateB) return dateB - dateA;
      if (currentUser && selectedCategories.length === 0) {
          const userInterests = currentUser.interests || [];
          const aRelevance = (a.requestedService.includes(currentUser.mainField) ? 2 : 0) + (a.tags.some(t => userInterests.includes(t)) ? 1 : 0);
          const bRelevance = (b.requestedService.includes(currentUser.mainField) ? 2 : 0) + (b.tags.some(t => userInterests.includes(t)) ? 1 : 0);
          return bRelevance - aRelevance;
      }
      return 0;
  });

  const unreadCount = messages.filter(m => m.receiverId === currentUser?.id && !m.isRead).length;
  const userOffers = offers.filter(o => {
      const isOwner = selectedProfile?.id === currentUser?.id;
      const isAdmin = currentUser?.role === 'admin';
      const belongsToProfile = o.profileId === (selectedProfile?.id || currentUser?.id);
      if (!belongsToProfile) return false;
      return (isOwner || isAdmin) ? true : o.status === 'active';
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar 
        currentUser={currentUser}
        onOpenCreateModal={handleOpenCreate}
        onOpenMessages={handleOpenMessages}
        onOpenAuth={() => { setAuthStartOnRegister(false); setIsAuthModalOpen(true); }}
        onOpenProfile={() => { setSelectedProfile(currentUser); setIsProfileModalOpen(true); }}
        onOpenUserManagement={() => setIsUserManagementOpen(true)}
        onOpenAdminOffers={() => setIsAdminOffersOpen(true)}
        onOpenAdManager={() => setIsAdManagerOpen(true)}
        onOpenAnalytics={() => setIsAdminAnalyticsOpen(true)}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        unreadCount={unreadCount}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />
      <Hero 
        onOpenWhoIsItFor={() => setIsWhoIsItForOpen(true)}
        onOpenSearchTips={() => setIsSearchTipsOpen(true)}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <AdBanner contextCategories={selectedCategories} systemAds={systemAds} currentUser={currentUser} />
        {/* Filters Bar */}
        <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 mb-4 sticky top-16 z-30 ${isSticky ? 'py-2 px-3 sm:px-4' : 'p-3 sm:p-6'}`}>
            <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-between">
                 <div className="flex items-center justify-between w-full gap-2">
                     <div className={`flex items-center gap-2 cursor-pointer ${isSticky ? 'flex-1' : ''}`} onClick={() => isSticky && setIsFilterOpen(!isFilterOpen)}>
                        <div className="bg-brand-100 p-2 rounded-lg text-brand-700 shrink-0"><Filter className="w-5 h-5" /></div>
                        <span className={`font-bold text-slate-800 whitespace-nowrap ${isSticky ? 'text-sm' : ''} ${isSticky && viewMode === 'compact' ? 'hidden sm:block' : ''}`}>{isSticky ? 'סינון' : 'סינון הצעות'}</span>
                        {isSticky && <div className="text-slate-400 mr-2">{isFilterOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</div>}
                     </div>
                     <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                         <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg h-10">
                            <div className="relative group flex items-center">
                                <ArrowUpDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
                                <select className="bg-transparent border-none text-xs sm:text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-7 pl-1 py-0 outline-none appearance-none hover:text-brand-600 transition-colors w-full sm:w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                                    <option value="newest">מודעות חדשות</option>
                                    <option value="deadline">מסתיימות בקרוב</option>
                                    <option value="rating">הכי מומלצות</option>
                                </select>
                            </div>
                         </div>
                         <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 h-10 shrink-0">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('compact')} className={`p-1.5 rounded-md transition-all ${viewMode === 'compact' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon className="w-4 h-4" /></button>
                         </div>
                     </div>
                 </div>
                 {(!isSticky || isFilterOpen) && (
                     <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 w-full flex-wrap items-center mt-2 sm:mt-4 ${isSticky ? 'animate-in fade-in slide-in-from-top-2' : ''}`}>
                         <div className="flex flex-row gap-2 w-full sm:w-auto flex-1">
                             <div className="relative group flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" className="w-full pl-3 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none transition-all shadow-sm" placeholder="חיפוש חופשי..." value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onClick={(e) => e.stopPropagation()} /></div>
                             <div className="relative group flex-1"><MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" className="w-full pl-3 pr-9 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none transition-all shadow-sm" placeholder="חיפוש לפי עיר..." value={locationInput} onChange={(e) => setLocationInput(e.target.value)} onClick={(e) => e.stopPropagation()} /></div>
                         </div>
                         <div className="flex flex-row gap-2 w-full sm:w-auto">
                            <div className="flex-1 sm:flex-none flex bg-slate-50 p-1 rounded-xl border border-slate-200 justify-center" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setDurationFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${durationFilter === 'all' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>הכל</button>
                                <button onClick={() => setDurationFilter('one-time')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${durationFilter === 'one-time' ? 'bg-white shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}><Clock className="w-3 h-3" /><span className="inline">חד פעמי</span></button>
                                <button onClick={() => setDurationFilter('ongoing')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${durationFilter === 'ongoing' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Repeat className="w-3 h-3" /><span className="inline">מתמשך</span></button>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleResetFilters(); }} className="flex items-center justify-center gap-1 px-3 py-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium text-xs border border-transparent hover:border-red-200 shrink-0" title="נקה את כל הסינונים"><XIcon className="w-4 h-4" /></button>
                         </div>
                     </div>
                 )}
            </div>
            {(!isSticky || isFilterOpen) && (
                <div className={isSticky ? 'animate-in fade-in slide-in-from-top-2' : ''}>
                    <div className="h-px bg-slate-100 my-2 sm:my-3 w-full"></div>
                    <div className="relative w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide select-none">
                            <button onClick={() => toggleCategory('הכל')} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCategories.length === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>הכל</button>
                            {availableCategories.map(category => (
                                <button key={category} onClick={() => toggleCategory(category)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border flex items-center gap-2 ${selectedCategories.includes(category) ? 'bg-brand-600 text-white border-brand-600 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>{category}</button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
        {isLoading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 text-brand-500 animate-spin" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} onContact={(profile) => handleContact(profile, offer.title)} onUserClick={handleViewProfile} onRate={handleRateOffer} currentUserId={currentUser?.id} viewMode={viewMode} onDelete={handleDeleteOffer} />
              ))}
              <div onClick={handleOpenCreate} className={`cursor-pointer border-2 border-dashed border-brand-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-all group min-h-[150px] ${viewMode === 'grid' ? 'min-h-[350px]' : ''}`}>
                   <div className="bg-brand-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-sm"><Plus className="w-8 h-8 text-brand-600" /></div>
                   <h3 className="text-xl font-bold text-slate-800">יש לך כישרון להציע?</h3>
                   <p className="text-slate-500 mt-2 max-w-xs text-sm">הצטרף למאות בעלי עסקים שכבר מחליפים שירותים וחוסכים כסף.</p>
                   <span className="mt-4 text-brand-600 font-bold bg-white px-4 py-2 rounded-full shadow-sm text-sm group-hover:shadow-md transition-shadow">פרסם הצעה חדשה &rarr;</span>
              </div>
            </div>
        )}
        {!isLoading && filteredOffers.length === 0 && (
          <div className="text-center py-10 col-span-full"><h3 className="text-lg font-bold text-slate-700">לא נמצאו הצעות תואמות לסינון</h3><button onClick={handleResetFilters} className="mt-2 text-brand-600 font-bold hover:underline text-sm">נקה סינונים</button></div>
        )}
      </main>
      <Footer onOpenAccessibility={() => setIsAccessibilityOpen(true)} />
      <CookieConsentModal />
      <CompleteProfileModal isOpen={isCompleteProfileModalOpen} onClose={() => setIsCompleteProfileModalOpen(false)} onSave={handleCompleteProfile} />
      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onAddOffer={handleAddOffer} onUpdateOffer={handleUpdateOffer} currentUser={currentUser || { ...{id:'guest', name:'אורח', avatarUrl:'', role:'user', expertise:ExpertiseLevel.JUNIOR, mainField:'', portfolioUrl:''}, id: 'temp' }} editingOffer={editingOffer} />
      <MessagingModal isOpen={isMessagingModalOpen} onClose={() => setIsMessagingModalOpen(false)} currentUser={currentUser?.id || 'guest'} messages={messages} onSendMessage={handleSendMessage} onMarkAsRead={handleMarkAsRead} recipientProfile={selectedProfile} initialSubject={initialMessageSubject} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} />
      <UsersListModal isOpen={isUserManagementOpen} onClose={() => setIsUserManagementOpen(false)} users={users} currentUser={currentUser} onDeleteUser={(id) => deleteDoc(doc(db, "users", id))} onApproveUpdate={handleApproveUserUpdate} onRejectUpdate={handleRejectUserUpdate} onViewProfile={handleViewProfile} />
      <AdminOffersModal isOpen={isAdminOffersOpen} onClose={() => setIsAdminOffersOpen(false)} offers={offers} onDeleteOffer={handleDeleteOffer} onBulkDelete={handleBulkDelete} onApproveOffer={handleApproveOffer} onEditOffer={(offer) => { setEditingOffer(offer); setIsCreateModalOpen(true); setIsAdminOffersOpen(false); }} onViewProfile={handleViewProfile} />
      <AdminAdManager isOpen={isAdManagerOpen} onClose={() => setIsAdManagerOpen(false)} ads={systemAds} availableInterests={availableInterests} availableCategories={availableCategories} onAddAd={handleAddAd} onEditAd={handleEditAd} onDeleteAd={handleDeleteAd} />
      <AdminAnalyticsModal isOpen={isAdminAnalyticsOpen} onClose={() => setIsAdminAnalyticsOpen(false)} users={users} availableCategories={availableCategories} availableInterests={availableInterests} onAddCategory={(cat) => checkForNewCategory(cat)} onAddInterest={(int) => checkForNewInterest(int)} onDeleteCategory={handleRejectCategory} onDeleteInterest={handleRejectInterest} pendingCategories={taxonomy.pendingCategories} pendingInterests={taxonomy.pendingInterests} onApproveCategory={handleApproveCategory} onRejectCategory={handleRejectCategory} onReassignCategory={handleReassignCategory} onApproveInterest={handleApproveInterest} onRejectInterest={handleRejectInterest} />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} onOpenAuth={() => { setAuthStartOnRegister(true); setIsAuthModalOpen(true); }} />
      <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} onStartSearching={() => { setIsSearchTipsOpen(false); window.scrollTo({ top: 600, behavior: 'smooth' }); }} />
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} profile={selectedProfile} currentUser={currentUser} userOffers={userOffers} onDeleteOffer={handleDeleteOffer} onUpdateProfile={handleUpdateProfile} onContact={(profile) => handleContact(profile)} onRate={handleRateOffer} availableCategories={availableCategories} availableInterests={availableInterests} onApproveUpdate={handleApproveUserUpdate} onRejectUpdate={handleRejectUserUpdate} />
    </div>
  );
};