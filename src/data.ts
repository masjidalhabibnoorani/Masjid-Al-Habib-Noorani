/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Admin,
  Announcement,
  PrayerTiming,
  HistorySection,
  Activity,
  MapSettings,
  Administrator,
  FundModule,
  FundMember,
  FundMemberTransaction,
  OtherFundEntry,
  Expense,
  ProtectedPagePassword,
  Project,
  AuditLog,
  Commitment,
  ReligiousStaff
} from './types';
import { saveToCloud } from './firebase';

// Gregorian months for Masjid Fund
export const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Islamic months for Bazm Fund
export const ISLAMIC_MONTHS = [
  'Rabi-ul-Awwal', 'Rabi-us-Sani', 'Jamadi-ul-Awwal', 'Jamadi-us-Sani',
  'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul-Qadah', 'Dhul-Hijjah',
  'Muharram', 'Safar'
];

// Initial password seeds
export const INITIAL_PASSWORDS: ProtectedPagePassword[] = [
  { id: 'admin_dashboard', pageName: 'Admin Dashboard', passwordValue: 'habib786' },
  { id: 'masjid_portfolio', pageName: 'Masjid Fund Portfolio', passwordValue: 'm123' },
  { id: 'masjid_fixed', pageName: 'Masjid Fixed Fund', passwordValue: 'fixed786' },
  { id: 'masjid_other', pageName: 'Masjid Other Fund', passwordValue: 'other786' },
  { id: 'masjid_expenses', pageName: 'Masjid Fund Expenses', passwordValue: 'exp786' },
  { id: 'masjid_commitments', pageName: 'Masjid Fund Commitments', passwordValue: 'com786' },
  { id: 'bazm_portfolio', pageName: 'Bazm Fund Portfolio', passwordValue: 'b123' },
  { id: 'bazm_fixed', pageName: 'Bazm Fixed Fund', passwordValue: 'bfixed786' },
  { id: 'bazm_other', pageName: 'Bazm Other Fund', passwordValue: 'bother786' },
  { id: 'bazm_expenses', pageName: 'Bazm Fund Expenses', passwordValue: 'bexp786' },
  { id: 'bazm_commitments', pageName: 'Bazm Fund Commitments', passwordValue: 'bcom786' },
  { id: 'yearly_rollover', pageName: 'Ledger Yearly Rollover/Reset', passwordValue: 'reset786' },
];

export const INITIAL_PRAYER_TIMINGS: PrayerTiming[] = [
  { id: '1', prayerName: 'Fajr', azaanTime: '04:15', prayerTime: '04:45', notes: 'Dars-e-Quran subah sabaq' },
  { id: '2', prayerName: 'Zuhr', azaanTime: '12:30', prayerTime: '13:00', notes: 'Zawal time 12:10 ke baad' },
  { id: '3', prayerName: 'Asr', azaanTime: '16:45', prayerTime: '17:00', notes: 'Chaye aur dars program' },
  { id: '4', prayerName: 'Maghrib', azaanTime: '19:15', prayerTime: '19:18', notes: 'Azaan ke fauran baad' },
  { id: '5', prayerName: 'Isha', azaanTime: '20:45', prayerTime: '21:00', notes: 'Taleem program weekly' },
  { id: '6', prayerName: 'Jummah', azaanTime: '12:45', prayerTime: '13:30', notes: 'Khutba Arabic 01:00 baje' }
];

export const INITIAL_HISTORY: HistorySection[] = [
  { id: '1', title: 'Buniyad – 1982', content: 'Masjid Al Habib Noorani ki buniyad 1982 mein Wah Cantt ke pur-sukoon mahol mein rakhi gayi. Shuru mein ye choti si kachi tameer thi jahan chand afraat namaz parha karte the.', sortOrder: 1 },
  { id: '2', title: 'Taraqqi (Tameer-e-Nau)', content: '2005 mein masjid ki jadeed tameer-e-nau ka aghaaz kiya gaya. Khubsurat gumbad, jadeed cooling system, aur do naye minaar tameer kiye gaye taake ziyada namazi sama sakein.', sortOrder: 2 },
  { id: '3', title: 'Halat-e-Hazra', content: 'Alhamdulillah, aaj masjid mein 2,500 se zayed namazi ki gunjaish hai. Fully air-conditioned halls, automatic wuzu systems aur ek shandaar islami library dastyaab hai.', sortOrder: 3 },
  { id: '4', title: 'Mustaqbil Ke Khwab', content: 'Hum aik computer academy aur muft medical dispensory qayem karne ka irada rakhte hain. Iske sath hi poori building ko solar energy par shift kiya ja raha hai.', sortOrder: 4 }
];

