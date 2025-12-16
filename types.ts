
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
  interests?: string[]; // New: For personalization (Sports, Baking, etc.)
  bio?: string;
  joinedAt?: string;
  pendingUpdate?: Partial<UserProfile>; // Staging area for profile changes requiring approval
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
  tags: string[];
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
  senderName: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
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

export interface SystemTaxonomy {
  approvedCategories: string[];
  pendingCategories: string[];
  approvedInterests: string[];
  pendingInterests?: string[];
}
