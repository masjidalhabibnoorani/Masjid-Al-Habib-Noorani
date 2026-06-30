/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Admin, Announcement, PrayerTiming, HistorySection, Activity, MapSettings, 
  Administrator, FundModule, FundMember, FundMemberTransaction, OtherFundEntry, 
  Expense, ProtectedPagePassword, Project, AuditLog, resolveImageUrl, Commitment,
  ReligiousStaff
} from './types';
import { PortalDatabase, INITIAL_PASSWORDS } from './data';
import { gsap } from 'gsap';

import { ToastProvider } from './components/Toast';

// Component Imports
import Particles from './components/Particles';

import Marquee from './components/Marquee';
import NamazSection from './components/NamazSection';
import FundDetailsView from './components/FundDetailsView';
import AdminPortal from './components/AdminPortal';
import TiltCard from './components/TiltCard';
import MagneticButton from './components/MagneticButton';
import Counter from './components/Counter';
import AIChatWidget from './components/AIChatWidget';

// Lucide icons
import { 
  ShieldAlert, BookOpen, Compass, Calendar, MapPin, DollarSign, ArrowUpRight, 
  Lock, CheckCircle, Smartphone, ExternalLink, ShieldCheck, Heart, Menu, X, Bell, Volume2,
  Award, Users
} from 'lucide-react';

// Dynamic Theme Presets Definition
const THEME_PRESETS = [
  {
    id: 'pine',
    name: 'Emerald Pine (Standard Dark)',
    colors: {
      bg: '#142E2B',
      bar: '#091514',
      card: '#244541',
      hover: '#315C57',
      btn: '#14B8A6',
      btnHover: '#2DD4BF',
      active: '#0D9488',
      border: '#1A3B37',
      textHeading: '#FFFFFF',
      textBody: '#E0EDE5',
      textMuted: '#A8BCB0',
    }
  },
  {
    id: 'blue',
    name: 'Royal Islamic Blue (Dark)',
    colors: {
      bg: '#0A1A2F',
      bar: '#050D17',
      card: '#162A45',
      hover: '#20395c',
      btn: '#3B82F6',
      btnHover: '#60A5FA',
      active: '#2563EB',
      border: '#233A54',
      textHeading: '#FFFFFF',
      textBody: '#CBDCFF',
      textMuted: '#94B8FF',
    }
  },
  {
    id: 'gold',
    name: 'Desert Medina Gold (Dark)',
    colors: {
      bg: '#2d2417',
      bar: '#1d170f',
      card: '#3f3220',
      hover: '#4e3e29',
      btn: '#b28026',
      btnHover: '#dfaa46',
      active: '#8e6113',
      border: '#4c3f2b',
      textHeading: '#FFF8EB',
      textBody: '#DFC296',
      textMuted: '#AF9671',
    }
  },
  {
    id: 'rose',
    name: 'Sufi Crimson Rose (Dark)',
    colors: {
      bg: '#3d1620',
      bar: '#290f15',
      card: '#5c2230',
      hover: '#6d2a3a',
      btn: '#b82a46',
      btnHover: '#e64e6c',
      active: '#911f35',
      border: '#6b2d3c',
      textHeading: '#FFF0F3',
      textBody: '#DDA0AC',
      textMuted: '#B27682',
    }
  },
  {
    id: 'turquoise',
    name: 'Mughal Mosaic Turquoise (Dark)',
    colors: {
      bg: '#143D3F',
      bar: '#0C2627',
      card: '#295C5E',
      hover: '#3D7B7D',
      btn: '#00A896',
      btnHover: '#00E5C9',
      active: '#018576',
      border: '#1F5354',
      textHeading: '#F0FDFA',
      textBody: '#99F6E4',
      textMuted: '#5EEAD4',
    }
  },
  {
    id: 'teal',
    name: 'Silk Teal & Platinum (Dark)',
    colors: {
      bg: '#142E2B',
      bar: '#091514',
      card: '#244541',
      hover: '#315C57',
      btn: '#14B8A6',
      btnHover: '#2DD4BF',
      active: '#0D9488',
      border: '#1A3B37',
      textHeading: '#F0FDFA',
      textBody: '#99F6E4',
      textMuted: '#2DD4BF',
    }
  },
  {
    id: 'charcoal',
    name: 'Al-Aqsa Slate & Gold (Dark)',
    colors: {
      bg: '#1F2421',
      bar: '#111413',
      card: '#323936',
      hover: '#414A46',
      btn: '#D4AF37',
      btnHover: '#F3E5AB',
      active: '#AA8811',
      border: '#2A302D',
      textHeading: '#FDFDFD',
      textBody: '#D4DCD8',
      textMuted: '#A3B0AA',
    }
  },
  {
    id: 'luxury-kaabah',
    name: 'Imperial Kaabah Metallic (Premium Dark)',
    colors: {
      bg: '#0F0F0F',
      bar: '#050505',
      card: '#1A1A1A',
      hover: '#2D2D2D',
      btn: '#DFBA4F',
      btnHover: '#F7E39A',
      active: '#C1992F',
      border: '#282828',
      textHeading: '#FFFFFF',
      textBody: '#E3E3E3',
      textMuted: '#A3A3A3',
    }
  },
  {
    id: 'deep-space',
    name: 'Cosmic Tahajjud Star (Premium Dark)',
    colors: {
      bg: '#05070F',
      bar: '#020308',
      card: '#0D1224',
      hover: '#18203D',
      btn: '#6366F1',
      btnHover: '#818CF8',
      active: '#4F46E5',
      border: '#1E2958',
      textHeading: '#FFFFFF',
      textBody: '#CBD5E1',
      textMuted: '#94A3B8',
    }
  },
  {
    id: 'light-jasmine',
    name: 'Pure Jasmine Emerald (Premium Light)',
    colors: {
      bg: '#F3F9F6',
      bar: '#E2EFEA',
      card: '#FFFFFF',
      hover: '#D2E5DE',
      btn: '#047857',
      btnHover: '#059669',
      active: '#065F46',
      border: '#C2DBD0',
      textHeading: '#064E3B',
      textBody: '#1F2937',
      textMuted: '#4B5563',
    }
  },
  {
    id: 'light-bukhara',
    name: 'Bright Sand of Bukhara (Premium Light)',
    colors: {
      bg: '#F9F6F0',
      bar: '#F1E9DC',
      card: '#FFFFFF',
      hover: '#EADFCB',
      btn: '#B45309',
      btnHover: '#D97706',
      active: '#92400E',
      border: '#DFD0B8',
      textHeading: '#78350F',
      textBody: '#1F2937',
      textMuted: '#5E6773',
    }
  },
  {
    id: 'light-parchment',
    name: 'Quranic Parchment Warm (Premium Light)',
    colors: {
      bg: '#F5ECE3',
      bar: '#EDE1CF',
      card: '#FFFFFF',
      hover: '#E2D3BE',
      btn: '#5C4033',
      btnHover: '#8B5A2B',
      active: '#3D2B1F',
      border: '#D3C2AE',
      textHeading: '#2B1B10',
      textBody: '#3E2723',
      textMuted: '#795548',
    }
  }
];

