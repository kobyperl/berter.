
export enum ExpertiseLevel {
  JUNIOR = 'מתחיל',
  MID = 'בינוני',
  SENIOR = 'מומחה',
  AGENCY = 'סוכנות'
}

export interface UserProfile {
  id: string;
  name: string; // Combined First/Last for display
  email?: string; // Auth
  password?: string; // Auth (Real implementation)
  role?: 'user' | 'admin'; // Access control
  avatarUrl: string;
  portfolioUrl: string;
  portfolioImages?: string[]; // New: Visual portfolio gallery
  expertise: ExpertiseLevel;
  mainField: string; // Used for ad targeting and relevance
  secondaryFields?: string[]; // New: Allow up to 3 fields in registration
  interests?: string[]; // New: For personalization (Sports, Baking, etc.)
  bio?: string;
  joinedAt?: string;
  pendingUpdate?: Partial<UserProfile>; // Staging area for profile changes requiring approval
  lastSmartMatchSent?: string; // Timestamp for throttling smart match emails
}

export interface Rating {
  userId: string;
  score: number; // 1-5
}

export interface BarterOffer {
  id: string;
  profileId: string;
  profile: UserProfile; // Snapshot of the user at the time of posting
  title: string;
  offeredService: string; // What I give
  requestedService: string; // What I want
  location: string;
  description: string;
  tags: string[]; // Legacy/Fallback general tags
  giving_tags?: string[]; // New: Structured tags for what is offered (AI extracted)
  receiving_tags?: string[]; // New: Structured tags for what is requested (AI extracted)
  durationType: 'one-time' | 'ongoing'; // New: Duration of the barter
  expirationDate?: string; // New: Optional expiration date for one-time offers
  status: 'active' | 'pending' | 'rejected' | 'expired'; // New: Moderation status
  createdAt: string;
  ratings: Rating[]; // Array of ratings
  averageRating: number; // Cached average
}

export interface AdContent {
  headline: string;
  body: string;
  cta: string;
  targetAudience: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  participantIds: string[]; // חובה! נדרש עבור חוקי האבטחה החדשים
  senderName: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  
  // New features
  attachmentUrl?: string;
  attachmentType?: 'image' | 'file';
  attachmentExpiry?: string; // ISO date for deletion
  replyTo?: { id: string; content: string; senderName: string };
  isDeleted?: boolean;
  lastEdited?: string; // Timestamp
}

export interface SystemAd {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  ctaText: string; // Call to Action (e.g., "Buy Now")
  linkUrl: string; // Where the click goes
  targetCategories: string[]; // Professions / Site Sections (e.g., "Web Dev")
  targetInterests: string[]; // Subject Matters / User Interests (e.g., "Music", "Sports")
  subLabel?: string; // Optional text to appear at the bottom (e.g., "Sponsored") - if empty, nothing shows
  isActive: boolean;
}

export interface TagMapping {
  tagName: string;
  mappedCategories: string[]; // IDs or Names of categories/occupations (Blue)
  mappedInterests: string[]; // IDs or Names of interests (Green)
  isHidden?: boolean; // New: If true, hide from mapping list (Blacklist)
}

export interface SystemTaxonomy {
  approvedCategories: string[];
  pendingCategories: string[];
  approvedInterests: string[];
  pendingInterests?: string[];
  categoryHierarchy?: Record<string, string>; // Child Category -> Parent Category Name
  tagMappings?: Record<string, TagMapping>; // New: Map tag string to structured mapping
  isInitialized?: boolean; // New: Track if static constants have been migrated to DB
}