export const INITIAL_ACTIVITIES: Activity[] = [
  { id: '1', title: 'Dars-e-Quran', timing: 'Maghrib ke baad', description: 'Tafseer ul Quran ka sabaq jis mein aam feham urdu mein aayatein bayan ki jati hain.', sortOrder: 1 },
  { id: '2', title: 'Taleem Program', timing: 'Asar ke baad', description: 'Bache aur baron ko sahih talaffuz ke sath Quran-e-Pak ka qaida aur namaz ke masail sikhao.', sortOrder: 2 },
  { id: '3', title: 'Hifz Classes', timing: 'Din mein 4 times', description: 'Zaheen bacho ke liye hifz-e-quran ki makhsoos darsgah jahan asatiza nigrani karte hain.', sortOrder: 3 }
];

export const INITIAL_MAP: MapSettings = {
  id: '1',
  iframeUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13264.444212351761!2d72.7153163!3d33.783688!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38dfa7321e053f31%3A0x6b4fbccd15c0e15f!2sWah%20Cantt%2C%20Rawalpindi%2C%20Punjab%2C%20Pakistan!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s',
  address: 'Saddar Bazar, G.T Road, Wah Cantt, Rawalpindi, Punjab, Pakistan',
  details: 'Main bypass se kareeb, markazi commercial market ke sath.'
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: '⭐ Ramzan-ul-Mubarak', content: 'InshaAllah Ramzan-ul-Mubarak ke dauran taraweeh ki aakhri raaten makhsoos hafizan parhayenge. Khatm-ul-Quran ki tayyari jari hai.', active: true, expiryDate: '2026-09-30', createdAt: '2026-06-15' },
  { id: '2', title: '📢 Clean Water Filtration', content: 'Dono makhsoos gates par jadeed water filtration systems lagaye ja chuke hain. Muft peenay ke saaf pani ki supply jari hai.', active: true, expiryDate: '2026-12-31', createdAt: '2026-06-15' },
  { id: '3', title: '💧 Solar Panel Stage 2', content: 'Masjid ki electricity ko full solar grid par shift karne ke liye Project Fund ke donations ab qabool kiye ja rahe hain.', active: true, expiryDate: '2026-08-15', createdAt: '2026-06-15' }
];

