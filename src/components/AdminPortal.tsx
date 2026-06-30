/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Admin, Announcement, PrayerTiming, HistorySection, Activity, MapSettings, 
  Administrator, FundModule, FundMember, FundMemberTransaction, OtherFundEntry, 
  Expense, ProtectedPagePassword, Project, AuditLog, resolveImageUrl, ShopRentRecord, ZakatEntry,
  ReligiousStaff
} from '../types';
import { useToast } from './Toast';
import { GREGORIAN_MONTHS, ISLAMIC_MONTHS, PortalDatabase } from '../data';
import TiltCard from './TiltCard';
import Counter from './Counter';

const formatTime12Hour = (timeStr: string): string => {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return trimmed;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  if (isNaN(hours)) return trimmed;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' becomes '12'
  return `${hours}:${minutes} ${ampm}`;
};
import { 
  LayoutDashboard, Globe, Shield, Database, ShieldAlert, History, Activity as ActIcon, 
  Bell, Clock, MapPin, FolderKey, FileCheck, Check, Trash2, Edit2, Plus, X,
  Save, RotateCcw, AlertCircle, FileText, Moon, UserMinus, PlusCircle, AlignLeft, Send,
  User, Users, Palette, Sliders, Search, Mic, Bot, HeartHandshake, Award
} from 'lucide-react';

