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
  monthKey?: string; // '2026-01' (Gregorian), 'Rabi-ul-Awwal' (Islamic), or 'Phase 1' etc.
  amount: number;
  paymentDate?: string; // 'YYYY-MM-DD'
}

export interface OtherFundEntry {
  id: string;
  fundId: string;
  date?: string;
  source: string;
  sourceId?: string;
  amount: number;
  details: string;
  monthKey?: string;
  customOrder?: number;
}

export interface Expense {
  id: string;
  fundId: string;
  name: string;
  amount: number;
  date?: string;
  details: string;
  monthKey?: string;
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
    paymentDate?: string;
    amountPaid: number;
  }>;
}

export interface ZakatEntry {
  id: string;
  type: 'collection' | 'disbursement';
  donorOrBeneficiary: string;
  amount: number;
  date?: string;
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


export function formatDateStr(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  try {
    if (dateStr instanceof Date) {
      if (isNaN(dateStr.getTime())) return '';
      const dd = String(dateStr.getDate()).padStart(2, '0');
      const mm = String(dateStr.getMonth() + 1).padStart(2, '0');
      const yyyy = String(dateStr.getFullYear());
      return `${dd}/${mm}/${yyyy}`;
    }
    const str = String(dateStr).trim();
    if (!str) return '';

    // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
    if (dmyMatch) {
      const dd = String(dmyMatch[1]).padStart(2, '0');
      const mm = String(dmyMatch[2]).padStart(2, '0');
      const yyyy = dmyMatch[3];
      return `${dd}/${mm}/${yyyy}`;
    }

    // Match YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
    const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymdMatch) {
      const yyyy = ymdMatch[1];
      const mm = String(ymdMatch[2]).padStart(2, '0');
      const dd = String(ymdMatch[3]).padStart(2, '0');
      return `${dd}/${mm}/${yyyy}`;
    }

    // Only attempt generic date parsing if string looks like a full date (e.g. ISO string or month name with at least 8 chars)
    if (str.length >= 8 && (str.includes('T') || /[a-zA-Z]/.test(str))) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = String(d.getFullYear());
        return `${dd}/${mm}/${yyyy}`;
      }
    }

    return str;
  } catch {
    return String(dateStr || '');
  }
}

export function formatDateTimeStr(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  try {
    if (dateStr instanceof Date) {
      if (isNaN(dateStr.getTime())) return '';
      const dd = String(dateStr.getDate()).padStart(2, '0');
      const mm = String(dateStr.getMonth() + 1).padStart(2, '0');
      const yyyy = String(dateStr.getFullYear());
      let hr = dateStr.getHours();
      const min = String(dateStr.getMinutes()).padStart(2, '0');
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      hr = hr ? hr : 12;
      const hrStr = String(hr).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hrStr}:${min} ${ampm}`;
    }

    const str = String(dateStr).trim();
    if (!str) return '';

    // If ISO with time like YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD HH:mm:ss
    const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})[T\s](\d{1,2}):(\d{1,2})/);
    if (isoMatch) {
      const yyyy = isoMatch[1];
      const mm = String(isoMatch[2]).padStart(2, '0');
      const dd = String(isoMatch[3]).padStart(2, '0');
      let hr = parseInt(isoMatch[4], 10);
      const min = String(isoMatch[5]).padStart(2, '0');
      const ampm = hr >= 12 ? 'PM' : 'AM';
      hr = hr % 12;
      hr = hr ? hr : 12;
      const hrStr = String(hr).padStart(2, '0');
      return `${dd}/${mm}/${yyyy} ${hrStr}:${min} ${ampm}`;
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) {
      return formatDateStr(str);
    }
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = String(d.getFullYear());
    let hr = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12;
    hr = hr ? hr : 12;
    const hrStr = String(hr).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hrStr}:${min} ${ampm}`;
  } catch {
    return formatDateStr(dateStr);
  }
}

export function toHtmlDateValue(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '';
  try {
    if (dateStr instanceof Date) {
      if (isNaN(dateStr.getTime())) return '';
      const yyyy = String(dateStr.getFullYear());
      const mm = String(dateStr.getMonth() + 1).padStart(2, '0');
      const dd = String(dateStr.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    const str = String(dateStr).trim();
    if (!str) return '';

    // If already YYYY-MM-DD
    const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (ymdMatch) {
      const yyyy = ymdMatch[1];
      const mm = String(ymdMatch[2]).padStart(2, '0');
      const dd = String(ymdMatch[3]).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

    // If DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (dmyMatch) {
      const dd = String(dmyMatch[1]).padStart(2, '0');
      const mm = String(dmyMatch[2]).padStart(2, '0');
      const yyyy = dmyMatch[3];
      return `${yyyy}-${mm}-${dd}`;
    }

    const d = new Date(str);
    if (isNaN(d.getTime())) return '';
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

export function parseDateToDate(dateStr: string | Date | undefined | null): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? null : dateStr;
  }
  const str = String(dateStr).trim();
  if (!str) return null;

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function parseDateToTimestamp(dateStr: string | Date | undefined | null): number {
  const d = parseDateToDate(dateStr);
  return d ? d.getTime() : 0;
}
