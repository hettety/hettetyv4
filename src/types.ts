export type Page = 'home' | 'listings' | '3d-experience' | 'legal' | 'ai-chat' | 'login' | 'register' | 'contact' | '3d' | 'about' | 'buy' | 'verification' | 'tours' | 'terms' | 'privacy' | 'cookie-policy' | 'profile' | 'add-listing' | 'payment' | 'manage-users';

export interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  imageUrl: string;
  images?: string[];
  videoUrl?: string;
  digitalTwinUrl?: string; // Real walkthrough tour — Matterport or Polycam link
  panoramas?: string[]; // Equirectangular 360° photos for the panorama viewer
  status: 'For Sale' | 'For Rent';
  isVerified: boolean;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  paymentMethods?: string[];
  publishDate?: string;
  unitCode?: string;
  legalDocs?: string[]; // URLs or IDs
  authorUid?: string;
  
  // Additional Legal / Details Info
  registrationNumber?: string; // raqm el shahr el 3aqary
  courtSignatureValidity?: boolean; // s7t tawqe3
  isResale?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferences: string;
}

export interface Purchase {
  id: string;
  propertyId: string;
  purchaseDate: string;
  status: string;
  property?: Property;
}

export interface ChatMessage {
  role: 'model' | 'user';
  text: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  lastUpdatedAt: string;
}

export interface UserDocument {
  id: string;
  fileId?: string;
  name: string;
  type: string;
  status: string;
  uploadDate: string;
  accessStatus?: 'Locked' | 'Requested' | 'Granted';
  size?: number;
  content?: string; // Base64 data URL for viewing (if small) or download URL
  ownerUid: string;
  storagePath?: string;
}
