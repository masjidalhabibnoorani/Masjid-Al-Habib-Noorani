/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Admin {
  id: string;
  username: string;
  passwordHash: string; // Hashed or saved securely
  role: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  active: boolean;
  expiryDate: string;
  createdAt: string;
  imageUrl?: string;
  showImage?: boolean;
}

export interface PrayerTiming {
  id: string;
  prayerName: string;
  azaanTime: string; // "HH:MM"
  prayerTime: string; // "HH:MM"
  notes: string;
}

export interface HistorySection {
  id: string;
  title: string;
  content: string;
  sortOrder: number;
}

export interface Activity {
  id: string;
  title: string;
  timing: string;
  description: string;
  sortOrder: number;
}

export interface MapSettings {
  id: string;
  iframeUrl: string;
  address: string;
  details?: string;
}

export interface Administrator {
  id: string;
  moduleType: 'masjid' | 'bazm' | 'project';
  moduleId: string | null; // Null for masjid/bazm, ID for specific projects
  name: string;
  position: string;
  phone: string;
  image: string; // Base64 or online placeholder
}

export type FundType = 'masjid' | 'bazm' | 'project';
export type FundStatus = 'active' | 'completed' | 'archived' | 'suspended';

export interface FundModule {
  id: string; // e.g. 'masjid-fund', 'bazm-fund', 'project-x'
  name: string;
  type: FundType;
  status: FundStatus;
}

export interface FundMember {
  id: string;
  fundId: string;
  name: string;
  phone: string;
  requiredAmount: number;
  remainingPrevious: number;
  paidPrevious: number;
  paidPreviousDate?: string; // Date when previous dues were paid
}

export interface FundMemberTransaction {
  id: string;
  memberId: string;
  monthKey: string; // '2026-01' (Gregorian), 'Rabi-ul-Awwal' (Islamic), or 'Phase 1' etc.
  amount: number;
  paymentDate: string; // 'YYYY-MM-DD'
}

export interface OtherFundEntry {
  id: string;
  fundId: string;
  date: string;
  source: string;
  amount: number;
  details: string;
}

export interface Expense {
  id: string;
  fundId: string;
  name: string;
  amount: number;
  date: string;
  details: string;
}

export interface ProtectedPagePassword {
  id: string; // e.g. 'masjid_portfolio', 'masjid_fixed', 'masjid_other', 'masjid_expenses', 'bazm_portfolio' etc. or 'project_[projectId]_portfolio'
  pageName: string;
  passwordValue: string; // Read/Write representation as requested for Admin Dashboard
}

export interface Project {
  id: string;
  fundModuleId: string; // Points to 'project-x' fund module
  name: string;
  shortDescription: string;
  fullDescription: string;
  targetAmount: number;
  status: FundStatus; // 'active' | 'completed' | 'archived' | 'suspended'
  startDate: string;
  endDate: string;
  featuredImage: string;
  visibility: 'public' | 'hidden';
  dynamicMonths: string[]; // Phase 1, Phase 2, etc. configured dynamically
  gallery: string[]; // List of images
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: 'ADD' | 'EDIT' | 'DELETE' | 'PASSWORD_CHANGE' | 'RESTORE' | 'BACKUP_CREATE' | 'BACKUP_RESTORE';
  module: string;
  recordId: string;
  oldValue: string; // JSON Stringified
  newValue: string; // JSON Stringified
  ipAddress: string;
  timestamp: string;
}

export interface BackupRecord {
  timestamp: string;
  type: 'manual' | 'auto';
  fileName: string;
  dataJson: string;
}

export function resolveImageUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  
  // ImgBB single image page links, e.g. https://ibb.co/7tYdgYvy or http://ibb.co/7tYdgYvy
  // Convert them to the raw image endpoint: https://i.ibb.co/7tYdgYvy/image.png
  const ibbRegex = /https?:\/\/ibb\.co\/([a-zA-Z0-9]+)/i;
  const match = trimmed.match(ibbRegex);
  if (match) {
    const code = match[1];
    return `https://i.ibb.co/${code}/image.png`;
  }
  return trimmed;
}

export interface ShopRentRecord {
  id: string;
  name: string;
  monthlyRent: number;
  isRented: boolean;
  payments: Record<string, {
    isPaid: boolean;
    paymentDate: string;
    amountPaid: number;
  }>;
}

export interface ZakatEntry {
  id: string;
  type: 'collection' | 'disbursement';
  donorOrBeneficiary: string;
  amount: number;
  date: string;
  category: string; // e.g., 'Widow support', 'Medical Aid', 'General Sadqah'
  month: string;
}

export interface Commitment {
  id: string;
  fundId: string; // e.g. 'masjid-fund', 'bazm-fund', 'project-x'
  name: string;
  phone: string;
  amountDue: number; // Remaining amount to pay
  notes: string;
  createdAt: string;
}

export interface ReligiousStaff {
  id: string;
  name: string;
  position: string;
  phone: string;
  imageUrl: string;
  active: boolean;
}