export const INITIAL_ADMINISTRATORS: Administrator[] = [
  // Masjid Fund
  { id: '1', moduleType: 'masjid', moduleId: null, name: 'Haji Muhammad Anwar', position: 'Saddar / President', phone: '0300-1234567', image: 'https://images.unsplash.com/photo-1547037579-f0fc020ac3be?w=400&auto=format&fit=crop&q=80' },
  { id: '2', moduleType: 'masjid', moduleId: null, name: 'Sufi Safeer Ahmad', position: 'Khazan / Treasurer', phone: '0321-7654321', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { id: '3', moduleType: 'masjid', moduleId: null, name: 'Qari Abdur Razzaq', position: 'Khatib & Markazi Imam', phone: '0333-9876543', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80' },
  
  // Bazm Fund
  { id: '4', moduleType: 'bazm', moduleId: null, name: 'Muhammad Irfan Shah', position: 'Bazm In-charge', phone: '0313-5551122', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80' },
  { id: '5', moduleType: 'bazm', moduleId: null, name: 'Zeeshan Ali Al-Razi', position: 'Senior Coordinator', phone: '0312-8889900', image: 'https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?w=400&auto=format&fit=crop&q=80' },
];

export const INITIAL_RELIGIOUS_STAFF: ReligiousStaff[] = [
  { id: 'staff-1', name: 'Qari Abdur Razzaq', position: 'Khatib & Markazi Lead Imam', phone: '0333-9876543', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80', active: true },
  { id: 'staff-2', name: 'Qari Muhammad Bilal', position: 'Naib Imam & Muazzin', phone: '0345-1122334', imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80', active: true },
  { id: 'staff-3', name: 'Hafiz Ahmad Saeed', position: 'Mudarris (Quran & Tajweed Teacher)', phone: '0312-5556677', imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80', active: true }
];

export const INITIAL_FUNDS: FundModule[] = [
  { id: 'masjid-fund', name: 'Masjid Fund', type: 'masjid', status: 'active' },
  { id: 'bazm-fund', name: 'Bazm-e-Raza Fund', type: 'bazm', status: 'active' },
  { id: 'project-solar', name: 'Solar Project', type: 'project', status: 'active' }
];

// Seed Members for Masjid Fund (Gregorian)
export const INITIAL_MASJID_MEMBERS: FundMember[] = [
  { id: 'mm-1', fundId: 'masjid-fund', name: 'Malik Mohammad Asif', phone: '0300-5123456', requiredAmount: 12000, remainingPrevious: 2000, paidPrevious: 2000 },
  { id: 'mm-2', fundId: 'masjid-fund', name: 'Chaudhary Abdul Ghafoor', phone: '0321-5987654', requiredAmount: 24000, remainingPrevious: 0, paidPrevious: 0 },
  { id: 'mm-3', fundId: 'masjid-fund', name: 'Rana Muhammad Tanveer', phone: '0345-5431298', requiredAmount: 12000, remainingPrevious: 5000, paidPrevious: 1000 },
  { id: 'mm-4', fundId: 'masjid-fund', name: 'Sheikh Jameel ur Rehman', phone: '0333-5112233', requiredAmount: 18000, remainingPrevious: 0, paidPrevious: 0 },
  { id: 'mm-5', fundId: 'masjid-fund', name: 'Dr. Sajid Al-Zaman', phone: '0312-5001199', requiredAmount: 36000, remainingPrevious: 10000, paidPrevious: 10000 }
];

// Seed Transactions for Masjid Fund
// monthKey format: e.g. "January" to "December", or special "khatm", "prev"
export const INITIAL_MASJID_TRANSACTIONS: FundMemberTransaction[] = [
  // mm-1 (Asif) - paid some months, Khatm-ul-Quran Done
  { id: 't-1', memberId: 'mm-1', monthKey: 'January', amount: 1000, paymentDate: '2026-01-05' },
  { id: 't-2', memberId: 'mm-1', monthKey: 'February', amount: 1000, paymentDate: '2026-02-05' },
  { id: 't-3', memberId: 'mm-1', monthKey: 'March', amount: 1000, paymentDate: '2026-03-05' },
  { id: 't-4', memberId: 'mm-1', monthKey: 'April', amount: 1000, paymentDate: '2026-04-06' },
  { id: 't-5', memberId: 'mm-1', monthKey: 'May', amount: 1000, paymentDate: '2026-05-10' },
  { id: 't-6', memberId: 'mm-1', monthKey: 'June', amount: 1000, paymentDate: '2026-06-02' },
  { id: 't-7', memberId: 'mm-1', monthKey: 'khatm', amount: 3000, paymentDate: '2026-04-12' }, // Khatm-ul-Quran extra sum

  // mm-2 (Ghafoor) - fully paid Gregorian year
  { id: 't-10', memberId: 'mm-2', monthKey: 'January', amount: 2000, paymentDate: '2026-01-02' },
  { id: 't-11', memberId: 'mm-2', monthKey: 'February', amount: 2000, paymentDate: '2026-02-02' },
  { id: 't-12', memberId: 'mm-2', monthKey: 'March', amount: 2000, paymentDate: '2026-03-03' },
  { id: 't-13', memberId: 'mm-2', monthKey: 'April', amount: 2000, paymentDate: '2026-04-01' },
  { id: 't-14', memberId: 'mm-2', monthKey: 'May', amount: 2000, paymentDate: '2026-05-02' },
  { id: 't-15', memberId: 'mm-2', monthKey: 'June', amount: 2000, paymentDate: '2026-06-05' },
  { id: 't-16', memberId: 'mm-2', monthKey: 'July', amount: 2000, paymentDate: '2026-06-15' },
  { id: 't-17', memberId: 'mm-2', monthKey: 'August', amount: 2000, paymentDate: '2026-06-15' },
  { id: 't-18', memberId: 'mm-2', monthKey: 'September', amount: 2000, paymentDate: '2026-06-15' },
  { id: 't-19', memberId: 'mm-2', monthKey: 'October', amount: 2000, paymentDate: '2026-06-15' },
  { id: 't-20', memberId: 'mm-2', monthKey: 'November', amount: 2000, paymentDate: '2026-06-15' },
  { id: 't-21', memberId: 'mm-2', monthKey: 'December', amount: 2000, paymentDate: '2026-06-15' },

  // mm-3 (Tanveer) - underpaid, pending previous year remaining
  { id: 't-30', memberId: 'mm-3', monthKey: 'January', amount: 1000, paymentDate: '2026-01-12' },
  { id: 't-31', memberId: 'mm-3', monthKey: 'February', amount: 1000, paymentDate: '2026-02-15' },
  // March to June missing (Defaulter / Behind track)

  // mm-5 (Sajid) - on track, generous
  { id: 't-40', memberId: 'mm-5', monthKey: 'January', amount: 3000, paymentDate: '2026-01-08' },
  { id: 't-41', memberId: 'mm-5', monthKey: 'February', amount: 3000, paymentDate: '2026-02-10' },
  { id: 't-42', memberId: 'mm-5', monthKey: 'March', amount: 3000, paymentDate: '2026-03-08' },
  { id: 't-43', memberId: 'mm-5', monthKey: 'April', amount: 3000, paymentDate: '2026-04-12' },
  { id: 't-44', memberId: 'mm-5', monthKey: 'May', amount: 3000, paymentDate: '2026-05-15' },
  { id: 't-45', memberId: 'mm-5', monthKey: 'June', amount: 3000, paymentDate: '2026-06-10' }
];

// Seed Other Fund Entries (Masjid Fund)
export const INITIAL_MASJID_OTHERS: OtherFundEntry[] = [
  { id: 'mo-1', fundId: 'masjid-fund', date: '2026-06-01', source: 'Friday Collection Gate A', amount: 18500, details: 'Jummah tul wida namaz general fundraising baskets.' },
  { id: 'mo-2', fundId: 'masjid-fund', date: '2026-06-05', source: 'Anonymus / Ghun-Naam Shakhs', amount: 50000, details: 'Naa-malum khair-khwah ki taraf se ac cooling fans ke liye.' },
  { id: 'mo-3', fundId: 'masjid-fund', date: '2026-05-20', source: 'Eid-ul-Fitr Sadqah box', amount: 44000, details: 'Muster box near main library entrance.' }
];

// Seed Expenses (Masjid Fund)
export const INITIAL_MASJID_EXPENSES: Expense[] = [
  { id: 'me-1', fundId: 'masjid-fund', name: 'Imam & Khatib Hadiya', amount: 35000, date: '2026-06-01', details: 'Monthly payment for khutab and markazi lead.' },
  { id: 'me-2', fundId: 'masjid-fund', name: 'Electricity Bill', amount: 28000, date: '2026-06-03', details: 'Wapda electricity dues for May air conditioning.' },
  { id: 'me-3', fundId: 'masjid-fund', name: 'Water Pump Repairing', amount: 6500, date: '2026-05-18', details: 'Internal valve and wiring repair of underground motor.' }
];

// BAZM-E-RAZA SEED DATA
export const INITIAL_BAZM_MEMBERS: FundMember[] = [
  { id: 'bm-1', fundId: 'bazm-fund', name: 'Syed Ali Shah Al-Hussaini', phone: '0302-7771234', requiredAmount: 6000, remainingPrevious: 1000, paidPrevious: 1000 },
  { id: 'bm-2', fundId: 'bazm-fund', name: 'Kamran Raza Qadri', phone: '0313-9993322', requiredAmount: 12000, remainingPrevious: 0, paidPrevious: 0 },
  { id: 'bm-3', fundId: 'bazm-fund', name: 'Mohammad Naeem Siddiqui', phone: '0331-4445566', requiredAmount: 6000, remainingPrevious: 2000, paidPrevious: 2000 }
];

export const INITIAL_BAZM_TRANSACTIONS: FundMemberTransaction[] = [
  { id: 'bt-1', memberId: 'bm-1', monthKey: 'Rabi-ul-Awwal', amount: 1000, paymentDate: '2026-03-24' },
  { id: 'bt-2', memberId: 'bm-1', monthKey: 'Rabi-us-Sani', amount: 1000, paymentDate: '2026-04-20' },
  { id: 'bt-3', memberId: 'bm-2', monthKey: 'Rabi-ul-Awwal', amount: 2000, paymentDate: '2026-03-22' },
  { id: 'bt-4', memberId: 'bm-2', monthKey: 'Rabi-us-Sani', amount: 2000, paymentDate: '2026-04-18' },
  { id: 'bt-5', memberId: 'bm-2', monthKey: 'Jamadi-ul-Awwal', amount: 2000, paymentDate: '2026-05-15' }
];

export const INITIAL_BAZM_OTHERS: OtherFundEntry[] = [
  { id: 'bo-1', fundId: 'bazm-fund', date: '2026-06-02', source: 'Mefil-e-Naat Mehman Box', amount: 12500, details: 'Bazm-e-Raza monthly Giyarwi shareef gather.' }
];

export const INITIAL_BAZM_EXPENSES: Expense[] = [
  { id: 'be-1', fundId: 'bazm-fund', name: 'Sound System Service', amount: 3500, date: '2026-06-03', details: 'Repair of wireless microphones for Naat Khwani.' }
];

// PROJECTS SEED DATA
export const INITIAL_PROJECT_RECORD: Project = {
  id: 'project-solar',
  fundModuleId: 'project-solar',
  name: 'Solar Panel Project Phase 2',
  shortDescription: 'Masjid Al Habib Noorani ko fully sustainable green energy grid par shift karna.',
  fullDescription: 'Is project ke tehet masjid ki chat par mazeed 30kW solar panel panels aur lithium metal batteries lagayee jayengi taake Loadshedding ke dauran poora cooling system aur filters bina kisi interruption ke chal saken. Tamam muazzaz ehbab aur contributors se pur-khaloos guzarish hai ke is ahmiat ke hamil kaam mein hissa lain.',
  targetAmount: 350000,
  status: 'active',
  startDate: '2026-05-01',
  endDate: '2026-10-31',
  featuredImage: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=80',
  visibility: 'public',
  dynamicMonths: ['Phase 1 Setup', 'Phase 2 Battery', 'Phase 3 Commissioning'],
  gallery: [
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548613053-220bfb8015fe?w=600&auto=format&fit=crop&q=80'
  ]
};

export const INITIAL_PROJECT_MEMBERS: FundMember[] = [
  { id: 'pm-1', fundId: 'project-solar', name: 'Al-Haj Sheikh Farhan', phone: '0300-8881122', requiredAmount: 150000, remainingPrevious: 0, paidPrevious: 0 },
  { id: 'pm-2', fundId: 'project-solar', name: 'Engr. Waqas Mahmood', phone: '0344-9005511', requiredAmount: 90000, remainingPrevious: 0, paidPrevious: 0 }
];

export const INITIAL_PROJECT_TRANSACTIONS: FundMemberTransaction[] = [
  { id: 'pt-1', memberId: 'pm-1', monthKey: 'Phase 1 Setup', amount: 50000, paymentDate: '2026-05-05' },
  { id: 'pt-2', memberId: 'pm-1', monthKey: 'Phase 2 Battery', amount: 50000, paymentDate: '2026-06-01' },
  { id: 'pt-3', memberId: 'pm-2', monthKey: 'Phase 1 Setup', amount: 30000, paymentDate: '2026-05-15' }
];

export const INITIAL_PROJECT_OTHERS: OtherFundEntry[] = [
  { id: 'po-1', fundId: 'project-solar', date: '2026-06-04', source: 'Engr Ghaasib Al-Wahid', amount: 45000, details: 'Direct project check funding.' }
];

export const INITIAL_PROJECT_EXPENSES: Expense[] = [
  { id: 'pe-1', fundId: 'project-solar', name: 'Inverter Purchase 15kW', amount: 110000, date: '2026-05-20', details: 'Dual phase hybrid solar controller.' }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'l-1', adminId: 'super-admin', action: 'ADD', module: 'System Settings', recordId: '1', oldValue: '', newValue: '{"message": "Masjid Al Habib Noorani portal initialized"}', ipAddress: '127.0.0.1', timestamp: '2026-06-15T00:12:19-07:00' }
];

export const INITIAL_COMMITMENTS: Commitment[] = [
  { id: 'c-1', fundId: 'masjid-fund', name: 'Chaudhary Nisar Ali', phone: '0300-5551122', amountDue: 25000, notes: 'Masjid floor carpet contribution remaining.', createdAt: '2026-06-15' },
  { id: 'c-2', fundId: 'masjid-fund', name: 'Malik Muhammad Sajid', phone: '0321-4448899', amountDue: 15000, notes: 'Main gate grill commitment.', createdAt: '2026-06-16' },
  { id: 'c-3', fundId: 'bazm-fund', name: 'Zafar Iqbal Naati', phone: '0333-5152535', amountDue: 8000, notes: 'Milad sound system sponsor commitment remaining.', createdAt: '2026-06-17' },
  { id: 'c-4', fundId: 'project-solar', name: 'Dr. Tariq Mahmood', phone: '0300-9876543', amountDue: 50000, notes: 'Inverter contribution commitment.', createdAt: '2026-06-18' }
];

export const DEFAULT_NOTICE_TEMPLATE = `السلام علیکم ورحمۃ اللہ وبرکاتہ!
محترم <strong style="font-size: 1.3em; color: #047857;">[NAME]</strong> صاحب،

<div style="font-size: 1.1em; background: #f0fdf4; padding: 15px; border-radius: 8px; border-right: 4px solid #047857; margin: 20px 0;">
  [NOTE]
</div>

آپ کے ذمے [FUND_NAME] کی مد میں **[AMOUNT] روپے** بقایا ہیں۔
آپ سے گزارش ہے کہ یہ بقایا رقم جلد از جلد مسجد انتظامیہ یا امین صاحب کو جمع کروائیں تا کہ امور بغیر کسی رکاوٹ کے جاری رہ سکیں۔ اللہ تعالیٰ آپ کے مال میں برکت عطا فرمائے۔ آمین!

فون نمبر ریکارڈ: [PHONE]

منجانب: انتظامیہ کمیٹی، مسجد ال-حبیب نورانی، واہ کینٹ`;


// LocalStorage Database Driver Wrapper
export class PortalDatabase {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(`masjid_habib_${key}`);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch (e) {
      // Fail silent
    }
    this.set(key, defaultValue);
    return defaultValue;
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`masjid_habib_${key}`, JSON.stringify(value));
      // Background async backup to Firestore
      saveToCloud(key, value).catch(e => console.error('Cloud backup error:', e));
    } catch (e) {
      // Fail silent
    }
  }

  // Load fully resolved database state
  static init(force: boolean = false): void {
    try {
      const passwordsStored = localStorage.getItem('masjid_habib_passwords');
      const isCleanOrEmpty = !passwordsStored || passwordsStored === '[]' || JSON.parse(passwordsStored ?? '[]').length === 0;
      
      if (force || isCleanOrEmpty) {
        this.set('passwords', INITIAL_PASSWORDS);
        this.set('prayer_timings', INITIAL_PRAYER_TIMINGS);
        this.set('history_sections', INITIAL_HISTORY);
        this.set('activities', INITIAL_ACTIVITIES);
        this.set('map_settings', INITIAL_MAP);
        this.set('announcements', INITIAL_ANNOUNCEMENTS);
        this.set('administrators', INITIAL_ADMINISTRATORS);
        this.set('religious_staff', INITIAL_RELIGIOUS_STAFF);
        this.set('funds', INITIAL_FUNDS);
        this.set('members', [...INITIAL_MASJID_MEMBERS, ...INITIAL_BAZM_MEMBERS, ...INITIAL_PROJECT_MEMBERS]);
        this.set('transactions', [...INITIAL_MASJID_TRANSACTIONS, ...INITIAL_BAZM_TRANSACTIONS, ...INITIAL_PROJECT_TRANSACTIONS]);
        this.set('other_fund_entries', [...INITIAL_MASJID_OTHERS, ...INITIAL_BAZM_OTHERS, ...INITIAL_PROJECT_OTHERS]);
        this.set('expenses', [...INITIAL_MASJID_EXPENSES, ...INITIAL_BAZM_EXPENSES, ...INITIAL_PROJECT_EXPENSES]);
        this.set('projects', [INITIAL_PROJECT_RECORD]);
        this.set('audit_logs', INITIAL_AUDIT_LOGS);
        this.set('commitments', INITIAL_COMMITMENTS);
        this.set('notice_template', DEFAULT_NOTICE_TEMPLATE);
      } else {
        // Fallback for existing browser sessions that don't have religious_staff yet
        if (!localStorage.getItem('masjid_habib_religious_staff')) {
          this.set('religious_staff', INITIAL_RELIGIOUS_STAFF);
        }
      }
    } catch (e) {
      // Fail silent
    }
  }

  static resetToDefault(): void {
    localStorage.removeItem('masjid_habib_passwords');
    this.init(true);
    window.location.reload();
  }
}

// Auto-initialize immediately on module file import to prevent raw state initialization gaps
PortalDatabase.init();