export default function App() {
  // Initialize Database once on startup
  useEffect(() => {
    PortalDatabase.init();
  }, []);

  const [currentThemeId, setCurrentThemeId] = useState<string>(() => PortalDatabase.get('current_theme_id', 'custom'));
  const [themeTrigger, setThemeTrigger] = useState<number>(0);

  useEffect(() => {
    const selectedTheme = THEME_PRESETS.find(t => t.id === currentThemeId) || THEME_PRESETS[0];
    const root = document.documentElement;
    
    let colors = { ...selectedTheme.colors };
    
    if (currentThemeId === 'custom') {
      const customColors = PortalDatabase.get('custom_theme_colors', null);
      if (customColors) {
        colors = { 
          ...colors, 
          ...customColors 
        };
      }
    }

    root.style.setProperty('--color-pine-bg', colors.bg);
    root.style.setProperty('--color-pine-bar', colors.bar);
    root.style.setProperty('--color-pine-card', colors.card);
    root.style.setProperty('--color-pine-hover', colors.hover);
    root.style.setProperty('--color-pine-btn', colors.btn);
    root.style.setProperty('--color-pine-btn-hover', colors.btnHover);
    root.style.setProperty('--color-pine-active', colors.active);
    root.style.setProperty('--color-pine-border', colors.border);

    root.style.setProperty('--custom-pine-bg', colors.bg);
    root.style.setProperty('--custom-pine-bar', colors.bar);
    root.style.setProperty('--custom-pine-card', colors.card);
    root.style.setProperty('--custom-pine-hover', colors.hover);
    root.style.setProperty('--custom-pine-btn', colors.btn);
    root.style.setProperty('--custom-pine-btn-hover', colors.btnHover);
    root.style.setProperty('--custom-pine-active', colors.active);
    root.style.setProperty('--custom-pine-border', colors.border);

    // Calculate contrast text dynamically depending on the current background color
    const getContrastText = (hex: string, style: 'heading' | 'body' | 'muted') => {
      if (!hex || !hex.startsWith('#')) {
        return style === 'heading' ? '#F5F5F5' : style === 'body' ? '#B8D0C0' : '#8CA89A';
      }
      const r = parseInt(hex.slice(1, 3), 16) || 0;
      const g = parseInt(hex.slice(3, 5), 16) || 0;
      const b = parseInt(hex.slice(5, 7), 16) || 0;
      const yiq = (r * 299 + g * 587 + b * 114) / 1000;
      if (yiq >= 135) {
        // Light background -> Dark Slate colors
        return style === 'heading' ? '#000000' : style === 'body' ? '#1e293b' : '#475569';
      } else {
        // Dark background -> Light Slate colors
        return style === 'heading' ? '#ffffff' : style === 'body' ? '#f1f5f9' : '#cbd5e1';
      }
    };

    const textHeadingColor = colors.textHeading || getContrastText(colors.bg, 'heading');
    const textBodyColor = colors.textBody || getContrastText(colors.bg, 'body');
    const textMutedColor = colors.textMuted || getContrastText(colors.bg, 'muted');

    root.style.setProperty('--text-pine-heading', textHeadingColor);
    root.style.setProperty('--text-pine-body', textBodyColor);
    root.style.setProperty('--text-pine-muted', textMutedColor);

    // Calculate YIQ for background to set font weight
    const bgHex = colors.bg || '#000000';
    const r = parseInt(bgHex.slice(1, 3), 16) || 0;
    const g = parseInt(bgHex.slice(3, 5), 16) || 0;
    const b = parseInt(bgHex.slice(5, 7), 16) || 0;
    const bgYiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Ensure text is bold and crisp
    root.style.setProperty('--font-weight-body', bgYiq >= 135 ? '500' : '400');
    root.classList.toggle('high-contrast', true);

    // Apply custom wallpaper background image if set
    const customBg = PortalDatabase.get('custom_bg_image', '');
    const bgOpacity = PortalDatabase.get('custom_bg_opacity', 35);
    const bgImageEl = document.getElementById('website_custom_bg_image_overlay');
    if (bgImageEl) {
      if (customBg) {
        bgImageEl.style.backgroundImage = `url("${resolveImageUrl(customBg)}")`;
        bgImageEl.style.opacity = `${bgOpacity / 100}`;
        bgImageEl.style.display = 'block';
      } else {
        bgImageEl.style.display = 'none';
      }
    }
  }, [currentThemeId, themeTrigger]);

  const [sectionBgSettings, setSectionBgSettings] = useState(() => 
    PortalDatabase.get('section_bg_settings', {
      hero: 'transparent',
      namaz: 'solid',
      history: 'transparent',
      activities: 'transparent',
      location: 'solid',
      financials: 'transparent'
    })
  );

  const [sectionColors, setSectionColors] = useState(() => 
    PortalDatabase.get<Record<string, { bg?: string; textHeading?: string; textBody?: string }>>('section_custom_colors', {
      hero: {},
      namaz: {},
      history: {},
      activities: {},
      location: {},
      financials: {}
    })
  );

  useEffect(() => {
    setSectionBgSettings(PortalDatabase.get('section_bg_settings', {
      hero: 'transparent',
      namaz: 'solid',
      history: 'transparent',
      activities: 'transparent',
      location: 'solid',
      financials: 'transparent'
    }));
    setSectionColors(PortalDatabase.get('section_custom_colors', {
      hero: {},
      namaz: {},
      history: {},
      activities: {},
      location: {},
      financials: {}
    }));
  }, [themeTrigger]);

  const handleThemeChange = (themeId: string) => {
    setCurrentThemeId(themeId);
    PortalDatabase.set('current_theme_id', themeId);
    setThemeTrigger(prev => prev + 1);
  };

  // System States (Synced from PortalDatabase / localStorage)
  const [passwords, setPasswords] = useState<ProtectedPagePassword[]>(() => 
    PortalDatabase.get('passwords', [])
  );
  const [prayerTimings, setPrayerTimings] = useState<PrayerTiming[]>(() => 
    PortalDatabase.get('prayer_timings', [])
  );
  const [historySections, setHistorySections] = useState<HistorySection[]>(() => 
    PortalDatabase.get('history_sections', [])
  );
  const [activities, setActivities] = useState<Activity[]>(() => 
    PortalDatabase.get('activities', [])
  );
  const [mapSettings, setMapSettings] = useState<MapSettings>(() => 
    PortalDatabase.get('map_settings', { id: '1', iframeUrl: '', address: '' })
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => 
    PortalDatabase.get('announcements', [])
  );
  const [funds, setFunds] = useState<FundModule[]>(() => 
    PortalDatabase.get('funds', [])
  );
  const [members, setMembers] = useState<FundMember[]>(() => 
    PortalDatabase.get('members', [])
  );
  const [transactions, setTransactions] = useState<FundMemberTransaction[]>(() => 
    PortalDatabase.get('transactions', [])
  );
  const [others, setOthers] = useState<OtherFundEntry[]>(() => 
    PortalDatabase.get('other_fund_entries', [])
  );
  const [expenses, setExpenses] = useState<Expense[]>(() => 
    PortalDatabase.get('expenses', [])
  );
  const [projects, setProjects] = useState<Project[]>(() => 
    PortalDatabase.get('projects', [])
  );
  const [commitments, setCommitments] = useState<Commitment[]>(() => 
    PortalDatabase.get('commitments', [])
  );

  // Auto-healing Project security keys registry synchronization and system passwords healing
  useEffect(() => {
    let passwordsUpdated = false;
    const currentPasswords = [...passwords];
    
    // First, heal static INITIAL_PASSWORDS
    INITIAL_PASSWORDS.forEach(seeded => {
      const exists = currentPasswords.some(p => p.id === seeded.id);
      if (!exists) {
        currentPasswords.push(seeded);
        passwordsUpdated = true;
      }
    });

    // Remove legacy unused passwords
    const legacyIds = ['masjid_shop_rent', 'masjid_zakat_ledger', 'bazm_bazm_custom_event'];
    for (let i = currentPasswords.length - 1; i >= 0; i--) {
      if (legacyIds.includes(currentPasswords[i].id)) {
        currentPasswords.splice(i, 1);
        passwordsUpdated = true;
      }
    }

    // Then, dynamic project keys
    projects.forEach(proj => {
      const keys = [
        { suffix: 'portfolio', name: 'Portfolio' },
        { suffix: 'fixed', name: 'Monthly Fixed' },
        { suffix: 'other', name: 'Other Contrib' },
        { suffix: 'expenses', name: 'Expenditures' },
        { suffix: 'commitments', name: 'Commitments' }
      ];
      
      keys.forEach(k => {
        const passwordId = `project_${proj.id}_${k.suffix}`;
        const exists = currentPasswords.some(p => p.id === passwordId);
        if (!exists) {
          currentPasswords.push({
            id: passwordId,
            pageName: `Project [${proj.name}] ${k.name}`,
            passwordValue: '786' // Standard default password for dynamic views
          });
          passwordsUpdated = true;
        }
      });
    });
    
    if (passwordsUpdated) {
      setPasswords(currentPasswords);
      PortalDatabase.set('passwords', currentPasswords);
    }
  }, [projects, passwords]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => 
    PortalDatabase.get('audit_logs', [])
  );
  const [administrators, setAdministrators] = useState<Administrator[]>(() => 
    PortalDatabase.get('administrators', [])
  );
  const [religiousStaff, setReligiousStaff] = useState<ReligiousStaff[]>(() => 
    PortalDatabase.get('religious_staff', [])
  );

  // Administrative Audit logging tracer
  const logAudit = (
    action: AuditLog['action'], 
    module: string, 
    recordId: string, 
    oldVal: any, 
    newVal: any
  ) => {
    const freshLog: AuditLog = {
      id: `l-${Date.now()}`,
      adminId: 'super-admin',
      action,
      module,
      recordId,
      oldValue: typeof oldVal === 'string' ? oldVal : JSON.stringify(oldVal),
      newValue: typeof newVal === 'string' ? newVal : JSON.stringify(newVal),
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString()
    };
    const updated = [...auditLogs, freshLog];
    setAuditLogs(updated);
    PortalDatabase.set('audit_logs', updated);
  };

  // State Routing: 'gateway' | 'public' | 'admin' | 'fund_details'
  const [viewState, setViewState] = useState<'gateway' | 'public' | 'admin' | 'fund_details'>('gateway');
  
  // GSAP animations when view state changes
  useEffect(() => {
    if (viewState === 'public') {
      // Stagger entrance of hero elements
      gsap.fromTo("#hero-section h1", 
        { opacity: 0, y: 40 }, 
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.1 }
      );
      gsap.fromTo("#hero-section p", 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out', delay: 0.3 }
      );
      gsap.fromTo("#hero-section .pt-8", 
        { opacity: 0, scale: 0.9, y: 20 }, 
        { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: 'back.out(1.5)', delay: 0.5 }
      );
      // Animate cards inside sections
      gsap.fromTo(".glass-panel", 
        { opacity: 0, y: 40, scale: 0.98 }, 
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power2.out', stagger: 0.1, delay: 0.4 }
      );
    } else if (viewState === 'gateway') {
      gsap.fromTo(".text-center h1", 
        { opacity: 0, scale: 0.95, y: -25 }, 
        { opacity: 1, scale: 1, y: 0, duration: 1.4, ease: 'power4.out' }
      );
      gsap.fromTo(".w-56", 
        { opacity: 0, y: 35 }, 
        { opacity: 1, y: 0, duration: 1, ease: 'back.out(1.4)', stagger: 0.15, delay: 0.3 }
      );
    }
  }, [viewState]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedFund, setSelectedFund] = useState<FundModule | null>(null);
  const [adminLedgerMode, setAdminLedgerMode] = useState(false);

  // 3D dimensions and tilting removed
  
  // Announcement popup state and action hook
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);

  const handlePublicEntrance = () => {
    const activeAnnouncements = announcements.filter(
      (ann) => ann.active && (!ann.expiryDate || new Date(ann.expiryDate) >= new Date())
    );

    if (activeAnnouncements.length > 0) {
      setShowAnnouncementPopup(true);
    } else {
      setViewState('public');
    }
  };

  // Admin Verification logic inside Gateway Page
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassObj = passwords.find(p => p.id === 'admin_dashboard');
    const systemAdminPass = adminPassObj ? adminPassObj.passwordValue : 'habib786';

    if (adminPasswordInput === systemAdminPass) {
      setViewState('admin');
      setAdminPasswordInput('');
      setAdminError('');
      setShowAdminLogin(false);
      logAudit('PASSWORD_CHANGE', 'Portal Admin Verification', 'admin_console', 'Verified', 'Access Approved');
    } else {
      setAdminError('Aap ne password ghalat enter kiya hai dubara koshish karen, agar aap administration me se hain. Agar nahi to aap ke liye ye data nahi hai.');
    }
  };

  const routeToFundDetails = (f: FundModule) => {
    setSelectedFund(f);
    setAdminLedgerMode(false);
    setViewState('fund_details');
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-pine-bg text-pine-text-body font-sans relative overflow-x-hidden selection:bg-pine-btn selection:text-white pb-0">
        
        {/* Custom Theme Wallpaper Background Overlay */}
      <div 
        id="website_custom_bg_image_overlay" 
        className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{
          display: 'var(--pine-wallpaper-display, none)',
          backgroundImage: 'var(--pine-wallpaper, none)',
          opacity: 'var(--pine-wallpaper-opacity, 0.35)',
          mixBlendMode: 'normal',
        }}
      />

      {/* Dynamic Custom Section Overrides */}
      <style>{`
        ${Object.entries(sectionColors).map(([sectionKey, colorsVal]) => {
          const colors = colorsVal as any;
          const rules = [];
          if (colors?.bg) {
            rules.push(`background-color: ${colors.bg} !important;`);
            rules.push(`background-image: none !important;`);
          }
          if (colors?.textHeading) {
            rules.push(`--text-pine-heading: ${colors.textHeading} !important;`);
          }
          if (colors?.textBody) {
            rules.push(`--text-pine-body: ${colors.textBody} !important;`);
          }
          if (rules.length === 0) return '';
          
          let selectors = '';
          if (sectionKey === 'hero') {
            selectors = '#hero-section';
          } else if (sectionKey === 'namaz') {
            selectors = '#namaz-timings-section-wrapper, #namaz-timings-section';
          } else if (sectionKey === 'history') {
            selectors = '#history-section';
          } else if (sectionKey === 'activities') {
            selectors = '#activities-section';
          } else if (sectionKey === 'location') {
            selectors = '#location-section';
          } else if (sectionKey === 'financials') {
            selectors = '#financials-section';
          }
          
          if (!selectors) return '';
          
          return `
            ${selectors} {
              ${rules.join('\n')}
            }
            ${colors?.textHeading ? `
              ${selectors} h1, ${selectors} h2, ${selectors} h3, ${selectors} h4, ${selectors} .text-white {
                color: ${colors.textHeading} !important;
              }
            ` : ''}
            ${colors?.textBody ? `
              ${selectors} p, ${selectors} span:not(.font-mono), ${selectors} div:not(.font-mono), ${selectors} .text-pine-text-body {
                color: ${colors.textBody} !important;
              }
            ` : ''}
          `;
        }).join('\n')}
      `}</style>

      {/* Drifting background particles behind text layers */}
      <Particles />

      {/* Screen Routing transitions view */}
      <AnimatePresence mode="wait">
        
        {/* VIEW 1: LANDING GATEWAY PAGE */}
        {viewState === 'gateway' && (
          <motion.div
            key="gateway"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="fixed inset-0 min-h-screen flex items-center justify-center p-4 z-40 select-none bg-transparent"
          >
            <div className="text-center max-w-xl w-full">
              
              {/* Dedicated Title Reveal (Staggered Animation 4) */}
              <div className="mb-4">
                <span className="text-[11px] font-button text-pine-btn-hover uppercase tracking-widest font-extrabold block">
                  Masjid Al-Habib Noorani
                </span>
                <h1 className="text-4xl md:text-5xl font-heading font-extrabold text-white mt-1.5 tracking-tight uppercase leading-none">
                  Enter In Website
                </h1>
                <p className="text-sm font-sans text-pine-text-muted mt-2">
                  As a public OR As a administration
                </p>
              </div>

              {/* Action buttons with magnetic spring behaviors */}
              <div className="mt-10 flex flex-col sm:flex-row gap-5 justify-center items-center">
                
                {/* Public entrance */}
                <div className="flex flex-col items-center">
                  <MagneticButton 
                    onClick={handlePublicEntrance}
                    className="w-56"
                  >
                    Enter as Public
                  </MagneticButton>
                  <span className="text-[10px] font-sans text-pine-text-muted mt-2 uppercase tracking-widest block">
                    Access by everyone
                  </span>
                </div>

                {/* Administration entrance with padlock validation */}
                <div className="flex flex-col items-center">
                  <MagneticButton 
                    onClick={() => setShowAdminLogin(true)}
                    className="w-56 bg-transparent border border-pine-border hover:bg-pine-hover/20 text-white"
                  >
                    Enter as Admin
                  </MagneticButton>
                  <span className="text-[10px] font-sans text-pine-text-muted mt-2 uppercase tracking-widest block">
                    Password Protected
                  </span>
                </div>

              </div>

              {/* Small credits footer */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <span className="text-[10px] font-mono text-pine-text-muted select-none">
                  Wah Cantt • Pakistan
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: PUBLIC WEBSITE (MAIN SEQUENCE SECTIONS) */}
        {viewState === 'public' && (
          <motion.div
            key="public"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen"
          >
            <div className="relative w-full">
              {/* Nav and scroll header parent container - fully fixed on scroll */}
              <div className="fixed top-0 left-0 right-0 z-40 w-full shadow-lg bg-pine-bar">
              {/* Announcement bar infinitely scrolling marquee */}
              <Marquee announcements={announcements} />

              {/* General Header with navigation links */}
              <header className="bg-pine-bar border-b border-pine-border shadow-md select-none">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                  <div onClick={() => { setViewState('gateway'); setMobileMenuOpen(false); }} className="flex items-center gap-3 cursor-pointer">
                    <div>
                      <h1 className="text-white font-heading font-extrabold text-sm uppercase tracking-wider">Masjid Al-Habib Noorani</h1>
                      <span className="text-[10px] text-pine-btn-hover font-mono uppercase block leading-none">Wah Cantt</span>
                    </div>
                  </div>

                  {/* Desktop anchors */}
                  <nav className="hidden md:flex items-center gap-6 text-[11px] font-button uppercase tracking-wider text-pine-text-body">
                    <a href="#hero-section" className="hover:text-white transition-colors">Home</a>
                    <a href="#namaz-timings-section" className="hover:text-white transition-colors">Namaz Timings</a>
                    <a href="#history-section" className="hover:text-white transition-colors flex items-center gap-1">History</a>
                    <a href="#religious-scholars-section" className="hover:text-white transition-colors">Staff & Imams</a>
                    <a href="#activities-section" className="hover:text-white transition-colors">Activities</a>
                    <a href="#location-section" className="hover:text-white transition-colors">Location</a>
                    <a href="#financials-section" className="hover:text-white transition-colors font-bold text-pine-btn-hover">Financials</a>
                  </nav>

                  {/* Desktop Action Buttons */}
                  <div className="hidden md:flex items-center gap-2">
                    <button 
                      onClick={() => setViewState('gateway')}
                      className="border border-pine-border text-[10px] font-button uppercase tracking-wider text-white hover:bg-pine-hover px-3.5 py-1.5 rounded-md cursor-pointer"
                    >
                      Log Out
                    </button>
                    <button 
                      onClick={() => setShowAdminLogin(true)}
                      className="bg-pine-btn hover:bg-pine-btn-hover text-[10px] text-white font-button uppercase tracking-wider px-3.5 py-1.5 rounded-md flex items-center gap-1"
                    >
                      <Lock className="w-3 h-3 text-pine-success" /> Admin Room
                    </button>
                  </div>

                  {/* Mobile Hamburger Toggle */}
                  <div className="md:hidden flex items-center gap-2">
                    <button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      className="text-white p-2 border border-pine-border rounded-lg hover:bg-pine-hover focus:outline-none"
                    >
                      {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Mobile Navigation Dropdown Tray */}
                {mobileMenuOpen && (
                  <div className="md:hidden border-t border-pine-border bg-pine-bar px-6 py-4 space-y-4 flex flex-col font-mono text-xs select-none shadow-2xl">
                    <a onClick={() => setMobileMenuOpen(false)} href="#hero-section" className="text-white font-sans text-sm border-b border-pine-border/20 pb-2">Home</a>
                    <a onClick={() => setMobileMenuOpen(false)} href="#namaz-timings-section" className="text-white font-sans text-sm border-b border-pine-border/20 pb-2">Namaz Timings</a>
                    <a onClick={() => setMobileMenuOpen(false)} href="#history-section" className="text-white font-sans text-sm border-b border-pine-border/20 pb-2">History</a>
                    <a onClick={() => setMobileMenuOpen(false)} href="#religious-scholars-section" className="text-white font-sans text-sm border-b border-pine-border/20 pb-2">Staff & Imams</a>
                    <a onClick={() => setMobileMenuOpen(false)} href="#activities-section" className="text-white font-sans text-sm border-b border-pine-border/20 pb-2">Activities</a>
                    <a onClick={() => setMobileMenuOpen(false)} href="#location-section" className="text-white font-sans text-sm border-b border-pine-border/20 pb-2">Location</a>
                    <a onClick={() => setMobileMenuOpen(false)} href="#financials-section" className="text-pine-btn-hover font-sans text-sm font-bold border-b border-pine-border/20 pb-2">Financials</a>
                    
                    {/* Mobile 3D Dimension Selector Removed */}

                    <div className="pt-2 flex flex-col gap-2">
                      <button 
                        onClick={() => { setViewState('gateway'); setMobileMenuOpen(false); }}
                        className="w-full text-center border border-pine-border text-[10px] font-button uppercase tracking-wider text-white hover:bg-pine-hover py-2.5 rounded-md"
                      >
                        Log Out
                      </button>
                      <button 
                        onClick={() => { setShowAdminLogin(true); setMobileMenuOpen(false); }}
                        className="w-full text-center bg-pine-btn hover:bg-pine-btn-hover text-[10px] text-white font-button uppercase tracking-wider py-2.5 rounded-md flex items-center justify-center gap-1"
                      >
                        <Lock className="w-3 h-3 text-pine-success" /> Admin Room
                      </button>
                    </div>
                  </div>
                )}
              </header>
            </div>

            {/* Spacer for fixed navigation header */}
            <div className="h-[108px] w-full shrink-0" />

            {/* SECTION 1: HOME SECTION (HERO SECTION with Slow drift parallax) */}
            <section id="hero-section" className={`relative min-h-[500px] flex items-center justify-center py-20 px-6 select-none overflow-hidden border-b border-pine-border ${
              sectionBgSettings.hero === 'transparent' ? 'bg-transparent' : 
              sectionBgSettings.hero === 'solid' ? 'bg-pine-bg' : 
              'bg-radial from-pine-bg via-pine-bar/80 to-black/60 pointer-events-auto backdrop-blur-[1px]'
            }`}>
              {(() => {
                const activeHeroAnnouncements = announcements.filter(
                  (ann) => ann.active && (!ann.expiryDate || new Date(ann.expiryDate) >= new Date())
                );
                
                return (
                  <div className="max-w-7xl w-full mx-auto relative z-20">
                    {activeHeroAnnouncements.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-7 text-center lg:text-left space-y-4">
                          <span className="text-[11px] font-button text-pine-btn-hover font-bold uppercase tracking-widest bg-pine-bar/40 py-1.5 px-4 rounded-full border border-pine-border inline-block">
                            Markazi Jamia Masjid • Masjid Al-Habib Noorani
                          </span>
                          
                          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white uppercase tracking-tight leading-none pt-2">
                            Welcome to Masjid Al-Habib Noorani
                          </h1>
                          
                          <p className="text-sm md:text-base font-sans text-pine-text-body max-w-2xl mx-auto lg:mx-0 leading-relaxed pt-2">
                            A center for true Islamic teachings. We warmly welcome respected worshipers and seekers of knowledge of the true faith to the depths of our hearts.
                          </p>

                          <div className="pt-8 flex gap-4 justify-center lg:justify-start">
                            <MagneticButton onClick={() => window.scrollTo({ top: document.getElementById('namaz-timings-section')?.offsetTop, behavior: 'smooth' })}>
                              Prayer Clock
                            </MagneticButton>
                            <a 
                              href="#financials-section"
                              className="py-3 px-6 rounded-lg text-xs font-button uppercase tracking-wider text-white border border-pine-border hover:bg-pine-hover/15 flex items-center gap-1.5 shadow-md"
                            >
                              Fund Portfolio <ArrowUpRight className="w-4 h-4 text-pine-success" />
                            </a>
                          </div>
                        </div>

                        <div className="lg:col-span-5 w-full">
                          <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5 }}
                            className="glass-panel p-6 rounded-2xl border-l-4 border-amber-500 shadow-2xl relative overflow-hidden bg-gradient-to-br from-pine-bar/95 to-pine-bg/95 backdrop-blur-md"
                          >
                            <div className="absolute top-0 right-0 p-3 opacity-15">
                              <Volume2 className="w-16 h-16 text-amber-500" />
                            </div>
                            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-white/5">
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                              <div>
                                <h4 className="text-xs font-heading font-black tracking-widest text-amber-400 uppercase">Ahem Ailaan / Announcements</h4>
                                <p className="text-[9px] text-pine-text-muted font-sans">Masjid Al-Habib Noorani Live updates</p>
                              </div>
                            </div>
                            
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                              {activeHeroAnnouncements.map((ann) => (
                                <div key={ann.id} className="p-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/20 transition-all text-left">
                                  <div className="flex justify-between items-start gap-2 mb-1.5">
                                    <h5 className="text-xs font-heading font-extrabold text-amber-300 uppercase tracking-wide">
                                      {ann.title}
                                    </h5>
                                    <span className="text-[9px] font-mono text-pine-text-muted shrink-0">
                                      {new Date(ann.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-sans text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                    {ann.content}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-4xl mx-auto text-center space-y-6 py-8">
                        <span className="text-[11px] font-button text-pine-btn-hover font-bold uppercase tracking-widest bg-pine-bar/40 py-1.5 px-4 rounded-full border border-pine-border inline-block">
                          Markazi Jamia Masjid • Masjid Al-Habib Noorani
                        </span>
                        
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-white uppercase tracking-tight leading-none pt-2">
                          Welcome to Masjid Al-Habib Noorani
                        </h1>
                        
                        <p className="text-sm md:text-base font-sans text-pine-text-body max-w-2xl mx-auto leading-relaxed pt-2">
                          A center for true Islamic teachings. We warmly welcome respected worshipers and seekers of knowledge of the true faith to the depths of our hearts.
                        </p>

                        <div className="pt-4 flex gap-4 justify-center">
                          <MagneticButton onClick={() => window.scrollTo({ top: document.getElementById('namaz-timings-section')?.offsetTop, behavior: 'smooth' })}>
                            Prayer Clock
                          </MagneticButton>
                          <a 
                            href="#financials-section"
                            className="py-3 px-6 rounded-lg text-xs font-button uppercase tracking-wider text-white border border-pine-border hover:bg-pine-hover/15 flex items-center gap-1.5 shadow-md"
                          >
                            Fund Portfolio <ArrowUpRight className="w-4 h-4 text-pine-success" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Side location tag */}
              <div className="absolute bottom-6 right-6 text-right hidden md:block select-none">
                <span className="text-[10px] font-mono text-pine-text-muted uppercase tracking-widest block">Wah Cantt, Punjab</span>
              </div>
            </section>

            {/* SECTION 2: NAMAZ TIMINGS (Live counting in Karachi timezone) */}
            <section id="namaz-timings-section-wrapper" className={
              sectionBgSettings.namaz === 'transparent' ? 'bg-transparent' :
              sectionBgSettings.namaz === 'solid' ? 'bg-pine-bg border border-pine-border/20' :
              'bg-pine-bg/75 backdrop-blur-sm border-b border-pine-border/20'
            }>
              <NamazSection prayerTimings={prayerTimings} />
            </section>

            {/* SECTION 3: MASJID HISTORY TIMELINE CARDS */}
            <section id="history-section" className={`py-20 px-6 md:px-8 max-w-7xl mx-auto border-t border-b border-pine-border/40 select-none rounded-3xl ${
              sectionBgSettings.history === 'transparent' ? 'bg-transparent' :
              sectionBgSettings.history === 'solid' ? 'bg-pine-bg' :
              'bg-pine-bg/75 backdrop-blur-sm'
            }`}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-heading font-extrabold text-white tracking-tight uppercase flex items-center justify-center gap-2">
                  <BookOpen className="w-7 h-7 text-pine-btn-hover" />
                  Masjid History
                </h2>
                <p className="text-xs text-pine-text-body mt-2">Historical journey and milestones of Masjid Al-Habib Noorani.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {historySections.map((hist) => (
                  <TiltCard key={hist.id} className="bg-gradient-to-b from-pine-card/50 to-pine-bar/60">
                    <h3 className="text-base font-heading font-extrabold text-white border-b border-pine-border/40 pb-2 mb-3">
                      {hist.title}
                    </h3>
                    <p className="text-xs text-pine-text-body leading-relaxed">
                      {hist.content}
                    </p>
                  </TiltCard>
                ))}
              </div>
            </section>

            {/* SECTION 3B: RELIGIOUS SCHOLARS & MASJID STAFF */}
            <section id="religious-scholars-section" className={`py-20 px-6 md:px-8 max-w-7xl mx-auto border-b border-pine-border/40 select-none rounded-3xl ${
              sectionBgSettings.history === 'transparent' ? 'bg-transparent' :
              sectionBgSettings.history === 'solid' ? 'bg-pine-bg' :
              'bg-pine-bg/75 backdrop-blur-sm'
            }`}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-heading font-extrabold text-white tracking-tight uppercase flex items-center justify-center gap-2">
                  <Award className="w-7 h-7 text-amber-400 animate-pulse" />
                  Masjid Scholars & Imams
                </h2>
                <p className="text-xs text-pine-text-body mt-2">
                  Meet our esteemed religious staff members, scholars, and teachers dedicated to our spiritual growth.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                {religiousStaff
                  .filter((staff) => staff.active !== false)
                  .map((staff) => (
                    <TiltCard key={staff.id} className="bg-gradient-to-b from-pine-card/50 to-pine-bar/60 border border-pine-border/40 hover:border-amber-500/50 transition-all p-6 flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <div className="w-80 h-80 max-w-full aspect-square rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-lg bg-pine-bg/50 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:border-amber-400">
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
                          ) : (
                            <Users className="w-12 h-12 text-pine-text-muted/50 absolute" />
                          )}
                        </div>
                        <span className="absolute bottom-1 right-2 bg-emerald-500 w-4 h-4 rounded-full border-2 border-pine-bar shadow-md" title="Active"></span>
                      </div>

                      <h3 className="text-lg font-heading font-extrabold text-white">{staff.name}</h3>
                      <p className="text-xs font-semibold text-amber-400 mt-1 uppercase tracking-wider font-button">{staff.position}</p>
                      
                      {staff.phone && (
                        <div className="mt-4 pt-3 border-t border-pine-border/30 w-full flex items-center justify-center gap-2 text-xs text-pine-text-body">
                          <span className="text-pine-text-muted">Raabta / Phone:</span>
                          <a 
                            href={`tel:${staff.phone}`}
                            className="font-mono text-white hover:text-amber-400 font-semibold transition-colors bg-pine-bg/40 px-2.5 py-1 rounded border border-pine-border/20"
                          >
                            {staff.phone}
                          </a>
                        </div>
                      )}
                    </TiltCard>
                  ))}
              </div>
            </section>

            {/* SECTION 4: CURRENT ACTIVITIES QURAN PROGRAMS */}
            <section id="activities-section" className={`py-20 px-6 md:px-8 max-w-7xl mx-auto border-b border-pine-border/40 select-none rounded-3xl ${
              sectionBgSettings.activities === 'transparent' ? 'bg-transparent' :
              sectionBgSettings.activities === 'solid' ? 'bg-pine-bg' :
              'bg-pine-bg/75 backdrop-blur-sm'
            }`}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-heading font-extrabold text-white tracking-tight uppercase flex items-center justify-center gap-2">
                  <Compass className="w-7 h-7 text-pine-btn-hover" />
                  Current Activities
                </h2>
                <p className="text-xs text-pine-text-body mt-2">Daily Quran classes, Tajweed for children, and morning/evening religious programs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {activities.map((act) => (
                  <TiltCard key={act.id} glow={false} className="bg-gradient-to-b from-pine-card/60 to-pine-bar/60 p-6 flex flex-col justify-between h-56">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs uppercase font-button text-pine-btn-hover font-semibold tracking-wider">Timing: {act.timing}</span>
                      </div>
                      <h3 className="text-lg font-heading font-extrabold text-white mt-1.5">{act.title}</h3>
                      <p className="text-xs text-pine-text-body mt-3 leading-relaxed">
                        {act.description}
                      </p>
                    </div>

                    <div className="flex justify-end pt-3">
                      <span className="text-[9px] font-mono text-pine-text-muted">Verified Activity</span>
                    </div>
                  </TiltCard>
                ))}
              </div>
            </section>

            {/* SECTION 5: MASJID LOCATION GOOGLE MAP EMBEDS */}
            <section id="location-section" className={`py-20 px-6 md:px-8 max-w-7xl mx-auto border-b border-pine-border/40 select-none rounded-3xl ${
              sectionBgSettings.location === 'transparent' ? 'bg-transparent' :
              sectionBgSettings.location === 'solid' ? 'bg-pine-bg' :
              'bg-pine-bg/75 backdrop-blur-sm'
            }`}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-heading font-extrabold text-white tracking-tight uppercase flex items-center justify-center gap-2">
                  <MapPin className="w-7 h-7 text-pine-btn-hover" />
                  Masjid Location Map
                </h2>
                <p className="text-xs text-pine-text-body mt-2">Masjid Al-Habib Noorani location pointers inside Wah Cantt of Punjab Pakistan.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
                {/* Information block */}
                <div className="space-y-4">
                  <div className="glass-panel p-5 rounded-xl border border-pine-border">
                    <span className="text-[10px] text-pine-btn-hover font-button uppercase tracking-wider block mb-1 font-bold">Markazi Address</span>
                    <p className="text-xs font-medium text-white">{mapSettings.address}</p>
                    <p className="text-[11px] text-pine-text-muted font-sans mt-2 italic">{mapSettings.details}</p>
                  </div>
                  
                  <a 
                    href="https://maps.google.com" 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    className="w-full py-3 bg-pine-btn hover:bg-pine-btn-hover text-white text-xs font-button uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 text-center"
                  >
                    Get directions Google Maps <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Iframe card maps */}
                <div className="lg:col-span-2 aspect-video rounded-2xl overflow-hidden border border-pine-border/60 bg-pine-bar/30">
                  {mapSettings.iframeUrl ? (
                    <iframe
                      src={mapSettings.iframeUrl}
                      className="w-full h-full border-0 select-none pointer-events-auto"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Masjid location"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col justify-center items-center text-xs text-pine-text-muted">
                      No location mapping URL saved yet.
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 6: FINANCIAL RECORDS DIRECTORY */}
            <section id="financials-section" className={`py-20 px-6 md:px-8 max-w-7xl mx-auto select-none rounded-3xl ${
              sectionBgSettings.financials === 'transparent' ? 'bg-transparent' :
              sectionBgSettings.financials === 'solid' ? 'bg-pine-bg' :
              'bg-pine-bg/75 backdrop-blur-sm'
            }`}>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-heading font-extrabold text-white tracking-tight uppercase flex items-center justify-center gap-2">
                  <DollarSign className="w-7 h-7 text-pine-btn-hover" />
                  Financial Records & Funds
                </h2>
                <p className="text-xs text-pine-text-body mt-2">Transparent lists of accounts, contributions and monthly expenses. Managed and audited weekly.</p>
              </div>

              {/* Three permanent folder portals cards mapping */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {funds.map((f) => {
                  // If project, resolve matching record
                  const optProject = projects.find(p => p.fundModuleId === f.id);
                  const isArchivedProject = optProject && optProject.status === 'archived';

                  // Do not show archived projects in front public listings
                  if (isArchivedProject) return null;

                  // Resolve dynamic total achieved
                  const moduleMembers = members.filter(m => m.fundId === f.id);
                  const mTransactions = transactions.filter(t => t.monthKey !== 'khatm');
                  
                  let fixedTotal = 0;
                  moduleMembers.forEach(m => {
                    const trans = mTransactions.filter(t => t.memberId === m.id);
                    fixedTotal += trans.reduce((s, item) => s + item.amount, 0);
                  });

                  const otherTotal = others.filter(o => o.fundId === f.id).reduce((s, item) => s + item.amount, 0);
                  const combinedTotal = fixedTotal + otherTotal;

                  return (
                    <TiltCard key={f.id} glow className="bg-gradient-to-br from-pine-card/60 to-pine-bar/60 p-6 flex flex-col justify-between h-64 border border-pine-border hover:border-pine-btn">
                      <div>
                        <span className="text-[10px] font-button text-pine-btn-hover uppercase font-bold tracking-widest block mb-1">
                          {f.type === 'project' ? 'Dynamic Project Channel' : 'Permanent Mosque Fund'}
                        </span>
                        <h3 className="text-xl font-heading font-extrabold text-white">{f.name}</h3>
                        <p className="text-xs text-pine-text-body mt-2">
                          {f.type === 'masjid' && "Masjid Al-Habib Noorani general development, electricity bills and repair works."}
                          {f.type === 'bazm' && "Sunni propagation, Milaad-un-Nabi events, books printing and Giyaarwee Shareef feasts."}
                          {f.type === 'project' && optProject?.shortDescription}
                        </p>
                      </div>

                      <div className="border-t border-pine-border/40 pt-4 mt-4 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-pine-text-muted uppercase block leading-none">Audited & Managed</span>
                          <span className="text-xs font-sans text-pine-text-body mt-1 block font-medium">
                            Weekly Accounts
                          </span>
                        </div>
                        <button 
                          onClick={() => routeToFundDetails(f)}
                          className="py-1.5 px-4 bg-pine-btn hover:bg-pine-btn-hover text-white text-xs font-button uppercase tracking-wider rounded-md flex items-center gap-1 transition-colors"
                        >
                          View Details <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TiltCard>
                  );
                })}
              </div>
            </section>

            {/* Public general Footer footer */}
            <footer className="bg-pine-bar border-t border-pine-border py-12 px-6 shadow-2xl relative select-none">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-pine-text-muted">
                <div className="flex items-center gap-3">
                  <div>
                    <span className="font-heading font-bold text-white uppercase block">Masjid Al-Habib Noorani</span>
                    <span className="text-[10px] block">Bahtar Morr • Wah Cantt • Punjab • Pakistan</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-pine-text-body">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  <span>Serving the sunni community with absolute transparency.</span>
                </div>

                <div className="font-mono text-[10px]">
                  © 2026 Masjid Al-Habib Noorani. All Rights Reserved.
                </div>
              </div>
            </footer>

            </div>

            {/* Floating AI Chatbot Companion */}
            <AIChatWidget
              prayerTimings={prayerTimings}
              announcements={announcements}
              historySections={historySections}
              activities={activities}
              administrators={administrators}
              projects={projects}
              religiousStaff={religiousStaff}
            />
          </motion.div>
        )}

        {/* VIEW 3: FINANCIAL SUBVIEWS REGISTER */}
        {viewState === 'fund_details' && selectedFund && (
          <motion.div
            key="fund_details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <FundDetailsView
              fund={selectedFund}
              project={projects.find(p => p.fundModuleId === selectedFund.id)}
              onBack={() => {
                if (adminLedgerMode) {
                  setViewState('admin');
                } else {
                  setViewState('public');
                }
              }}
              members={members}
              transactions={transactions}
              others={others}
              expenses={expenses}
              passwords={passwords}
              admins={administrators}
              setMembers={setMembers}
              setTransactions={setTransactions}
              setOthers={setOthers}
              setExpenses={setExpenses}
              commitments={commitments}
              setCommitments={setCommitments}
              logAudit={logAudit}
              isAdminView={adminLedgerMode}
            />
          </motion.div>
        )}

        {/* VIEW 4: ADMINISTRATIVE CONSOLE */}
        {viewState === 'admin' && (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <AdminPortal
              onLogout={() => setViewState('gateway')}
              onBackToPublic={() => setViewState('public')}
              onOpenFundInAdminRoom={(f) => {
                setSelectedFund(f);
                setAdminLedgerMode(true);
                setViewState('fund_details');
              }}
              announcements={announcements}
              setAnnouncements={setAnnouncements}
              prayerTimings={prayerTimings}
              setPrayerTimings={setPrayerTimings}
              historySections={historySections}
              setHistorySections={setHistorySections}
              activities={activities}
              setActivities={setActivities}
              mapSettings={mapSettings}
              setMapSettings={setMapSettings}
              funds={funds}
              setFunds={setFunds}
              members={members}
              setMembers={setMembers}
              transactions={transactions}
              setTransactions={setTransactions}
              others={others}
              setOthers={setOthers}
              expenses={expenses}
              setExpenses={setExpenses}
              passwords={passwords}
              setPasswords={setPasswords}
              projects={projects}
              setProjects={setProjects}
              commitments={commitments}
              setCommitments={setCommitments}
              auditLogs={auditLogs}
              setAuditLogs={setAuditLogs}
              logAudit={logAudit}
              administrators={administrators}
              setAdministrators={setAdministrators}
              religiousStaff={religiousStaff}
              setReligiousStaff={setReligiousStaff}
              currentThemeId={currentThemeId}
              onThemeChange={handleThemeChange}
            />
          </motion.div>
        )}

      </AnimatePresence>

      {/* Login Popup model if admin gates requested */}
      {showAdminLogin && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm ml-auto mr-auto bg-gradient-to-b from-pine-card to-pine-bar border border-pine-border p-8 rounded-2xl shadow-2xl"
          >
            <div className="text-center mb-6">
              <ShieldAlert className="w-10 h-10 text-pine-btn-hover mx-auto mb-2 animate-pulse" />
              <h3 className="text-sm font-button uppercase font-extrabold text-white tracking-widest">Administrator Gateway</h3>
              <p className="text-[10px] text-pine-text-muted mt-0.5 font-sans">Please enter the correct admin access key to load portal.</p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <label className="block text-[10px] font-button text-pine-text-body uppercase tracking-widest mb-1">Enter Password</label>
                <input
                  type="password"
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••"
                  autoFocus
                  className="w-full bg-pine-bar/60 border border-pine-border rounded-lg py-2 px-3 text-center text-white text-sm tracking-widest uppercase placeholder-pine-text-muted/20 focus:outline-none focus:border-pine-btn"
                />
              </div>
              {adminError && (
                <p className="text-[11px] text-pine-error text-center font-medium animate-shake">
                  {adminError}
                </p>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="w-1/2 py-2 rounded-lg border border-pine-border text-[11px] font-button text-pine-text-body uppercase hover:bg-pine-hover/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-lg bg-pine-btn hover:bg-pine-btn-hover text-white text-[11px] font-button uppercase"
                >
                  Verify Key
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Dynamic Active Announcement Interstitial Popup Modal */}
      {showAnnouncementPopup && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-lg bg-gradient-to-b from-pine-bar to-pine-bg border border-pine-border p-6 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            {/* Top gold bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-teal-500 to-amber-500" />
            
            {/* Header */}
            <div className="text-center mb-5 pb-4 border-b border-white/5">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                <Volume2 className="w-6 h-6 text-amber-400 animate-bounce" />
              </div>
              <h2 className="text-amber-400 font-sans text-xl font-bold tracking-wide">AHAM ELANAAT</h2>
              <h3 className="text-xs font-button uppercase font-extrabold text-white tracking-widest mt-1">Important Announcements</h3>
            </div>

            {/* List of active announcements */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 mb-6">
              {announcements
                .filter((ann) => ann.active && (!ann.expiryDate || new Date(ann.expiryDate) >= new Date()))
                .map((ann) => (
                  <div 
                    key={ann.id} 
                    className="p-4 bg-teal-950/10 border border-emerald-500/10 rounded-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all text-left"
                  >
                    <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500/60" />
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xs font-heading font-extrabold text-white uppercase tracking-wider pl-1.5 transition-colors group-hover:text-amber-300">
                        {ann.title}
                      </h4>
                      <span className="text-[9px] font-mono text-zinc-500 shrink-0">
                        {new Date(ann.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-zinc-300 leading-relaxed pl-1.5 whitespace-pre-wrap mb-1">
                      {ann.content}
                    </p>
                    {ann.showImage && ann.imageUrl && (
                      <div className="mt-3 pl-1.5 overflow-hidden rounded-lg border border-emerald-500/20 bg-black/40">
                        <img 
                          src={ann.imageUrl} 
                          alt={ann.title} 
                          className="w-full max-h-52 object-cover rounded-lg shadow-md hover:scale-[1.01] transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => {
                  setShowAnnouncementPopup(false);
                  setViewState('public');
                }}
                className="w-full h-11 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-xs text-white font-extrabold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 cursor-pointer active:scale-[0.98]"
              >
                Next
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
    </ToastProvider>
  );
}
