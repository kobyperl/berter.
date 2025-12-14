
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
import { HowItWorksModal } from './components/HowItWorksModal';
import { WhoIsItForModal } from './components/WhoIsItForModal';
import { SearchTipsModal } from './components/SearchTipsModal';
import { AdminDashboardModal } from './components/AdminDashboardModal'; 
import { AdminAdManager } from './components/AdminAdManager';
import { AdminAnalyticsModal } from './components/AdminAnalyticsModal';
import { UsersListModal } from './components/UsersListModal';
import { AdminOffersModal } from './components/AdminOffersModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { CookieConsentModal } from './components/CookieConsentModal';
import { CompleteProfileModal } from './components/CompleteProfileModal';
import { EmailCenterModal } from './components/EmailCenterModal'; // New Import

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
  getDoc,
  query,
  where,
  writeBatch
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
  const [authUid, setAuthUid] = useState<string | null>(null);

  const [offers, setOffers] = useState<BarterOffer[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemAds, setSystemAds] = useState<SystemAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [taxonomy, setTaxonomy] = useState<SystemTaxonomy>({
      approvedCategories: [],
      pendingCategories: [],
      approvedInterests: [],
      pendingInterests: []
  });

  // --- Auth Listener & Current User Sync ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setAuthUid(firebaseUser ? firebaseUser.uid : null);
      
      if (firebaseUser) {
          setCurrentUser(prev => {
              if (prev && prev.id === firebaseUser.uid) return prev;
              
              return {
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'משתמש',
                  email: firebaseUser.email || '',
                  avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}&background=random`,
                  role: 'user', 
                  expertise: ExpertiseLevel.MID,
                  mainField: '', 
                  portfolioUrl: ''
              };
          });
      } else {
          setCurrentUser(null);
          setUsers([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!authUid) return;

    const userDocRef = doc(db, "users", authUid);
    const unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const firestoreData = docSnap.data() as UserProfile;
            setCurrentUser(firestoreData);
        }
    });

    return () => unsubscribeUserDoc();
  }, [authUid]);

  // --- Main Data Loading ---
  useEffect(() => {
    let unsubscribeUsers = () => {};
    
    if (currentUser?.role === 'admin') {
        unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot: QuerySnapshot<DocumentData>) => {
          const fetchedUsers: UserProfile[] = [];
          snapshot.forEach((doc) => fetchedUsers.push(doc.data() as UserProfile));
          setUsers(fetchedUsers);
        });
    }

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

    const unsubscribeTaxonomy = onSnapshot(doc(db, "system_metadata", "taxonomy"), (docSnap) => {
        if (docSnap.exists()) {
            setTaxonomy(docSnap.data() as SystemTaxonomy);
        } else {
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
  }, [currentUser?.role]); 

  // --- Computed Lists ---
  const availableInterests = React.useMemo(() => {
    return Array.from(new Set([...(taxonomy.approvedInterests || COMMON_INTERESTS)])).sort();
  }, [taxonomy.approvedInterests]);

  const availableCategories = React.useMemo(() => {
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
  
  // Admin UI States
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isEmailCenterOpen, setIsEmailCenterOpen] = useState(false); // New State
  
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isWhoIsItForOpen, setIsWhoIsItForOpen] = useState(false);
  const [isSearchTipsOpen, setIsSearchTipsOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [initialMessageSubject, setInitialMessageSubject] = useState<string>('');

  const [viewFilter, setViewFilter] = useState<'all' | 'for_you'>('all');

  const displayedCategories = React.useMemo(() => {
      return [...availableCategories].sort((a, b) => {
          const isASelected = selectedCategories.includes(a);
          const isBSelected = selectedCategories.includes(b);
          if (isASelected && !isBSelected) return -1;
          if (!isASelected && isBSelected) return 1;
          return a.localeCompare(b, 'he'); 
      });
  }, [availableCategories, selectedCategories]);
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [keywordInput, setKeywordInput] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [keywordFilter, setKeywordFilter] = useState<string>('');
  const [durationFilter, setDurationFilter] = useState<'all' | 'one-time' | 'ongoing'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'deadline'>('newest');

  const [isSticky, setIsSticky] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  
  const isStickyRef = useRef(isSticky);
  const isFilterOpenRef = useRef(isFilterOpen);
  const openStartScrollY = useRef(0);
  const lastToggleTimeRef = useRef(0);
  const filterBarRef = useRef<HTMLDivElement>(null);
  
  const isProgrammaticScroll = useRef(false);
  const isFirstRender = useRef(true);

  useEffect(() => { isStickyRef.current = isSticky; }, [isSticky]);
  useEffect(() => { isFilterOpenRef.current = isFilterOpen; }, [isFilterOpen]);

  useEffect(() => {
    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;
      const currentScrollY = window.scrollY;
      const stickyOffset = filterBarRef.current ? filterBarRef.current.offsetTop - 64 : 600;
      const isNowSticky = currentScrollY >= stickyOffset - 2;

      if (isNowSticky !== isStickyRef.current) {
        setIsSticky(isNowSticky);
        isStickyRef.current = isNowSticky; 
      }

      if (isNowSticky && isFilterOpenRef.current) {
          if (Date.now() - lastToggleTimeRef.current < 500) return;
          const scrollDistance = Math.abs(currentScrollY - openStartScrollY.current);
          if (scrollDistance > 60) {
              setIsFilterOpen(false);
              isFilterOpenRef.current = false;
          }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); 

  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    const scrollToFilters = () => {
        if (!filterBarRef.current) return;
        const stickyThreshold = filterBarRef.current.offsetTop - 64;
        const targetY = stickyThreshold - 20;
        if (window.scrollY > stickyThreshold) {
            isProgrammaticScroll.current = true;
            window.scrollTo({ top: Math.max(0, targetY), behavior: 'auto' });
            openStartScrollY.current = Math.max(0, targetY);
            lastToggleTimeRef.current = Date.now();
            setTimeout(() => { isProgrammaticScroll.current = false; }, 100);
        }
    };
    setTimeout(scrollToFilters, 0);
  }, [selectedCategories, searchQuery, durationFilter, sortBy, keywordFilter, locationFilter]);

  const toggleStickyBar = () => {
      const currentScrollY = window.scrollY;
      if (isStickyRef.current || currentScrollY > 60) {
          const newState = !isFilterOpenRef.current;
          setIsFilterOpen(newState);
          isFilterOpenRef.current = newState;
          lastToggleTimeRef.current = Date.now(); 
          if (newState) openStartScrollY.current = currentScrollY;
      }
  };

  useEffect(() => {
    const timer = setTimeout(() => setLocationFilter(locationInput), 300);
    return () => clearTimeout(timer);
  }, [locationInput]);

  useEffect(() => {
    const timer = setTimeout(() => setKeywordFilter(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const checkForNewCategory = async (category: string) => {
      if (!category) return;
      const trimmedCat = category.trim();
      if (!taxonomy.approvedCategories.includes(trimmedCat) && !taxonomy.pendingCategories?.includes(trimmedCat)) {
          try {
              await updateDoc(doc(db, "system_metadata", "taxonomy"), {
                  pendingCategories: arrayUnion(trimmedCat)
              });
          } catch (error) { console.error("Error adding pending category", error); }
      }
  };

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

  const syncUserToOffers = async (userId: string, updatedProfile: UserProfile) => {
      try {
          const q = query(collection(db, "offers"), where("profileId", "==", userId));
          const querySnapshot = await getDocs(q);
          if (querySnapshot.empty) return;
          const batch = writeBatch(db);
          querySnapshot.forEach((docSnapshot) => {
              const offerRef = doc(db, "offers", docSnapshot.id);
              batch.update(offerRef, { profile: updatedProfile });
          });
          await batch.commit();
      } catch (error) { console.error("Error syncing profile:", error); }
  };

  const handleUpdateProfile = async (updatedProfileData: UserProfile) => {
      try {
          if (updatedProfileData.mainField) checkForNewCategory(updatedProfileData.mainField);
          const isAdmin = currentUser?.role === 'admin';
          if (isAdmin) {
              const { pendingUpdate, ...dataToSave } = updatedProfileData;
              const cleanProfileData = { ...dataToSave };
              if ('pendingUpdate' in cleanProfileData) delete (cleanProfileData as any).pendingUpdate;
              const firestoreUpdateData = { ...dataToSave, pendingUpdate: deleteField() };
              
              if (currentUser?.id === updatedProfileData.id) setCurrentUser(cleanProfileData as UserProfile);
              if (selectedProfile?.id === updatedProfileData.id) setSelectedProfile(cleanProfileData as UserProfile);
              setOffers(prevOffers => prevOffers.map(o => o.profileId === updatedProfileData.id ? { ...o, profile: cleanProfileData as UserProfile } : o));

              await setDoc(doc(db, "users", updatedProfileData.id), firestoreUpdateData, { merge: true });
              syncUserToOffers(updatedProfileData.id, cleanProfileData as UserProfile);
          } else {
              const { id, role, pendingUpdate: p, ...dataToUpdate } = updatedProfileData;
              await updateDoc(doc(db, "users", updatedProfileData.id), { pendingUpdate: dataToUpdate });
              const pendingProfile = { ...updatedProfileData, pendingUpdate: dataToUpdate };
              if (currentUser?.id === updatedProfileData.id) setCurrentUser(prev => prev ? ({ ...prev, pendingUpdate: dataToUpdate }) : null);
              if (selectedProfile?.id === updatedProfileData.id) setSelectedProfile(pendingProfile);
          }
      } catch (error) { console.error(error); alert("שגיאה בעדכון הפרופיל"); }
  };

  const handleApproveUserUpdate = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (!user || !user.pendingUpdate) return;
      if (user.pendingUpdate.mainField) await checkForNewCategory(user.pendingUpdate.mainField);
      const { pendingUpdate, ...baseUserData } = user;
      const finalData: UserProfile = { ...baseUserData, ...pendingUpdate };
      const updatePayload = { ...finalData, pendingUpdate: deleteField() };
      try {
          await setDoc(doc(db, "users", userId), updatePayload, { merge: true });
          await syncUserToOffers(userId, finalData);
          setOffers(prevOffers => prevOffers.map(o => o.profileId === userId ? { ...o, profile: finalData } : o));
          if (selectedProfile?.id === userId) setSelectedProfile(finalData);
      } catch (error) { console.error(error); alert("שגיאה באישור השינויים"); }
  };

  const handleRejectUserUpdate = async (userId: string) => {
      try {
        await updateDoc(doc(db, "users", userId), { pendingUpdate: deleteField() });
        const user = users.find(u => u.id === userId);
        if (user && selectedProfile?.id === userId) {
             const { pendingUpdate, ...cleanUser } = user;
             setSelectedProfile(cleanUser as UserProfile);
        }
      } catch (error) { console.error(error); alert("שגיאה בדחיית השינויים"); }
  };

  const handleRegister = async (newUser: Partial<UserProfile>, pass: string) => {
    try {
        if (newUser.mainField) await checkForNewCategory(newUser.mainField);
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
        setIsAuthModalOpen(false);
        
        // Trigger Welcome Email (Integration)
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
          await updateDoc(doc(db, "system_metadata", "taxonomy"), { 
              pendingCategories: arrayRemove(category),
              approvedCategories: arrayRemove(category) 
          });
      } catch (e) { console.error(e); }
  };
  
  const handleReassignCategory = async (oldCategory: string, newCategory: string) => {
      try {
          const q = query(collection(db, "users"), where("mainField", "==", oldCategory));
          const querySnapshot = await getDocs(q);
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => { batch.update(doc.ref, { mainField: newCategory }); });
          await batch.commit();
          await updateDoc(doc(db, "system_metadata", "taxonomy"), { pendingCategories: arrayRemove(oldCategory) });
          alert(`עודכנו ${querySnapshot.size} משתמשים.`);
      } catch (e) { console.error(e); alert("שגיאה בשינוי קטגוריה"); }
  };
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
          await updateDoc(doc(db, "system_metadata", "taxonomy"), { pendingInterests: arrayRemove(interest), approvedInterests: arrayRemove(interest) });
      } catch (e) { console.error(e); }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        setIsAuthModalOpen(false);
    } catch (error: any) { alert("שגיאה בהתחברות: " + error.message); }
  };

  const handleCompleteProfile = (data: { portfolioUrl: string, portfolioImages: string[] }) => {
    if (!currentUser) return;
    handleUpdateProfile({ ...currentUser, ...data });
    setIsCompleteProfileModalOpen(false);
  };

  const handleLogout = async () => { await signOut(auth); };

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
      try { await setDoc(doc(db, "offers", updatedOffer.id), offerToSave); } 
      catch (error) { console.error(error); }
  };
  
  const handleEditOffer = (offer: BarterOffer) => {
      setEditingOffer(offer);
      setIsCreateModalOpen(true);
      setIsAdminDashboardOpen(false);
  };
  
  const handleRateOffer = async (offerId: string, score: number) => {
    if (!currentUser) return;
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;
    const newRatings = [...(offer.ratings || []).filter(r => r.userId !== currentUser.id), { userId: currentUser.id, score }];
    const average = parseFloat((newRatings.reduce((sum, r) => sum + r.score, 0) / newRatings.length).toFixed(1));
    try { await updateDoc(doc(db, "offers", offerId), { ratings: newRatings, averageRating: average }); } 
    catch (error) { console.error(error); }
  };

  const handleDeleteOffer = async (offerId: string) => { 
      try { await deleteDoc(doc(db, "offers", offerId)); } 
      catch (error) { console.error(error); alert("שגיאה במחיקת המודעה"); } 
  };
  
  const handleApproveOffer = async (offerId: string) => { try { await updateDoc(doc(db, "offers", offerId), { status: 'active' }); } catch (error) { console.error(error); } };
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
    try { 
        await setDoc(doc(db, "messages", newMessage.id), newMessage);
        
        // Trigger Email Alert (Integration)
        // Find recipient email (optimized: in real app, better to fetch from DB)
        // For now, assume we can get it if admin or just trigger logic on backend
        // Here we send the trigger to backend, backend should look up email
        fetch('/api/emails/send', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                type: 'chat_alert',
                to: receiverId, // Backend will resolve ID to Email
                data: { 
                    userName: receiverName,
                    senderName: currentUser?.name || 'משתמש'
                }
            })
        }).catch(e => console.error("Email trigger failed", e));

    } catch (error) { console.error(error); }
  };

  const handleMarkAsRead = async (messageId: string) => { try { await updateDoc(doc(db, "messages", messageId), { isRead: true }); } catch (error) { console.error(error); } };
  const handleAddAd = async (newAd: SystemAd) => { try { await setDoc(doc(db, "systemAds", newAd.id), newAd); } catch (error) { console.error(error); } };
  const handleEditAd = async (updatedAd: SystemAd) => { try { await setDoc(doc(db, "systemAds", updatedAd.id), updatedAd); } catch (error) { console.error(error); } };
  const handleDeleteAd = async (adId: string) => { 
      try { await deleteDoc(doc(db, "systemAds", adId)); } 
      catch (error) { console.error(error); alert("שגיאה במחיקת הקמפיין"); } 
  };

  const handleDeleteUser = async (userId: string) => {
      try {
          await deleteDoc(doc(db, "users", userId));
          const q = query(collection(db, "offers"), where("profileId", "==", userId));
          const querySnapshot = await getDocs(q);
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => {
              batch.delete(doc.ref);
          });
          await batch.commit();
      } catch (error) {
          console.error("Error deleting user:", error);
          alert("שגיאה במחיקת המשתמש");
      }
  };

  const handleContact = (profile: UserProfile, offerTitle?: string) => {
    if (!currentUser) { setAuthStartOnRegister(false); setIsAuthModalOpen(true); return; }
    if (profile.id === currentUser.id) { alert("זוהי ההצעה שלך :)"); return; }
    handleViewProfile(profile, true).then(() => {
        setInitialMessageSubject(offerTitle ? `התעניינות ב: ${offerTitle}` : '');
        setIsMessagingModalOpen(true);
    });
  };

  const handleViewProfile = async (profile: UserProfile, openMessaging = false) => {
    let profileToView = profile;
    if (currentUser && profile.id === currentUser.id) profileToView = currentUser;
    else if (currentUser?.role === 'admin') {
        const cachedUser = users.find(u => u.id === profile.id);
        if (cachedUser) profileToView = cachedUser;
    } else {
        try {
             const userDoc = await getDoc(doc(db, "users", profile.id));
             if (userDoc.exists()) profileToView = userDoc.data() as UserProfile;
        } catch (e) { console.error(e); }
    }
    setSelectedProfile(profileToView);
    if (!openMessaging) setIsProfileModalOpen(true);
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

  const pendingUserUpdatesCount = users.filter(u => u.pendingUpdate).length;
  const pendingOffersCount = offers.filter(o => o.status === 'pending').length;
  const pendingTaxonomyCount = (taxonomy.pendingCategories?.length || 0) + (taxonomy.pendingInterests?.length || 0);
  const totalAdminPending = pendingUserUpdatesCount + pendingOffersCount + pendingTaxonomyCount;

  const filteredOffers = offers.filter(offer => {
    const isMine = currentUser && offer.profileId === currentUser.id;
    const isAdmin = currentUser?.role === 'admin';
    if (offer.status !== 'active' && !isMine && !isAdmin) return false; 

    if (viewFilter === 'for_you') {
        if (!currentUser) return false; 
        const myProfession = currentUser.mainField;
        const matchesMyProfession = 
            offer.requestedService.includes(myProfession) || 
            (offer.tags && offer.tags.some(t => t === myProfession));

        const myInterests = currentUser.interests || [];
        const matchesMyInterests = 
            myInterests.some(interest => 
                offer.offeredService.includes(interest) || 
                (offer.tags && offer.tags.includes(interest))
            );

        if (!matchesMyProfession && !matchesMyInterests) return false;
    }

    const title = offer.title || '';
    const offeredService = offer.offeredService || '';
    const requestedService = offer.requestedService || '';
    const description = offer.description || '';
    const location = offer.location || '';
    const tags = Array.isArray(offer.tags) ? offer.tags : [];

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(title.toLowerCase().includes(query) || 
              offeredService.toLowerCase().includes(query) || 
              requestedService.toLowerCase().includes(query) || 
              description.toLowerCase().includes(query) || 
              tags.some(t => (t || '').toLowerCase().includes(query)))) return false;
    }
    if (keywordFilter) {
        const query = keywordFilter.toLowerCase();
        if (!(title.toLowerCase().includes(query) || 
              offeredService.toLowerCase().includes(query) || 
              requestedService.toLowerCase().includes(query) || 
              tags.some(t => (t || '').toLowerCase().includes(query)))) return false;
    }
    if (locationFilter && !location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (durationFilter !== 'all' && offer.durationType !== durationFilter) return false;
    
    if (selectedCategories.length > 0) {
        const matchesCategory = selectedCategories.some(cat => 
            tags.includes(cat) || 
            offeredService.includes(cat) ||
            tags.some(t => t.includes(cat)) 
        );
        if (!matchesCategory) return false;
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
        onOpenProfile={() => { 
            setSelectedProfile(currentUser); 
            setIsProfileModalOpen(true); 
        }}
        // Updated Props
        onOpenAdminDashboard={() => setIsAdminDashboardOpen(true)}
        onOpenEmailCenter={() => setIsEmailCenterOpen(true)} // Pass the handler
        
        adminPendingCount={totalAdminPending}
        onLogout={handleLogout}
        onSearch={setSearchQuery}
        unreadCount={unreadCount}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        activeFeed={viewFilter}
        onNavigate={(feed) => {
            if (feed === 'for_you' && !currentUser) {
                setAuthStartOnRegister(false);
                setIsAuthModalOpen(true);
            } else {
                setViewFilter(feed);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }}
      />
      
      {viewFilter === 'all' && (
        <Hero 
            currentUser={currentUser}
            onOpenWhoIsItFor={() => setIsWhoIsItForOpen(true)}
            onOpenSearchTips={() => setIsSearchTipsOpen(true)}
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        <AdBanner contextCategories={selectedCategories} systemAds={systemAds} currentUser={currentUser} />
        
        {viewFilter === 'for_you' && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="bg-brand-100 p-2 rounded-full text-brand-600"><Plus className="w-5 h-5" /></span>
                    הצעות שנבחרו במיוחד בשבילך
                </h2>
                <p className="text-slate-500 mt-1">
                    רשימה מותאמת אישית לפי תחום העיסוק ({currentUser?.mainField}) ותחומי העניין שלך.
                </p>
            </div>
        )}

        {/* Filters Bar */}
        <div 
          ref={filterBarRef}
          className={`bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 mb-8 sticky top-16 z-30 ${isSticky ? 'py-2 px-3 sm:px-4 cursor-pointer' : 'p-3 sm:p-6'}`}
          onClick={toggleStickyBar}
        >
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 items-start lg:items-center justify-between">
                 <div className="flex items-center justify-between w-full lg:w-auto shrink-0">
                     <div className={`flex items-center gap-2 select-none ${isSticky ? 'flex-1 lg:flex-none' : ''}`}>
                        <div className="bg-brand-100 p-2 rounded-lg text-brand-700 shrink-0"><Filter className="w-5 h-5" /></div>
                        <span className={`font-bold text-slate-800 whitespace-nowrap ${isSticky ? 'text-sm' : ''}`}>{isSticky ? 'סינון' : 'סינון הצעות'}</span>
                        {isSticky && <div className="text-slate-400 mr-2">{isFilterOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}</div>}
                     </div>
                     <div className="flex lg:hidden items-center gap-2 overflow-x-auto scrollbar-hide" onClick={(e) => e.stopPropagation()}>
                         <div className="flex items-center gap-2 bg-white border border-slate-300 p-1 rounded-xl h-[42px]">
                            <div className="relative group flex items-center h-full">
                                <ArrowUpDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
                                <select className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8 pl-2 h-full outline-none appearance-none w-full" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                                    <option value="newest">מודעות חדשות</option>
                                    <option value="deadline">מסתיימות בקרוב</option>
                                    <option value="rating">הכי מומלצות</option>
                                </select>
                            </div>
                         </div>
                         <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 h-[42px] shrink-0">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('compact')} className={`p-1.5 rounded-md transition-all ${viewMode === 'compact' ? 'bg-slate-100 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon className="w-4 h-4" /></button>
                         </div>
                     </div>
                 </div>

                 <div 
                    className={`flex flex-col lg:flex-row gap-2 w-full lg:w-auto lg:justify-end items-center ${(!isSticky || isFilterOpen) ? 'flex' : 'hidden lg:flex'}`}
                 >
                     {(!isSticky || isFilterOpen) && (
                         <div 
                            className={`flex flex-col lg:flex-row gap-2 w-full lg:w-auto items-center ${isSticky ? 'animate-in fade-in slide-in-from-top-2' : ''}`}
                         >
                             <div className="relative group w-full lg:w-44">
                                 <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                 <input 
                                    type="text" 
                                    className="w-full pl-3 pr-9 h-[42px] bg-white border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none transition-all shadow-sm" 
                                    placeholder="חיפוש חופשי..." 
                                    value={keywordInput} 
                                    onChange={(e) => setKeywordInput(e.target.value)} 
                                    onClick={(e) => e.stopPropagation()} 
                                />
                             </div>
                             <div className="relative group w-full lg:w-44">
                                 <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                 <input 
                                    type="text" 
                                    className="w-full pl-3 pr-9 h-[42px] bg-white border border-slate-300 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-brand-200 focus:border-brand-500 outline-none transition-all shadow-sm" 
                                    placeholder="חיפוש לפי עיר..." 
                                    value={locationInput} 
                                    onChange={(e) => setLocationInput(e.target.value)} 
                                    onClick={(e) => e.stopPropagation()} 
                                />
                             </div>
                             <div className="flex flex-row gap-2 w-full lg:w-auto">
                                <div className="flex-1 sm:flex-none flex bg-white p-1 rounded-xl border border-slate-300 justify-center h-[42px] items-center" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => setDurationFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all h-full flex items-center justify-center ${durationFilter === 'all' ? 'bg-slate-100 shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>הכל</button>
                                    <button onClick={() => setDurationFilter('one-time')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all h-full flex items-center justify-center gap-1 ${durationFilter === 'one-time' ? 'bg-slate-100 shadow-sm text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}><Clock className="w-3 h-3" /><span className="hidden xl:inline">חד פעמי</span><span className="xl:hidden">פרויקט</span></button>
                                    <button onClick={() => setDurationFilter('ongoing')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all h-full flex items-center justify-center gap-1 ${durationFilter === 'ongoing' ? 'bg-slate-100 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}><Repeat className="w-3 h-3" /><span className="hidden xl:inline">מתמשך</span><span className="xl:hidden">ריטיינר</span></button>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleResetFilters(); }} 
                                    className="flex items-center justify-center gap-1 px-3 h-[42px] text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors font-medium text-xs border border-transparent hover:border-red-200 shrink-0" 
                                    title="נקה את כל הסינונים"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                             </div>
                         </div>
                     )}

                     <div 
                        className="hidden lg:flex items-center gap-2 ml-2"
                        onClick={(e) => e.stopPropagation()} 
                     >
                         <div className="flex items-center gap-2 bg-white border border-slate-300 p-1 rounded-xl h-[42px]">
                            <div className="relative group flex items-center h-full">
                                <ArrowUpDown className="w-4 h-4 text-slate-400 absolute right-2 pointer-events-none" />
                                <select className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 cursor-pointer pr-8 pl-2 h-full outline-none appearance-none hover:text-brand-600 transition-colors" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                                    <option value="newest">מודעות חדשות</option>
                                    <option value="deadline">מסתיימות בקרוב</option>
                                    <option value="rating">הכי מומלצות</option>
                                </select>
                            </div>
                         </div>
                         <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 h-[42px] shrink-0">
                            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-slate-100 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('compact')} className={`p-1.5 rounded-md transition-all ${viewMode === 'compact' ? 'bg-slate-100 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><ListIcon className="w-4 h-4" /></button>
                         </div>
                     </div>

                 </div>
            </div>
            {(!isSticky || isFilterOpen) && (
                <div 
                    className={isSticky ? 'animate-in fade-in slide-in-from-top-2' : ''}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="h-px bg-slate-100 my-2 sm:my-3 w-full"></div>
                    <div className="relative w-full overflow-hidden">
                        <div className="flex gap-2 overflow-x-auto pb-2 pt-2 scrollbar-hide select-none">
                            <button onClick={() => toggleCategory('הכל')} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${selectedCategories.length === 0 ? 'bg-slate-900 text-white border-slate-900 shadow-md transform scale-105' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>הכל</button>
                            {displayedCategories.map(category => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {filteredOffers.length > 0 ? (
                  filteredOffers.map((offer) => (
                    <OfferCard 
                        key={offer.id} 
                        offer={offer} 
                        onContact={(profile) => handleContact(profile, offer.title)} 
                        onUserClick={(profile) => handleViewProfile(profile)} 
                        onRate={handleRateOffer} 
                        currentUserId={currentUser?.id} 
                        viewMode={viewMode} 
                        onDelete={handleDeleteOffer} 
                        onEdit={handleEditOffer} 
                    />
                  ))
              ) : (
                  viewFilter === 'for_you' ? (
                      <div className="col-span-full text-center py-16 bg-white rounded-xl border border-slate-200 shadow-sm">
                          <div className="bg-brand-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                              <Search className="w-8 h-8 text-brand-600" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">עדיין לא נמצאו התאמות מושלמות</h3>
                          <p className="text-slate-500 max-w-md mx-auto mb-6">
                              אנחנו מחפשים כל הזמן הצעות שמתאימות למקצוע שלך ({currentUser?.mainField}) או לתחומי העניין שלך.
                              כדאי לוודא שפרופיל המשתמש שלך מעודכן עם כל תחומי העניין!
                          </p>
                          <button 
                            onClick={() => {
                                setSelectedProfile(currentUser);
                                setIsProfileModalOpen(true);
                            }}
                            className="text-brand-600 font-bold hover:underline"
                          >
                              עדכן פרופיל אישי
                          </button>
                      </div>
                  ) : null
              )}
              
              {(viewFilter === 'all' || filteredOffers.length > 0) && (
                  <div onClick={handleOpenCreate} className={`cursor-pointer border-2 border-dashed border-brand-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-all group min-h-[150px] ${viewMode === 'grid' ? 'min-h-[350px]' : ''}`}>
                       <div className="bg-brand-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform shadow-sm"><Plus className="w-8 h-8 text-brand-600" /></div>
                       <h3 className="text-xl font-bold text-slate-800">יש לך כישרון להציע?</h3>
                       <p className="text-slate-500 mt-2 max-w-xs text-sm">הצטרף למאות בעלי עסקים שכבר מחליפים שירותים וחוסכים כסף.</p>
                       <span className="mt-4 text-brand-600 font-bold bg-white px-4 py-2 rounded-full shadow-sm text-sm group-hover:shadow-md transition-shadow">פרסם הצעה חדשה &rarr;</span>
                  </div>
              )}
            </div>
        )}
        {!isLoading && filteredOffers.length === 0 && viewFilter === 'all' && (
          <div className="text-center py-10 col-span-full"><h3 className="text-lg font-bold text-slate-700">לא נמצאו הצעות תואמות לסינון</h3><button onClick={handleResetFilters} className="mt-2 text-brand-600 font-bold hover:underline text-sm">נקה סינונים</button></div>
        )}
      </main>
      <Footer onOpenAccessibility={() => setIsAccessibilityOpen(true)} />
      <CookieConsentModal />
      <CompleteProfileModal isOpen={isCompleteProfileModalOpen} onClose={() => setIsCompleteProfileModalOpen(false)} onSave={handleCompleteProfile} />
      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onAddOffer={handleAddOffer} onUpdateOffer={handleUpdateOffer} currentUser={currentUser || { ...{id:'guest', name:'אורח', avatarUrl:'', role:'user', expertise:ExpertiseLevel.JUNIOR, mainField:'', portfolioUrl:''}, id: 'temp' }} editingOffer={editingOffer} />
      <MessagingModal isOpen={isMessagingModalOpen} onClose={() => setIsMessagingModalOpen(false)} currentUser={currentUser?.id || 'guest'} messages={messages} onSendMessage={handleSendMessage} onMarkAsRead={handleMarkAsRead} recipientProfile={selectedProfile} initialSubject={initialMessageSubject} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} />
      
      {/* Existing Admin Dashboard */}
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
        onBulkDelete={handleBulkDelete}
        onApproveOffer={handleApproveOffer}
        onEditOffer={handleEditOffer}
        availableCategories={availableCategories}
        availableInterests={availableInterests}
        pendingCategories={taxonomy.pendingCategories}
        pendingInterests={taxonomy.pendingInterests || []}
        onAddCategory={(cat) => checkForNewCategory(cat)}
        onAddInterest={(int) => checkForNewInterest(int)}
        onDeleteCategory={handleRejectCategory}
        onDeleteInterest={handleRejectInterest}
        onApproveCategory={handleApproveCategory}
        onRejectCategory={handleRejectCategory}
        onReassignCategory={handleReassignCategory}
        onApproveInterest={handleApproveInterest}
        onRejectInterest={handleRejectInterest}
        ads={systemAds}
        onAddAd={handleAddAd}
        onEditAd={handleEditAd}
        onDeleteAd={handleDeleteAd}
        onViewProfile={handleViewProfile}
      />

      {/* New Email Control Center Modal */}
      <EmailCenterModal 
        isOpen={isEmailCenterOpen} 
        onClose={() => setIsEmailCenterOpen(false)} 
      />

      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} onOpenAuth={() => { setAuthStartOnRegister(true); setIsAuthModalOpen(true); }} />
      <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} onStartSearching={() => { setIsSearchTipsOpen(false); window.scrollTo({ top: 600, behavior: 'smooth' }); }} />
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} profile={selectedProfile} currentUser={currentUser} userOffers={userOffers} onDeleteOffer={handleDeleteOffer} onUpdateProfile={handleUpdateProfile} onContact={(profile) => handleContact(profile)} onRate={handleRateOffer} availableCategories={availableCategories} availableInterests={availableInterests} onApproveUpdate={handleApproveUserUpdate} onRejectUpdate={handleRejectUserUpdate} />
    </div>
  );
};
