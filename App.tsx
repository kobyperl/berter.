
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

  // --- Auth Listener & Current User Sync ---
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((firebaseUser) => {
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

    const userDocRef = db.collection("users").doc(authUid);
    const unsubscribeUserDoc = userDocRef.onSnapshot((docSnap) => {
        if (docSnap.exists) {
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

    const unsubscribeMessages = db.collection("messages").onSnapshot((snapshot) => {
        const fetchedMessages: Message[] = [];
        snapshot.forEach((doc) => fetchedMessages.push(doc.data() as Message));
        setMessages(fetchedMessages);
    });

    const unsubscribeTaxonomy = db.collection("system_metadata").doc("taxonomy").onSnapshot((docSnap) => {
        if (docSnap.exists) {
            setTaxonomy(docSnap.data() as SystemTaxonomy);
        } else {
            db.collection("system_metadata").doc("taxonomy").set({
                approvedCategories: CATEGORIES,
                pendingCategories: [],
                approvedInterests: COMMON_INTERESTS,
                pendingInterests: [],
                categoryHierarchy: {}
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
  const [isMessagingModalOpen, setIsMessagingModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForceEditMode, setProfileForceEditMode] = useState(false);
  const [isPostRegisterPromptOpen, setIsPostRegisterPromptOpen] = useState(false);
  const [isProfessionalismPromptOpen, setIsProfessionalismPromptOpen] = useState(false); 
  
  // Admin UI States
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
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  useEffect(() => {
    const timer = setTimeout(() => setLocationFilter(locationInput), 300);
    return () => clearTimeout(timer);
  }, [locationInput]);

  useEffect(() => {
    const timer = setTimeout(() => setKeywordFilter(keywordInput), 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  const normalizeInput = (input: string | undefined, list: string[]) => {
      if (!input) return '';
      const trimmed = input.trim();
      const match = list.find(item => item.trim().toLowerCase() === trimmed.toLowerCase());
      return match || trimmed;
  };

  const checkForNewCategory = async (category: string) => {
      if (!category) return;
      const trimmedCat = category.trim();
      const existsInApproved = taxonomy.approvedCategories.some(c => c.trim().toLowerCase() === trimmedCat.toLowerCase());
      const existsInPending = taxonomy.pendingCategories?.some(c => c.trim().toLowerCase() === trimmedCat.toLowerCase());
      if (!existsInApproved && !existsInPending) {
          try {
              await db.collection("system_metadata").doc("taxonomy").update({
                  pendingCategories: firebase.firestore.FieldValue.arrayUnion(trimmedCat)
              });
          } catch (error) { console.error("Error adding pending category", error); }
      }
  };

  const checkForNewInterest = async (interest: string) => {
      if (!interest) return;
      const trimmed = interest.trim();
      const existsInApproved = taxonomy.approvedInterests.some(i => i.trim().toLowerCase() === trimmed.toLowerCase());
      const existsInPending = taxonomy.pendingInterests?.some(i => i.trim().toLowerCase() === trimmed.toLowerCase());
      if (!existsInApproved && !existsInPending) {
          try {
              await db.collection("system_metadata").doc("taxonomy").update({
                  pendingInterests: firebase.firestore.FieldValue.arrayUnion(trimmed)
              });
          } catch (e) { console.error(e); }
      }
  };

  const syncUserToOffers = async (userId: string, updatedProfile: UserProfile) => {
      try {
          const q = db.collection("offers").where("profileId", "==", userId);
          const querySnapshot = await q.get();
          if (querySnapshot.empty) return;
          const batch = db.batch();
          querySnapshot.forEach((docSnapshot) => {
              const offerRef = db.collection("offers").doc(docSnapshot.id);
              batch.update(offerRef, { profile: updatedProfile });
          });
          await batch.commit();
      } catch (error) { console.error("Error syncing profile:", error); }
  };

  const handleUpdateProfile = async (updatedProfileData: UserProfile) => {
      const normalizedProfile: UserProfile = {
          ...updatedProfileData,
          mainField: normalizeInput(updatedProfileData.mainField, taxonomy.approvedCategories),
          interests: (updatedProfileData.interests || []).map(i => normalizeInput(i, taxonomy.approvedInterests))
      };
      try {
          if (normalizedProfile.mainField) checkForNewCategory(normalizedProfile.mainField);
          if (normalizedProfile.interests) { normalizedProfile.interests.forEach(interest => checkForNewInterest(interest)); }
          const isAdmin = currentUser?.role === 'admin';
          if (isAdmin) {
              const { pendingUpdate, ...dataToSave } = normalizedProfile;
              const firestoreUpdateData = { ...dataToSave, pendingUpdate: firebase.firestore.FieldValue.delete() };
              if (currentUser?.id === normalizedProfile.id) setCurrentUser(dataToSave as UserProfile);
              await db.collection("users").doc(normalizedProfile.id).set(firestoreUpdateData, { merge: true });
              syncUserToOffers(normalizedProfile.id, dataToSave as UserProfile);
          } else {
              const { id, role, pendingUpdate: p, ...dataToUpdate } = normalizedProfile;
              await db.collection("users").doc(normalizedProfile.id).update({ pendingUpdate: dataToUpdate });
              if (currentUser?.id === normalizedProfile.id) setCurrentUser(prev => prev ? ({ ...prev, pendingUpdate: dataToUpdate }) : null);
          }
      } catch (error) { console.error(error); alert("שגיאה בעדכון הפרופיל"); }
  };

  const handleRegister = async (newUser: Partial<UserProfile>, pass: string) => {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(newUser.email!, pass);
        const uid = userCredential.user!.uid;
        const normalizedMainField = normalizeInput(newUser.mainField, taxonomy.approvedCategories) || newUser.mainField?.trim() || 'כללי';
        const normalizedInterests = (newUser.interests || []).map(i => normalizeInput(i, taxonomy.approvedInterests) || i.trim());
        const userProfile: UserProfile = {
            id: uid,
            name: newUser.name || 'משתמש חדש',
            email: newUser.email,
            role: newUser.email === ADMIN_EMAIL ? 'admin' : 'user',
            avatarUrl: newUser.avatarUrl || `https://ui-avatars.com/api/?name=${newUser.name}&background=random`,
            portfolioUrl: newUser.portfolioUrl || '',
            portfolioLinkText: newUser.portfolioLinkText || '',
            portfolioImages: newUser.portfolioImages || [],
            expertise: newUser.expertise || ExpertiseLevel.MID,
            mainField: normalizedMainField, 
            interests: normalizedInterests,
            joinedAt: new Date().toISOString()
        };
        await db.collection("users").doc(uid).set(userProfile);
        setCurrentUser(userProfile);
        setIsAuthModalOpen(false);

        setTimeout(() => {
            setIsPostRegisterPromptOpen(true);
        }, 1000);

        if (normalizedMainField) checkForNewCategory(normalizedMainField).catch(e => {});
        if (normalizedInterests.length > 0) {
            normalizedInterests.forEach(interest => checkForNewInterest(interest).catch(e => {}));
        }
    } catch (error: any) { 
        console.error("Registration Error:", error);
        alert(`שגיאה בהרשמה: ${error.message}`); 
    }
  };

  const handleLogin = async (email: string, pass: string) => {
    try { await auth.signInWithEmailAndPassword(email, pass); setIsAuthModalOpen(false); } 
    catch (error: any) { alert("שגיאה בהתחברות: " + error.message); }
  };

  const handleLogout = async () => { await auth.signOut(); };
  
  const handleAddOffer = async (newOffer: BarterOffer) => {
    try { 
        await db.collection("offers").doc(newOffer.id).set(newOffer);
        
        const hasShownThisSession = sessionStorage.getItem('prof_prompt_shown');
        if (!hasShownThisSession) {
            setTimeout(() => {
                setIsProfessionalismPromptOpen(true);
                sessionStorage.setItem('prof_prompt_shown', 'true');
            }, 1500);
        }
    } 
    catch (error) { alert("שגיאה בפרסום ההצעה"); }
  };

  const handleSendMessage = async (receiverId: string, receiverName: string, subject: string, content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(), senderId: currentUser?.id || 'guest', receiverId, senderName: currentUser?.name || 'אורח', receiverName, subject, content, timestamp: new Date().toISOString(), isRead: false
    };
    try { await db.collection("messages").doc(newMessage.id).set(newMessage); } 
    catch (error) { console.error("Error saving message:", error); }
  };

  const handleContact = (profile: UserProfile, subject: string = '') => {
    if (!currentUser) { 
        setAuthStartOnRegister(false); 
        setIsAuthModalOpen(true); 
        return; 
    }
    setSelectedProfile(profile);
    setInitialMessageSubject(subject);
    setIsMessagingModalOpen(true);
  };

  const handleRateOffer = async (offerId: string, rating: number) => {
    if (!currentUser) { 
        setIsAuthModalOpen(true); 
        return; 
    }
    
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    const existingRatings = offer.ratings || [];
    const userRatingIndex = existingRatings.findIndex(r => r.userId === currentUser.id);
    
    let newRatings = [...existingRatings];
    if (userRatingIndex > -1) {
        newRatings[userRatingIndex] = { userId: currentUser.id, score: rating };
    } else {
        newRatings.push({ userId: currentUser.id, score: rating });
    }

    const totalScore = newRatings.reduce((acc, curr) => acc + curr.score, 0);
    const averageRating = totalScore / newRatings.length;

    try {
        await db.collection("offers").doc(offerId).update({
            ratings: newRatings,
            averageRating: averageRating
        });
    } catch (error) {
        console.error("Error rating offer:", error);
    }
  };

  const handleViewProfile = async (profile: UserProfile, openMessaging = false) => {
    let profileToView = profile;
    if (currentUser && profile.id === currentUser.id) profileToView = currentUser;
    else {
        try {
             const userDoc = await db.collection("users").doc(profile.id).get();
             if (userDoc.exists) profileToView = userDoc.data() as UserProfile;
        } catch (e) { console.error(e); }
    }
    setSelectedProfile(profileToView);
    if (!openMessaging) {
        setProfileForceEditMode(false);
        setIsProfileModalOpen(true);
    }
  };

  const handleOpenCreate = () => {
    if (!currentUser) { setAuthStartOnRegister(true); setIsAuthModalOpen(true); return; }
    setEditingOffer(null);
    setIsCreateModalOpen(true);
    setIsPostRegisterPromptOpen(false); 
  };

  const toggleCategory = (category: string) => {
      if (category === 'הכל') { setSelectedCategories([]); return; }
      setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };

  const handleResetFilters = () => {
      setSearchQuery(''); setKeywordFilter(''); setKeywordInput(''); setLocationFilter(''); setLocationInput(''); setDurationFilter('all'); setSelectedCategories([]);
  };

  // --- Admin Logic Handlers ---
  const handleApproveUserUpdate = async (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user && user.pendingUpdate) {
          const { pendingUpdate, ...rest } = user;
          const updated = { ...rest, ...user.pendingUpdate };
          await db.collection("users").doc(userId).set({ ...updated, pendingUpdate: firebase.firestore.FieldValue.delete() });
          syncUserToOffers(userId, updated as UserProfile);
      }
  };

  const handleRejectUserUpdate = async (userId: string) => {
      await db.collection("users").doc(userId).update({ pendingUpdate: firebase.firestore.FieldValue.delete() });
  };

  const handleBulkDeleteOffers = async (threshold: string) => {
      const toDelete = offers.filter(o => new Date(o.createdAt) < new Date(threshold));
      const batch = db.batch();
      toDelete.forEach(o => batch.delete(db.collection("offers").doc(o.id)));
      await batch.commit();
      alert(`נמחקו ${toDelete.length} מודעות.`);
  };

  const handleTaxonomyAction = async (type: 'category' | 'interest', action: 'add' | 'delete' | 'approve' | 'reject' | 'edit' | 'reassign', data: any) => {
      const docRef = db.collection("system_metadata").doc("taxonomy");
      if (action === 'add') {
          const field = type === 'category' ? 'approvedCategories' : 'approvedInterests';
          await docRef.update({ [field]: firebase.firestore.FieldValue.arrayUnion(data) });
      } else if (action === 'delete') {
          const field = type === 'category' ? 'approvedCategories' : 'approvedInterests';
          await docRef.update({ [field]: firebase.firestore.FieldValue.arrayRemove(data) });
      } else if (action === 'approve') {
          const approvedField = type === 'category' ? 'approvedCategories' : 'approvedInterests';
          const pendingField = type === 'category' ? 'pendingCategories' : 'pendingInterests';
          await docRef.update({ 
              [approvedField]: firebase.firestore.FieldValue.arrayUnion(data),
              [pendingField]: firebase.firestore.FieldValue.arrayRemove(data)
          });
      } else if (action === 'reject') {
          const pendingField = type === 'category' ? 'pendingCategories' : 'pendingInterests';
          await docRef.update({ [pendingField]: firebase.firestore.FieldValue.arrayRemove(data) });
      } else if (action === 'reassign' && type === 'category') {
          const { oldCat, newCat } = data;
          const batch = db.batch();
          const affectedUsers = users.filter(u => u.mainField === oldCat);
          affectedUsers.forEach(u => batch.update(db.collection("users").doc(u.id), { mainField: newCat }));
          batch.update(docRef, { pendingCategories: firebase.firestore.FieldValue.arrayRemove(oldCat) });
          await batch.commit();
      } else if (action === 'edit') {
          const { oldName, newName, parent } = data;
          const tax = { ...taxonomy };
          const listField = type === 'category' ? 'approvedCategories' : 'approvedInterests';
          (tax as any)[listField] = (tax as any)[listField].map((i: string) => i === oldName ? newName : i);
          if (parent) tax.categoryHierarchy = { ...tax.categoryHierarchy, [newName]: parent };
          await docRef.set(tax);
          if (type === 'category') {
             const batch = db.batch();
             users.filter(u => u.mainField === oldName).forEach(u => batch.update(db.collection("users").doc(u.id), { mainField: newName }));
             await batch.commit();
          }
      }
  };

  const filteredOffers = React.useMemo(() => {
    return offers.filter(offer => {
      const isMine = currentUser && offer.profileId === currentUser.id;
      const isAdmin = currentUser?.role === 'admin';
      if (offer.status !== 'active' && !isMine && !isAdmin) return false; 
      if (viewFilter === 'for_you') {
          if (!currentUser) return false; 
          const myProfession = currentUser.mainField;
          const matchesMyProfession = offer.requestedService.includes(myProfession) || (offer.tags && offer.tags.some(t => t === myProfession));
          if (!matchesMyProfession) return false;
      }
      const title = offer.title || '';
      const description = offer.description || '';
      if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!(title.toLowerCase().includes(query) || description.toLowerCase().includes(query))) return false;
      }
      if (keywordFilter) {
          const query = keywordFilter.toLowerCase();
          if (!(title.toLowerCase().includes(query) || description.toLowerCase().includes(query))) return false;
      }
      if (locationFilter && !(offer.location || '').toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (durationFilter !== 'all' && offer.durationType !== durationFilter) return false;
      if (selectedCategories.length > 0) {
          const matchesCategory = selectedCategories.some(cat => (offer.tags || []).includes(cat) || (offer.offeredService || '').includes(cat));
          if (!matchesCategory) return false;
      }
      return true;
    }).sort((a, b) => {
        if (sortBy === 'rating') {
            const ratingA = a.averageRating || 0;
            const ratingB = b.averageRating || 0;
            if (ratingB !== ratingA) return ratingB - ratingA;
        }
        
        if (sortBy === 'deadline') {
            if (a.expirationDate && !b.expirationDate) return -1;
            if (!a.expirationDate && b.expirationDate) return 1;
            if (a.expirationDate && b.expirationDate) {
                return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
            }
        }

        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
    });
  }, [offers, currentUser, viewFilter, searchQuery, keywordFilter, locationFilter, durationFilter, selectedCategories, sortBy]);

  const unreadCount = messages.filter(m => m.receiverId === currentUser?.id && !m.isRead).length;

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <AccessibilityToolbar />
      <Navbar 
        currentUser={currentUser}
        onOpenCreateModal={handleOpenCreate}
        onOpenMessages={() => { if(!currentUser){ setIsAuthModalOpen(true); return; } setIsMessagingModalOpen(true); }}
        onOpenAuth={() => { setAuthStartOnRegister(false); setIsAuthModalOpen(true); }}
        onOpenProfile={() => { setSelectedProfile(currentUser); setProfileForceEditMode(false); setIsProfileModalOpen(true); }}
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
            displayedCategories={displayedCategories} handleResetFilters={handleResetFilters}
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
                    currentUserId={currentUser?.id} viewMode={viewMode}
                    onDelete={(id) => db.collection("offers").doc(id).delete()}
                    onEdit={(o) => { setEditingOffer(o); setIsCreateModalOpen(true); }}
                />
              ))}
              <div onClick={handleOpenCreate} className="cursor-pointer border-2 border-dashed border-brand-300 rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-brand-50 transition-all group">
                   <div className="bg-brand-100 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform"><Plus className="w-8 h-8 text-brand-600" /></div>
                   <h3 className="text-xl font-bold text-slate-800">פרסם הצעה חדשה</h3>
                   <p className="text-slate-500 mt-2 text-sm">הפוך את הכישרון שלך למטבע עכשיו.</p>
              </div>
            </div>
        )}
      </main>

      <Footer onOpenAccessibility={() => setIsAccessibilityOpen(true)} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      
      {/* Modals & Popups */}
      {isAdminDashboardOpen && (
          <AdminDashboardModal 
            isOpen={isAdminDashboardOpen} onClose={() => setIsAdminDashboardOpen(false)}
            users={users} currentUser={currentUser} onDeleteUser={(id) => db.collection("users").doc(id).delete()}
            onApproveUpdate={handleApproveUserUpdate} onRejectUpdate={handleRejectUserUpdate}
            offers={offers} onDeleteOffer={(id) => db.collection("offers").doc(id).delete()}
            onBulkDelete={handleBulkDeleteOffers} onApproveOffer={(id) => db.collection("offers").doc(id).update({status:'active'})}
            onEditOffer={(o) => { setEditingOffer(o); setIsAdminDashboardOpen(false); setIsCreateModalOpen(true); }}
            availableCategories={availableCategories} availableInterests={availableInterests}
            pendingCategories={taxonomy.pendingCategories || []} pendingInterests={taxonomy.pendingInterests || []}
            categoryHierarchy={taxonomy.categoryHierarchy}
            onAddCategory={(c) => handleTaxonomyAction('category', 'add', c)} onAddInterest={(i) => handleTaxonomyAction('interest', 'add', i)}
            onDeleteCategory={(c) => handleTaxonomyAction('category', 'delete', c)} onDeleteInterest={(i) => handleTaxonomyAction('interest', 'delete', i)}
            onApproveCategory={(c) => handleTaxonomyAction('category', 'approve', c)} onRejectCategory={(c) => handleTaxonomyAction('category', 'reject', c)}
            onApproveInterest={(i) => handleTaxonomyAction('interest', 'approve', i)} onRejectInterest={(i) => handleTaxonomyAction('interest', 'reject', i)}
            onReassignCategory={(oldCat, newCat) => handleTaxonomyAction('category', 'reassign', {oldCat, newCat})}
            onEditCategory={(oldName, newName, parent) => handleTaxonomyAction('category', 'edit', {oldName, newName, parent})}
            onEditInterest={(oldName, newName) => handleTaxonomyAction('interest', 'edit', {oldName, newName})}
            ads={systemAds} onAddAd={(ad) => db.collection("systemAds").doc(ad.id).set(ad)}
            onEditAd={(ad) => db.collection("systemAds").doc(ad.id).set(ad)}
            onDeleteAd={(id) => db.collection("systemAds").doc(id).delete()}
            onViewProfile={(u) => { setSelectedProfile(u); setIsProfileModalOpen(true); }}
          />
      )}

      {isEmailCenterOpen && <EmailCenterModal isOpen={isEmailCenterOpen} onClose={() => setIsEmailCenterOpen(false)} />}

      <PostRegisterPrompt 
        isOpen={isPostRegisterPromptOpen} 
        onClose={() => setIsPostRegisterPromptOpen(false)} 
        onStartOffer={handleOpenCreate}
        userName={currentUser?.name || ''}
      />
      
      <ProfessionalismPrompt 
        isOpen={isProfessionalismPromptOpen}
        onClose={() => setIsProfessionalismPromptOpen(false)}
        onEditProfile={() => {
            setIsProfessionalismPromptOpen(false);
            setSelectedProfile(currentUser);
            setProfileForceEditMode(true);
            setIsProfileModalOpen(true);
        }}
      />

      <CreateOfferModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onAddOffer={handleAddOffer} currentUser={currentUser || { ...{id:'guest', name:'אורח', avatarUrl:'', role:'user', expertise:ExpertiseLevel.JUNIOR, mainField:'', portfolioUrl:''}, id: 'temp' }} editingOffer={editingOffer} onUpdateOffer={(o) => db.collection("offers").doc(o.id).set(o)} />
      <MessagingModal isOpen={isMessagingModalOpen} onClose={() => setIsMessagingModalOpen(false)} currentUser={currentUser?.id || 'guest'} messages={messages} onSendMessage={handleSendMessage} onMarkAsRead={(id) => db.collection("messages").doc(id).update({isRead: true})} recipientProfile={selectedProfile} initialSubject={initialMessageSubject} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onLogin={handleLogin} onRegister={handleRegister} startOnRegister={authStartOnRegister} availableCategories={availableCategories} availableInterests={availableInterests} onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)} />
      <ProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => { setIsProfileModalOpen(false); setProfileForceEditMode(false); }} 
        profile={selectedProfile} 
        currentUser={currentUser} 
        userOffers={offers.filter(o => o.profileId === selectedProfile?.id)} 
        onDeleteOffer={(id) => { return db.collection("offers").doc(id).delete(); }} 
        onEditOffer={(o) => { setIsProfileModalOpen(false); setEditingOffer(o); setIsCreateModalOpen(true); }}
        onUpdateProfile={handleUpdateProfile} 
        onContact={(p) => handleContact(p)} 
        availableCategories={availableCategories} 
        availableInterests={availableInterests} 
        startInEditMode={profileForceEditMode}
      />
      <HowItWorksModal isOpen={isHowItWorksOpen} onClose={() => setIsHowItWorksOpen(false)} />
      <WhoIsItForModal isOpen={isWhoIsItForOpen} onClose={() => setIsWhoIsItForOpen(false)} onOpenAuth={() => { setAuthStartOnRegister(true); setIsAuthModalOpen(true); }} />
      <SearchTipsModal isOpen={isSearchTipsOpen} onClose={() => setIsSearchTipsOpen(false)} onStartSearching={() => window.scrollTo({ top: 600, behavior: 'smooth' })} />
      <AccessibilityModal isOpen={isAccessibilityOpen} onClose={() => setIsAccessibilityOpen(false)} />
      <PrivacyPolicyModal isOpen={isPrivacyPolicyOpen} onClose={() => setIsPrivacyPolicyOpen(false)} />
      <CookieConsentModal />
    </div>
  );
};