interface AdminPortalProps {
  onLogout: () => void;
  onBackToPublic?: () => void;
  currentThemeId: string;
  onThemeChange: (themeId: string) => void;
  onOpenFundInAdminRoom?: (fund: FundModule) => void;
  // State elements
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  prayerTimings: PrayerTiming[];
  setPrayerTimings: React.Dispatch<React.SetStateAction<PrayerTiming[]>>;
  historySections: HistorySection[];
  setHistorySections: React.Dispatch<React.SetStateAction<HistorySection[]>>;
  activities: Activity[];
  setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
  mapSettings: MapSettings;
  setMapSettings: React.Dispatch<React.SetStateAction<MapSettings>>;
  // Portals states
  funds: FundModule[];
  setFunds: React.Dispatch<React.SetStateAction<FundModule[]>>;
  members: FundMember[];
  setMembers: React.Dispatch<React.SetStateAction<FundMember[]>>;
  transactions: FundMemberTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<FundMemberTransaction[]>>;
  others: OtherFundEntry[];
  setOthers: React.Dispatch<React.SetStateAction<OtherFundEntry[]>>;
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  passwords: ProtectedPagePassword[];
  setPasswords: React.Dispatch<React.SetStateAction<ProtectedPagePassword[]>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  commitments: any[];
  setCommitments: React.Dispatch<React.SetStateAction<any[]>>;
  auditLogs: AuditLog[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
  logAudit: (action: AuditLog['action'], module: string, recordId: string, oldValue: any, newValue: any) => void;
  administrators: Administrator[];
  setAdministrators: React.Dispatch<React.SetStateAction<Administrator[]>>;
  religiousStaff: ReligiousStaff[];
  setReligiousStaff: React.Dispatch<React.SetStateAction<ReligiousStaff[]>>;
}

type AdminTab = 
  | 'announcements'
  | 'namaz'
  | 'history'
  | 'activities'
  | 'map'
  | 'passwords'
  | 'financials'
  | 'projects'
  | 'administrators'
  | 'religious_staff'
  | 'themes'
  | 'ai'
  | 'commitments';

export default function AdminPortal({
  onLogout,
  onBackToPublic,
  currentThemeId,
  onThemeChange,
  onOpenFundInAdminRoom,
  announcements,
  setAnnouncements,
  prayerTimings,
  setPrayerTimings,
  historySections,
  setHistorySections,
  activities,
  setActivities,
  mapSettings,
  setMapSettings,
  funds,
  setFunds,
  members,
  setMembers,
  transactions,
  setTransactions,
  others,
  setOthers,
  expenses,
  setExpenses,
  passwords,
  setPasswords,
  projects,
  setProjects,
  commitments,
  setCommitments,
  auditLogs,
  setAuditLogs,
  logAudit,
  administrators,
  setAdministrators,
  religiousStaff,
  setReligiousStaff,
}: AdminPortalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('announcements');
  const [financeSubTab, setFinanceSubTab] = useState<'contributors' | 'inflows' | 'others' | 'expenses'>('contributors');

  // AI Assistant Custom Knowledge State
  const [aiExtraInfo, setAiExtraInfo] = useState(() => {
    return PortalDatabase.get<string>('ai_extra_info', '');
  });

  // Custom Theme & Landscape Wallpaper states initialized from database storage
  const [customColors, setCustomColors] = useState(() => {
    const stored = PortalDatabase.get('custom_theme_colors', {});
    return {
      bg: '#142E2B',
      bar: '#091514',
      card: '#244541',
      hover: '#315C57',
      btn: '#14B8A6',
      btnHover: '#2DD4BF',
      active: '#0D9488',
      border: '#1A3B37',
      textHeading: '#f8fafc',
      textBody: '#e2e8f0',
      textMuted: '#94a3b8',
      ...stored
    };
  });

  const [customBgUrl, setCustomBgUrl] = useState(() => {
    return PortalDatabase.get('custom_bg_image', '');
  });

  const [customBgOpacity, setCustomBgOpacity] = useState(() => {
    return PortalDatabase.get('custom_bg_opacity', 35);
  });

  const [sectionBgSettings, setSectionBgSettings] = useState<Record<string, string>>(() => {
    return PortalDatabase.get('section_bg_settings', {
      hero: 'transparent',
      namaz: 'solid',
      history: 'transparent',
      activities: 'transparent',
      location: 'solid',
      financials: 'transparent'
    });
  });

  const [sectionColors, setSectionColors] = useState<Record<string, { bg?: string; textHeading?: string; textBody?: string }>>(() => {
    return PortalDatabase.get('section_custom_colors', {
      hero: {},
      namaz: {},
      history: {},
      activities: {},
      location: {},
      financials: {}
    });
  });

  // Specific editing states
  const [editingPrayer, setEditingPrayer] = useState<PrayerTiming | null>(null);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [editingHist, setEditingHist] = useState<HistorySection | null>(null);
  const [editingAct, setEditingAct] = useState<Activity | null>(null);
  const [editingMember, setEditingMember] = useState<FundMember | null>(null);
  const [editingOther, setEditingOther] = useState<OtherFundEntry | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Financial Sub View Toggle
  const [financialSubView, setFinancialSubView] = useState<'core'>('core');

  const [newAnn, setNewAnn] = useState({ title: '', content: '', expiryDate: '', imageUrl: '', showImage: false });
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    position: 'Khatib & Markazi Lead Imam',
    phone: '',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
  });
  const [editingStaff, setEditingStaff] = useState<ReligiousStaff | null>(null);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [newHist, setNewHist] = useState({ title: '', content: '' });
  const [newAct, setNewAct] = useState({ title: '', timing: '', description: '' });
  const [editedMap, setEditedMap] = useState({ iframeUrl: mapSettings.iframeUrl, address: mapSettings.address });
  const [newAdminForm, setNewAdminForm] = useState({
    moduleType: 'masjid' as 'masjid' | 'bazm' | 'project',
    moduleId: '',
    name: '',
    position: '',
    phone: '',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120'
  });

  // Bulk financial creation forms
  const [newMemberForm, setNewMemberForm] = useState({
    fundId: 'masjid-fund',
    name: '',
    phone: '',
    requiredAmount: 12000,
    remainingPrevious: 0,
    paidPrevious: 0
  });

  const [newTransactionForm, setNewTransactionForm] = useState({
    memberId: '',
    monthKey: 'January',
    amount: 1000,
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [newOtherForm, setNewOtherForm] = useState({
    fundId: 'masjid-fund',
    source: '',
    amount: 5000,
    date: new Date().toISOString().split('T')[0],
    details: ''
  });

  const [newExpenseForm, setNewExpenseForm] = useState({
    fundId: 'masjid-fund',
    name: '',
    amount: 5000,
    date: new Date().toISOString().split('T')[0],
    details: ''
  });

  // Project Creation forms
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    shortDescription: '',
    fullDescription: '',
    targetAmount: 250000,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    dynamicMonthsCsv: 'Phase 1 Foundations, Phase 2 Construction, Phase 3 Paint',
    password: '786'
  });

  const [projectMonthsCount, setProjectMonthsCount] = useState(3);
  const [projectMonthNames, setProjectMonthNames] = useState<string[]>(['Phase 1', 'Phase 2', 'Phase 3']);

  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const handleMonthsCountChange = (count: number) => {
    setProjectMonthsCount(count);
    setProjectMonthNames(prev => {
      const copy = [...prev];
      if (copy.length < count) {
        while (copy.length < count) {
          copy.push(`Phase ${copy.length + 1}`);
        }
      } else if (copy.length > count) {
        return copy.slice(0, count);
      }
      return copy;
    });
  };

  // Commitment modal states
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [editingCommitment, setEditingCommitment] = useState<any>(null); // For edit mode
  const [activeCommitmentFund, setActiveCommitmentFund] = useState('');
  const [activeCommitmentFundName, setActiveCommitmentFundName] = useState('');
  const [commitmentForm, setCommitmentForm] = useState({ name: '', phone: '', amountDue: '', notes: '' });

  // Backup & JSON state uploading references
  const [backupRestoreInput, setBackupRestoreInput] = useState('');
  const [restoreStatus, setRestoreStatus] = useState('');
  const [financeSearch, setFinanceSearch] = useState('');
  const [inflowFundFilter, setInflowFundFilter] = useState<string>('masjid-fund');
  const [donorSearchQuery, setDonorSearchQuery] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Derived filtered collections based on unified financeSearch
  const filteredMembers = members.filter(m => {
    if (!financeSearch) return true;
    const term = financeSearch.toLowerCase();
    return m.name.toLowerCase().includes(term) || m.phone.toLowerCase().includes(term);
  });

  const filteredTransactions = transactions.filter(t => {
    if (!financeSearch) return true;
    const term = financeSearch.toLowerCase();
    const m = members.find(mem => mem.id === t.memberId);
    return (
      (m && m.name.toLowerCase().includes(term)) ||
      t.monthKey.toLowerCase().includes(term) ||
      t.amount.toString().includes(term) ||
      (t.paymentDate && t.paymentDate.toLowerCase().includes(term))
    );
  });

  const filteredOthers = others.filter(o => {
    if (!financeSearch) return true;
    const term = financeSearch.toLowerCase();
    return (
      o.source.toLowerCase().includes(term) ||
      o.details.toLowerCase().includes(term) ||
      o.amount.toString().includes(term) ||
      (o.date && o.date.toLowerCase().includes(term))
    );
  });

  const filteredExpenses = expenses.filter(e => {
    if (!financeSearch) return true;
    const term = financeSearch.toLowerCase();
    return (
      e.name.toLowerCase().includes(term) ||
      e.details.toLowerCase().includes(term) ||
      e.amount.toString().includes(term) ||
      (e.date && e.date.toLowerCase().includes(term))
    );
  });

  // ---------------- PUBLIC CRUD ACTIONS ----------------
  
  // Namaz timings updates
  const handleSavePrayer = (p: PrayerTiming) => {
    const updated = prayerTimings.map(item => item.id === p.id ? p : item);
    logAudit('EDIT', 'Prayer Timings', p.id, JSON.stringify(prayerTimings.find(x => x.id === p.id)), JSON.stringify(p));
    setPrayerTimings(updated);
    PortalDatabase.set('prayer_timings', updated);
    setEditingPrayer(null);
  };

  // Announcements CRUD
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnn.title || !newAnn.content) return;

    const ann: Announcement = {
      id: `ann-${Date.now()}`,
      title: newAnn.title,
      content: newAnn.content,
      active: true,
      expiryDate: newAnn.expiryDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      imageUrl: newAnn.imageUrl || '',
      showImage: newAnn.showImage || false,
      createdAt: new Date().toISOString().split('T')[0]
    };

    const updated = [...announcements, ann];
    logAudit('ADD', 'Announcements', ann.id, '', JSON.stringify(ann));
    setAnnouncements(updated);
    PortalDatabase.set('announcements', updated);
    setNewAnn({ title: '', content: '', expiryDate: '', imageUrl: '', showImage: false });
  };

  const handleToggleAnn = (id: string, state: boolean) => {
    const updated = announcements.map(a => a.id === id ? { ...a, active: state } : a);
    logAudit('EDIT', 'Announcements State', id, `active:${!state}`, `active:${state}`);
    setAnnouncements(updated);
    PortalDatabase.set('announcements', updated);
  };

  const handleDeleteAnn = (id: string) => {
    const original = announcements.find(a => a.id === id);
    const updated = announcements.filter(a => a.id !== id);
    logAudit('DELETE', 'Announcements', id, JSON.stringify(original), '');
    setAnnouncements(updated);
    PortalDatabase.set('announcements', updated);
  };

  // History CRUD
  const handleAddHist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHist.title || !newHist.content) return;

    const h: HistorySection = {
      id: `h-${Date.now()}`,
      title: newHist.title,
      content: newHist.content,
      sortOrder: historySections.length + 1
    };

    const updated = [...historySections, h];
    logAudit('ADD', 'History Timeline', h.id, '', JSON.stringify(h));
    setHistorySections(updated);
    PortalDatabase.set('history_sections', updated);
    setNewHist({ title: '', content: '' });
  };

  const handleDeleteHist = (id: string) => {
    const original = historySections.find(x => x.id === id);
    const updated = historySections.filter(x => x.id !== id);
    logAudit('DELETE', 'History Timeline', id, JSON.stringify(original), '');
    setHistorySections(updated);
    PortalDatabase.set('history_sections', updated);
  };

  // Activities CRUD
  const handleAddAct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAct.title || !newAct.timing) return;

    const a: Activity = {
      id: `act-${Date.now()}`,
      title: newAct.title,
      timing: newAct.timing,
      description: newAct.description,
      sortOrder: activities.length + 1
    };

    const updated = [...activities, a];
    logAudit('ADD', 'Activities Program', a.id, '', JSON.stringify(a));
    setActivities(updated);
    PortalDatabase.set('activities', updated);
    setNewAct({ title: '', timing: '', description: '' });
  };

  const handleDeleteAct = (id: string) => {
    const original = activities.find(x => x.id === id);
    const updated = activities.filter(x => x.id !== id);
    logAudit('DELETE', 'Activities Program', id, JSON.stringify(original), '');
    setActivities(updated);
    PortalDatabase.set('activities', updated);
  };

  // Map settings updates
  const handleSaveMap = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: MapSettings = {
      id: mapSettings.id,
      iframeUrl: editedMap.iframeUrl,
      address: editedMap.address
    };
    logAudit('EDIT', 'Google Map Coordinate', mapSettings.id, JSON.stringify(mapSettings), JSON.stringify(updated));
    setMapSettings(updated);
    PortalDatabase.set('map_settings', updated);
  };

  // ---------------- PORTALS/FINANCIAL PORTAL CRUD ----------------
  
  // Custom fixed password configuration modifiers
  const handleUpdatePassword = (id: string, newVal: string) => {
    const updated = passwords.map(p => p.id === id ? { ...p, passwordValue: newVal } : p);
    logAudit('PASSWORD_CHANGE', 'Protected Crypt Access', id, '******', 'CHANGED');
    setPasswords(updated);
    PortalDatabase.set('passwords', updated);
  };

  // Financial Registration CRUD (Adds members to the system)
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name || !newMemberForm.phone) return;

    const m: FundMember = {
      id: `m-${Date.now()}`,
      fundId: newMemberForm.fundId,
      name: newMemberForm.name,
      phone: newMemberForm.phone,
      requiredAmount: Number(newMemberForm.requiredAmount),
      remainingPrevious: Number(newMemberForm.remainingPrevious),
      paidPrevious: Number(newMemberForm.paidPrevious)
    };

    const updated = [...members, m];
    logAudit('ADD', `Fund Member Registered`, m.id, '', JSON.stringify(m));
    setMembers(updated);
    PortalDatabase.set('members', updated);
    showToast("Member added successfully", "success");
    
    setNewMemberForm({
      fundId: newMemberForm.fundId,
      name: '',
      phone: '',
      requiredAmount: 12000,
      remainingPrevious: 0,
      paidPrevious: 0
    });
  };

  // Quick transaction register (Adds monthly payments)
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransactionForm.memberId || !newTransactionForm.amount) return;

    const t: FundMemberTransaction = {
      id: `t-${Date.now()}`,
      memberId: newTransactionForm.memberId,
      monthKey: newTransactionForm.monthKey,
      amount: Number(newTransactionForm.amount),
      paymentDate: newTransactionForm.paymentDate
    };

    const updated = [...transactions, t];
    logAudit('ADD', `Member Payment Log`, t.id, '', JSON.stringify(t));
    setTransactions(updated);
    PortalDatabase.set('transactions', updated);

    // Re-seed simple clean form
    setNewTransactionForm(prev => ({
      ...prev,
      memberId: '',
      amount: 1000
    }));
    setDonorSearchQuery('');
  };

  // ----- SHARED SAVE & DELETE HANDLERS -----
  const handleSaveAnnouncement = (ann: Announcement) => {
    const updated = announcements.map(a => a.id === ann.id ? ann : a);
    logAudit('EDIT', 'Announcements Re-write', ann.id, JSON.stringify(announcements.find(x => x.id === ann.id)), JSON.stringify(ann));
    setAnnouncements(updated);
    PortalDatabase.set('announcements', updated);
    setEditingAnn(null);
  };

  const handleSaveHistory = (hist: HistorySection) => {
    const updated = historySections.map(h => h.id === hist.id ? hist : h);
    logAudit('EDIT', 'History Timeline Cards Change', hist.id, JSON.stringify(historySections.find(x => x.id === hist.id)), JSON.stringify(hist));
    setHistorySections(updated);
    PortalDatabase.set('history_sections', updated);
    setEditingHist(null);
  };

  const handleSaveActivity = (act: Activity) => {
    const updated = activities.map(a => a.id === act.id ? act : a);
    logAudit('EDIT', 'Islamic Activities Revised', act.id, JSON.stringify(activities.find(x => x.id === act.id)), JSON.stringify(act));
    setActivities(updated);
    PortalDatabase.set('activities', updated);
    setEditingAct(null);
  };

  const handleSaveAdmin = (adm: Administrator) => {
    const finalAdm = { ...adm, image: resolveImageUrl(adm.image) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120' };
    const updated = administrators.map(a => a.id === adm.id ? finalAdm : a);
    logAudit('EDIT', 'Administrator Updated', adm.id, JSON.stringify(administrators.find(x => x.id === adm.id)), JSON.stringify(finalAdm));
    setAdministrators(updated);
    PortalDatabase.set('administrators', updated);
    setEditingAdmin(null);
  };

  const handleDeleteAdmin = (id: string) => {
    const original = administrators.find(a => a.id === id);
    if (!original) return;
    
    const updated = administrators.filter(a => a.id !== id);
    logAudit('DELETE', 'Administrator Purged', id, JSON.stringify(original), '');
    setAdministrators([...updated]);
    PortalDatabase.set('administrators', updated);
  };

  const handleCreateAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.name || !newAdminForm.position) return;

    const newAdm: Administrator = {
      id: `admin-${Date.now()}`,
      moduleType: newAdminForm.moduleType,
      moduleId: newAdminForm.moduleType === 'project' ? newAdminForm.moduleId : null,
      name: newAdminForm.name,
      position: newAdminForm.position,
      phone: newAdminForm.phone,
      image: resolveImageUrl(newAdminForm.image) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120'
    };

    const updated = [...administrators, newAdm];
    logAudit('ADD', 'Administrator Registered', newAdm.id, '', JSON.stringify(newAdm));
    setAdministrators(updated);
    PortalDatabase.set('administrators', updated);

    setNewAdminForm({
      moduleType: 'masjid',
      moduleId: '',
      name: '',
      position: '',
      phone: '',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=120'
    });
  };

  const handleSaveStaff = (staff: ReligiousStaff) => {
    const updated = religiousStaff.map(s => s.id === staff.id ? staff : s);
    logAudit('EDIT', 'Religious Scholar Staff Updated', staff.id, JSON.stringify(religiousStaff.find(x => x.id === staff.id)), JSON.stringify(staff));
    setReligiousStaff(updated);
    PortalDatabase.set('religious_staff', updated);
    setEditingStaff(null);
  };

  const handleDeleteStaff = (id: string) => {
    const original = religiousStaff.find(s => s.id === id);
    if (!original) return;
    
    const updated = religiousStaff.filter(s => s.id !== id);
    logAudit('DELETE', 'Religious Scholar Staff Deleted', id, JSON.stringify(original), '');
    setReligiousStaff([...updated]);
    PortalDatabase.set('religious_staff', updated);
    setStaffToDelete(null);
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name || !newStaffForm.position) return;

    const newStaff: ReligiousStaff = {
      id: `staff-${Date.now()}`,
      name: newStaffForm.name,
      position: newStaffForm.position,
      phone: newStaffForm.phone,
      imageUrl: newStaffForm.imageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      active: true
    };

    const updated = [...religiousStaff, newStaff];
    logAudit('ADD', 'Religious Scholar Staff Registered', newStaff.id, '', JSON.stringify(newStaff));
    setReligiousStaff(updated);
    PortalDatabase.set('religious_staff', updated);

    setNewStaffForm({
      name: '',
      position: 'Khatib & Markazi Lead Imam',
      phone: '',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'
    });
  };

  const handleSaveMember = (mem: FundMember) => {
    const updated = members.map(m => m.id === mem.id ? mem : m);
    logAudit('EDIT', 'Contributor Settings Restructured', mem.id, JSON.stringify(members.find(x => x.id === mem.id)), JSON.stringify(mem));
    setMembers(updated);
    PortalDatabase.set('members', updated);
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId: string) => {
    const original = members.find(m => m.id === memberId);
    const updated = members.filter(m => m.id !== memberId);
    logAudit('DELETE', 'Contributor Purged From DB', memberId, JSON.stringify(original), '');
    setMembers(updated);
    PortalDatabase.set('members', updated);
    
    // Auto cascade-delete related member transactions
    const updatedTrans = transactions.filter(t => t.memberId !== memberId);
    setTransactions(updatedTrans);
    PortalDatabase.set('transactions', updatedTrans);
  };

  const handleDeleteTransaction = (id: string) => {
    const original = transactions.find(t => t.id === id);
    const updated = transactions.filter(t => t.id !== id);
    logAudit('DELETE', 'Payment Cash Receipt Voided', id, JSON.stringify(original), '');
    setTransactions(updated);
    PortalDatabase.set('transactions', updated);
  };

  const handleAddOther = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOtherForm.source || !newOtherForm.amount) return;

    const o: OtherFundEntry = {
      id: `mo-${Date.now()}`,
      fundId: newOtherForm.fundId,
      source: newOtherForm.source,
      amount: Number(newOtherForm.amount),
      date: newOtherForm.date,
      details: newOtherForm.details
    };

    const updated = [...others, o];
    logAudit('ADD', `Other Cash Entry Logged`, o.id, '', JSON.stringify(o));
    setOthers(updated);
    PortalDatabase.set('other_fund_entries', updated);

    setNewOtherForm({
      fundId: newOtherForm.fundId,
      source: '',
      amount: 5000,
      date: new Date().toISOString().split('T')[0],
      details: ''
    });
  };

  const handleSaveOther = (o: OtherFundEntry) => {
    const updated = others.map(item => item.id === o.id ? o : item);
    logAudit('EDIT', 'Other Fund Entry Corrected', o.id, JSON.stringify(others.find(x => x.id === o.id)), JSON.stringify(o));
    setOthers(updated);
    PortalDatabase.set('other_fund_entries', updated);
    setEditingOther(null);
  };

  const handleDeleteOther = (id: string) => {
    const original = others.find(o => o.id === id);
    const updated = others.filter(o => o.id !== id);
    logAudit('DELETE', 'Other Fund Entry Purged', id, JSON.stringify(original), '');
    setOthers(updated);
    PortalDatabase.set('other_fund_entries', updated);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseForm.name || !newExpenseForm.amount) return;

    const exp: Expense = {
      id: `me-${Date.now()}`,
      fundId: newExpenseForm.fundId,
      name: newExpenseForm.name,
      amount: Number(newExpenseForm.amount),
      date: newExpenseForm.date,
      details: newExpenseForm.details
    };

    const updated = [...expenses, exp];
    logAudit('ADD', `Expense Cash Outflow Logged`, exp.id, '', JSON.stringify(exp));
    setExpenses(updated);
    PortalDatabase.set('expenses', updated);

    setNewExpenseForm({
      fundId: newExpenseForm.fundId,
      name: '',
      amount: 5000,
      date: new Date().toISOString().split('T')[0],
      details: ''
    });
  };

  const handleSaveExpense = (e: Expense) => {
    const updated = expenses.map(item => item.id === e.id ? e : item);
    logAudit('EDIT', 'Capital Outflow Expense Corrected', e.id, JSON.stringify(expenses.find(x => x.id === e.id)), JSON.stringify(e));
    setExpenses(updated);
    PortalDatabase.set('expenses', updated);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (id: string) => {
    const original = expenses.find(e => e.id === id);
    const updated = expenses.filter(e => e.id !== id);
    logAudit('DELETE', 'Capital Outflow Expense Voided', id, JSON.stringify(original), '');
    setExpenses(updated);
    PortalDatabase.set('expenses', updated);
  };

  const handleSaveProject = (updatedProj: Project) => {
    const updated = projects.map(p => p.id === updatedProj.id ? updatedProj : p);
    logAudit('EDIT', 'Update Project', updatedProj.id, JSON.stringify(projects.find(p => p.id === updatedProj.id)), JSON.stringify(updatedProj));
    setProjects(updated);
    PortalDatabase.set('projects', updated);
    
    // Also update the associated fund module name if it changed
    const associatedFund = funds.find(f => f.id === updatedProj.fundModuleId);
    if (associatedFund && associatedFund.name !== updatedProj.name) {
      const updatedFunds = funds.map(f => f.id === associatedFund.id ? { ...f, name: updatedProj.name } : f);
      setFunds(updatedFunds);
      PortalDatabase.set('funds', updatedFunds);
    }
    
    setEditingProject(null);
  };

  // ---------------- PROJECT CRUD ACTIONS ----------------
  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.name || !newProjectForm.shortDescription) return;

    const pModuleId = `project-${Date.now()}`;
    const newModule: FundModule = {
      id: pModuleId,
      name: newProjectForm.name,
      type: 'project',
      status: 'active'
    };

    // Parse dynamic phases
    const monthsArr = projectMonthNames.map(m => m.trim()).filter(Boolean);

    const prj: Project = {
      id: `p-${Date.now()}`,
      fundModuleId: pModuleId,
      name: newProjectForm.name,
      shortDescription: newProjectForm.shortDescription,
      fullDescription: newProjectForm.fullDescription,
      targetAmount: Number(newProjectForm.targetAmount),
      status: 'active',
      startDate: newProjectForm.startDate,
      endDate: newProjectForm.endDate || 'No Schedule',
      featuredImage: '',
      visibility: 'public',
      dynamicMonths: monthsArr,
      gallery: []
    };

    const updatedFunds = [...funds, newModule];
    const updatedProjects = [...projects, prj];

    // Generate automatic sub-ledger passwords for this new project using user defined password
    const userPass = newProjectForm.password.trim() || '786';
    const newProjectPasswords: ProtectedPagePassword[] = [
      { id: `project_${prj.id}_portfolio`, pageName: `Project [${prj.name}] Portfolio`, passwordValue: userPass },
      { id: `project_${prj.id}_fixed`, pageName: `Project [${prj.name}] Monthly Fixed`, passwordValue: userPass },
      { id: `project_${prj.id}_other`, pageName: `Project [${prj.name}] Other Contrib`, passwordValue: userPass },
      { id: `project_${prj.id}_expenses`, pageName: `Project [${prj.name}] Expenditures`, passwordValue: userPass },
      { id: `project_${prj.id}_commitments`, pageName: `Project [${prj.name}] Commitments`, passwordValue: userPass },
    ];
    const updatedPasswords = [...passwords, ...newProjectPasswords];

    logAudit('ADD', 'Create Project', prj.id, '', JSON.stringify(prj));
    setFunds(updatedFunds);
    setProjects(updatedProjects);
    setPasswords(updatedPasswords);
    
    PortalDatabase.set('funds', updatedFunds);
    PortalDatabase.set('projects', updatedProjects);
    PortalDatabase.set('passwords', updatedPasswords);

    // Reset Form
    setNewProjectForm({
      name: '',
      shortDescription: '',
      fullDescription: '',
      targetAmount: 250000,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      dynamicMonthsCsv: 'Phase 1 Foundations, Phase 2 Construction, Phase 3 Paint',
      password: '786'
    });
    setProjectMonthsCount(3);
    setProjectMonthNames(['Phase 1', 'Phase 2', 'Phase 3']);
  };

  const handlePermanentDeleteProject = () => {
    const adminPassObj = passwords.find(p => p.id === 'admin_dashboard');
    const systemAdminPass = adminPassObj ? adminPassObj.passwordValue : 'habib786';

    if (deleteConfirmPassword !== systemAdminPass) {
      setDeleteError('Aap ne password ghalat enter kiya hai dubara koshish karen, agar aap administration me se hain. Agar nahi to aap ke liye ye data nahi hai.');
      return;
    }

    const proj = projects.find(p => p.id === projectToDelete);
    if (!proj) return;

    // Remove the project
    const updatedProjects = projects.filter(p => p.id !== projectToDelete);
    setProjects(updatedProjects);
    PortalDatabase.set('projects', updatedProjects);

    // Remove the associated fund
    const assocFundId = proj.fundModuleId;
    const updatedFunds = funds.filter(f => f.id !== assocFundId);
    setFunds(updatedFunds);
    PortalDatabase.set('funds', updatedFunds);

    // Clean up members in that fund
    const assocMembers = members.filter(m => m.fundId === assocFundId);
    const assocMemberIds = assocMembers.map(m => m.id);
    const updatedMembers = members.filter(m => m.fundId !== assocFundId);
    setMembers(updatedMembers);
    PortalDatabase.set('members', updatedMembers);

    // Clean up transactions for those members
    const updatedTransactions = transactions.filter(t => !assocMemberIds.includes(t.memberId));
    setTransactions(updatedTransactions);
    PortalDatabase.set('transactions', updatedTransactions);

    // Clean up other fund entries for that fund
    const updatedOthers = others.filter(o => o.fundId !== assocFundId);
    setOthers(updatedOthers);
    PortalDatabase.set('other_fund_entries', updatedOthers);

    // Clean up expenses for that fund
    const updatedExpenses = expenses.filter(e => e.fundId !== assocFundId);
    setExpenses(updatedExpenses);
    PortalDatabase.set('expenses', updatedExpenses);

    // Clean up associated portal passwords for this project
    const updatedPasswords = passwords.filter(p => !p.id.startsWith(`project_${proj.id}_`));
    setPasswords(updatedPasswords);
    PortalDatabase.set('passwords', updatedPasswords);

    logAudit('DELETE', 'Projects & Funds Core', proj.id, JSON.stringify(proj), 'Permanently Deleted');

    setProjectToDelete(null);
    setDeleteConfirmPassword('');
    setDeleteError('');
  };

  // ---------------- SYSTEM BACKUPS DRIVER ----------------
  const handleDownloadBackup = () => {
    const payload = {
      passwords,
      prayer_timings: prayerTimings,
      history_sections: historySections,
      activities,
      map_settings: mapSettings,
      announcements,
      funds,
      members,
      transactions,
      others,
      expenses,
      projects,
      auditLogs
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masjid_habib_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    logAudit('BACKUP_CREATE', 'Backup Center', 'json_file', '', 'Manual Download');
  };

  const handleRestoreBackup = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(backupRestoreInput);
      if (parsed.passwords && parsed.prayer_timings) {
        // Hydrate all local arrays
        setPasswords(parsed.passwords);
        setPrayerTimings(parsed.prayer_timings);
        setHistorySections(parsed.history_sections);
        setActivities(parsed.activities);
        setMapSettings(parsed.map_settings);
        setAnnouncements(parsed.announcements);
        setFunds(parsed.funds);
        setMembers(parsed.members);
        setTransactions(parsed.transactions);
        if (parsed.others) setOthers(parsed.others);
        if (parsed.expenses) setExpenses(parsed.expenses);
        setProjects(parsed.projects);
        setAuditLogs(parsed.auditLogs);

        // Store back physically
        PortalDatabase.set('passwords', parsed.passwords);
        PortalDatabase.set('prayer_timings', parsed.prayer_timings);
        PortalDatabase.set('history_sections', parsed.history_sections);
        PortalDatabase.set('activities', parsed.activities);
        PortalDatabase.set('map_settings', parsed.map_settings);
        PortalDatabase.set('announcements', parsed.announcements);
        PortalDatabase.set('funds', parsed.funds);
        PortalDatabase.set('members', parsed.members);
        PortalDatabase.set('transactions', parsed.transactions);
        PortalDatabase.set('projects', parsed.projects);
        PortalDatabase.set('audit_logs', parsed.auditLogs);
        if (parsed.others) PortalDatabase.set('other_fund_entries', parsed.others);
        if (parsed.expenses) PortalDatabase.set('expenses', parsed.expenses);

        setRestoreStatus('✅ Database custom state restored successfully! Refreshing...');
        logAudit('BACKUP_RESTORE', 'Backup Center', 'user_restore', '', 'Uploaded Stringified Data');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setRestoreStatus('❌ Invalid JSON model columns mapping failed.');
      }
    } catch {
      setRestoreStatus('❌ Syntax error parsing string payload JSON.');
    }
  };

  // Math calculated counts for Admin Header index
  const getCombinedInflow = () => members.reduce((sum, m) => sum + m.paidPrevious, 0) + transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-pine-bg text-pine-text-body flex flex-col z-10 relative font-sans">
      
      {/* Top action navbar */}
      <header className="bg-pine-bar border-b border-pine-border py-4 px-6 md:px-8 flex items-center justify-between select-none shadow-md">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-pine-btn-hover" />
          <h1 className="text-base font-heading font-extrabold tracking-wider text-white uppercase">Masjid Al-Habib Noorani Admin Console</h1>
        </div>
        <div className="flex items-center gap-2">
          {onBackToPublic && (
            <button 
              onClick={onBackToPublic}
              className="border border-pine-border hover:bg-pine-hover text-white font-button text-xs uppercase tracking-wider py-1.5 px-3 rounded-md transition-colors"
            >
              Wapas (Back)
            </button>
          )}
          <button 
            onClick={onLogout}
            className="bg-pine-error hover:opacity-90 text-white font-button text-xs uppercase tracking-wider py-1.5 px-3 rounded-md transition-opacity"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main split viewport layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar panels menu */}
        <aside className="w-full md:w-64 bg-pine-bar/65 border-r border-pine-border/60 py-6 px-4 flex flex-col gap-1 z-20">
          <span className="text-[10px] font-button text-pine-text-muted uppercase tracking-wider px-3 mb-2 block">Public Portal CRUD</span>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'announcements' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" /> Announcements Marquee
          </button>
          <button 
            onClick={() => setActiveTab('namaz')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'namaz' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" /> Prayers Timetable
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'history' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <History className="w-4 h-4 shrink-0" /> Historic Cards
          </button>
          <button 
            onClick={() => setActiveTab('activities')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'activities' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <ActIcon className="w-4 h-4 shrink-0" /> Quranic Programs
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'map' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" /> Map Embed Set
          </button>
          <button 
            onClick={() => setActiveTab('administrators')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'administrators' ? 'bg-pine-active text-white font-semibold animate-pulse' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <User className="w-4 h-4 shrink-0 text-pink-300" /> Committee (Intezamia)
          </button>
          <button 
            onClick={() => setActiveTab('religious_staff')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'religious_staff' ? 'bg-pine-active text-white font-semibold animate-pulse' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <Award className="w-4 h-4 shrink-0 text-amber-300" /> Scholars & Imams
          </button>

          <span className="text-[10px] font-button text-pine-text-muted uppercase tracking-wider px-3 mt-4 mb-2 block">Finances & Dynamic Projects</span>
          <button 
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'financials' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <FileCheck className="w-4 h-4 shrink-0" /> Ledger Accounts
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'projects' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" /> Create Projects
          </button>
          <button 
            onClick={() => setActiveTab('commitments')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'commitments' ? 'bg-pine-active text-white font-semibold animate-pulse' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <HeartHandshake className="w-4 h-4 shrink-0 text-rose-400" /> Manage Commitments
          </button>
          <button 
            onClick={() => setActiveTab('passwords')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'passwords' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <FolderKey className="w-4 h-4 shrink-0" /> Register Passwords
          </button>
          <button 
            onClick={() => setActiveTab('themes')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'themes' ? 'bg-pine-active text-white font-semibold' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <Palette className="w-4 h-4 shrink-0" /> Website Theme Colors
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex items-center gap-2.5 py-2.5 px-3 rounded text-xs font-button uppercase tracking-wider text-left transition-colors ${
              activeTab === 'ai' ? 'bg-pine-active text-white font-semibold animate-pulse' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            <Bot className="w-4 h-4 shrink-0 text-teal-400" /> AI Assistant Knowledge
          </button>
          
        </aside>

        {/* Dynamic panels content canvas */}
        <main className="flex-1 py-10 px-6 md:px-12 overflow-y-auto">
          
          {/* TAB: AI Knowledge Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div>
                <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider flex items-center gap-2">
                  <Bot className="w-6 h-6 text-teal-400" /> AI Assistant Knowledge Base
                </h2>
                <p className="text-xs text-pine-text-muted mt-1">
                  Yahan aap aesi extra maloomat (extra information) ya hidayat likh sakte hain jo aap chahte hain ke AI Chatbot ko pata ho. AI inhi hidayat ko use kar ke public visitors ke sawalat ke jawab dega.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Knowledge Form */}
                <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-pine-border bg-pine-bar/40 space-y-4">
                  <h3 className="text-sm font-button uppercase tracking-wider text-teal-400 font-bold flex items-center gap-2">
                    <Bot className="w-4 h-4" /> Custom Knowledge Context
                  </h3>
                  
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body font-bold mb-2">Extra Information (Urdu, English, or Roman Urdu)</label>
                    <textarea
                      value={aiExtraInfo}
                      onChange={(e) => setAiExtraInfo(e.target.value)}
                      rows={12}
                      placeholder="e.g. 
- Madrassa-e-Habibia ki classes subah 8 se dopahar 1 baje tak hoti hain. Free Quran sabaq classes hain.
- Masjid ke 2 main gates hain. Gate A G.T Road par khulta hai aur Gate B Saddar bazaar ki taraf.
- Solar panel installation phase 2 ka target Rs. 350,000 hai jo ke humne jald poora karna hai.
- Masjid ke aas pass parking strictly prohibited hai line lagaye baghair."
                      className="w-full bg-pine-bar/90 border border-pine-border p-4 text-xs text-white rounded-xl focus:outline-none focus:border-pine-btn font-sans leading-relaxed shadow-inner"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <p className="text-[10px] text-pine-text-muted italic">
                      Characters: {aiExtraInfo.length} (Unlimited)
                    </p>
                    <button
                      onClick={() => {
                        const originalValue = PortalDatabase.get<string>('ai_extra_info', '');
                        PortalDatabase.set('ai_extra_info', aiExtraInfo);
                        logAudit('EDIT', 'AI Custom Knowledge Base Updated', 'ai_extra_info', originalValue.substring(0, 100), aiExtraInfo.substring(0, 100));
                        
                        // Show visual success feedback
                        const btn = document.getElementById('ai-save-btn');
                        if (btn) {
                          const origText = btn.innerText;
                          btn.innerText = "✓ Settings Saved!";
                          btn.classList.remove('bg-pine-btn');
                          btn.classList.add('bg-emerald-600');
                          setTimeout(() => {
                            btn.innerText = origText;
                            btn.classList.remove('bg-emerald-600');
                            btn.classList.add('bg-pine-btn');
                          }, 2500);
                        }
                      }}
                      id="ai-save-btn"
                      className="py-2.5 px-6 bg-pine-btn hover:bg-pine-btn-hover text-white font-button text-xs uppercase tracking-wider rounded-xl transition-all shadow-md font-bold"
                    >
                      Save AI Context
                    </button>
                  </div>
                </div>

                {/* Sidebar tips & quick templates */}
                <div className="glass-panel p-6 rounded-2xl border border-pine-border bg-pine-bar/30 space-y-4">
                  <h3 className="text-sm font-button uppercase tracking-wider text-pink-300 font-bold">💡 Tips & Quick Templates</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                    Aap niche diye gaye templates par click kar ke unhe fauran apne knowledge base mein add kar sakte hain:
                  </p>

                  <div className="space-y-3 pt-2">
                    <button
                      onClick={() => {
                        const template = "\n- Madrassa-e-Habibia hifz program subah 8 se dopahar 1 baje tak chalta hai. Is mein bacho ko muft dars aur hifz karwaya jata hai. Quran dars har asar ke baad hota hai.";
                        setAiExtraInfo(prev => prev + template);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-pine-bar/60 border border-pine-border/50 hover:border-teal-500 transition-all text-[11px] text-teal-200"
                    >
                      <span className="font-bold block text-teal-400 mb-1">+ Madrassa & Programs Template</span>
                      Madrassa timing, muft dars schedules, and educational programs context.
                    </button>

                    <button
                      onClick={() => {
                        const template = "\n- Solar Grid Project ke liye donations online check ya direct committee member Haji Muhammad Anwar ko diye ja sakte hain. Bank accounts ki tafseelat committee room se mil sakti hain.";
                        setAiExtraInfo(prev => prev + template);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-pine-bar/60 border border-pine-border/50 hover:border-teal-500 transition-all text-[11px] text-teal-200"
                    >
                      <span className="font-bold block text-pink-300 mb-1">+ Donations & Bank Info Template</span>
                      Donation guidelines, committee contact protocols, and support lines.
                    </button>

                    <button
                      onClick={() => {
                        const template = "\n- Masjid gate par jootey rakhne ka khas intizaam hai. Parking strictly bypass line se aage prohibited hai taake traffic flow kharab na ho. Security ke liye CCTV cameras 24/7 online hain.";
                        setAiExtraInfo(prev => prev + template);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-pine-bar/60 border border-pine-border/50 hover:border-teal-500 transition-all text-[11px] text-teal-200"
                    >
                      <span className="font-bold block text-amber-200 mb-1">+ Discipline & Security Template</span>
                      Parking rules, shoe counters details, and active CCTV security safety.
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Commitments Management */}
          {activeTab === 'commitments' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div>
                <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider flex items-center gap-2">
                  <HeartHandshake className="w-6 h-6 text-rose-400" /> Manage Commitments
                </h2>
                <p className="text-xs text-pine-text-muted mt-1">
                  Yahan se aap tamam funds (Masjid, Bazm, aur Projects) ki commitments add, edit, aur delete kar sakte hain. Jab kisi shakhs ko uski commitment ka notice nikalna ho, toh public view mein note print kiya jasakta hai.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  { id: 'masjid-fund', name: 'Masjid Fund' },
                  { id: 'bazm-fund', name: 'Bazm Fund' },
                  ...projects.map(p => ({ id: p.fundModuleId, name: p.name }))
                ].map(fundTarget => {
                  const fundCommitments = commitments.filter(c => c.fundId === fundTarget.id);
                  return (
                    <div key={fundTarget.id} className="glass-panel p-6 rounded-2xl border border-pine-border">
                      <div className="flex justify-between items-center mb-4 border-b border-pine-border pb-2">
                        <h3 className="text-sm font-button uppercase tracking-wider text-emerald-400 font-bold">
                          {fundTarget.name}
                        </h3>
                        <button
                          onClick={() => {
                            setCommitmentForm({ name: '', phone: '', amountDue: '', notes: '' });
                            setEditingCommitment(null);
                            setActiveCommitmentFund(fundTarget.id);
                            setActiveCommitmentFundName(fundTarget.name);
                            setShowCommitmentModal(true);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>

                      {fundCommitments.length === 0 ? (
                        <p className="text-xs text-pine-text-muted italic py-4 text-center">Koi commitment nahi hai.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left font-sans text-xs">
                            <thead>
                              <tr className="bg-black/40 text-pine-text-body border-b border-pine-border">
                                <th className="py-2 px-3">Name</th>
                                <th className="py-2 px-3">Phone</th>
                                <th className="py-2 px-3 text-right">Amount</th>
                                <th className="py-2 px-3 w-1/2">Details (Note)</th>
                                <th className="py-2 px-3 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {fundCommitments.map(c => (
                                <tr key={c.id} className="hover:bg-white/5">
                                  <td className="py-2 px-3 font-bold text-white">{c.name}</td>
                                  <td className="py-2 px-3 font-mono text-zinc-400">{c.phone || '-'}</td>
                                  <td className="py-2 px-3 font-mono text-rose-400 text-right font-bold">{c.amountDue.toLocaleString()} Rs</td>
                                  <td className="py-2 px-3 text-zinc-400">
                                    <div className="flex items-center gap-2">
                                      <span className="truncate max-w-[250px]" title={c.notes}>{c.notes || '-'}</span>
                                      <button 
                                        onClick={() => {
                                          setEditingCommitment(c);
                                          setCommitmentForm({
                                            name: c.name,
                                            phone: c.phone || '',
                                            amountDue: c.amountDue.toString(),
                                            notes: c.notes || ''
                                          });
                                          setActiveCommitmentFund(fundTarget.id);
                                          setActiveCommitmentFundName(fundTarget.name);
                                          setShowCommitmentModal(true);
                                        }}
                                        className="text-emerald-400 hover:text-emerald-300 ml-auto"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-center">
                                    <button
                                      onClick={() => {
                                        if(window.confirm('Delete this commitment?')) {
                                          const updated = commitments.filter(x => x.id !== c.id);
                                          setCommitments(updated);
                                          PortalDatabase.set('commitments', updated);
                                          logAudit('DELETE', 'Commitment Deleted', fundTarget.name, c.name, '');
                                        }
                                      }}
                                      className="text-rose-500 hover:text-rose-400 font-bold"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: Announcements Ticker Form */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider">Announcements Marquee Manager</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form to enter */}
                <div className="glass-panel p-6 rounded-2xl border border-pine-border relative">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4 font-bold flex items-center gap-2">📢 Add Announcement</h3>
                  <form onSubmit={handleAddAnnouncement} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Title / Tag</label>
                      <input
                        type="text"
                        required
                        value={newAnn.title}
                        onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                        placeholder="e.g. ⭐ Ramzan-ul-Mubarak"
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs placeholder-pine-text-muted/40 text-white focus:outline-none focus:border-pine-btn"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Marquee Statement Details</label>
                      <textarea
                        required
                        value={newAnn.content}
                        rows={3}
                        onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                        placeholder="Enter statement to roll dynamically..."
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs placeholder-pine-text-muted/40 text-white focus:outline-none focus:border-pine-btn"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Expiry Date</label>
                      <input
                        type="date"
                        value={newAnn.expiryDate}
                        onChange={(e) => setNewAnn({ ...newAnn, expiryDate: e.target.value })}
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    {/* Image ON/OFF and Link */}
                    <div className="space-y-3 pt-1 border-t border-pine-border/40">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="show-ann-image"
                          checked={newAnn.showImage}
                          onChange={(e) => setNewAnn({ ...newAnn, showImage: e.target.checked })}
                          className="bg-pine-bar border border-pine-border rounded focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="show-ann-image" className="text-xs text-pine-text-body uppercase cursor-pointer select-none font-semibold">
                          Add Picture? (ON/OFF)
                        </label>
                      </div>

                      {newAnn.showImage && (
                        <div className="space-y-1 animate-fade-in">
                          <label className="block text-[10px] uppercase text-amber-400 font-bold">Picture Link / URL</label>
                          <input
                            type="url"
                            required={newAnn.showImage}
                            value={newAnn.imageUrl}
                            onChange={(e) => setNewAnn({ ...newAnn, imageUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs placeholder-pine-text-muted/40 text-white focus:outline-none focus:border-pine-btn"
                          />
                        </div>
                      )}
                    </div>

                    <button type="submit" className="w-full py-2 bg-pine-btn hover:bg-pine-btn-hover font-button text-xs uppercase text-white rounded-lg font-bold">
                      Broadcast Live
                    </button>
                  </form>
                </div>

                {/* List board */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white">Active Banner Streams</h3>
                  <div className="space-y-3">
                    {announcements.map((ann) => (
                      <div key={ann.id} className="glass-panel p-4 rounded-xl border border-pine-border flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          {ann.showImage && ann.imageUrl && (
                            <img 
                              src={ann.imageUrl} 
                              alt="" 
                              className="w-12 h-12 rounded object-cover border border-pine-border shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{ann.title}</span>
                              {!ann.active && <span className="text-[10px] bg-red-950/45 text-red-400 px-1.5 py-0.5 rounded uppercase font-button">DRAFT</span>}
                              {ann.showImage && ann.imageUrl && <span className="text-[10px] bg-teal-950/45 text-teal-400 px-1.5 py-0.5 rounded uppercase font-button">🏞️ Pic ON</span>}
                            </div>
                            <p className="text-xs text-pine-text-body mt-1">{ann.content}</p>
                            <span className="text-[10px] text-pine-text-muted block mt-1">Expiry Date: {ann.expiryDate}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => setEditingAnn(ann)}
                            className="p-1 px-2 text-amber-500 hover:bg-amber-950/20 border border-pine-border/40 rounded text-[10px] font-button"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleToggleAnn(ann.id, !ann.active)}
                            className="p-1 px-2 border border-pine-border rounded text-[10px] font-button"
                          >
                            {ann.active ? 'Hide' : 'Publish'}
                          </button>
                          <button 
                            onClick={() => handleDeleteAnn(ann.id)}
                            className="p-1 px-2 text-rose-400 hover:bg-rose-950/20 border border-pine-border/40 rounded text-[10px] font-button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Namaz CRUD timings */}
          {activeTab === 'namaz' && (
            <div className="space-y-6 animate-fade-in shadow-lg">
              <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider">Prayers Timetable CRUD</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {prayerTimings.map((prayer) => (
                  <TiltCard key={prayer.id} glow={false} className="p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-heading font-bold text-base text-white">{prayer.prayerName}</span>
                        {prayer.prayerName.toLowerCase() === 'jummah' && <span className="text-[10px] bg-pine-btn text-white py-0.5 px-2 rounded">FRI HIGH</span>}
                        {prayer.prayerName.toLowerCase() === 'maghrib' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 py-0.5 px-2 border border-amber-500/30 rounded font-bold uppercase animate-pulse">
                            🌞 AUTO SUNSET
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-pine-text-muted">Azaan Time:</span>
                          <span className="text-white font-semibold">
                            {prayer.prayerName.toLowerCase() === 'maghrib' ? 'Automatic (Sunset)' : formatTime12Hour(prayer.azaanTime)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-pine-text-muted">Jamat Time:</span>
                          <span className="text-pine-btn-hover font-semibold">
                            {prayer.prayerName.toLowerCase() === 'maghrib' ? 'Automatic (+3 mins)' : formatTime12Hour(prayer.prayerTime)}
                          </span>
                        </div>
                        <div className="border-t border-pine-border/40 pt-2 text-[11px] text-pine-text-body italic">
                          {prayer.prayerName.toLowerCase() === 'maghrib' ? 'Maghrib timing is automatically calculated based on daily sunset coordinates for Wah Cantt.' : prayer.notes}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingPrayer(prayer)}
                      className="mt-6 w-full py-1.5 border border-pine-border rounded-md text-xs font-button uppercase tracking-wider text-pine-text-heading hover:bg-pine-hover/10"
                    >
                      {prayer.prayerName.toLowerCase() === 'maghrib' ? 'View/Edit Notes' : 'Update Timetable'}
                    </button>
                  </TiltCard>
                ))}
              </div>

              {/* Editing timing modal */}
              {editingPrayer && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
                  <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border-pine-btn">
                    <h3 className="font-heading font-bold text-white text-base mb-4 uppercase">Update {editingPrayer.prayerName} timings</h3>
                    
                    {editingPrayer.prayerName.toLowerCase() === 'maghrib' && (
                      <div className="mb-4 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3 rounded-lg leading-relaxed font-sans">
                        ⚠️ <strong>Maghrib (Sunset) ka time 100% automatic hai!</strong>
                        <p className="mt-1 text-pine-text-body">Wah Cantt ke daily sunset coordinates ke mutabiq ye roz khud ba khud update hota hai. Aap yahan sirf iske notes edit kar sakte hain.</p>
                      </div>
                    )}

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSavePrayer(editingPrayer);
                    }} className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase text-pine-text-body mb-0.5">Azaan Time (HH:MM)</label>
                        <input
                          type="text"
                          required
                          disabled={editingPrayer.prayerName.toLowerCase() === 'maghrib'}
                          value={editingPrayer.prayerName.toLowerCase() === 'maghrib' ? 'AUTO (SUNSET)' : editingPrayer.azaanTime}
                          onChange={(e) => setEditingPrayer({ ...editingPrayer, azaanTime: e.target.value })}
                          className={`w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-sm text-center font-mono text-white rounded-md ${
                            editingPrayer.prayerName.toLowerCase() === 'maghrib' ? 'opacity-60 cursor-not-allowed bg-pine-bg/50' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-pine-text-body mb-0.5">Jamat Timing (HH:MM)</label>
                        <input
                          type="text"
                          required
                          disabled={editingPrayer.prayerName.toLowerCase() === 'maghrib'}
                          value={editingPrayer.prayerName.toLowerCase() === 'maghrib' ? 'AUTO (+3 mins)' : editingPrayer.prayerTime}
                          onChange={(e) => setEditingPrayer({ ...editingPrayer, prayerTime: e.target.value })}
                          className={`w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-sm text-center font-mono text-white rounded-md ${
                            editingPrayer.prayerName.toLowerCase() === 'maghrib' ? 'opacity-60 cursor-not-allowed bg-pine-bg/50' : ''
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-pine-text-body mb-0.5">Notes Statement</label>
                        <input
                          type="text"
                          value={editingPrayer.notes}
                          onChange={(e) => setEditingPrayer({ ...editingPrayer, notes: e.target.value })}
                          className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-md"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingPrayer(null)}
                          className="w-1/2 py-2 border border-pine-border text-xs uppercase font-button text-pine-text-body rounded-md"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="w-1/2 py-2 bg-pine-btn text-xs uppercase font-button text-white rounded-md"
                        >
                          Save changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: History sections CRUD */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fade-in shadow-lg">
              <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider">Historic Cards Manager</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Addition Form */}
                <div className="glass-panel p-6 rounded-2xl border border-pine-border">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4">Add History Era</h3>
                  <form onSubmit={handleAddHist} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-button">Era Title / Year</label>
                      <input
                        type="text"
                        required
                        value={newHist.title}
                        onChange={(e) => setNewHist({ ...newHist, title: e.target.value })}
                        placeholder="e.g. Buniyad – 1982"
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-button">Content description mapping</label>
                      <textarea
                        required
                        value={newHist.content}
                        rows={5}
                        onChange={(e) => setNewHist({ ...newHist, content: e.target.value })}
                        placeholder="Detail the timeline narrative clearly..."
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-pine-btn hover:bg-pine-btn-hover font-button text-xs uppercase text-white rounded-lg">
                      Save History Card
                    </button>
                  </form>
                </div>

                {/* List block */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white">History Timeline Cards</h3>
                  <div className="space-y-3">
                    {historySections.map((hist) => (
                      <div key={hist.id} className="glass-panel p-4 rounded-xl border border-pine-border flex justify-between items-start gap-4">
                        <div>
                          <span className="text-xs font-bold text-white">{hist.title}</span>
                          <p className="text-xs text-pine-text-body mt-2 leading-relaxed">{hist.content}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => setEditingHist(hist)}
                            className="text-amber-500 p-1 px-2 border border-pine-border/40 hover:bg-amber-950/20 rounded font-button text-[10px]"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteHist(hist.id)}
                            className="text-rose-455 p-1 px-2 border border-pine-border/40 hover:bg-rose-950/20 rounded font-button text-[10px]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Current Activities Quran programs */}
          {activeTab === 'activities' && (
            <div className="space-y-6 animate-fade-in shadow-lg">
              <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider">Quranic Programs Manager</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form activities */}
                <div className="glass-panel p-6 rounded-2xl border border-pine-border">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4">Add Activites Era</h3>
                  <form onSubmit={handleAddAct} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-button">Activity Program Title</label>
                      <input
                        type="text"
                        required
                        value={newAct.title}
                        onChange={(e) => setNewAct({ ...newAct, title: e.target.value })}
                        placeholder="e.g. Dars-e-Quran"
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-button">Timing Notes</label>
                      <input
                        type="text"
                        required
                        value={newAct.timing}
                        onChange={(e) => setNewAct({ ...newAct, timing: e.target.value })}
                        placeholder="e.g. Maghrib ke baad"
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-button">Content Details</label>
                      <textarea
                        value={newAct.description}
                        rows={3}
                        onChange={(e) => setNewAct({ ...newAct, description: e.target.value })}
                        placeholder="Enter statement detailing schedules..."
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                      />
                    </div>
                    <button type="submit" className="w-full py-2 bg-pine-btn hover:bg-pine-btn-hover font-button text-xs uppercase text-white rounded-lg">
                      Save Program Card
                    </button>
                  </form>
                </div>

                {/* List board block */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white">Active Islamic Program Cards</h3>
                  <div className="space-y-3">
                    {activities.map((act) => (
                      <div key={act.id} className="glass-panel p-4 rounded-xl border border-pine-border flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{act.title}</span>
                            <span className="text-[10px] bg-pine-active text-pine-btn-hover font-mono px-2 py-0.5 rounded">{act.timing}</span>
                          </div>
                          <p className="text-xs text-pine-text-body mt-1 leading-relaxed">{act.description}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => setEditingAct(act)}
                            className="text-amber-500 p-1 px-2 border border-pine-border/40 hover:bg-amber-955/20 rounded font-button text-[10px]"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteAct(act.id)}
                            className="text-rose-455 p-1 px-2 border border-pine-border/40 hover:bg-rose-950/20 rounded font-button text-[10px]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Map embeds coordinates updates */}
          {activeTab === 'map' && (
            <div className="space-y-6 animate-fade-in shadow-lg">
              <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider">Map Configuration coordinates</h2>
              
              <div className="max-w-xl glass-panel p-6 rounded-2xl border border-pine-border">
                <form onSubmit={handleSaveMap} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-button">Google maps Iframe Src URL</label>
                    <input
                      type="text"
                      required
                      value={editedMap.iframeUrl}
                      onChange={(e) => setEditedMap({ ...editedMap, iframeUrl: e.target.value })}
                      className="w-full bg-pine-bar/60 border border-pine-border py-2.5 px-3 text-xs text-white placeholder-pine-text-muted/40 font-mono rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-button">Actual address coordinate name</label>
                    <input
                      type="text"
                      required
                      value={editedMap.address}
                      onChange={(e) => setEditedMap({ ...editedMap, address: e.target.value })}
                      className="w-full bg-pine-bar/60 border border-pine-border py-2.5 px-3 text-xs text-white placeholder-pine-text-muted/40 rounded-lg"
                    />
                  </div>
                  <button type="submit" className="py-2.5 px-5 bg-pine-btn hover:bg-pine-btn-hover text-white text-xs font-button uppercase tracking-wider rounded-lg">
                    Save location parameters
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: Ledger accounts registrations */}
          {activeTab === 'financials' && (
            <div className="space-y-8 animate-fade-in text-sans">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-pine-border pb-4">
                <div>
                  <h2 className="text-xl font-heading font-extrabold text-white uppercase tracking-wider font-bold">Ledger & Welfare Accounts Register</h2>
                  <p className="text-xs text-pine-text-muted mt-1">Saddar, Khazan aur Committee ke liye tanzemi koshishein aur maal register.</p>
                </div>
                
                {/* Financial Sub View Select Tabs Removed */}
              </div>

              {/* VIEW 1: CORE ACCOUNTS & DONORS */}
              {financialSubView === 'core' && (
                <div className="space-y-8 animate-fade-in">
                  {/* SPREADSHEET LEDGER ADMIN ROOM ACCESS CARDS */}
              <div className="glass-panel p-6 rounded-2xl border border-rose-500/20 bg-gradient-to-r from-pine-bar/95 via-rose-950/5 to-pine-bar shadow-xl">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                    <Database className="w-5 h-5 text-rose-450 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider">
                      📖 SPREADSHEET LEDGER ADMIN ROOM (MUSAWWADAAT / UPDATE REGISTERS)
                    </h3>
                    <p className="text-xs text-pine-text-body mt-1 max-w-2xl leading-relaxed">
                      Wasee paimane par cell-value updates, khatm-ul-quran, previous remaining balances aur har har mahine ke amounts ko Excel style me update karne ke liye niche kisi bhi Fund Module Register ko open karein (Public panel me edits strictly locked hain):
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  {funds.map((f) => {
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => onOpenFundInAdminRoom?.(f)}
                        className="p-4 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 border border-rose-500/20 hover:border-rose-450 text-left transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between group cursor-pointer h-full"
                      >
                        <div>
                          <span className="text-[10px] font-mono uppercase bg-rose-500/15 text-rose-300 px-2 py-0.5 rounded font-bold">
                            {f.type} ledger
                          </span>
                          <h4 className="text-xs font-bold text-white mt-2 group-hover:text-rose-400 transition-colors">
                            {f.name}
                          </h4>
                          <p className="text-[11px] text-pine-text-muted mt-1 leading-normal">
                            Edit entire matrix, monthly payment statuses, dates & khatm details.
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-rose-300/80 group-hover:text-rose-300 mt-3 font-sans">
                          Manage & Edit Register <span>→</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* SECTION: Regular Donors */}
              <div className="space-y-4 pt-4 border-t border-pine-border/40">
                <h3 className="text-xs font-bold text-pine-btn-hover uppercase tracking-widest flex items-center gap-2">
                  <span>👥</span> Contributor Profiles & Regular Inflow Payments
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Form: Add a fixed donor member */}
                  <div className="glass-panel p-6 rounded-2xl border border-pine-border shadow-md">
                    <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4 flex items-center gap-1.5"><Send className="w-4 h-4 text-pine-btn-hover" /> Add Contributor Accounts</h3>
                    <form onSubmit={handleAddMember} className="space-y-4 font-sans">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Fund Folder Target</label>
                          <select
                            value={newMemberForm.fundId}
                            onChange={(e) => setNewMemberForm({ ...newMemberForm, fundId: e.target.value })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                          >
                            {funds.map((f) => (
                              <option key={f.id} value={f.id} className="bg-pine-bar text-white">{f.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Contributor full name</label>
                          <input
                            type="text"
                            required
                            value={newMemberForm.name}
                            onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                            placeholder="e.g. Hafiz Muhammad Mubeen Sahib"
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Mobile Line / Phone</label>
                          <input
                            type="text"
                            required
                            value={newMemberForm.phone}
                            onChange={(e) => setNewMemberForm({ ...newMemberForm, phone: e.target.value })}
                            placeholder="0300-1234567"
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Yearly Target Rs (Required)</label>
                          <input
                            type="number"
                            required
                            value={newMemberForm.requiredAmount}
                            onChange={(e) => setNewMemberForm({ ...newMemberForm, requiredAmount: Number(e.target.value) })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg"
                          />
                        </div>
                      </div>
                      
                      {/* Conditionally show Previous Dues for Masjid and Bazm only */}
                      {(newMemberForm.fundId === 'masjid-fund' || newMemberForm.fundId === 'bazm-fund') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs uppercase text-zinc-400 mb-1 font-bold">Prev Remaining Due (Rs)</label>
                            <input
                              type="number"
                              value={newMemberForm.remainingPrevious}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, remainingPrevious: Number(e.target.value) })}
                              className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:border-pine-btn outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase text-zinc-400 mb-1 font-bold">Prev Paid Clearing (Rs)</label>
                            <input
                              type="number"
                              value={newMemberForm.paidPrevious}
                              onChange={(e) => setNewMemberForm({ ...newMemberForm, paidPrevious: Number(e.target.value) })}
                              className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:border-pine-btn outline-none font-mono"
                            />
                          </div>
                        </div>
                      )}
                      
                      <button type="submit" className="w-full py-2 bg-pine-btn hover:bg-pine-btn-hover text-xs font-button uppercase text-white rounded-lg transition-colors font-bold shadow-lg shadow-emerald-950/20">
                        Register Contributor Account
                      </button>
                    </form>
                  </div>

                  {/* Form: Add a transaction ledger */}
                  <div className="glass-panel p-6 rounded-2xl border border-pine-border shadow-md">
                    <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4 flex items-center gap-1.5"><Plus className="w-4 h-4 text-pine-btn-hover" /> Add Inflow Payment</h3>
                    
                    {/* Category Filter buttons: Mosque, Bazm, Projects */}
                    <div className="mb-4">
                      <label className="block text-xs uppercase text-pine-text-body mb-2">1. Choose Fund Category (Select Fund Folder)</label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {funds.map(f => {
                          const count = members.filter(m => m.fundId === f.id).length;
                          const isSelected = inflowFundFilter === f.id;
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                setInflowFundFilter(f.id);
                                // Resolve default first month for the selected category
                                let defaultMonth = 'January';
                                if (f.type === 'masjid') defaultMonth = 'khatm';
                                else if (f.type === 'bazm') defaultMonth = ISLAMIC_MONTHS[0];
                                else if (f.type === 'project') {
                                  const pObj = projects.find(p => p.id === f.id || p.fundModuleId === f.id);
                                  defaultMonth = pObj && pObj.dynamicMonths.length > 0 ? pObj.dynamicMonths[0] : 'Phase 1 Setup';
                                }
                                setNewTransactionForm(prev => ({ 
                                  ...prev, 
                                  memberId: '', 
                                  monthKey: defaultMonth 
                                })); // Reset selected donor & assign correct default month key
                              }}
                              className={`py-2 px-3 rounded-lg text-left text-xs transition-all duration-200 border ${
                                isSelected 
                                  ? 'bg-pine-btn text-white border-pine-btn shadow-md' 
                                  : 'bg-pine-bar/40 text-pine-text-body border-pine-border/60 hover:bg-pine-hover hover:text-white'
                              }`}
                            >
                              <span className="font-bold block text-[11px]">
                                {f.type === 'masjid' ? '🕌 ' : f.type === 'bazm' ? '🎪 ' : '🛠️ '}
                                {f.name}
                              </span>
                              <span className="text-[10px] opacity-75 font-normal block mt-0.5">{count} Donors is me hain</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <form onSubmit={handleAddTransaction} className="space-y-4">
                      <div>
                        <label className="block text-xs uppercase text-pine-text-body mb-2 flex justify-between items-center">
                          <span>2. Choose Active Donor ({funds.find(f => f.id === inflowFundFilter)?.name || 'Filtered List'})</span>
                          {newTransactionForm.memberId && (
                            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3" /> SELECTED
                            </span>
                          )}
                        </label>

                        {(() => {
                          const activeCategoryMembers = members.filter(m => m.fundId === inflowFundFilter);
                          const selectedMember = activeCategoryMembers.find(m => m.id === newTransactionForm.memberId);

                          const startVoiceSearchForDonor = () => {
                            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                            if (!SpeechRecognition) {
                              alert("Aapka browser voice command support nahi karta. Google Chrome istamal karein.");
                              return;
                            }
                            const recognition = new SpeechRecognition();
                            recognition.lang = 'ur-PK';
                            recognition.interimResults = false;
                            recognition.maxAlternatives = 1;
                            
                            setIsVoiceListening(true);
                            recognition.start();

                            recognition.onresult = (event: any) => {
                              const speechToText = event.results[0][0].transcript;
                              setDonorSearchQuery(speechToText);
                              setIsVoiceListening(false);
                            };

                            recognition.onerror = () => {
                              setIsVoiceListening(false);
                            };

                            recognition.onend = () => {
                              setIsVoiceListening(false);
                            };
                          };

                          if (selectedMember) {
                            const sNo = activeCategoryMembers.findIndex(m => m.id === selectedMember.id) + 1;
                            return (
                              <div className="bg-emerald-950/20 border border-emerald-500/40 p-3 rounded-lg flex items-center justify-between animate-fade-in font-sans">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-wider">Sr No {sNo} • Contributor Info</span>
                                  <h4 className="text-sm font-extrabold text-white mt-0.5">{selectedMember.name}</h4>
                                  <p className="text-xs text-pine-text-muted mt-0.5">{selectedMember.phone} • Target: {selectedMember.requiredAmount.toLocaleString()} Rs</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewTransactionForm(prev => ({ ...prev, memberId: '' }));
                                    setDonorSearchQuery('');
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-950/45 border border-rose-500/40 text-rose-350 text-[10px] font-button rounded-md hover:bg-rose-900/60 transition-all uppercase"
                                >
                                  Change Donor
                                </button>
                              </div>
                            );
                          }

                          // Filter donors by: name, phone, or serial number
                          const q = donorSearchQuery.toLowerCase().trim();
                          const matchedDonors = activeCategoryMembers.filter((m, idx) => {
                            if (!q) return true;
                            const matchName = m.name.toLowerCase().includes(q);
                            const matchPhone = m.phone.toLowerCase().includes(q);
                            const matchSr = q === (idx + 1).toString() || q === `s-${idx + 1}` || q === `s${idx+1}` || q === `sr-${idx+1}` || q === `sr${idx+1}`;
                            return matchName || matchPhone || matchSr;
                          });

                          return (
                            <div className="space-y-2">
                              {/* Input container with Mic */}
                              <div className="relative">
                                <span className="absolute left-3 top-2.5 text-pine-text-muted">
                                  <Search className="w-4 h-4" />
                                </span>
                                <input
                                  type="text"
                                  value={donorSearchQuery}
                                  onChange={(e) => setDonorSearchQuery(e.target.value)}
                                  placeholder="Search Name, Phone, or Serial Number (S#)..."
                                  className="w-full bg-pine-bar/60 border border-pine-border py-2 pl-9 pr-10 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                                />
                                <button
                                  type="button"
                                  onClick={startVoiceSearchForDonor}
                                  className={`absolute right-2 top-1.5 p-1 px-1.5 rounded-md transition-all ${
                                    isVoiceListening 
                                      ? 'bg-rose-600 text-white animate-pulse' 
                                      : 'text-pine-text-muted hover:text-white hover:bg-pine-hover'
                                  }`}
                                  title="Voice search donor name"
                                >
                                  <Mic className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Options popup/results container */}
                              <div className="max-h-48 overflow-y-auto border border-pine-border/60 bg-pine-bar/45 rounded-lg divide-y divide-pine-border/40">
                                {matchedDonors.length === 0 ? (
                                  <p className="p-3 text-[11px] text-amber-500 text-center">⚠️ No donors match "{donorSearchQuery}"</p>
                                ) : (
                                  matchedDonors.slice(0, 8).map((m) => {
                                    // Locate actual Sr No
                                    const realSrNo = activeCategoryMembers.findIndex(x => x.id === m.id) + 1;
                                    return (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setNewTransactionForm(prev => ({ ...prev, memberId: m.id }))}
                                        className="w-full text-left p-2.5 px-3 flex items-center justify-between text-xs hover:bg-pine-btn/20 transition-all font-sans group"
                                      >
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="bg-pine-border text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">S# {realSrNo}</span>
                                            <span className="font-semibold text-white group-hover:text-pine-btn-hover transition-colors">{m.name}</span>
                                          </div>
                                          <span className="text-[10px] text-pine-text-muted">{m.phone}</span>
                                        </div>
                                        <div className="text-right">
                                          <span className="text-[10px] text-emerald-400 font-bold block">{m.requiredAmount.toLocaleString()} Rs</span>
                                          <span className="text-[8px] uppercase text-pine-text-muted">Target Limit</span>
                                        </div>
                                      </button>
                                    );
                                  })
                                )}
                                {matchedDonors.length > 8 && (
                                  <p className="p-1.5 text-[9px] text-pine-text-muted text-center italic bg-pine-bar/30">Showing first 8 matches. Type more to filter...</p>
                                )}
                              </div>
                              
                              {activeCategoryMembers.length === 0 && (
                                <p className="text-[10px] font-sans text-amber-500 mt-1">⚠️ Is category/fund me koi contributors registered nahi hain. Pehle contributor register karein.</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">
                            {(() => {
                              const matchedFund = funds.find(f => f.id === inflowFundFilter);
                              return matchedFund?.type === 'project' ? 'Project Phase / Milestone' : 'Payment Month';
                            })()}
                          </label>
                          <select
                            value={newTransactionForm.monthKey}
                            onChange={(e) => setNewTransactionForm({ ...newTransactionForm, monthKey: e.target.value })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg"
                          >
                            {(() => {
                              const matchedFund = funds.find(f => f.id === inflowFundFilter);
                              if (matchedFund?.type === 'masjid') {
                                return (
                                  <>
                                    <option value="khatm">Khatm-ul-Quran Ceremony</option>
                                    {GREGORIAN_MONTHS.map(g => (
                                      <option key={g} value={g} className="bg-pine-bar text-white">{g}</option>
                                    ))}
                                  </>
                                );
                              } else if (matchedFund?.type === 'bazm') {
                                return (
                                  <>
                                    {ISLAMIC_MONTHS.map(i => (
                                      <option key={i} value={i} className="bg-pine-bar text-white">{i}</option>
                                    ))}
                                  </>
                                );
                              } else {
                                const pObj = projects.find(p => p.id === inflowFundFilter || p.fundModuleId === inflowFundFilter);
                                const dynamicMonths = pObj ? pObj.dynamicMonths : ['Phase 1 Setup', 'Phase 2 Battery', 'Phase 3 Commissioning'];
                                return (
                                  <>
                                    {dynamicMonths.map(pMonth => (
                                      <option key={pMonth} value={pMonth} className="bg-pine-bar text-white">{pMonth}</option>
                                    ))}
                                  </>
                                );
                              }
                            })()}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Amount Rs</label>
                          <input
                            type="number"
                            required
                            value={newTransactionForm.amount}
                            onChange={(e) => setNewTransactionForm({ ...newTransactionForm, amount: Number(e.target.value) })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Payment Date</label>
                          <input
                            type="date"
                            required
                            value={newTransactionForm.paymentDate}
                            onChange={(e) => setNewTransactionForm({ ...newTransactionForm, paymentDate: e.target.value })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <button type="submit" className="w-full py-2 bg-pine-btn hover:bg-pine-btn-hover text-xs font-button uppercase text-white rounded-lg transition-colors font-bold">
                        Log ledger transaction
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {/* SECTION: Direct Receipts & Expenses */}
              <div className="space-y-4 pt-8 border-t border-pine-border/45">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                  <span>💰</span> Direct Non-Donor Receipts & Outflow Expenses
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Form: Add direct receipts (others) */}
                  <div className="glass-panel p-6 rounded-2xl border border-pine-border shadow-md">
                    <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                      <Send className="w-4 h-4 text-emerald-400" /> Log Other Inflow Receipt
                    </h3>
                    <form onSubmit={handleAddOther} className="space-y-4 font-sans">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Fund Folder Target</label>
                          <select
                            value={newOtherForm.fundId}
                            onChange={(e) => setNewOtherForm({ ...newOtherForm, fundId: e.target.value })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                          >
                            {funds.map((f) => (
                              <option key={f.id} value={f.id} className="bg-pine-bar text-white">{f.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Inflow Source / Sender</label>
                          <input
                            type="text"
                            required
                            value={newOtherForm.source}
                            onChange={(e) => setNewOtherForm({ ...newOtherForm, source: e.target.value })}
                            placeholder="e.g. general box, iron waste, banks"
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Amount Rs</label>
                          <input
                            type="number"
                            required
                            value={newOtherForm.amount}
                            onChange={(e) => setNewOtherForm({ ...newOtherForm, amount: Number(e.target.value) })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Receipt Date</label>
                          <input
                            type="date"
                            required
                            value={newOtherForm.date}
                            onChange={(e) => setNewOtherForm({ ...newOtherForm, date: e.target.value })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs uppercase text-pine-text-body mb-1">Extra Details / Memo</label>
                        <textarea
                          value={newOtherForm.details}
                          onChange={(e) => setNewOtherForm({ ...newOtherForm, details: e.target.value })}
                          placeholder="Zaruri malomat ya notes darj krein..."
                          rows={2}
                          className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                        />
                      </div>

                      <button type="submit" className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-xs font-button uppercase text-white rounded-lg transition-colors font-bold shadow-lg shadow-emerald-950/20">
                        Log Direct Receipt Entry
                      </button>
                    </form>
                  </div>

                  {/* Form: Add Cash Outflow Expense */}
                  <div className="glass-panel p-6 rounded-2xl border border-pine-border shadow-md">
                    <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-rose-450" /> Log Cash Outflow Expense
                    </h3>
                    <form onSubmit={handleAddExpense} className="space-y-4 font-sans">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Fund Folder Target</label>
                          <select
                            value={newExpenseForm.fundId}
                            onChange={(e) => setNewExpenseForm({ ...newExpenseForm, fundId: e.target.value })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                          >
                            {funds.map((f) => (
                              <option key={f.id} value={f.id} className="bg-pine-bar text-white">{f.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Expense Payee / Item Name</label>
                          <input
                            type="text"
                            required
                            value={newExpenseForm.name}
                            onChange={(e) => setNewExpenseForm({ ...newExpenseForm, name: e.target.value })}
                            placeholder="e.g. electricity bill, floor sweepers, paint"
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Outflow Amount Rs</label>
                          <input
                            type="number"
                            required
                            value={newExpenseForm.amount}
                            onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: Number(e.target.value) })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg font-mono focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase text-pine-text-body mb-1">Expense Date</label>
                          <input
                            type="date"
                            required
                            value={newExpenseForm.date}
                            onChange={(e) => setNewExpenseForm({ ...newExpenseForm, date: e.target.value })}
                            className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg font-mono focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs uppercase text-pine-text-body mb-1">Expenditure Details / Memo</label>
                        <textarea
                          value={newExpenseForm.details}
                          onChange={(e) => setNewExpenseForm({ ...newExpenseForm, details: e.target.value })}
                          placeholder="Payment details ya bill reference..."
                          rows={2}
                          className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                        />
                      </div>

                      <button type="submit" className="w-full py-2 bg-rose-800 hover:bg-rose-700 text-xs font-button uppercase text-white rounded-lg transition-colors font-bold shadow-lg shadow-rose-950/20">
                        Log Outflow Expense Entry
                      </button>
                    </form>
                  </div>

                </div>
              </div>

                </div>
              )}

              {/* Shops and Zakat Views Removed */}

            </div>
          )}

          {/* TAB: Projects Creation Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-6 animate-fade-in shadow-lg">
              <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider">Dynamic Projects Creators</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Addition Form */}
                <div className="glass-panel p-6 rounded-2xl border border-pine-border font-sans">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4">Launch New Project</h3>
                  <form onSubmit={handleAddProject} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1">Project Name</label>
                      <input
                        type="text"
                        required
                        value={newProjectForm.name}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, name: e.target.value })}
                        placeholder="e.g. Clean drinking water filtration Stage 2"
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1">Short Description (max 3 lines)</label>
                      <input
                        type="text"
                        required
                        value={newProjectForm.shortDescription}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, shortDescription: e.target.value })}
                        placeholder="Brief summary line on card views..."
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1">Full Detailed description</label>
                      <textarea
                        required
                        value={newProjectForm.fullDescription}
                        rows={4}
                        onChange={(e) => setNewProjectForm({ ...newProjectForm, fullDescription: e.target.value })}
                        placeholder="Detail fully the sharia statements or purposes..."
                        className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase text-pine-text-body mb-1">Target Amount Budget (Rs)</label>
                        <input
                          type="number"
                          required
                          value={newProjectForm.targetAmount}
                          onChange={(e) => setNewProjectForm({ ...newProjectForm, targetAmount: Number(e.target.value) })}
                          className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 rounded-lg text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-pine-btn-hover font-bold mb-1">Project Passcode (Password)</label>
                        <input
                          type="text"
                          required
                          value={newProjectForm.password}
                          onChange={(e) => setNewProjectForm({ ...newProjectForm, password: e.target.value })}
                          placeholder="e.g. 786"
                          className="w-full bg-pine-bar/60 border border-pine-btn py-2 px-3 rounded-lg text-xs text-white text-center font-bold tracking-widest placeholder:text-pine-text-muted"
                        />
                      </div>
                    </div>

                    <div className="bg-pine-bar/35 p-4 rounded-xl border border-pine-border/60 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs uppercase text-pine-btn-hover font-bold mb-1">Project Duration (Months/Phases)</label>
                          <select
                            value={projectMonthsCount}
                            onChange={(e) => handleMonthsCountChange(Number(e.target.value))}
                            className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24].map((c) => (
                              <option key={c} value={c} className="bg-pine-bg text-white">{c} Month{c > 1 ? 's' : ''} / Phase{c > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[11px] text-pine-text-muted md:w-1/2">
                          Manually custom name each installment month or phase below. These names will be dynamically generated as headers in the database register tree.
                        </p>
                      </div>

                      <div className="space-y-2 border-t border-pine-border/40 pt-3">
                        <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Phase / Month Names</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                          {projectMonthNames.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-pine-bar/20 p-1.5 rounded border border-pine-border/30">
                              <span className="text-[10px] text-zinc-400 font-mono w-14">Seq {idx + 1}:</span>
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => {
                                  const updatedNames = [...projectMonthNames];
                                  updatedNames[idx] = e.target.value;
                                  setProjectMonthNames(updatedNames);
                                }}
                                placeholder={`Phase ${idx + 1}`}
                                className="flex-1 bg-pine-bar border border-pine-border/60 py-1 px-2 rounded text-[11px] text-white focus:outline-none focus:border-pine-btn"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button type="submit" className="w-full py-2.5 bg-pine-btn hover:bg-pine-btn-hover font-button text-xs uppercase text-white rounded-lg">
                      Deploy and Publish Project
                    </button>
                  </form>
                </div>

                {/* List board block */}
                <div className="space-y-4">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white">Created Project Channels</h3>
                  <div className="space-y-3">
                    {projects.map((proj) => (
                      <div key={proj.id} className="glass-panel p-4 rounded-xl border border-pine-border flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{proj.name}</span>
                            <span className={`text-[9px] font-button uppercase px-2 py-0.5 rounded ${
                              proj.status === 'active' ? 'bg-emerald-950/45 text-emerald-400' : 'bg-rose-950/45 text-rose-450'
                            }`}>{proj.status}</span>
                          </div>
                          <p className="text-xs text-pine-text-muted mt-1">Target Limit: {proj.targetAmount.toLocaleString()} Rs • Phases: {proj.dynamicMonths.join(' → ')}</p>
                        </div>
                        <div className="flex gap-2 text-sans">
                          <button 
                            type="button"
                            onClick={() => setEditingProject(proj)}
                            className="p-1.5 px-3.5 bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/40 hover:border-amber-400 text-amber-350 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Profile
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setProjectToDelete(proj.id);
                              setDeleteConfirmPassword('');
                              setDeleteError('');
                            }}
                            className="p-1.5 px-3.5 bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/40 hover:border-rose-400 text-rose-350 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            Delete Project
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PROJECT PERMANENT DELETION MODAL */}
              {projectToDelete && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                  <div className="w-full max-w-md bg-gradient-to-b from-pine-card to-pine-bar border border-pine-border p-6 rounded-2xl shadow-2xl space-y-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-rose-950/50 text-rose-400 border border-rose-500/45 rounded-full flex items-center justify-center mx-auto mb-3">
                        ⚠️
                      </div>
                      <h3 className="text-sm font-button uppercase font-extrabold text-white tracking-widest">Delete Project & Ledgers</h3>
                      <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                        Arzi archive ke bajaye ye project database se <strong>hamesha ke liye mitaya</strong> ja raha hai. Is ke saare donors, installments, expenses aur records mukammal tor par delete ho jayenge.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">Confirm with Super Admin Passcode</label>
                        <input 
                          type="password"
                          required
                          value={deleteConfirmPassword}
                          onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                          placeholder="Super Admin Password darj karein..."
                          className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                      </div>

                      {deleteError && (
                        <div className="p-2.5 bg-rose-950/40 border border-rose-900/50 rounded-lg text-[10.5px] text-rose-300 font-semibold">
                          {deleteError}
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setProjectToDelete(null)}
                          className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-lg font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePermanentDeleteProject}
                          className="flex-1 py-2 bg-rose-700 hover:bg-rose-605 text-xs text-white rounded-lg font-bold"
                        >
                          Confirm & Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PROJECT EDIT MODAL */}
              {editingProject && (
                <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[110] flex items-center justify-center p-4">
                  <div className="w-full max-w-2xl bg-gradient-to-b from-pine-card to-pine-bar border border-pine-border p-6 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 border-b border-pine-border/50 pb-4">
                      <h3 className="text-sm font-button uppercase font-extrabold text-white tracking-widest flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-amber-500" /> Edit Project: {editingProject.name}
                      </h3>
                      <button onClick={() => setEditingProject(null)} className="text-pine-text-muted hover:text-white">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveProject(editingProject);
                    }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase text-zinc-400 mb-1">Project Name (Naam)</label>
                          <input 
                            type="text"
                            required
                            value={editingProject.name}
                            onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                            className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-zinc-400 mb-1">Status</label>
                          <select 
                            value={editingProject.status}
                            onChange={(e) => setEditingProject({ ...editingProject, status: e.target.value as any })}
                            className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none"
                          >
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                            <option value="suspended">Suspended</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">Short Tagline (Choti Tafseel)</label>
                        <input 
                          type="text"
                          required
                          value={editingProject.shortDescription}
                          onChange={(e) => setEditingProject({ ...editingProject, shortDescription: e.target.value })}
                          className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase text-zinc-400 mb-1">Full Narrative Description (Tafseeli Maloomat)</label>
                        <textarea 
                          required
                          rows={4}
                          value={editingProject.fullDescription}
                          onChange={(e) => setEditingProject({ ...editingProject, fullDescription: e.target.value })}
                          className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase text-zinc-400 mb-1">Target Amount (Rs)</label>
                          <input 
                            type="number"
                            required
                            value={editingProject.targetAmount}
                            onChange={(e) => setEditingProject({ ...editingProject, targetAmount: Number(e.target.value) })}
                            className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-zinc-400 mb-1">Visibility</label>
                          <select 
                            value={editingProject.visibility}
                            onChange={(e) => setEditingProject({ ...editingProject, visibility: e.target.value as any })}
                            className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none"
                          >
                            <option value="public">Public (Everyone)</option>
                            <option value="hidden">Hidden from Front</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-pine-bar/40 p-4 rounded-xl border border-pine-border/60 space-y-4">
                        <div>
                          <label className="block text-xs uppercase text-pine-btn-hover font-bold mb-1.5">Project Phases / Milestones (Project Ke Phase Naam)</label>
                          <p className="text-[10px] text-zinc-400 mb-3 leading-relaxed">
                            Aap yahan se is project ke phases ke naam badal sakte hain, naye phases add kar sakte hain, ya unhe delete kar sakte hain. Jab donation entry/ledger log karenge, toh yehi naye naam show honge.
                          </p>
                          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                            {(editingProject.dynamicMonths || []).map((phase, phaseIdx) => (
                              <div key={phaseIdx} className="flex items-center gap-2 bg-pine-bg p-2 rounded border border-pine-border/40">
                                <span className="text-[10px] text-zinc-400 font-mono w-14 shrink-0">Seq {phaseIdx + 1}:</span>
                                <input 
                                  type="text"
                                  required
                                  value={phase}
                                  onChange={(e) => {
                                    const updatedPhases = [...editingProject.dynamicMonths];
                                    updatedPhases[phaseIdx] = e.target.value;
                                    setEditingProject({ ...editingProject, dynamicMonths: updatedPhases });
                                  }}
                                  className="flex-1 bg-pine-bar border border-pine-border py-1 px-2 rounded text-[11px] text-white focus:outline-none focus:border-pine-btn"
                                />
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const updatedPhases = editingProject.dynamicMonths.filter((_, i) => i !== phaseIdx);
                                    setEditingProject({ ...editingProject, dynamicMonths: updatedPhases });
                                  }}
                                  className="text-rose-400 hover:text-rose-300 text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-rose-950/20 border border-rose-500/20 rounded transition-colors shrink-0"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                          <button 
                            type="button"
                            onClick={() => {
                              const currentPhases = editingProject.dynamicMonths || [];
                              setEditingProject({
                                ...editingProject,
                                dynamicMonths: [...currentPhases, `Phase ${currentPhases.length + 1}`]
                              });
                            }}
                            className="mt-2 py-1 px-3 bg-pine-bar hover:bg-pine-hover border border-pine-border text-[10px] uppercase text-pine-btn-hover rounded font-bold transition-all"
                          >
                            + Add New Phase
                          </button>
                        </div>
                        <p className="text-[9px] text-zinc-500 italic">Project images have been disabled as per your request.</p>
                      </div>

                      <div className="flex gap-3 pt-4 border-t border-pine-border/30">
                        <button
                          type="button"
                          onClick={() => setEditingProject(null)}
                          className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs text-white rounded-lg font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-xs text-white rounded-lg font-bold shadow-lg shadow-amber-950/20"
                        >
                          Save Project Updates
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Password settings locks */}
          {activeTab === 'passwords' && (
            <div className="space-y-8 animate-fade-in shadow-lg font-sans">
              <div>
                <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider flex items-center gap-2">
                  <FolderKey className="w-6 h-6 text-pine-btn-hover" />
                  Tab Passwords & Security Keys Registry
                </h2>
                <p className="text-xs text-pine-text-muted mt-2">
                  Portals aur ledgers par security ta-un karne ke liye passcodes tanzem karein. Cleartext save hone ki wajah se aap kisi bhi waqt admin panel se inheen dekh aur tabdeel kar sakte hain.
                </p>
              </div>
              
              {(() => {
                const corePasswords = passwords.filter(p => p.id === 'admin_dashboard');
                const masjidPasswords = passwords.filter(p => p.id.startsWith('masjid_'));
                const bazmPasswords = passwords.filter(p => p.id.startsWith('bazm_'));
                const projectPasswords = passwords.filter(p => p.id.startsWith('project_'));

                const renderPasswordItem = (pass: typeof passwords[0]) => (
                  <div key={pass.id} className="glass-panel p-4 rounded-xl border border-pine-border/60 flex justify-between items-center hover:border-pine-btn/30 transition-all">
                    <div>
                      <span className="text-xs font-bold text-white uppercase tracking-wider block">{pass.pageName}</span>
                      <span className="text-[9px] text-pine-text-muted font-mono mt-0.5 block">KEY: {pass.id}</span>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={pass.passwordValue}
                        onChange={(e) => handleUpdatePassword(pass.id, e.target.value)}
                        className="bg-pine-bar/60 border border-pine-border py-1 px-3 uppercase font-mono text-center text-xs text-pine-btn-hover rounded focus:outline-none focus:border-pine-btn w-32 focus:ring-1 focus:ring-pine-btn"
                      />
                    </div>
                  </div>
                );

                return (
                  <div className="space-y-8">
                    {/* SECTION 1: Core Portal Keys */}
                    {corePasswords.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-pine-btn-hover uppercase tracking-widest flex items-center gap-1.5 bg-pine-bar/30 p-2 px-3 rounded-lg border border-pine-border/40">
                          <Shield className="w-4 h-4" /> Core Dashboard & Security Gate Passcode
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {corePasswords.map(renderPasswordItem)}
                        </div>
                      </div>
                    )}

                    {/* SECTION 2: Masjid Noorani Keys */}
                    {masjidPasswords.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-sky-400 uppercase tracking-widest flex items-center gap-1.5 bg-sky-950/20 p-2 px-3 rounded-lg border border-sky-500/20">
                          🕌 Masjid-e-Noorani Fixed-Fund Ledgers Keys
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {masjidPasswords.map(renderPasswordItem)}
                        </div>
                      </div>
                    )}

                    {/* SECTION 3: Bazm-e-Raza Keys */}
                    {bazmPasswords.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 bg-amber-950/20 p-2 px-3 rounded-lg border border-amber-500/20">
                          🎪 Bazm-e-Raza Islamic monthly Fund Keys
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {bazmPasswords.map(renderPasswordItem)}
                        </div>
                      </div>
                    )}

                    {/* SECTION 4: Project Specific Passwords */}
                    <div className="space-y-6">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 bg-emerald-950/20 p-2 px-3 rounded-lg border border-emerald-500/20">
                        🛠️ Dynamic Construction / Development Projects Keys
                      </h3>
                      {projects.length === 0 ? (
                        <p className="text-[11px] text-pine-text-muted italic p-4 text-center bg-pine-bar/10 rounded-xl border border-pine-border/30">
                          Abhi koi naya development project ya us ke dynamic passcodes registers nahi hain. Naye projects banye jane par un ke passwords yahan khudkar tareeqe se dekhaye jayenge.
                        </p>
                      ) : (
                        <div className="space-y-6">
                          {projects.map(proj => {
                            const projPass = projectPasswords.filter(p => p.id.startsWith(`project_${proj.id}_`));
                            if (projPass.length === 0) return null;
                            return (
                              <div key={proj.id} className="space-y-3 bg-black/20 p-4 rounded-xl border border-pine-border/50">
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-1.5 border-b border-pine-border/50 pb-2">
                                  {proj.name}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {projPass.map(renderPasswordItem)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}


          {/* TAB: Theme Changer Colors Preset Selection */}
          {activeTab === 'themes' && (
            <div className="space-y-6 animate-fade-in font-sans">
              <div>
                <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider flex items-center gap-2">
                  <Palette className="w-6 h-6 text-pine-btn-hover" />
                  Website Elements Custom Color Coordinator
                </h2>
                <p className="text-xs text-pine-text-muted mt-1 font-sans">
                  Aap website ke kisi bhi specific hissay ka beeshak wo koi text ho, section ho ya background ho, apni marzi se mukammal custom color rakhein. Tabdeeli fori poori website par laagu ho jayegi.
                </p>
              </div>

              {/* Dynamic Theme & Custom Wallpaper Background Customizer */}
              <div className="glass-panel p-8 rounded-2xl border border-pine-btn/40 bg-pine-bar/65 font-sans mt-4 shadow-xl">
                <div className="grid grid-cols-1 gap-8">
                  
                  {/* Part 1: Custom Wallpaper Background Optional */}
                  <div className="bg-pine-bar/30 p-5 rounded-xl border border-pine-border/60 space-y-4">
                    <h3 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-pine-border/50 pb-2">
                      <Sliders className="w-4 h-4 text-pine-btn-hover" /> 1. Custom Background Picture (Optional Wallpaper)
                    </h3>
                    <p className="text-[11px] text-pine-text-muted font-sans">
                      Aap solid colors ke upar aik khubsurat deeni background tasveer lagana chahein to yahan link darj karein.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-pine-text-body uppercase font-bold mb-1 font-sans">Wallpaper Image URL (Online Tasveer Ka Link)</label>
                        <input 
                          type="url"
                          placeholder="e.g., https://images.unsplash.com/... or paste any online image address"
                          value={customBgUrl}
                          onChange={(e) => {
                            const url = e.target.value;
                            setCustomBgUrl(url);
                            PortalDatabase.set('custom_bg_image', url);
                            onThemeChange('custom'); // select custom theme dynamically
                            logAudit('EDIT', 'Themes', 'custom_bg_image', customBgUrl, url);
                          }}
                          className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                        />
                      </div>

                      {/* Quick Contrast Opacity Slider */}
                      <div>
                        <div className="flex justify-between text-[10px] text-pine-text-body font-bold mb-1 font-sans">
                          <span>Contrast Opacity (Tasveer ki Taakat):</span>
                          <span className="font-mono">{customBgOpacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="5"
                          max="90"
                          step="5"
                          value={customBgOpacity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setCustomBgOpacity(val);
                            PortalDatabase.set('custom_bg_opacity', val);
                            const bgImageEl = document.getElementById('website_custom_bg_image_overlay');
                            if (bgImageEl) bgImageEl.style.opacity = `${val / 100}`;
                          }}
                          className="w-full h-1 bg-pine-bar rounded-lg appearance-none cursor-pointer accent-pine-btn mt-2"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomBgUrl('');
                          PortalDatabase.set('custom_bg_image', '');
                          onThemeChange('custom');
                        }}
                        className="py-1 px-2.5 bg-red-950/20 hover:bg-red-900/40 text-rose-350 text-[10px] rounded border border-rose-950/40 transition-all font-semibold cursor-pointer font-sans"
                      >
                        ❌ Clear Wallpaper
                      </button>
                    </div>
                  </div>

                  {/* Part 2: Custom Elements Specific Color Picker */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-pine-border/50 pb-2">
                      <Palette className="w-4 h-4 text-pine-btn-hover" /> 2. Specific Element Custom Colors (Har Cheez Ke Rang Mutayin Karen)
                    </h3>

                    {/* Subpart A: Layout & Sections */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-pine-btn-hover uppercase tracking-wider font-sans">Layout & Sections (Dhancha Aur Dabbe)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                          { key: 'bg', label: 'Main Website Background (Background Rang)' },
                          { key: 'bar', label: 'Header & Footer Bar (Oopri Patti)' },
                          { key: 'card', label: 'Card Sections Background (Bakse / Sections)' },
                          { key: 'border', label: 'Borders & Divider Dividers (Lakeerein / Borders)' },
                        ].map(({ key, label }) => (
                          <div key={key} className="bg-pine-bar/30 p-3 rounded-lg border border-pine-border/40">
                            <label className="block text-[10px] text-pine-text-muted uppercase font-semibold mb-1 truncate font-sans" title={label}>{label}</label>
                            <div className="flex gap-2">
                              <input 
                                type="color"
                                value={(customColors as any)[key] || '#000000'}
                                onChange={(e) => {
                                  const updated = { ...customColors, [key]: e.target.value };
                                  setCustomColors(updated);
                                  PortalDatabase.set('custom_theme_colors', updated);
                                  onThemeChange('custom');
                                }}
                                className="bg-transparent cursor-pointer w-7 h-7 rounded border-0 shrink-0"
                              />
                              <input 
                                type="text"
                                value={(customColors as any)[key] || '#000000'}
                                onChange={(e) => {
                                  const updated = { ...customColors, [key]: e.target.value };
                                  setCustomColors(updated);
                                  PortalDatabase.set('custom_theme_colors', updated);
                                  onThemeChange('custom');
                                }}
                                className="bg-pine-bar/60 font-mono text-center text-xs text-white uppercase w-full rounded border border-pine-border py-1 px-1.5 focus:outline-none focus:border-pine-btn"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subpart A-2: Section Wallpapers & Overlays */}
                    <div className="space-y-3 bg-pine-bar/20 p-4 rounded-xl border border-pine-border/40 mt-4">
                      <h4 className="text-[11px] font-bold text-pine-btn-hover uppercase tracking-wider font-sans">
                        Section Background Style Configuration (Sectionon Ka Paper Ya Pukhta Rang)
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-sans italic">
                        Yahan se aap muntakhib karein ke har section me background picture nazar aaye (Transparent) ya standard solid color ho.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { key: 'hero', label: '1. Home / Hero Header (Hero Section)' },
                          { key: 'namaz', label: '2. Namaz Timings Clock (Namaz Clock)' },
                          { key: 'history', label: '3. Historical Journey (Tareekh-e-Masjid)' },
                          { key: 'activities', label: '4. Islamic Activities (Sargarmiyan)' },
                          { key: 'location', label: '5. Google Maps Location (Masjid Ka Naqsha)' },
                          { key: 'financials', label: '6. Financial Portals (Maliyati Hisabat)' },
                        ].map(({ key, label }) => {
                          const currentMode = sectionBgSettings[key] || 'transparent';
                          return (
                            <div key={key} className="bg-pine-bar/50 p-3 rounded-lg border border-pine-border/40 space-y-2">
                              <label className="block text-[10px] text-white uppercase font-bold truncate font-sans">{label}</label>
                              <div className="flex gap-1 bg-pine-bar/90 p-1 rounded-md border border-pine-border/60">
                                {[
                                  { value: 'transparent', displayValue: 'Wallpaper' },
                                  { value: 'solid', displayValue: 'Solid Color' },
                                  { value: 'blend', displayValue: 'Blend Both' }
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                      const updated = { ...sectionBgSettings, [key]: opt.value };
                                      setSectionBgSettings(updated);
                                      PortalDatabase.set('section_bg_settings', updated);
                                      onThemeChange('custom');
                                    }}
                                    className={`flex-1 text-[9px] font-bold font-button uppercase py-1 rounded text-center transition-all cursor-pointer ${
                                      currentMode === opt.value
                                        ? 'bg-pine-btn text-white shadow'
                                        : 'text-pine-text-muted hover:text-white hover:bg-pine-hover/10'
                                    }`}
                                  >
                                    {opt.displayValue}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Subpart B: Text & Typography */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-pine-btn-hover uppercase tracking-wider font-sans">Site Typography & Contrast (Likhayi Aur Kitabat Ke Rang)</h4>
                      <p className="text-[10px] text-zinc-400 font-sans italic">Readability tip: Use pure white (#FFFFFF) for headings and light gray (#E2E8F0) for body text on dark themes.</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { key: 'textHeading', label: 'Titles & Headings (Bari Surkhiyan)' },
                          { key: 'textBody', label: 'Standard Descriptions (Aam Tehreerein)' },
                          { key: 'textMuted', label: 'Muted Details & Small Text (Halki Bareek Tehreer)' },
                        ].map(({ key, label }) => (
                          <div key={key} className="bg-pine-bar/30 p-3 rounded-lg border border-pine-border/40">
                            <label className="block text-[10px] text-pine-text-muted uppercase font-semibold mb-1 truncate font-sans" title={label}>{label}</label>
                            <div className="flex gap-2">
                              <input 
                                type="color"
                                value={(customColors as any)[key] || '#ffffff'}
                                onChange={(e) => {
                                  const updated = { ...customColors, [key]: e.target.value };
                                  setCustomColors(updated);
                                  PortalDatabase.set('custom_theme_colors', updated);
                                  onThemeChange('custom');
                                }}
                                className="bg-transparent cursor-pointer w-7 h-7 rounded border-0 shrink-0"
                              />
                              <input 
                                type="text"
                                value={(customColors as any)[key] || '#ffffff'}
                                onChange={(e) => {
                                  const updated = { ...customColors, [key]: e.target.value };
                                  setCustomColors(updated);
                                  PortalDatabase.set('custom_theme_colors', updated);
                                  onThemeChange('custom');
                                }}
                                className="bg-pine-bar/60 font-mono text-center text-xs text-white uppercase w-full rounded border border-pine-border py-1 px-1.5 focus:outline-none focus:border-pine-btn"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Subpart C: Buttons & States */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-pine-btn-hover uppercase tracking-wider font-sans">Interactive Buttons & Selection States (Buttons Aur Ishare)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                          { key: 'btn', label: 'Main CTA Button (Buttons Ka Rang)' },
                          { key: 'btnHover', label: 'Button Hover Background (Button Ka Ishara)' },
                          { key: 'hover', label: 'Row Focus Highlight (Sectionon Par Mouse Lane Ka Rang)' },
                          { key: 'active', label: 'Active Selected States (Ishare Aur Badges)' },
                        ].map(({ key, label }) => (
                          <div key={key} className="bg-pine-bar/30 p-3 rounded-lg border border-pine-border/40">
                            <label className="block text-[10px] text-pine-text-muted uppercase font-semibold mb-1 truncate font-sans" title={label}>{label}</label>
                            <div className="flex gap-2">
                              <input 
                                type="color"
                                value={(customColors as any)[key] || '#01796F'}
                                onChange={(e) => {
                                  const updated = { ...customColors, [key]: e.target.value };
                                  if (key === 'btn') {
                                    updated.active = e.target.value;
                                  }
                                  setCustomColors(updated);
                                  PortalDatabase.set('custom_theme_colors', updated);
                                  onThemeChange('custom');
                                }}
                                className="bg-transparent cursor-pointer w-7 h-7 rounded border-0 shrink-0"
                              />
                              <input 
                                type="text"
                                value={(customColors as any)[key] || '#01796F'}
                                onChange={(e) => {
                                  const updated = { ...customColors, [key]: e.target.value };
                                  if (key === 'btn') {
                                    updated.active = e.target.value;
                                  }
                                  setCustomColors(updated);
                                  PortalDatabase.set('custom_theme_colors', updated);
                                  onThemeChange('custom');
                                }}
                                className="bg-pine-bar/60 font-mono text-center text-xs text-white uppercase w-full rounded border border-pine-border py-1 px-1.5 focus:outline-none focus:border-pine-btn"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center bg-pine-bar/45 p-4 rounded-xl border border-pine-border/50 text-[11px] text-pine-text-muted gap-2">
                      <span className="font-sans">💡 Colors are applied in real-time instantly across the whole webpage!</span>
                      <button
                        type="button"
                        onClick={() => {
                          const standardPineColors = {
                            bg: '#142E2B',
                            bar: '#091514',
                            card: '#244541',
                            hover: '#315C57',
                            btn: '#14B8A6',
                            btnHover: '#2DD4BF',
                            active: '#0D9488',
                            border: '#1A3B37',
                            textHeading: '#f8fafc',
                            textBody: '#e2e8f0',
                            textMuted: '#94a3b8',
                            accent: '#F59E0B',
                            icon: '#14B8A6',
                            inputBg: '#091514',
                            inputBorder: '#1A3B37'
                          };
                          setCustomColors(standardPineColors);
                          PortalDatabase.set('custom_theme_colors', standardPineColors);
                          onThemeChange('custom');
                        }}
                        className="py-1.5 px-3 bg-red-950/20 hover:bg-red-900/40 text-rose-350 rounded border border-rose-950/30 font-semibold cursor-pointer text-[10px] font-sans"
                      >
                        Reset Standard Theme Values
                      </button>
                    </div>

                    {/* Part 3: Advanced Elements Colors */}
                    <div className="space-y-3 mt-6">
                      <h4 className="text-[11px] font-bold text-pine-btn-hover uppercase tracking-wider font-sans">Advanced Element Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { key: 'accent', label: 'Accent Color' },
                          { key: 'icon', label: 'Icons Color' },
                          { key: 'inputBg', label: 'Input Background' },
                          { key: 'inputBorder', label: 'Input Border' },
                          { key: 'textHeading', label: 'Heading Text' },
                          { key: 'textBody', label: 'Body Text' },
                          { key: 'textMuted', label: 'Muted Text' },
                          { key: 'btnBg', label: 'Button Background' },
                          { key: 'cardBg', label: 'Card Background' },
                        ].map(({ key, label }) => (
                          <div key={key} className="bg-pine-bar/30 p-3 rounded-lg border border-pine-border/40">
                            <label className="block text-[10px] text-pine-text-muted uppercase font-semibold mb-1 truncate font-sans" title={label}>{label}</label>
                            <div className="flex gap-2">
                              <input 
                                type="color"
                                value={(customColors as any)[key] || '#cccccc'}
                                onChange={(e) => {
                                  const updated = { ...customColors, [key]: e.target.value };
                                  setCustomColors(updated);
                                  PortalDatabase.set('custom_theme_colors', updated);
                                  onThemeChange('custom');
                                }}
                                className="bg-transparent cursor-pointer w-7 h-7 rounded border-0 shrink-0"
                              />
                              <input 
                                type="text"
                                value={(customColors as any)[key] || '#cccccc'}
                                onChange={(e) => {
                                  const updated = { ...customColors, [key]: e.target.value };
                                  setCustomColors(updated);
                                  PortalDatabase.set('custom_theme_colors', updated);
                                  onThemeChange('custom');
                                }}
                                className="bg-pine-bar/60 font-mono text-center text-xs text-white uppercase w-full rounded border border-pine-border py-1 px-1.5 focus:outline-none focus:border-pine-btn"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* NEW SECTION: PER-SECTION CUSTOM COLOR CONTROLLER */}
                    <div className="space-y-4 mt-8 pt-6 border-t border-pine-border/60">
                        <h4 className="text-[12px] font-bold text-pine-btn-hover uppercase tracking-wider font-heading flex items-center gap-2">
                          <Palette className="w-4 h-4 text-[#0AEAA2]" /> 4. Individual Section Custom Colors (Har Section Ke Rang Aur Likhayi)
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-sans italic">
                          Yahan se aap website ke har section ka background aur text colors apni marzi se badal sakte hain. Agar khali chhorien ge, to default theme colors apply honge.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { key: 'hero', name: '1. Home / Hero Header (Hero Section)' },
                            { key: 'namaz', name: '2. Namaz Timings Clock (Namaz Clock)' },
                            { key: 'history', name: '3. Historical Journey (Tareekh-e-Masjid)' },
                            { key: 'activities', name: '4. Islamic Activities (Sargarmiyan)' },
                            { key: 'location', name: '5. Google Maps Location (Masjid Ka Naqsha)' },
                            { key: 'financials', name: '6. Financial Portals (Maliyati Hisabat)' }
                          ].map(({ key, name }) => {
                            const colors = sectionColors[key] || {};
                            return (
                              <div key={key} className="bg-pine-bar/40 p-4 rounded-xl border border-pine-border/60 space-y-3">
                                <div className="flex justify-between items-center border-b border-pine-border/40 pb-2">
                                  <span className="text-[11px] font-bold text-white font-sans">{name}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = { ...sectionColors, [key]: {} };
                                      setSectionColors(updated);
                                      PortalDatabase.set('section_custom_colors', updated);
                                      onThemeChange('custom');
                                    }}
                                    className="text-[9px] bg-red-950/30 hover:bg-red-900/50 text-rose-350 px-2 py-0.5 rounded border border-rose-950/40 transition-all font-semibold font-sans cursor-pointer"
                                  >
                                    Reset (Saf Karen)
                                  </button>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  {/* BG Color */}
                                  <div className="space-y-1">
                                    <label className="block text-[8px] uppercase text-zinc-400 font-sans truncate" title="Background Color">Background</label>
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="color"
                                        value={colors.bg || '#142E2B'}
                                        onChange={(e) => {
                                          const updated = {
                                            ...sectionColors,
                                            [key]: { ...colors, bg: e.target.value }
                                          };
                                          setSectionColors(updated);
                                          PortalDatabase.set('section_custom_colors', updated);
                                          onThemeChange('custom');
                                        }}
                                        className="bg-transparent cursor-pointer w-6 h-6 rounded border-0 shrink-0"
                                      />
                                      <input 
                                        type="text"
                                        placeholder="Auto"
                                        value={colors.bg || ''}
                                        onChange={(e) => {
                                          const updated = {
                                            ...sectionColors,
                                            [key]: { ...colors, bg: e.target.value }
                                          };
                                          setSectionColors(updated);
                                          PortalDatabase.set('section_custom_colors', updated);
                                          onThemeChange('custom');
                                        }}
                                        className="bg-pine-bar/60 font-mono text-[9px] text-center text-white uppercase w-full rounded border border-pine-border py-0.5 px-1 focus:outline-none focus:border-pine-btn"
                                      />
                                    </div>
                                  </div>

                                  {/* Headings Text Color */}
                                  <div className="space-y-1">
                                    <label className="block text-[8px] uppercase text-zinc-400 font-sans truncate" title="Headings Text Color">Headings</label>
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="color"
                                        value={colors.textHeading || '#ffffff'}
                                        onChange={(e) => {
                                          const updated = {
                                            ...sectionColors,
                                            [key]: { ...colors, textHeading: e.target.value }
                                          };
                                          setSectionColors(updated);
                                          PortalDatabase.set('section_custom_colors', updated);
                                          onThemeChange('custom');
                                        }}
                                        className="bg-transparent cursor-pointer w-6 h-6 rounded border-0 shrink-0"
                                      />
                                      <input 
                                        type="text"
                                        placeholder="Auto"
                                        value={colors.textHeading || ''}
                                        onChange={(e) => {
                                          const updated = {
                                            ...sectionColors,
                                            [key]: { ...colors, textHeading: e.target.value }
                                          };
                                          setSectionColors(updated);
                                          PortalDatabase.set('section_custom_colors', updated);
                                          onThemeChange('custom');
                                        }}
                                        className="bg-pine-bar/60 font-mono text-[9px] text-center text-white uppercase w-full rounded border border-pine-border py-0.5 px-1 focus:outline-none focus:border-pine-btn"
                                      />
                                    </div>
                                  </div>

                                  {/* Body Text Color */}
                                  <div className="space-y-1">
                                    <label className="block text-[8px] uppercase text-zinc-400 font-sans truncate" title="Standard Text Color">Body Text</label>
                                    <div className="flex items-center gap-1">
                                      <input 
                                        type="color"
                                        value={colors.textBody || '#e2e8f0'}
                                        onChange={(e) => {
                                          const updated = {
                                            ...sectionColors,
                                            [key]: { ...colors, textBody: e.target.value }
                                          };
                                          setSectionColors(updated);
                                          PortalDatabase.set('section_custom_colors', updated);
                                          onThemeChange('custom');
                                        }}
                                        className="bg-transparent cursor-pointer w-6 h-6 rounded border-0 shrink-0"
                                      />
                                      <input 
                                        type="text"
                                        placeholder="Auto"
                                        value={colors.textBody || ''}
                                        onChange={(e) => {
                                          const updated = {
                                            ...sectionColors,
                                            [key]: { ...colors, textBody: e.target.value }
                                          };
                                          setSectionColors(updated);
                                          PortalDatabase.set('section_custom_colors', updated);
                                          onThemeChange('custom');
                                        }}
                                        className="bg-pine-bar/60 font-mono text-[9px] text-center text-white uppercase w-full rounded border border-pine-border py-0.5 px-1 focus:outline-none focus:border-pine-btn"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB: Administrators / committee roster */}
          {activeTab === 'administrators' && (
            <div className="space-y-8 animate-fade-in font-sans">
              <div>
                <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider">Committee & Administrators</h2>
                <p className="text-xs text-pine-text-muted font-sans mt-1">Manage the central committee roster. All active committee rosters will be rendered automatically in the public finances portals for accountability.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel left: Register New Administrator Form */}
                <div className="glass-panel p-6 rounded-2xl border border-pine-border bg-pine-bar/40 self-start">
                  <h3 className="text-sm font-button uppercase tracking-wider text-pink-300 mb-4 font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-pink-300" /> New Administrator
                  </h3>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Full Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Hafiz Muhammad Mubeen Sahib"
                        value={newAdminForm.name}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, name: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Designation / Position</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Secretary General / Khazan-e-Aala"
                        value={newAdminForm.position}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, position: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Contact Phone</label>
                      <input 
                        type="text"
                        placeholder="e.g. 0300-1234567"
                        value={newAdminForm.phone}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, phone: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Assigned Department</label>
                      <select
                        value={newAdminForm.moduleType}
                        onChange={(m) => setNewAdminForm({ ...newAdminForm, moduleType: m.target.value as 'masjid' | 'bazm' | 'project', moduleId: '' })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      >
                        <option value="masjid">Masjid Al Habib Noorani Fund</option>
                        <option value="bazm">Bazm-e-Raza Islamic Fund</option>
                        <option value="project">Specific Dynamic Projects</option>
                      </select>
                    </div>

                    {newAdminForm.moduleType === 'project' && (
                      <div>
                        <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Select Project</label>
                        <select
                          required
                          value={newAdminForm.moduleId}
                          onChange={(e) => setNewAdminForm({ ...newAdminForm, moduleId: e.target.value })}
                          className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn border-pink-305"
                        >
                          <option value="">-- Choose Campaign --</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Profile Photo Link (Optional)</label>
                      <input 
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={newAdminForm.image}
                        onChange={(e) => setNewAdminForm({ ...newAdminForm, image: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-pine-btn hover:bg-pine-btn-hover text-white font-button text-xs uppercase tracking-wider rounded-lg transition-all"
                    >
                      Authenticate and Register Admin
                    </button>
                  </form>
                </div>

                {/* Panel right: Administrators List Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white mb-2 font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-pine-btn-hover" /> Registered Committee Leaders ({administrators.length})
                  </h3>

                  <div className="space-y-8">
                    {(() => {
                      const masjidAdmins = administrators.filter(a => a.moduleType === 'masjid');
                      const bazmAdmins = administrators.filter(a => a.moduleType === 'bazm');
                      const projectAdmins = administrators.filter(a => a.moduleType === 'project');

                      const renderGroup = (title: string, admins: typeof administrators, labelClass: string) => {
                        if (admins.length === 0) return null;
                        return (
                          <div className="space-y-6">
                            <h4 className="text-xs font-black text-pine-btn-hover uppercase tracking-[0.3em] border-b border-pine-border/40 pb-2 mb-4 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-pine-btn"></span>
                              {title}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                              {admins.map((adm, index) => {
                                const projName = adm.moduleType === 'project' && projects.find(p => p.id === adm.moduleId)?.name;
                                return (
                                  <div key={adm.id} className="bg-pine-bar/60 border border-pine-border/40 rounded-3xl p-6 hover:bg-pine-hover/10 transition-all group shadow-2xl">
                                    <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,1fr,auto] gap-4 items-center">
                                      {/* COLUMN 1: NAME AND DEPARTMENT */}
                                      <div className="flex flex-col items-center gap-2 text-center w-full">
                                          <h4 className="font-heading font-black text-white text-md uppercase tracking-tight leading-tight">
                                            {adm.name}
                                          </h4>
                                          <span className={`text-[9px] tracking-[0.2em] font-black uppercase py-0.5 px-3 rounded inline-block border border-current/20 ${labelClass}`}>
                                            {adm.moduleType === 'masjid' ? 'Management' :
                                             adm.moduleType === 'bazm' ? 'Foundation' : `Campaign`}
                                          </span>
                                      </div>

                                      {/* COLUMN 2: RANK/POSITION */}
                                      <div className="flex flex-col items-center text-center w-full">
                                        <p className="text-[10px] text-pine-text-muted uppercase font-black tracking-widest mb-1 italic">Rank / Position</p>
                                        <div className="w-full bg-black/40 border-l-4 border-pine-btn py-2 px-3 rounded-r-xl shadow-lg">
                                          <p className="text-sm text-white font-black uppercase tracking-tighter italic leading-snug">
                                            {adm.position}
                                          </p>
                                        </div>
                                        {projName && (
                                          <div className="mt-1 flex items-center gap-1.5 justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-pine-btn"></div>
                                            <p className="text-[9px] text-pine-btn-hover font-black uppercase tracking-widest">{projName}</p>
                                          </div>
                                        )}
                                      </div>

                                      {/* COLUMN 3: CONTACT & CONTROL */}
                                      <div className="flex flex-col gap-2 w-full">
                                        <div className="bg-black/50 p-2 rounded-lg border border-pine-border/30 shadow-inner">
                                          <p className="text-[9px] text-zinc-500 uppercase font-black tracking-widest mb-1 italic">Contact</p>
                                          <p className="text-xs text-zinc-200 font-mono break-words text-center">
                                            {adm.phone || 'N/A'}
                                          </p>
                                        </div>
                                        <div className="flex gap-2 justify-center">
                                          <button
                                            type="button"
                                            onClick={() => setEditingAdmin(adm)}
                                            className="flex-1 py-1.5 bg-zinc-800 hover:bg-white hover:text-black rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all shadow-lg active:scale-95 border border-white/5"
                                          >
                                            Modify
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setAdminToDelete(adm.id)}
                                            className="flex-1 py-1.5 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-[0.1em] text-rose-500 transition-all shadow-lg active:scale-95"
                                          >
                                            Expel
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {/* COLUMN 4: IMAGE */}
                                      <div className="flex flex-col items-center shrink-0">
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-pine-btn/50 bg-black shadow-2xl">
                                          <img 
                                            src={resolveImageUrl(adm.image) || 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=300&q=80'} 
                                            alt={adm.name} 
                                            referrerPolicy="no-referrer"
                                            className="w-full h-full object-cover" 
                                            style={{ imageRendering: 'high-quality' }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      };

                      return (
                        <>
                          {renderGroup('Masjid Administrators', masjidAdmins, 'bg-indigo-950/40 text-indigo-300')}
                          {renderGroup('Bazm-e-Raza Administrators', bazmAdmins, 'bg-amber-950/40 text-amber-100')}
                          {renderGroup('Project Campaigns Administrators', projectAdmins, 'bg-rose-950/40 text-rose-100')}

                          {administrators.length === 0 && (
                            <div className="col-span-full py-12 text-center text-xs text-pine-text-muted font-sans border border-dashed border-pine-border/60 rounded-xl">
                              No registered system administrators found. Register them using the left panel.
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: DELETE ADMINISTRATOR CONFIRMATION */}
          {adminToDelete && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-[#091514] border-2 border-red-900/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(127,29,29,0.3)] animate-in zoom-in duration-200">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/40">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-heading font-black text-white text-center mb-2 uppercase tracking-tighter">Confirm Deletion</h3>
                <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed">
                  Kya aap is committee member ko system se nikalna chahte hain? Ye amal wapas nahi liya ja sakta.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      handleDeleteAdmin(adminToDelete);
                      setAdminToDelete(null);
                    }}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-button font-bold rounded-2xl transition-all shadow-lg shadow-rose-950/40"
                  >
                    Yes, Delete Member
                  </button>
                  <button
                    onClick={() => setAdminToDelete(null)}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-button font-bold rounded-2xl transition-all"
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: Edit Administrator */}
          {editingAdmin && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-pine-bar/95 border border-pine-border p-6 rounded-2xl shadow-2xl animate-fade-in font-sans">
                <h3 className="font-heading font-extrabold text-white text-base mb-4 uppercase tracking-wider font-bold">Edit Administrator details</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveAdmin(editingAdmin);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingAdmin.name}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Designation Position</label>
                    <input
                      type="text"
                      required
                      value={editingAdmin.position}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, position: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Contact Phone</label>
                    <input
                      type="text"
                      value={editingAdmin.phone}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, phone: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Assigned Department</label>
                    <select
                      value={editingAdmin.moduleType}
                      onChange={(m) => setEditingAdmin({ ...editingAdmin, moduleType: m.target.value as 'masjid' | 'bazm' | 'project', moduleId: m.target.value !== 'project' ? null : editingAdmin.moduleId })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    >
                      <option value="masjid">Masjid Al Habib Noorani Fund</option>
                      <option value="bazm">Bazm-e-Raza Islamic Fund</option>
                      <option value="project">Specific Dynamic Projects</option>
                    </select>
                  </div>
                  {editingAdmin.moduleType === 'project' && (
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Select Project</label>
                      <select
                        required
                        value={editingAdmin.moduleId || ''}
                        onChange={(e) => setEditingAdmin({ ...editingAdmin, moduleId: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      >
                        <option value="">-- Choose Campaign --</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Profile Photo Image URL Link</label>
                    <input
                      type="url"
                      value={editingAdmin.image}
                      onChange={(e) => setEditingAdmin({ ...editingAdmin, image: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-pine-border/40">
                    <button
                      type="button"
                      onClick={() => setEditingAdmin(null)}
                      className="py-1.5 px-3 rounded border border-pine-border text-xs text-white hover:bg-pine-hover"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4 rounded bg-pine-btn hover:bg-pine-btn-hover text-xs text-white font-button uppercase"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB VIEW: RELIGIOUS STAFF */}
          {activeTab === 'religious_staff' && (
            <div className="space-y-8 animate-fade-in font-sans">
              <div>
                <h2 className="text-xl font-heading font-extrabold text-white border-b border-pine-border pb-4 uppercase tracking-wider">Religious Staff & Scholars (Khateeb / Imams)</h2>
                <p className="text-xs text-pine-text-muted font-sans mt-1">Manage details of the mosque's Khatib, Lead Imam, Naib Imam, Mudarris, and other religious leadership positions. These are showcased on the home page and accessed by the AI Companion.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add New Scholar/Staff Form */}
                <div className="glass-panel p-6 rounded-2xl border border-pine-border bg-pine-bar/40 self-start">
                  <h3 className="text-sm font-button uppercase tracking-wider text-amber-400 mb-4 font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-amber-400" /> New Religious Staff
                  </h3>
                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Scholar / Staff Name</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Qari Abdur Razzaq"
                        value={newStaffForm.name}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Designation / Rank / Ohda</label>
                      <input 
                        type="text"
                        required
                        placeholder="e.g. Khatib & Markazi Lead Imam"
                        value={newStaffForm.position}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, position: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Raabta / Contact Phone</label>
                      <input 
                        type="text"
                        placeholder="e.g. 0333-9876543"
                        value={newStaffForm.phone}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-pine-text-body font-bold mb-1">Photo Image URL Link</label>
                      <input 
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={newStaffForm.imageUrl}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, imageUrl: e.target.value })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-button text-xs uppercase tracking-wider rounded-lg transition-all font-bold shadow-lg"
                    >
                      Register Scholar Staff
                    </button>
                  </form>
                </div>

                {/* Staff List Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white mb-2 font-bold flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" /> Active Scholars & Teachers ({religiousStaff.length})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {religiousStaff.map((staff) => (
                      <div key={staff.id} className="bg-pine-bar/60 border border-pine-border/40 rounded-3xl p-6 hover:bg-pine-hover/10 transition-all shadow-2xl relative">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/50 bg-black shadow-lg shrink-0 flex items-center justify-center">
                            {staff.imageUrl ? (
                              <img 
                                src={staff.imageUrl} 
                                alt={staff.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as any).src = '';
                                  (e.target as any).style.display = 'none';
                                }}
                              />
                            ) : null}
                            <Users className="w-6 h-6 text-pine-text-muted/40 absolute" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-heading font-extrabold text-white text-md truncate uppercase tracking-tight leading-tight">
                              {staff.name}
                            </h4>
                            <p className="text-xs text-amber-400 font-bold uppercase tracking-wider mt-0.5">{staff.position}</p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-1">📞 {staff.phone || 'No phone added'}</p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-pine-border/20 flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = religiousStaff.map(s => s.id === staff.id ? { ...s, active: !s.active } : s);
                              setReligiousStaff(updated);
                              PortalDatabase.set('religious_staff', updated);
                              logAudit('EDIT', `Toggle Scholar Staff Status (${staff.name})`, staff.id, JSON.stringify(staff), JSON.stringify({ ...staff, active: !staff.active }));
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all border ${
                              staff.active !== false 
                                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/60' 
                                : 'bg-zinc-800 text-zinc-500 border-zinc-700/40 hover:bg-zinc-700'
                            }`}
                          >
                            {staff.active !== false ? '● Active' : '○ Disabled'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingStaff(staff)}
                            className="py-1.5 px-2.5 bg-zinc-800 hover:bg-white hover:text-black rounded-lg text-[9px] font-black uppercase tracking-[0.1em] transition-all border border-white/5"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setStaffToDelete(staff.id)}
                            className="py-1.5 px-2.5 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-600 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-[0.1em] text-rose-500 transition-all shadow-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    {religiousStaff.length === 0 && (
                      <div className="col-span-full py-12 text-center text-xs text-pine-text-muted font-sans border border-dashed border-pine-border/60 rounded-xl">
                        No registered religious staff members found. Register them using the left form.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: DELETE SCHOLAR STAFF CONFIRMATION */}
          {staffToDelete && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
              <div className="w-full max-w-sm bg-[#091514] border-2 border-red-900/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(127,29,29,0.3)] animate-in zoom-in duration-200">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/40">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-heading font-black text-white text-center mb-2 uppercase tracking-tighter">Confirm Scholar Deletion</h3>
                <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed">
                  Kya aap is religious staff member ko system se delete karna chahte hain? Ye data permanently khatam ho jayega.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      handleDeleteStaff(staffToDelete);
                    }}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-button font-bold rounded-2xl transition-all shadow-lg"
                  >
                    Yes, Delete Staff
                  </button>
                  <button
                    onClick={() => setStaffToDelete(null)}
                    className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-button font-bold rounded-2xl transition-all"
                  >
                    No, Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL: Edit Scholar Staff */}
          {editingStaff && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-pine-bar/95 border border-pine-border p-6 rounded-2xl shadow-2xl animate-fade-in font-sans">
                <h3 className="font-heading font-extrabold text-white text-base mb-4 uppercase tracking-wider font-bold text-amber-400">Edit Scholar Staff</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveStaff(editingStaff);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Scholar / Staff Name</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.name}
                      onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Designation / Rank / Ohda</label>
                    <input
                      type="text"
                      required
                      value={editingStaff.position}
                      onChange={(e) => setEditingStaff({ ...editingStaff, position: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Contact Phone</label>
                    <input
                      type="text"
                      value={editingStaff.phone || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Profile Photo Link URL</label>
                    <input
                      type="url"
                      value={editingStaff.imageUrl || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, imageUrl: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-pine-border/40">
                    <button
                      type="button"
                      onClick={() => setEditingStaff(null)}
                      className="py-1.5 px-3 rounded border border-pine-border text-xs text-white hover:bg-pine-hover"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="py-1.5 px-4 rounded bg-amber-500 hover:bg-amber-600 text-xs text-white font-button uppercase font-bold"
                    >
                      Save Scholar Details
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: Edit Announcement */}
          {editingAnn && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-pine-bar/95 border border-pine-border p-6 rounded-2xl shadow-2xl animate-fade-in font-sans">
                <h3 className="font-heading font-extrabold text-white text-base mb-4 uppercase tracking-wider font-bold">Edit Announcement Banner</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveAnnouncement(editingAnn);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Title / Tag</label>
                    <input
                      type="text"
                      required
                      value={editingAnn.title}
                      onChange={(e) => setEditingAnn({ ...editingAnn, title: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Marquee Statement Details</label>
                    <textarea
                      required
                      value={editingAnn.content}
                      rows={4}
                      onChange={(e) => setEditingAnn({ ...editingAnn, content: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Expiry Date</label>
                    <input
                      type="date"
                      value={editingAnn.expiryDate}
                      onChange={(e) => setEditingAnn({ ...editingAnn, expiryDate: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="edit-ann-active"
                      checked={editingAnn.active}
                      onChange={(e) => setEditingAnn({ ...editingAnn, active: e.target.checked })}
                      className="bg-pine-bar border border-pine-border rounded focus:ring-0"
                    />
                    <label htmlFor="edit-ann-active" className="text-xs text-pine-text-body uppercase selection:bg-transparent cursor-pointer font-medium">Published & Visible</label>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="edit-ann-showImage"
                      checked={editingAnn.showImage || false}
                      onChange={(e) => setEditingAnn({ ...editingAnn, showImage: e.target.checked })}
                      className="bg-pine-bar border border-pine-border rounded focus:ring-0"
                    />
                    <label htmlFor="edit-ann-showImage" className="text-xs text-pine-text-body uppercase selection:bg-transparent cursor-pointer font-medium">Add Picture? (ON/OFF)</label>
                  </div>
                  {editingAnn.showImage && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-xs uppercase text-amber-400 font-bold">Picture Link / URL</label>
                      <input
                        type="url"
                        required={editingAnn.showImage}
                        value={editingAnn.imageUrl || ''}
                        onChange={(e) => setEditingAnn({ ...editingAnn, imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none focus:border-pine-btn"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAnn(null)}
                      className="w-1/2 py-2 border border-pine-border text-xs uppercase font-button text-pine-text-body rounded-lg hover:bg-pine-hover/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-pine-btn text-xs uppercase font-button text-white rounded-lg hover:bg-pine-btn-hover font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: Edit History Card */}
          {editingHist && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-pine-bar/95 border border-pine-border p-6 rounded-2xl shadow-2xl animate-fade-in font-sans">
                <h3 className="font-heading font-extrabold text-white text-base mb-4 uppercase tracking-wider font-bold">Edit History Timeline Card</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveHistory(editingHist);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Timeline Phase Year/Tag</label>
                    <input
                      type="text"
                      required
                      value={editingHist.title}
                      onChange={(e) => setEditingHist({ ...editingHist, title: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Details description Content</label>
                    <textarea
                      required
                      value={editingHist.content}
                      rows={5}
                      onChange={(e) => setEditingHist({ ...editingHist, content: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingHist(null)}
                      className="w-1/2 py-2 border border-pine-border text-xs uppercase font-button text-pine-text-body rounded-lg hover:bg-pine-hover/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-pine-btn text-xs uppercase font-button text-white rounded-lg hover:bg-pine-btn-hover font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: Edit Quranic Program Activity */}
          {editingAct && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-pine-bar/95 border border-pine-border p-6 rounded-2xl shadow-2xl animate-fade-in font-sans">
                <h3 className="font-heading font-extrabold text-white text-base mb-4 uppercase tracking-wider font-bold">Edit Islamic Program Card</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveActivity(editingAct);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Program Title</label>
                    <input
                      type="text"
                      required
                      value={editingAct.title}
                      onChange={(e) => setEditingAct({ ...editingAct, title: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Timings Statement</label>
                    <input
                      type="text"
                      required
                      value={editingAct.timing}
                      onChange={(e) => setEditingAct({ ...editingAct, timing: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Detailed Description notes</label>
                    <textarea
                      required
                      value={editingAct.description}
                      rows={4}
                      onChange={(e) => setEditingAct({ ...editingAct, description: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAct(null)}
                      className="w-1/2 py-2 border border-pine-border text-xs uppercase font-button text-pine-text-body rounded-lg hover:bg-pine-hover/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-pine-btn text-xs uppercase font-button text-white rounded-lg hover:bg-pine-btn-hover font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: Edit Contributor Account Details */}
          {editingMember && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-pine-bar/95 border border-pine-border p-6 rounded-2xl shadow-2xl animate-fade-in font-sans">
                <h3 className="font-heading font-extrabold text-white text-base mb-4 uppercase tracking-wider font-bold font-sans">Edit Contributor Account</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveMember(editingMember);
                }} className="space-y-4 font-sans">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold font-sans">Fund Module Folder</label>
                    <select
                      value={editingMember.fundId}
                      onChange={(e) => setEditingMember({ ...editingMember, fundId: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    >
                      {funds.map((f) => (
                        <option key={f.id} value={f.id} className="bg-pine-bar text-white">{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold font-sans">Contributor Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingMember.name}
                      onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold font-sans">Mobile Line / Phone</label>
                    <input
                      type="text"
                      required
                      value={editingMember.phone}
                      onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold font-sans">Yearly target amount (Rs)</label>
                    <input
                      type="number"
                      required
                      value={editingMember.requiredAmount}
                      onChange={(e) => setEditingMember({ ...editingMember, requiredAmount: Number(e.target.value) })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Prev Remaining target</label>
                      <input
                        type="number"
                        value={editingMember.remainingPrevious}
                        onChange={(e) => setEditingMember({ ...editingMember, remainingPrevious: Number(e.target.value) })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Prev Paid target</label>
                      <input
                        type="number"
                        value={editingMember.paidPrevious}
                        onChange={(e) => setEditingMember({ ...editingMember, paidPrevious: Number(e.target.value) })}
                        className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingMember(null)}
                      className="w-1/2 py-2 border border-pine-border text-xs uppercase font-button text-pine-text-body rounded-lg hover:bg-pine-hover/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-pine-btn text-xs uppercase font-button text-white rounded-lg hover:bg-pine-btn-hover font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: Edit Loose miscellaneous Income Collections */}
          {editingOther && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans">
              <div className="w-full max-w-md bg-pine-bar/95 border border-pine-border p-6 rounded-2xl shadow-2xl animate-fade-in font-sans font-sans">
                <h3 className="font-heading font-extrabold text-white text-base mb-4 uppercase tracking-wider font-bold">Edit Loose Inflow receipt</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveOther(editingOther);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Fund Folder</label>
                    <select
                      value={editingOther.fundId}
                      onChange={(e) => setEditingOther({ ...editingOther, fundId: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    >
                      {funds.map(f => (
                        <option key={f.id} value={f.id} className="bg-pine-bar text-white">{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Receipt Source</label>
                    <input
                      type="text"
                      required
                      value={editingOther.source}
                      onChange={(e) => setEditingOther({ ...editingOther, source: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Logged Date</label>
                    <input
                      type="date"
                      required
                      value={editingOther.date}
                      onChange={(e) => setEditingOther({ ...editingOther, date: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Amount outright (Rs)</label>
                    <input
                      type="number"
                      required
                      value={editingOther.amount}
                      onChange={(e) => setEditingOther({ ...editingOther, amount: Number(e.target.value) })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Statement description details</label>
                    <input
                      type="text"
                      value={editingOther.details}
                      onChange={(e) => setEditingOther({ ...editingOther, details: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingOther(null)}
                      className="w-1/2 py-2 border border-pine-border text-xs uppercase font-button text-pine-text-body rounded-lg hover:bg-pine-hover/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-pine-btn text-xs uppercase font-button text-white rounded-lg hover:bg-pine-btn-hover font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL: Edit Capital/Operating Outflow Expense */}
          {editingExpense && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-pine-bar/95 border border-pine-border p-6 rounded-2xl shadow-2xl animate-fade-in font-sans">
                <h3 className="font-heading font-extrabold text-white text-base mb-4 uppercase tracking-wider font-bold">Edit Operating Outflow Expense</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveExpense(editingExpense);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Fund Folder</label>
                    <select
                      value={editingExpense.fundId}
                      onChange={(e) => setEditingExpense({ ...editingExpense, fundId: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    >
                      {funds.map(f => (
                        <option key={f.id} value={f.id} className="bg-pine-bar text-white">{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Expense / Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={editingExpense.name}
                      onChange={(e) => setEditingExpense({ ...editingExpense, name: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Billing Date</label>
                    <input
                      type="date"
                      required
                      value={editingExpense.date}
                      onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Amount Paid (Rs)</label>
                    <input
                      type="number"
                      required
                      value={editingExpense.amount}
                      onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-pine-text-body mb-1 font-bold">Narration explanatory notes</label>
                    <input
                      type="text"
                      value={editingExpense.details}
                      onChange={(e) => setEditingExpense({ ...editingExpense, details: e.target.value })}
                      className="w-full bg-pine-bar border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingExpense(null)}
                      className="w-1/2 py-2 border border-pine-border text-xs uppercase font-button text-pine-text-body rounded-lg hover:bg-pine-hover/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 py-2 bg-pine-btn text-xs uppercase font-button text-white rounded-lg hover:bg-pine-btn-hover font-bold"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODALS */}
          {/* Commitment Modal */}
          {showCommitmentModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
              <div className="bg-pine-bg border border-pine-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
                <button
                  onClick={() => setShowCommitmentModal(false)}
                  className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-heading font-bold text-white mb-6">
                  {editingCommitment ? 'Edit Commitment' : 'Add New Commitment'}
                </h3>
                <p className="text-xs text-pine-text-muted mb-4 uppercase tracking-wider font-bold">
                  Fund: {activeCommitmentFundName}
                </p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amountNum = Number(commitmentForm.amountDue);
                    if (isNaN(amountNum) || amountNum < 0) return;

                    if (editingCommitment) {
                      const updated = commitments.map(c => 
                        c.id === editingCommitment.id 
                          ? { ...c, ...commitmentForm, amountDue: amountNum } 
                          : c
                      );
                      setCommitments(updated);
                      PortalDatabase.set('commitments', updated);
                      logAudit('EDIT', 'Commitment Edited', activeCommitmentFundName, editingCommitment.name, '');
                    } else {
                      const newCommitment = {
                        id: `c-${Date.now()}`,
                        fundId: activeCommitmentFund,
                        ...commitmentForm,
                        amountDue: amountNum,
                        createdAt: new Date().toISOString().split('T')[0]
                      };
                      const updated = [...commitments, newCommitment];
                      setCommitments(updated);
                      PortalDatabase.set('commitments', updated);
                      logAudit('ADD', 'Commitment Added', activeCommitmentFundName, '', `Added commitment for ${commitmentForm.name}`);
                    }
                    setShowCommitmentModal(false);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-pine-text-body mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={commitmentForm.name}
                      onChange={e => setCommitmentForm({...commitmentForm, name: e.target.value})}
                      className="w-full bg-black/30 border border-pine-border rounded-lg px-4 py-2.5 text-white font-sans text-sm focus:border-pine-btn focus:outline-none transition-colors"
                      placeholder="e.g. Hafiz Muhammad Mubeen Sahib"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-pine-text-body mb-1">Phone Number (Optional)</label>
                    <input
                      type="text"
                      value={commitmentForm.phone}
                      onChange={e => setCommitmentForm({...commitmentForm, phone: e.target.value})}
                      className="w-full bg-black/30 border border-pine-border rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-pine-btn focus:outline-none transition-colors"
                      placeholder="e.g. 0300-1234567"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-pine-text-body mb-1">Amount Due (Rs)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={commitmentForm.amountDue}
                      onChange={e => setCommitmentForm({...commitmentForm, amountDue: e.target.value})}
                      className="w-full bg-black/30 border border-pine-border rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:border-pine-btn focus:outline-none transition-colors"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-pine-text-body mb-1">Details / Notice Text</label>
                    <textarea
                      required
                      value={commitmentForm.notes}
                      onChange={e => setCommitmentForm({...commitmentForm, notes: e.target.value})}
                      rows={4}
                      className="w-full bg-black/30 border border-pine-border rounded-lg px-4 py-2 text-white font-sans text-sm focus:border-pine-btn focus:outline-none transition-colors resize-none"
                      placeholder="Note for the user..."
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowCommitmentModal(false)}
                      className="flex-1 px-4 py-2.5 text-xs uppercase tracking-wider font-bold text-pine-text-muted hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-pine-btn-hover hover:bg-pine-btn text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {editingCommitment ? 'Save Changes' : 'Add Commitment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
