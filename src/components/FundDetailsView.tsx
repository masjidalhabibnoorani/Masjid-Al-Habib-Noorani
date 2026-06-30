/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FundModule, FundMember, FundMemberTransaction, OtherFundEntry, Expense, 
  ProtectedPagePassword, Project, Administrator, AuditLog, resolveImageUrl, Commitment
} from '../types';
import { GREGORIAN_MONTHS, ISLAMIC_MONTHS, PortalDatabase } from '../data';
import TiltCard from './TiltCard';
import Counter from './Counter';
import MagneticButton from './MagneticButton';
import { useToast } from './Toast';
// Removed ShopRentsLedger, ZakatLedger, and BazmCustomEventRegistry
import { 
  Lock, Calendar, Users, DollarSign, ArrowLeft, Download, Printer, 
  Search, ShieldAlert, Plus, Edit, Trash, ChevronRight, User, Phone, CheckCircle, Info,
  Check, PlusCircle, Trash2, Edit2, Save, UserPlus, X, Building2, HeartHandshake, Award
} from 'lucide-react';

interface FundDetailsViewProps {
  fund: FundModule;
  project?: Project;
  onBack: () => void;
  // Shared database states from root parent
  members: FundMember[];
  transactions: FundMemberTransaction[];
  others: OtherFundEntry[];
  expenses: Expense[];
  passwords: ProtectedPagePassword[];
  admins: Administrator[];
  commitments: any[]; // will import Commitment from types
  // Mutators to log back to parent state
  setMembers: React.Dispatch<React.SetStateAction<FundMember[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<FundMemberTransaction[]>>;
  setOthers: React.Dispatch<React.SetStateAction<OtherFundEntry[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setCommitments: React.Dispatch<React.SetStateAction<any[]>>;
  logAudit: (action: AuditLog['action'], module: string, recordId: string, oldValue: any, newValue: any) => void;
  isAdminView?: boolean;
}

type TabType = 'landing' | 'overview' | 'portfolio' | 'fixed' | 'other' | 'expenses' | 'commitments';

interface OtherRegisterProps {
  fund: FundModule;
  others: OtherFundEntry[];
  monthsList: string[];
  setOthers: React.Dispatch<React.SetStateAction<OtherFundEntry[]>>;
  logAudit: (action: AuditLog['action'], module: string, recordId: string, oldValue: any, newValue: any) => void;
  isFundAdminUnlocked?: boolean;
}

// ----------------------------------------------------
// SECTION: OTHER FUND ACHIEVED
// ----------------------------------------------------

export default function FundDetailsView({
  fund,
  project,
  onBack,
  members,
  transactions,
  others,
  expenses,
  passwords,
  admins,
  commitments,
  setMembers,
  setTransactions,
  setOthers,
  setExpenses,
  setCommitments,
  logAudit,
  isAdminView = false,
}: FundDetailsViewProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('landing');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [portfolioMonthFilter, setPortfolioMonthFilter] = useState<number | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authorizedTabs, setAuthorizedTabs] = useState<Record<string, boolean>>({});
  const [pendingTabChange, setPendingTabChange] = useState<TabType | null>(null);

  // Administrative Financial Locking states - only true if we are explicitly viewing from Admin Room
  const [isFundAdminUnlocked, setIsFundAdminUnlocked] = useState(isAdminView);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [masterPassInput, setMasterPassInput] = useState('');
  const [masterError, setMasterError] = useState('');

  // Automatically authorize tabs and enable editor modes if starting in admin console view
  useEffect(() => {
    setIsFundAdminUnlocked(isAdminView);
    if (isAdminView) {
      setAuthorizedTabs({
        overview: true,
        portfolio: true,
        fixed: true,
        other: true,
        expenses: true,
        commitments: true
      });
    } else {
      setAuthorizedTabs({});
    }
  }, [isAdminView]);

  const [selectedReceipt, setSelectedReceipt] = useState<{
    id: string;
    memberName: string;
    memberPhone: string;
    monthKey: string;
    amount: number;
    paymentDate: string;
    fundName: string;
  } | null>(null);

  const handlePrintReceiptDirect = (receipt: {
    id: string;
    memberName: string;
    memberPhone: string;
    monthKey: string;
    amount: number;
    paymentDate: string;
    fundName: string;
  } | null) => {
    if (!receipt) return;
    const printWindow = window.open('', '_blank', 'width=800,height=850');
    if (!printWindow) {
      alert('Popup blockers active! Please allow popups to print receipt or use the dynamic 1-Click HTML download.');
      return;
    }
    
    const receiptHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt_Ref_${receipt.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;850&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: 'Inter', sans-serif;
      background: #ffffff;
      color: #000000;
      padding: 0;
      margin: 0;
      line-height: 1.4;
      font-size: 13px;
    }
    .receipt-box {
      background: #ffffff;
      border: 3px double #000000;
      border-radius: 8px;
      width: 100%;
      max-width: 600px;
      padding: 24px;
      margin: 20px auto;
      box-sizing: border-box;
    }
    .header {
      border-bottom: 2px solid #000000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .title-area h2 {
      margin: 0;
      font-size: 16px;
      font-weight: 850;
      text-transform: uppercase;
      color: #000000;
    }
    .title-area p {
      margin: 2px 0 0 0;
      font-size: 10px;
      color: #000000;
      font-weight: bold;
    }
    .title-area .sub {
      font-size: 9px;
      color: #374151;
      margin-top: 1px;
    }
    .ref-box {
      text-align: right;
    }
    .date-str {
      font-size: 9px;
      color: #000000;
      font-weight: bold;
      display: block;
      font-family: 'JetBrains Mono', monospace;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }
    .card {
      background: #f3f4f6;
      border: 1px solid #000000;
      padding: 12px;
      border-radius: 6px;
    }
    .card-header {
      font-size: 8px;
      color: #000000;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }
    .card-title {
      font-size: 12px;
      font-weight: 700;
      color: #000000;
    }
    .card-desc {
      font-size: 9px;
      color: #374151;
      margin-top: 3px;
    }
    .amount-box {
      background: #f3f4f6;
      border: 2px solid #000000;
      padding: 16px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 20px;
    }
    .amount-title {
      font-size: 9px;
      color: #000000;
      text-transform: uppercase;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .amount-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 26px;
      font-weight: 900;
      color: #000000;
    }
    .amount-words {
      font-size: 9px;
      font-style: italic;
      color: #000000;
      margin-top: 6px;
      background: #ffffff;
      padding: 3px 8px;
      border-radius: 4px;
      display: inline-block;
      border: 1px solid #000000;
      font-weight: bold;
    }
    .barcode-area {
      background: #ffffff;
      border: 1px dashed #000000;
      padding: 10px 14px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .footer {
      border-top: 1px dashed #000000;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .legal {
      font-size: 8.5px;
      color: #000000;
    }
    .seal {
      border: 2px solid #000000;
      color: #000000;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9px;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.5px;
      display: inline-block;
      background: #ffffff;
    }
    @media print {
      body {
        background: #ffffff;
        padding: 0;
      }
      .receipt-box {
        border-color: #000000;
        box-shadow: none;
        margin: 0 auto;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <div style="display: flex; align-items: center;">
        <div class="title-area">
          <h2>Masjid Al-Habib Noorani Community Trust</h2>
          <p>Wah Cantt, Punjab, Pakistan</p>
          <div class="sub">Official Audited Inflow Receipt • Tasdeeq Shuda Raseed</div>
        </div>
      </div>
      <div class="ref-box">
        <span class="date-str">Date: ${receipt.paymentDate}</span>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <div class="card-header">Received From (Mausool Kuninda)</div>
        <div class="card-title">${receipt.memberName}</div>
        <div class="card-desc">Phone: ${receipt.memberPhone || '-'}</div>
      </div>
      
      <div class="card">
        <div class="card-header">Fund Allocation (Khata)</div>
        <div class="card-title">${receipt.fundName}</div>
        <div class="card-desc">Purpose: <strong>${receipt.monthKey}</strong></div>
      </div>
    </div>
    
    <div class="amount-box">
      <div class="amount-title">Total Cash Received (Mausool Shuda Raqam)</div>
      <div class="amount-val">${receipt.amount.toLocaleString()} Rs</div>
      <div class="amount-words">Words: ${NumberToWords(receipt.amount)} Rupees Only</div>
    </div>
    
    <div class="footer">
      <div class="legal">
        <div style="font-weight: 800; color: #000000; margin-bottom: 2px;">✓ Digitally Authenticated Ledger</div>
        <span style="color: #374151; font-size: 7.5px;">Generated: ${new Date().toISOString().substring(0, 16).replace('T', ' ')}</span>
      </div>
      <div style="display: flex; gap: 12px; align-items: flex-end;">
        <div class="seal">VERIFIED</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    }
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleDownloadReceiptHtml = (receipt: {
    id: string;
    memberName: string;
    memberPhone: string;
    monthKey: string;
    amount: number;
    paymentDate: string;
    fundName: string;
  } | null) => {
    if (!receipt) return;
    const downloadDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt_Ref_${receipt.id}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;850&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background: #040e0b;
      background: radial-gradient(circle, #081d18 0%, #030807 100%);
      color: #f3f4f6;
      padding: 40px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      box-sizing: border-box;
    }
    .receipt-box {
      background: #091a16;
      border: 2px solid #10b981;
      border-radius: 24px;
      width: 100%;
      max-width: 580px;
      padding: 36px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.5);
      position: relative;
      box-sizing: border-box;
      overflow: hidden;
    }
    .watermark {
      position: absolute;
      inset: 0;
      opacity: 0.03;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 0;
    }
    .watermark svg {
      width: 400px;
      height: 400px;
    }
    .header {
      border-bottom: 2px solid rgba(16, 185, 129, 0.3);
      padding-bottom: 20px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 10;
    }
    .logo {
      font-size: 36px;
      margin-right: 16px;
    }
    .title-area h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 850;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      color: #059669;
    }
    .title-area p {
      margin: 4px 0 0 0;
      font-size: 10.5px;
      color: #34d399;
      font-family: 'JetBrains Mono', monospace;
    }
    .title-area .sub {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 2px;
    }
    .ref-box {
      text-align: right;
    }
    .ref-name {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid #10b981;
      padding: 8px 14px;
      border-radius: 10px;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700;
      font-size: 12px;
      color: #34d399;
      letter-spacing: 0.5px;
    }
    .date-str {
      font-size: 10px;
      color: #9cb3af;
      margin-top: 8px;
      display: block;
      font-family: 'JetBrains Mono', monospace;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin-bottom: 28px;
      position: relative;
      z-index: 10;
    }
    @media (min-width: 480px) {
      .grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .card {
      background: rgba(4, 14, 11, 0.6);
      border: 1px solid rgba(16, 185, 129, 0.2);
      padding: 18px;
      border-radius: 16px;
    }
    .card-header {
      font-size: 9px;
      color: #34d399;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #f3f4f6;
    }
    .card-desc {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 6px;
      font-family: 'JetBrains Mono', monospace;
    }
    .amount-box {
      background: linear-gradient(135deg, rgba(6, 95, 70, 0.3) 0%, rgba(4, 120, 87, 0.1) 100%);
      border: 2px solid #10b981;
      padding: 24px;
      border-radius: 16px;
      text-align: center;
      margin-bottom: 28px;
      position: relative;
      z-index: 10;
    }
    .amount-title {
      font-size: 9.5px;
      color: #34d399;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .amount-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 32px;
      font-weight: 850;
      color: #10b981;
      text-shadow: 0 0 10px rgba(16, 185, 129, 0.2);
    }
    .amount-words {
      font-size: 10px;
      color: #caf1db;
      margin-top: 12px;
      background: rgba(4, 14, 11, 0.8);
      padding: 6px 14px;
      border-radius: 8px;
      display: inline-block;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .barcode-area {
      background: rgba(4, 14, 11, 0.5);
      border: 1px dashed rgba(16, 185, 129, 0.3);
      padding: 14px 18px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 28px;
      position: relative;
      z-index: 10;
    }
    .hash-val {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9px;
      color: #9ca3af;
    }
    .barcode {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #34d399;
      letter-spacing: -1.2px;
      opacity: 0.8;
    }
    .footer {
      border-top: 1px dashed rgba(16, 185, 129, 0.25);
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
      z-index: 10;
    }
    .legal {
      font-size: 10px;
      color: #9cb3af;
    }
    .seal {
      border: 2px solid #059669;
      color: #34d399;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 10.5px;
      text-transform: uppercase;
      font-weight: 700;
      letter-spacing: 1.5px;
      transform: rotate(-4deg);
      display: inline-block;
      background: rgba(5, 150, 105, 0.1);
    }
    .sig-box {
      text-align: center;
      width: 150px;
      border-top: 1px solid rgba(255,255,255,0.25);
      padding-top: 8px;
      font-size: 9px;
      color: #9ca3af;
    }
    .btn-row {
      margin-top: 24px;
      display: flex;
      justify-content: center;
      gap: 12px;
    }
    .btn {
      background: #059669;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 700;
      text-decoration: none;
      text-transform: uppercase;
    }
    .btn-secondary {
      background: transparent;
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
    }
    @media print {
      body {
        background: white !important;
        color: black !important;
        padding: 0;
      }
      .receipt-box {
        box-shadow: none !important;
        border: 2px solid #000 !important;
        background: white !important;
      }
      .btn-row {
        display: none !important;
      }
      .amount-box {
        background: #f3f4f6 !important;
        border-color: #000 !important;
      }
      .amount-val, .ref-name, .logo, .title-area h2 {
        color: #000 !important;
      }
      .card {
        background: #fff !important;
        border-color: #ccc !important;
      }
      .card-title, .amount-words {
        color: #000 !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="watermark">
      <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 4.25c1.52.01 2.75 1.24 2.75 2.75 0 1.95-2.75 5.25-2.75 5.25S9.25 10.95 9.25 9c0-1.51 1.23-2.74 2.75-2.75z"/></svg>
    </div>
    
    <div class="header">
      <div style="display: flex; align-items: center;">
        <div class="title-area">
          <h2>Masjid Al-Habib Noorani Community Trust</h2>
          <p>Wah Cantt, Punjab, Pakistan</p>
          <div class="sub">Official Audited Inflow Receipt • Tasdeeq Shuda Raseed</div>
        </div>
      </div>
      <div class="ref-box">
        <span class="date-str">Date: ${receipt.paymentDate}</span>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <div class="card-header">Received From (Mausool Kuninda)</div>
        <div class="card-title">${receipt.memberName}</div>
        <div class="card-desc">Phone: ${receipt.memberPhone || '-'}</div>
      </div>
      
      <div class="card">
        <div class="card-header">Fund Allocation (Khata)</div>
        <div class="card-title">${receipt.fundName}</div>
        <div class="card-desc">Purpose: <strong>${receipt.monthKey}</strong></div>
      </div>
    </div>
    
    <div class="amount-box">
      <div class="amount-title">Total Cash Received (Mausool Shuda Raqam)</div>
      <div class="amount-val">${receipt.amount.toLocaleString()} Rs</div>
      <div class="amount-words">Words: ${NumberToWords(receipt.amount)} Rupees Only</div>
    </div>
    
    <div class="barcode-area">
    </div>
    
    <div class="footer">
      <div class="legal">
        <div style="font-weight: 700; color: #34d399; margin-bottom: 2px;">✓ Digitally Authenticated Ledger</div>
        <span style="color: #9cb3af; font-size: 8px;">Generated: ${new Date().toISOString().substring(0, 16).replace('T', ' ')}</span>
      </div>
      <div style="display: flex; gap: 16px; align-items: flex-end;">
        <div class="seal">VERIFIED</div>
      </div>
    </div>

    <div class="btn-row">
      <button class="btn" onclick="window.print()">Print This Receipt</button>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([downloadDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = url;
    tempLink.download = `Voucher_Receipt_AHNT.html`;
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
    URL.revokeObjectURL(url);
  };

  // Filter lists based on the specific fund module
  const currentMembers = members.filter(m => m.fundId === fund.id);
  const currentOthers = others.filter(o => o.fundId === fund.id);
  const currentExpenses = expenses.filter(e => e.fundId === fund.id);
  const currentAdmins = admins.filter(a => a.moduleType === fund.type && (fund.type !== 'project' || a.moduleId === project?.id));

  // Determine which months apply to the current fund
  const getMonths = (): string[] => {
    if (fund.type === 'masjid') return GREGORIAN_MONTHS;
    if (fund.type === 'bazm') return ISLAMIC_MONTHS;
    if (fund.type === 'project' && project) return project.dynamicMonths;
    return [];
  };

  const monthsList = getMonths();

  // Master Admin verification handler - ONLY applicable if under Admin Mode
  const handleVerifyMasterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminView) {
      setMasterError('Ghalat Iqdam! Is public area me tabdeeli restricted hai.');
      return;
    }
    const matchedMasterObj = passwords.find(p => p.id === 'admin_dashboard');
    const correctMaster = matchedMasterObj ? matchedMasterObj.passwordValue : 'habib786';

    if (masterPassInput === correctMaster || masterPassInput === 'habib786') {
      setIsFundAdminUnlocked(true);
      setAuthorizedTabs({
        overview: true,
        portfolio: true,
        fixed: true,
        other: true,
        expenses: true,
        commitments: true
      });
      setMasterPassInput('');
      setMasterError('');
      setShowVerificationModal(false);
      logAudit('EDIT', 'Fund Ledger Unlock', fund.name, 'Locked', 'Unlocked As Admin');
    } else {
      setMasterError('Aap ne password ghalat enter kiya hai dubara koshish karen, agar aap administration me se hain. Agar nahi to aap ke liye ye data nahi hai.');
    }
  };

  // Password verification schema handler
  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingTabChange) return;

    // Resolve specific password code required
    let passwordKey = `${fund.type}_${pendingTabChange}`;
    if (fund.type === 'project' && project) {
      passwordKey = `project_${project.id}_${pendingTabChange}`;
    }

    const matchedPasswordObj = passwords.find(p => p.id === passwordKey);
    const correctPassword = matchedPasswordObj ? matchedPasswordObj.passwordValue : 'habib786';

    const matchedMasterObj = passwords.find(p => p.id === 'admin_dashboard');
    const correctMaster = matchedMasterObj ? matchedMasterObj.passwordValue : 'habib786';

    // In administrative view, full edit rights are allocated.
    // In public panels, password authentication only grants READ access to the requested tab momentarily.
    // It NEVER prompts or triggers isFundAdminUnlocked to be true, preventing any edits inside public pages!
    if (passwordInput === correctPassword || passwordInput === correctMaster || passwordInput === 'habib786') {
      setAuthorizedTabs(prev => ({ ...prev, [pendingTabChange]: true }));
      setActiveTab(pendingTabChange);
      setPasswordInput('');
      setAuthError('');
      setPendingTabChange(null);
    } else {
      setAuthError('Aap ne password ghalat enter kiya hai dubara koshish karen, agar aap administration me se hain. Agar nahi to aap ke liye ye data nahi hai.');
    }
  };

  const requestTabChange = (tab: TabType) => {
    if (tab === 'landing' || tab === 'overview' || authorizedTabs[tab]) {
      setActiveTab(tab);
      setPendingTabChange(null);
    } else {
      setPendingTabChange(tab);
      setPasswordInput('');
      setAuthError('');
    }
  };

  const getPortfolioFixedSum = () => {
    let total = 0;
    currentMembers.forEach(m => {
      const mTrans = transactions.filter(t => t.memberId === m.id);
      mTrans.forEach(t => {
        if (t.monthKey !== 'khatm') {
          if (portfolioMonthFilter !== null) {
            const fundMonths = getMonths();
            if (t.monthKey === fundMonths[portfolioMonthFilter]) {
              total += t.amount;
            }
          } else {
            total += t.amount;
          }
        }
      });
    });
    return total;
  };

  const getPortfolioShopRentSum = () => {
    if (fund.type !== 'masjid') return 0;
    const shops = PortalDatabase.get<any[]>('shops', []);
    let total = 0;
    shops.forEach(s => {
      if (!s.isRented) return;
      monthsList.forEach((m, idx) => {
        if (portfolioMonthFilter !== null && portfolioMonthFilter !== idx) return;
        const pay = s.payments?.[m];
        if (pay?.isPaid) {
          total += pay.amountPaid || 0;
        }
      });
    });
    return total;
  };

  const getShopRentSum = () => {
    if (fund.type !== 'masjid') return 0;
    const shops = PortalDatabase.get<any[]>('shops', []);
    let total = 0;
    shops.forEach(s => {
      if (!s.isRented) return;
      monthsList.forEach(m => {
        const pay = s.payments?.[m];
        if (pay?.isPaid) {
          total += pay.amountPaid || 0;
        }
      });
    });
    return total;
  };

  const getPortfolioOtherSum = () => currentOthers.filter(o => {
     if (portfolioMonthFilter === null) return true;
     try { return new Date(o.date).getMonth() === portfolioMonthFilter; } catch { return false; }
  }).reduce((sum, o) => sum + o.amount, 0);

  const getPortfolioExpensesSum = () => currentExpenses.filter(e => {
     if (portfolioMonthFilter === null) return true;
     try { return new Date(e.date).getMonth() === portfolioMonthFilter; } catch { return false; }
  }).reduce((sum, e) => sum + e.amount, 0);

  const getPortfolioSumTotalAchieved = () => getPortfolioFixedSum() + getPortfolioOtherSum() + getPortfolioShopRentSum();
  const getPortfolioNetBalance = () => getPortfolioSumTotalAchieved() - getPortfolioExpensesSum();

  // Math Auto Calculations Engine
  const getFixedSum = () => {
    let total = 0;
    currentMembers.forEach(m => {
      const mTrans = transactions.filter(t => t.memberId === m.id);
      mTrans.forEach(t => {
        // Exclude custom Khatm entries or specify complete monthly sums
        if (t.monthKey !== 'khatm') {
          total += t.amount;
        }
      });
    });
    return total;
  };

  const getOtherSum = () => currentOthers.reduce((sum, o) => sum + o.amount, 0);
  const getExpensesSum = () => currentExpenses.reduce((sum, e) => sum + e.amount, 0);
  const getSumTotalAchieved = () => getFixedSum() + getOtherSum() + getShopRentSum();
  const getNetBalance = () => getSumTotalAchieved() - getExpensesSum();

  return (
    <div className="min-h-screen bg-pine-bg text-pine-text-body py-12 px-4 md:px-8 select-none relative z-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation title row - Dynamic Back actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 border-b border-pine-border pb-6">
          {activeTab === 'landing' ? (
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-button uppercase tracking-wider text-pine-text-muted hover:text-white transition-colors duration-200"
              id="btn_fund_exit"
            >
              <ArrowLeft className="w-4 h-4" /> Gateway Page
            </button>
          ) : (
            <button 
              onClick={() => {
                setActiveTab('landing');
                if (!isAdminView) {
                  setAuthorizedTabs({});
                }
              }}
              className="flex items-center gap-2 text-xs font-button uppercase tracking-wider text-pine-btn-hover hover:text-white transition-colors duration-205"
              id="btn_fund_return"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Fund Dashboard
            </button>
          )}
          <div className="text-right">
            <span className="text-xs font-button uppercase tracking-wider bg-pine-active px-2.5 py-1 rounded text-pine-text-heading">
              {fund.name} Fund Portal
            </span>
          </div>
        </div>

        {/* Dynamic header summary banner if project is loaded */}
        {fund.type === 'project' && project && (
          <div className="mb-8 glass-panel rounded-2xl p-6 border-l-4 border-pine-btn">
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-pine-text-heading mb-2">{project.name}</h1>
            <p className="text-sm text-pine-text-body mb-4">{project.shortDescription}</p>
            <div className="flex justify-between items-center text-xs font-sans text-pine-text-muted mt-2 border-t border-pine-border/30 pt-4">
              <span>Status: Active Development Campaign</span>
              <span>Auditing keys required for financial balance statements.</span>
            </div>
          </div>
        )}

        {/* Render password collection overlay if prompting for locked views */}
        {pendingTabChange && (
          <div className="max-w-md mx-auto my-12 glass-panel p-8 rounded-2xl border-pine-btn shadow-2xl relative z-40">
            <div className="text-center mb-6">
              <Lock className="w-12 h-12 text-pine-warning mx-auto mb-3 animate-bounce" />
              <h3 className="text-lg font-heading font-semibold text-white uppercase tracking-wider">Makhsoos Dastawez Password Protection</h3>
              <p className="text-xs text-pine-text-muted mt-1">Is makhsoos fund register ko dekhne ke liye makhsoos password darj karein.</p>
            </div>
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-button text-pine-text-body uppercase tracking-wider mb-1">Enter Secret Password</label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="******"
                  autoFocus
                  className="w-full bg-pine-bar/60 border border-pine-border rounded-lg py-2.5 px-3 uppercase font-mono text-center text-white placeholder-pine-text-muted/40 focus:outline-none focus:border-pine-btn"
                />
              </div>
              {authError && <p className="text-xs text-pine-error font-medium text-center">{authError}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingTabChange(null)}
                  className="w-1/2 py-2.5 rounded-lg border border-pine-border text-center text-xs font-button uppercase tracking-wider text-pine-text-body hover:bg-pine-hover/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-lg bg-pine-btn text-center text-xs font-button uppercase tracking-wider text-white hover:bg-pine-btn-hover"
                >
                  Unlock Page
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab Contents: Dynamic Dashboard Landing tab (Only summary cards + exactly 5 launching buttons) */}
        {!pendingTabChange && activeTab === 'landing' && (
          <div className="space-y-8 animate-fade-in font-sans">
            {/* Top Stat Summary Cards */}
            <div className="max-w-md mx-auto w-full">
              <div className="glass-panel p-5 rounded-2xl border border-pine-border flex flex-col justify-between text-center">
                <span className="text-[10px] text-pine-text-muted uppercase tracking-wider block mb-1 font-semibold">Core Contributors</span>
                {isFundAdminUnlocked ? (
                  <span className="text-2xl font-mono text-white font-bold block leading-tight">{currentMembers.length} Accounts</span>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 py-0.5">
                    <span className="text-lg font-mono tracking-widest text-pine-text-muted/70 font-extrabold select-none">••</span>
                    <Lock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                  </div>
                )}
                <span className="text-[10px] text-pine-text-muted/60 font-sans mt-1 block">Active registered donors in this directory</span>
              </div>
            </div>

            {/* Administrators restricted banner logic if locked */}
            {!isFundAdminUnlocked && (
              <div className="glass-panel p-6 rounded-2xl border border-pine-border bg-gradient-to-r from-pine-bar/95 via-pine-active/5 to-pine-bar flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-pine-btn/5 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-pine-btn/10 border border-pine-btn/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-pine-btn-hover animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-heading font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                       Mehfooz Shuda Financial Directory (Arakin-e-Committee Mode / Safe-View)
                    </h4>
                    <p className="text-xs text-pine-text-body mt-1 max-w-xl leading-relaxed select-text">
                      Is public area me registers or records ko tabdeel (edit) nahi kiya ja sakta. Kisi bhi draj shuda transaction ya cell value ko badalne ka ikhtiyar sirf Admin Room ke dastyab ledger management system me dastyab hai.
                    </p>
                  </div>
                </div>
                
                {isAdminView && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerificationModal(true);
                    }}
                    className="py-2.5 px-6 bg-gradient-to-r from-yellow-500 via-amber-600 to-amber-700 hover:from-yellow-450 hover:to-amber-600 text-black text-[11px] font-button uppercase tracking-wider font-extrabold rounded-xl shrink-0 flex items-center gap-2 shadow-xl hover:shadow-yellow-950/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" /> ADMINISTRATORS VERIFY
                  </button>
                )}
              </div>
            )}

            {/* Fully premium Master Administrators Verification modal */}
            {showVerificationModal && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-yellow-500/40 shadow-2xl relative">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-yellow-500/15 border border-yellow-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-heading font-extrabold text-white uppercase tracking-wider">Committee Admin Verify</h3>
                    <p className="text-xs text-pine-text-muted mt-1.5 leading-relaxed">
                      Financial details aur safe registers ko unlock karne ke liye apna makhsoos administrative passcode (e.g., Habib786) darj karein.
                    </p>
                  </div>
                  <form onSubmit={handleVerifyMasterPassword} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-button text-pine-text-body uppercase tracking-wider mb-1.5 font-bold">Committee Administrator Secret Code</label>
                      <input
                        type="password"
                        value={masterPassInput}
                        onChange={(e) => setMasterPassInput(e.target.value)}
                        placeholder="••••••"
                        autoFocus
                        className="w-full bg-pine-bar border border-pine-border rounded-lg py-2.5 px-3 uppercase font-mono text-center text-white focus:outline-none focus:border-pine-btn"
                      />
                    </div>
                    {masterError && <p className="text-xs text-pine-error font-medium text-center text-red-400">{masterError}</p>}
                    
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMasterPassInput('');
                          setMasterError('');
                          setShowVerificationModal(false);
                        }}
                        className="w-1/2 py-2.5 rounded-lg border border-pine-border text-center text-xs font-button uppercase tracking-wider text-pine-text-body hover:bg-pine-hover/10 cursor-pointer"
                      >
                        Bahar Niklein
                      </button>
                      <button
                        type="submit"
                        className="w-1/2 py-2.5 rounded-lg bg-pine-btn text-center text-xs font-button uppercase tracking-wider text-white hover:bg-pine-btn-hover font-bold cursor-pointer"
                      >
                        Verify & Unlock
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Folder Launcher Hub - EXACTLY 5 Premium Styled Buttons */}
            <div className="space-y-4 pt-4">
              <div className="border-b border-pine-border/40 pb-2">
                <h3 className="text-xs uppercase font-extrabold tracking-widest text-pine-text-heading">📋 Portal Exploration Selector Index</h3>
                <p className="text-[11px] text-pine-text-muted mt-0.5 font-sans">Access specific audited document pages directly below.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                {/* BUTTON 1 */}
                <button
                  onClick={() => requestTabChange('overview')}
                  className="glass-panel p-5 rounded-2xl hover:bg-pine-hover/10 cursor-pointer border border-pine-border hover:border-pine-btn text-left flex flex-col justify-between min-h-[160px] transition-all duration-300 animate-fade-in"
                  id="btn_tab_overview"
                >
                  <div className="flex justify-between items-start w-full mb-2">
                    <Info className="w-7 h-7 text-pine-btn-hover" />
                    <span className="bg-emerald-500/10 text-pine-btn-hover text-[8px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full">
                      Public Access
                    </span>
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-white text-xs tracking-wide">1. 👨‍💼 Committee & Administrators</h4>
                    <p className="text-[10px] text-pine-text-muted mt-1 leading-relaxed">Board of Trustees rosters and Islamic compliance statements.</p>
                  </div>
                </button>

                {/* BUTTON 2 */}
                <button
                  onClick={() => requestTabChange('portfolio')}
                  className="glass-panel p-5 rounded-2xl hover:bg-pine-hover/10 cursor-pointer border border-pine-border hover:border-pine-btn text-left flex flex-col justify-between min-h-[160px] transition-all duration-300"
                  id="btn_tab_portfolio"
                >
                  <div className="flex justify-between items-start w-full mb-2">
                    <DollarSign className="w-7 h-7 text-pine-btn-hover" />
                    {!(authorizedTabs['portfolio']) ? (
                      <Lock className="w-3.5 h-3.5 text-pine-warning" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-pine-success animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-white text-xs tracking-wide">2. 📊 Analytical Portfolio</h4>
                    <p className="text-[10px] text-pine-text-muted mt-1 leading-relaxed">Audited ratios, comparative category trend charts, and asset portfolios.</p>
                  </div>
                </button>

                {/* BUTTON 3 */}
                <button
                  onClick={() => requestTabChange('fixed')}
                  className="glass-panel p-5 rounded-2xl hover:bg-pine-hover/10 cursor-pointer border border-pine-border hover:border-pine-btn text-left flex flex-col justify-between min-h-[160px] transition-all duration-300"
                  id="btn_tab_fixed"
                >
                  <div className="flex justify-between items-start w-full mb-2">
                    <Calendar className="w-7 h-7 text-pine-btn-hover" />
                    {!(authorizedTabs['fixed']) ? (
                      <Lock className="w-3.5 h-3.5 text-pine-warning" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-pine-success" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-white text-xs tracking-wide">3. 📅 Monthly Fixed Register</h4>
                    <p className="text-[10px] text-pine-text-muted mt-1 leading-relaxed">Real-time spreadsheets and monthly member statements.</p>
                  </div>
                </button>

                {/* BUTTON 4 */}
                <button
                  onClick={() => requestTabChange('other')}
                  className="glass-panel p-5 rounded-2xl hover:bg-pine-hover/10 cursor-pointer border border-pine-border hover:border-pine-btn text-left flex flex-col justify-between min-h-[160px] transition-all duration-300"
                  id="btn_tab_other"
                >
                  <div className="flex justify-between items-start w-full mb-2">
                    <Users className="w-7 h-7 text-pine-btn-hover" />
                    {!(authorizedTabs['other']) ? (
                      <Lock className="w-3.5 h-3.5 text-pine-warning" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-pine-success" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-white text-xs tracking-wide">4. 📦 Other Donations</h4>
                    <p className="text-[10px] text-pine-text-muted mt-1 leading-relaxed">Handloose collections and second charity registries.</p>
                  </div>
                </button>

                {/* BUTTON 5 */}
                <button
                  onClick={() => requestTabChange('expenses')}
                  className="glass-panel p-5 rounded-2xl hover:bg-pine-hover/10 cursor-pointer border border-pine-border hover:border-pine-btn text-left flex flex-col justify-between min-h-[160px] transition-all duration-300"
                  id="btn_tab_expenses"
                >
                  <div className="flex justify-between items-start w-full mb-2">
                    <ShieldAlert className="w-7 h-7 text-pine-btn-hover" />
                    {!(authorizedTabs['expenses']) ? (
                      <Lock className="w-3.5 h-3.5 text-pine-warning" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-pine-success" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-white text-xs tracking-wide">5. 📉 Expense Outflows</h4>
                    <p className="text-[10px] text-pine-text-muted mt-1 leading-relaxed">Verified spending journals and invoices itemizations.</p>
                  </div>
                </button>

                {/* BUTTON 6: Commitments */}
                <button
                  onClick={() => requestTabChange('commitments')}
                  className="glass-panel p-5 rounded-2xl hover:bg-pine-hover/10 cursor-pointer border border-pine-border hover:border-pine-btn text-left flex flex-col justify-between min-h-[160px] transition-all duration-300"
                  id="btn_tab_commitments"
                >
                  <div className="flex justify-between items-start w-full mb-2">
                    <HeartHandshake className="w-7 h-7 text-pine-btn-hover" />
                    {!(authorizedTabs['commitments']) ? (
                      <Lock className="w-3.5 h-3.5 text-pine-warning" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-pine-success" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-heading font-extrabold text-white text-xs tracking-wide">6. 🤝 Commitments</h4>
                    <p className="text-[10px] text-pine-text-muted mt-1 leading-relaxed">Remaining amounts & pending contributions from members.</p>
                  </div>
                </button>

                {/* Shop Rents, Zakat, and Bazm Custom Event modules removed */}
              </div>
            </div>
          </div>
        )}

        {/* Tab Contents: Overview (Sharia Council & Trustees) */}
        {!pendingTabChange && activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in font-sans">
            <div className="glass-panel p-8 rounded-2xl border-l-4 border-pine-btn shadow-lg">
              <h3 className="text-xl font-heading font-bold text-pine-text-heading mb-3">Sharia Rules & Fund Statement</h3>
              <p className="text-sm text-pine-text-body leading-relaxed text-base">
                {fund.type === 'masjid' && "Masjid Fund ka istemal sirf aur sirf Masjid ke ikhrajat aur taraqqi ke liye kiya jata hai. Is fund ka istemal kisi dusri jagah nahi kiya jata. Ye sharia rulling key mutabiq ameen khazaanchi ki nigrani mein sarf hota hai."}
                {fund.type === 'bazm' && "Bazm-e-Raza Fund ka pura istemal milaad, mehfil-e-naat, deeni nashr-o-ishaat aur sunni libraries ke intezamat ke waqf fawaid ke liye kiya jata hai."}
                {fund.type === 'project' && project && project.fullDescription}
              </p>
            </div>

            {/* Detailed Project gallery (inside landing of Project) */}
            {fund.type === 'project' && project && project.gallery.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-heading font-semibold text-white">Project Work Gallery</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {project.gallery.map((url, i) => (
                    <div key={i} className="aspect-video rounded-xl overflow-hidden border border-pine-border group relative">
                      <img src={resolveImageUrl(url)} alt="Gallery item" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Committee Listing dynamic block */}
            <div className="space-y-6 pt-6 border-t border-pine-border/30">
              <div className="flex flex-col gap-1 font-sans">
                <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-pine-btn-hover" />
                  Intezamia Committee (Board of Trustees)
                </h3>
                <p className="text-xs text-pine-text-muted">Masjid Al Habib Noorani Wah Cantt structural organizing committee managing this ledger section.</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-pine-border/60">
                <table className="w-full text-left font-sans text-sm">
                  <thead className="bg-pine-bar/60 text-pine-text-muted text-xs uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Member Details</th>
                      <th className="py-3 px-4 font-semibold">Position</th>
                      <th className="py-3 px-4 font-semibold text-right">Contact / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pine-border/45 bg-pine-bg">
                    {currentAdmins.map((adm) => (
                      <tr key={adm.id} className="hover:bg-pine-hover/10 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex flex-col items-center gap-2">
                             <img 
                                src={resolveImageUrl(adm.image) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=240'} 
                                alt={adm.name} 
                                referrerPolicy="no-referrer" 
                                onClick={() => setSelectedImage(resolveImageUrl(adm.image) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=240')}
                                className="w-80 h-80 rounded-2xl object-cover shadow-lg border border-pine-btn/65 cursor-pointer hover:border-emerald-500 hover:opacity-95 transition-all duration-300 hover:scale-105" 
                              />
                               <h4 className="font-heading font-extrabold text-white text-lg">{adm.name}</h4>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-lg font-bold text-emerald-300 bg-emerald-900/40 px-2 py-1 rounded-md tracking-wide">{adm.position}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-base text-white font-mono font-bold">
                            <Phone className="w-4 h-4 text-emerald-400" /> {adm.phone || '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentAdmins.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-xs text-pine-text-muted font-sans border-t border-dashed border-pine-border/60">
                          No registered committee administrators found for this ledger.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Contents: Portfolio */}
        {!pendingTabChange && activeTab === 'portfolio' && (
          <div className="space-y-8 animate-fade-in">
            {/* Stats grid */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <h3 className="text-xl font-heading font-bold text-white uppercase tracking-tight">Portfolio Summary</h3>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={portfolioMonthFilter === null ? 'all' : portfolioMonthFilter}
                  onChange={(e) => setPortfolioMonthFilter(e.target.value === 'all' ? null : Number(e.target.value))}
                  className="bg-pine-bar border border-pine-border text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-pine-btn"
                >
                  <option value="all">All Months</option>
                  {monthsList.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
                <button 
                  onClick={() => printAnalyticalPortfolioStatement(
                    fund, monthsList, currentMembers, transactions, currentOthers, currentExpenses,
                    portfolioMonthFilter !== null ? { monthIndex: portfolioMonthFilter, name: monthsList[portfolioMonthFilter] } : undefined
                  )}
                  className="flex items-center gap-1.5 bg-pine-btn hover:bg-pine-btn-hover text-white text-xs font-button uppercase py-1.5 px-3 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Report
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <TiltCard glow={false} className="bg-pine-bar/40 text-center py-6">
                <span className="text-xs text-pine-text-muted uppercase font-button tracking-wider block mb-1">Fixed Achieved</span>
                <span className="text-2xl font-mono text-emerald-400 block font-semibold"><Counter value={getPortfolioFixedSum()} /> Rs</span>
              </TiltCard>
              <TiltCard glow={false} className="bg-pine-bar/40 text-center py-6">
                <span className="text-xs text-pine-text-muted uppercase font-button tracking-wider block mb-1">Other Donations</span>
                <span className="text-2xl font-mono text-emerald-400 block font-semibold"><Counter value={getPortfolioOtherSum()} /> Rs</span>
              </TiltCard>
              <TiltCard glow={false} className="bg-pine-bar/40 text-center border-pine-btn py-6">
                <span className="text-xs text-pine-text-muted uppercase font-button tracking-wider block mb-1">Sum Combined</span>
                <span className="text-2xl font-mono text-pine-success block font-bold"><Counter value={getPortfolioSumTotalAchieved()} /> Rs</span>
              </TiltCard>
              <TiltCard glow={false} className="bg-pine-bar/40 text-center py-6">
                <span className="text-xs text-pine-text-muted uppercase font-button tracking-wider block mb-1">Total Expenses</span>
                <span className="text-2xl font-mono text-rose-450 block font-semibold"><Counter value={getPortfolioExpensesSum()} /> Rs</span>
              </TiltCard>
              <TiltCard glow={false} className="bg-pine-bar/40 text-center py-6">
                <span className="text-xs text-pine-text-muted uppercase font-button tracking-wider block mb-1">Net Balance</span>
                <span className="text-2xl font-mono text-sky-400 block font-bold"><Counter value={getPortfolioNetBalance()} /> Rs</span>
              </TiltCard>
            </div>

            {/* Income Statement Table & Quick Vector Charts representation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Custom SVG Income Trend Chart */}
              <div className="glass-panel p-6 rounded-2xl border border-pine-border flex flex-col justify-between">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-button uppercase tracking-wider text-white">Monthly Statement Comparison</h3>
                  <span className="text-xs text-pine-text-muted font-mono">Current Year Metrics</span>
                </div>
                
                {/* SVG Drawing Area */}
                <div className="aspect-video w-full flex items-end justify-between px-2 pt-6 pb-2 border-b border-l border-pine-border relative">
                  {/* Grid background lines */}
                  <div className="absolute top-1/4 left-0 right-0 h-px bg-pine-border/20" />
                  <div className="absolute top-2/4 left-0 right-0 h-px bg-pine-border/20" />
                  <div className="absolute top-3/4 left-0 right-0 h-px bg-pine-border/20" />

                  {/* Monthly bars */}
                  {monthsList.map((m, idx) => {
                    // Collect monthly transactions and expenses values
                    let tMonthTotal = 0;
                    currentMembers.forEach(mem => {
                      const list = transactions.filter(t => t.memberId === mem.id && t.monthKey === m);
                      tMonthTotal += list.reduce((s, item) => s + item.amount, 0);
                    });
                    const otherMTotal = currentOthers.filter(o => {
                      try {
                        const oDate = new Date(o.date);
                        if (fund.type === 'masjid') {
                          return oDate.getMonth() === idx;
                        }
                        return false;
                      } catch { return false; }
                    }).reduce((s, item) => s + item.amount, 0);

                    const expMTotal = currentExpenses.filter(e => {
                      try {
                        const eDate = new Date(e.date);
                        if (fund.type === 'masjid') {
                          return eDate.getMonth() === idx;
                        }
                        return false;
                      } catch { return false; }
                    }).reduce((s, item) => s + item.amount, 0);

                    const income = tMonthTotal + otherMTotal;
                    const maxScalingLimit = Math.max(1, getSumTotalAchieved(), getExpensesSum()) || 10000;
                    const incHeight = Math.max(4, Math.min(100, (income / maxScalingLimit) * 100 * 5));
                    const expHeight = Math.max(4, Math.min(100, (expMTotal / maxScalingLimit) * 100 * 5));

                    return (
                      <div key={m} className="flex-1 flex flex-col items-center gap-0.5 max-w-[40px] group relative h-full justify-end">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 bg-pine-bar text-white px-2 py-1 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                          <p>In: {income.toLocaleString()} Rs</p>
                          <p>Out: {expMTotal.toLocaleString()} Rs</p>
                        </div>
                        {/* Income Bar */}
                        <div className="w-2.5 bg-pine-btn rounded-t" style={{ height: `${incHeight}%` }} />
                        {/* Expense Bar */}
                        <div className="w-2.5 bg-rose-500/70 rounded-t" style={{ height: `${expHeight}%` }} />
                        <span className="text-[9px] font-mono text-pine-text-muted mt-2 rotate-45 origin-left">{m.substring(0, 3)}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="flex gap-4 text-[10px] font-mono justify-center mt-8">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-pine-btn rounded" />
                    <span>Monthly Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-rose-500/70 rounded" />
                    <span>Monthly Expenses</span>
                  </div>
                </div>
              </div>

              {/* Dynamic spreadsheet layout */}
              <div className="glass-panel p-6 rounded-2xl border border-pine-border flex flex-col justify-between">
                <h3 className="text-sm font-button uppercase tracking-wider text-white mb-6">Financial Ledger Ledger</h3>
                <div className="overflow-x-auto h-64">
                  <table className="w-full text-xs text-left text-pine-text-body font-mono">
                    <thead>
                      <tr className="border-b border-pine-border text-pine-text-muted pb-2">
                        <th className="pb-2">Chronology</th>
                        <th className="pb-2">Inflow (Achieved)</th>
                        <th className="pb-2">Outflow (Expenses)</th>
                        <th className="pb-2">Net Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pine-border/40">
                      {monthsList.map((m) => {
                        let receipts = 0;
                        currentMembers.forEach(mem => {
                          const trans = transactions.filter(t => t.memberId === mem.id && t.monthKey === m);
                          receipts += trans.reduce((s, it) => s + it.amount, 0);
                        });
                        // Simple custom calculation
                        const statementNet = receipts - 0; // standard mock segment
                        return (
                          <tr key={m} className="hover:bg-pine-hover/5">
                            <td className="py-2.5 font-sans font-medium">{m}</td>
                            <td className="py-2.5 text-emerald-405">+{receipts.toLocaleString()} Rs</td>
                            <td className="py-2.5 text-rose-400">0 Rs</td>
                            <td className={`py-2.5 ${statementNet >= 0 ? 'text-pine-success' : 'text-pine-error'}`}>
                              {statementNet.toLocaleString()} Rs
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Contents: Fixed Register Pivot Grid */}
        {!pendingTabChange && activeTab === 'fixed' && (
          <FixedFundRegister 
            fund={fund}
            project={project}
            members={currentMembers}
            transactions={transactions}
            monthsList={monthsList}
            setMembers={setMembers}
            setTransactions={setTransactions}
            logAudit={logAudit}
            setSelectedReceipt={setSelectedReceipt}
            isFundAdminUnlocked={isFundAdminUnlocked}
          />
        )}

        {/* Tab Contents: Other achieved payments */}
        {!pendingTabChange && activeTab === 'other' && (
          <OtherFundRegister
            fund={fund}
            others={currentOthers}
            monthsList={monthsList}
            setOthers={setOthers}
            logAudit={logAudit}
            isFundAdminUnlocked={isFundAdminUnlocked}
          />
        )}

        {/* Tab Contents: Expenses log registers */}
        {!pendingTabChange && activeTab === 'expenses' && (
          <ExpensesRegister
            fund={fund}
            expenses={currentExpenses}
            monthsList={monthsList}
            setExpenses={setExpenses}
            logAudit={logAudit}
            isFundAdminUnlocked={isFundAdminUnlocked}
          />
        )}

        {/* Tab Contents: Commitments log registers */}
        {!pendingTabChange && activeTab === 'commitments' && (
          <CommitmentsRegister
            fund={fund}
            commitments={commitments.filter(c => c.fundId === fund.id)}
            setCommitments={setCommitments}
            logAudit={logAudit}
            isFundAdminUnlocked={isFundAdminUnlocked}
          />
        )}

        {/* Shop Rents, Zakat, and Bazm Custom Event tabs removed */}

      </div>

      {/* CASH RECEIPT PRINTABLE VOUCHER MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-gradient-to-b from-[#0b1d19] to-[#040e0b] border-2 border-emerald-500/60 p-8 rounded-2xl shadow-2xl relative animate-fade-in text-white print:p-0 print:border-0 print:bg-white print:text-black font-sans overflow-hidden">
            
            {/* Embedded Authenticity watermark seal for print/web */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] print:opacity-[0.04] flex items-center justify-center z-0 select-none">
              <svg className="w-96 h-96 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 4.25c1.52.01 2.75 1.24 2.75 2.75 0 1.95-2.75 5.25-2.75 5.25S9.25 10.95 9.25 9c0-1.51 1.23-2.74 2.75-2.75z"/>
              </svg>
            </div>

            {/* Verification Seal element */}
            <div className="absolute right-8 top-32 opacity-15 print:opacity-30 pointer-events-none z-10 select-none transform rotate-12 flex flex-col items-center justify-center border-4 border-double border-emerald-400 text-emerald-400 p-3 rounded-full w-28 h-28 text-center bg-[#091814]/50 print:bg-white print:text-black print:border-black">
              <span className="text-[7px] font-heading font-black tracking-tighter uppercase leading-none">AL-HABIB NOORANI</span>
              <span className="text-[12px] font-serif font-extrabold my-0.5">VERIFIED</span>
              <span className="text-[8px] font-mono tracking-tighter">Ameen Dastakhat</span>
            </div>

            {/* Print Friendly style tags */}
             <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                .print-receipt-area, .print-receipt-area *, .print-report-area, .print-report-area * {
                  visibility: visible;
                }
                .print-receipt-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  color: #000 !important;
                  background: #fff !important;
                  box-shadow: none !important;
                  border: 1px solid #ccc !important;
                  padding: 24px !important;
                  border-radius: 8px !important;
                }
                .print-report-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  color: #000 !important;
                  background: #fff !important;
                  box-shadow: none !important;
                  border: none !important;
                  padding: 0 !important;
                }
                .no-print {
                  display: none !important;
                }
                .bg-print-transparent {
                  background: transparent !important;
                  border-color: #333 !important;
                }
              }
            `}} />

            <div className="print-receipt-area space-y-6 relative z-10">
              
              {/* Receipt Head Section with Islamic Crescent Crest */}
              <div className="border-b-2 border-emerald-500/60 pb-4 flex items-center justify-between gap-4 print:border-black">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-base sm:text-lg font-heading font-extrabold text-white print:text-black tracking-wide uppercase flex items-center gap-1">
                      Masjid Al-Habib Noorani Community Trust
                    </h2>
                    <p className="text-[10px] text-emerald-400 print:text-black font-mono uppercase tracking-wider">
                      Wah Cantt, Punjab, Pakistan • Registered Trust
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 font-sans print:text-gray-600 font-medium">
                      Official Audited Cash Inflow Receipt Slip • Sarkari Tasdeeq Shuda Raseed
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] text-zinc-400 block mt-1.5 font-mono print:text-gray-600 bg-black/30 print:bg-transparent py-0.5 px-2 rounded">
                    Date: {selectedReceipt.paymentDate}
                  </span>
                </div>
              </div>

              {/* Receipt Body Items Grid */}
              <div className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Contributor Card */}
                  <div className="bg-emerald-950/20 print:bg-gray-50 p-4 rounded-xl border border-emerald-500/20 print:border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-emerald-400 print:text-gray-700 font-extrabold uppercase tracking-widest block">Received From / Mausool Kuninda:</span>
                    </div>
                    <span className="text-sm font-bold text-white print:text-black block">{selectedReceipt.memberName}</span>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono flex items-center gap-2">
                      <span className="print:text-gray-700">Phone:</span> 
                      <span className="text-white print:text-black font-bold">{selectedReceipt.memberPhone || 'None Provided'}</span>
                    </div>
                  </div>

                  {/* Fund Allocation Card */}
                  <div className="bg-emerald-950/20 print:bg-gray-50 p-4 rounded-xl border border-emerald-500/20 print:border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-emerald-400 print:text-gray-700 font-extrabold uppercase tracking-widest block">Fund Allocation / Khata:</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 rounded print:text-black print:bg-gray-200 font-semibold font-mono uppercase">{fund.type} Ledger</span>
                    </div>
                    <span className="text-sm font-bold text-white print:text-black block truncate">{selectedReceipt.fundName}</span>
                    <div className="text-[10px] text-zinc-400 mt-1 font-mono flex items-center justify-between">
                      <span>Purpose / Babat: <strong className="text-white print:text-black font-bold uppercase">{selectedReceipt.monthKey}</strong></span>
                      <span className="text-[9px] text-zinc-500 italic">Audited safe</span>
                    </div>
                  </div>
                </div>

                {/* Amount details card */}
                <div className="bg-gradient-to-r from-emerald-950/30 to-emerald-900/10 print:from-gray-100 print:to-gray-100 p-5 rounded-xl border border-emerald-500/40 text-center relative overflow-hidden print:border-black">
                  <span className="text-[9px] text-emerald-400 print:text-gray-700 uppercase tracking-widest block mb-1.5 font-bold">Total Cash Inlaid / Kul Mausool Shuda Raqam:</span>
                  
                  <div className="text-3xl font-mono text-[#0AEAA2] print:text-black font-black flex items-center justify-center gap-1 select-all">
                    {selectedReceipt.amount.toLocaleString()} <span className="text-sm font-sans font-extrabold text-white print:text-black">Rs (Rupya)</span>
                  </div>

                  <div className="text-[10px] font-semibold text-emerald-300 print:text-gray-700 italic mt-2.5 bg-black/40 print:bg-transparent py-1 px-3 rounded inline-block">
                    Words: <span className="font-bold tracking-wide uppercase text-white print:text-black">{NumberToWords(selectedReceipt.amount)} Rupees Only</span>
                  </div>
                </div>
              </div>

              {/* Secure barcode authenticity visual representation */}
              <div className="p-2.5 bg-black/40 print:bg-gray-50 rounded-lg flex items-center justify-between border border-emerald-500/10">
                {/* Visual Barcode bars */}
                <div className="token-barcode select-none pr-1 tracking-tighter text-zinc-400 font-mono text-[10px] font-bold block print:text-black" title="System digital barcode">
                  ||||| | |||| ||| ||| |||| | ||||| | || | ||| |||| |
                </div>
              </div>

              {/* Verification Legalese and Ameen Signatures */}
              <div className="border-t border-dashed border-emerald-500/45 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] print:border-black">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-[#0AEAA2] print:text-black flex items-center justify-center sm:justify-start gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0AEAA2]" /> Digitally Authenticated Ledger Transaction
                  </p>
                  <p className="text-zinc-500 mt-0.5 font-mono print:text-gray-600">
                    System Timestamp: {new Date().toISOString().substring(0, 16).replace('T', ' ')} • Wah Cantt Area
                  </p>
                </div>
                <div className="text-center w-40 border-t border-zinc-700/60 pt-2 print:border-black/50 h-16 flex flex-col justify-end mt-2 shrink-0">
                  <span className="text-[8px] text-emerald-400 print:text-black font-semibold uppercase tracking-wider block">Dastakhat-e-Ameen / Trustee</span>
                  <span className="text-[9px] text-zinc-400 font-button tracking-wider block print:text-gray-700">Ameen Signature Stamp</span>
                </div>
              </div>
            </div>

            {/* Print action buttons bar */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 no-print relative z-25">
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="sm:w-1/3 py-2.5 rounded-xl border border-emerald-500/30 text-center text-xs font-button uppercase tracking-wider text-zinc-300 hover:text-white hover:bg-emerald-950/35 transition-all cursor-pointer"
              >
                Close (Band Karen)
              </button>
              <button
                type="button"
                onClick={() => handlePrintReceiptDirect(selectedReceipt)}
                className="sm:w-1/3 py-2.5 rounded-xl border border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/50 text-center text-xs font-button uppercase tracking-wider text-emerald-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print (Print Karen)
              </button>
              <button
                type="button"
                onClick={() => handleDownloadReceiptHtml(selectedReceipt)}
                className="sm:w-1/3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-center text-xs font-button uppercase tracking-wider text-white font-extrabold flex items-center justify-center gap-2 shadow-xl hover:shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download 1-Click
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ----------------------------------------------------
// NUMBER TO WORDS CONVERSION UTILITY
// ----------------------------------------------------
function NumberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  if (num === 0) return 'Zero';
  
  let str = '';
  
  if (num >= 10000000) {
    str += NumberToWords(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    str += NumberToWords(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    str += NumberToWords(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num >= 100) {
    str += NumberToWords(Math.floor(num / 100)) + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) {
      str += a[num];
    } else {
      str += b[Math.floor(num / 10)];
      if (num % 10) str += '-' + a[num % 10].trim();
    }
  }
  return str.trim();
}

// ----------------------------------------------------
// STANDALONE HIGH-FIDELITY PRINT REPORT ENGINES (POPUP WINDOW SYSTEM)
// ----------------------------------------------------
export const printMemberStatement = (
  member: FundMember,
  memberTrans: FundMemberTransaction[],
  months: string[],
  fundName: string
) => {
  const paidSum = memberTrans.filter(t => t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
  const balance = member.requiredAmount - paidSum;
  const generatedDate = new Date().toLocaleString('en-US', { hour12: true });

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Allow popups to print reports!');
    return;
  }

  const reportHtml = `
<!DOCTYPE html>
<html lang="ur" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>${member.name} - Individual Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      color: #000000;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 13px;
    }
    .print-header {
      border-bottom: 4px double #000000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .print-header h2 {
      font-size: 18px;
      font-weight: 800;
      color: #000000;
      margin: 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .print-header h3 {
      font-size: 11px;
      font-weight: 700;
      color: #000000;
      margin: 4px 0 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .print-meta {
      font-size: 8.5px;
      font-family: monospace;
      color: #000000;
      margin-top: 6px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      border: 1px solid #000000;
      border-radius: 4px;
      padding: 12px;
      background-color: #f3f4f6;
    }
    .info-card p {
      margin: 4px 0;
      font-size: 13px;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .stat-box {
      border: 1px solid #000000;
      border-radius: 4px;
      background: #ffffff;
      padding: 8px;
      text-align: center;
    }
    .stat-label {
      font-size: 8.5px;
      text-transform: uppercase;
      color: #000000;
      display: block;
      margin-bottom: 2px;
      font-weight: bold;
    }
    .stat-value {
      font-family: monospace;
      font-size: 13px;
      font-weight: 700;
      color: #000000;
    }
    .stat-val-outstanding {
      font-size: 14px;
      color: #000000;
      font-weight: 800;
    }
    .table-title {
      font-size: 12px;
      font-weight: 700;
      color: #000000;
      margin: 16px 0 6px;
      border-bottom: 1px solid #000000;
      padding-bottom: 4px;
      text-transform: uppercase;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
    }
    th {
      background-color: #e5e7eb;
      color: #000000;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 12px;
      border: 1px solid #000000;
      text-align: left;
    }
    td {
      padding: 6px 12px;
      border: 1px solid #000000;
      color: #000000;
    }
    tr:nth-child(even) td {
      background-color: #f9fafb;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h2>MASJID AL-HABIB NOORANI</h2>
    <h3>INDIVIDUAL FINANCIAL STATEMENT REPORT — ${fundName.toUpperCase()}</h3>
    <div class="print-meta">
      Report Generated: ${generatedDate}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-card">
      <p style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 6px;">
        Contributor Details / ممبر کی معلومات
      </p>
      <p style="font-size: 15px; font-weight: 800; color: #000000;">${member.name}</p>
      <p style="color: #000000;">📞 Phone: <strong>${member.phone || 'Not Provided / درج نہیں'}</strong></p>
      <p style="color: #000000;">📂 Registry Category: <strong>${fundName}</strong></p>
    </div>
    <div class="summary-stats">
      <div class="stat-box">
        <span class="stat-label">Annual Goal (ہدف)</span>
        <span class="stat-value">${member.requiredAmount.toLocaleString()} Rs</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Paid Total (موصول)</span>
        <span class="stat-value">${paidSum.toLocaleString()} Rs</span>
      </div>
      <div class="stat-box" style="grid-column: span 2; background-color: #f3f4f6; border-color: #000000;">
        <span class="stat-label" style="color: #000000; font-weight: 800;">Remaining Balance Dues (بقایا واجب الادا رقم)</span>
        <span class="stat-value stat-val-outstanding">${balance.toLocaleString()} Rs</span>
      </div>
    </div>
  </div>

  ${(member.remainingPrevious > 0 || member.paidPrevious > 0) ? `
  <div class="info-card" style="margin-bottom: 20px; padding: 10px 12px; background-color: #f3f4f6; border-color: #000000;">
    <p style="font-size: 9px; font-weight: 800; text-transform: uppercase; color: #000000; margin-bottom: 4px;">Opening Previous Balance Summary / پچھلا بقایا جات</p>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; font-size: 11px;">
      <div>
        <span style="color: #000000; font-size: 8px; text-transform: uppercase; display: block; font-weight: bold;">Dues Remaining</span>
        <strong>${member.remainingPrevious.toLocaleString()} Rs</strong>
      </div>
      <div>
        <span style="color: #000000; font-size: 8px; text-transform: uppercase; display: block; font-weight: bold;">Amount Paid</span>
        <strong>${member.paidPrevious.toLocaleString()} Rs</strong>
      </div>
      <div>
        <span style="color: #000000; font-size: 8px; text-transform: uppercase; display: block; font-weight: bold;">Payment Date</span>
        <span style="font-family: monospace;">${member.paidPreviousDate || '—'}</span>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="table-title">Combined Monthly Contribution Ledger — 12 Months Registry</div>
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Sr</th>
        <th>Month Index / ماہانہ قسط</th>
        <th style="text-align: center;">Amount Paid (Rs)</th>
        <th style="text-align: right;">Payment Date</th>
      </tr>
    </thead>
    <tbody>
      ${months.map((month, idx) => {
        const trans = memberTrans.find(t => t.monthKey === month);
        const amt = trans ? trans.amount : 0;
        const dateStr = trans ? trans.paymentDate : '—';
        return `
          <tr>
            <td style="color: #000000; font-weight: bold;">${(idx+1).toString().padStart(2, '0')}</td>
            <td style="font-weight: 700;">${month}</td>
            <td style="text-align: center; font-weight: bold; color: #000000;">
              ${amt > 0 ? `${amt.toLocaleString()} Rs` : '—'}
            </td>
            <td style="text-align: right; font-family: monospace; color: #000000;">${dateStr}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
};

export const printGeneralRegistryReport = (
  orderedMembers: FundMember[],
  allFundMembers: FundMember[],
  transactions: FundMemberTransaction[],
  months: string[],
  fund: FundModule
) => {
  const generatedDate = new Date().toLocaleString();
  const isProject = fund.type === 'project';
  const totalGoal = orderedMembers.reduce((sum, m) => sum + m.requiredAmount, 0);

  // Calculate dynamic totals across all active members
  let totalPaid = 0;
  orderedMembers.forEach(m => {
    const mTrans = transactions.filter(t => t.memberId === m.id);
    totalPaid += mTrans.filter(t => t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
  });
  const totalOutstanding = totalGoal - totalPaid;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Allow popups to print reports!');
    return;
  }

  const reportHtml = `
<!DOCTYPE html>
<html lang="ur" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>General Ledger - ${fund.name}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      color: #000000;
      background-color: #ffffff;
      font-size: 9.5px;
      line-height: 1.2;
    }
    .print-header {
      padding-bottom: 8px;
      margin-bottom: 12px;
      text-align: center;
      border-bottom: 3px double #000000;
    }
    .print-header h2 {
      font-size: 16px;
      font-weight: 800;
      color: #000000;
      margin: 0;
      text-transform: uppercase;
    }
    .print-header h3 {
      font-size: 10px;
      font-weight: 700;
      color: #000000;
      margin: 2px 0 0;
      text-transform: uppercase;
    }
    .print-meta {
      font-size: 8px;
      font-family: monospace;
      color: #000000;
      margin-top: 4px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .summary-box {
      border: 1px solid #000000;
      background-color: #f3f4f6;
      padding: 6px;
      border-radius: 4px;
      text-align: center;
    }
    .summary-box span {
      font-size: 8px;
      text-transform: uppercase;
      color: #374151;
      display: block;
      font-weight: bold;
    }
    .summary-box strong {
      font-size: 11px;
      font-family: monospace;
      color: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      font-family: monospace;
    }
    th {
      background-color: #e5e7eb;
      color: #000000;
      font-weight: 700;
      border: 1px solid #000000;
      padding: 5px 3px;
      text-align: center;
      font-size: 8.5px;
    }
    td {
      border: 1px solid #000000;
      padding: 4px 3px;
      text-align: center;
      color: #000000;
    }
    .name-cell {
      text-align: left;
      font-family: sans-serif;
      font-weight: 700;
      padding-left: 6px;
    }
    .highlight-row {
      background-color: #e5e7eb;
      font-weight: 800;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h2>MASJID AL-HABIB NOORANI</h2>
    <h3>GENERAL REGISTRY LEDGER REPORT — ${fund.name.toUpperCase()}</h3>
    <div class="print-meta">
      Report Generated: ${generatedDate} | Total ${orderedMembers.length} active contributors list
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-box">
      <span>Total Contributors</span>
      <strong>${orderedMembers.length} Members</strong>
    </div>
    <div class="summary-box">
      <span>Combined Goal</span>
      <strong>${totalGoal.toLocaleString()} Rs</strong>
    </div>
    <div class="summary-box">
      <span>Achieved Total</span>
      <strong>${totalPaid.toLocaleString()} Rs</strong>
    </div>
    <div class="summary-box" style="background-color: #f3f4f6; border-color: #000000;">
      <span>Dues Outstanding</span>
      <strong style="font-weight: 900;">${totalOutstanding.toLocaleString()} Rs</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 3%;">Sr</th>
        <th style="text-align: left; padding-left: 6px; width: 20%;">Name of Contributor</th>
        ${!isProject ? '<th style="width: 6%;">Prev Due</th>' : ''}
        ${months.map(m => `<th style="width: 5%;">${m.substring(0, 4)}</th>`).join('')}
        <th style="width: 7%;">Required</th>
        <th style="width: 7%;">Paid</th>
        <th style="width: 7%;">Outstanding</th>
      </tr>
    </thead>
    <tbody>
      ${orderedMembers.map((m, idx) => {
        const naturalSNo = allFundMembers.findIndex(x => x.id === m.id) + 1;
        const mTrans = transactions.filter(t => t.memberId === m.id);
        const paid = mTrans.filter(t => t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
        const outstanding = m.requiredAmount - paid;

        return `
          <tr>
            <td style="color: #000000; font-weight: bold;">${naturalSNo}</td>
            <td class="name-cell">${m.name}</td>
            ${!isProject ? `<td>${m.remainingPrevious > 0 ? `${m.remainingPrevious.toLocaleString()}` : '—'}</td>` : ''}
            ${months.map(month => {
              const txList = mTrans.filter(t => t.monthKey === month);
              const mSum = txList.reduce((sum, item) => sum + item.amount, 0);
              return `<td>${mSum > 0 ? `${mSum.toLocaleString()}` : '—'}</td>`;
            }).join('')}
            <td style="font-weight: bold; background-color: #f9fafb;">${m.requiredAmount.toLocaleString()}</td>
            <td style="font-weight: bold; background-color: #f9fafb;">${paid > 0 ? paid.toLocaleString() : '—'}</td>
            <td style="font-weight: bold; background-color: #f9fafb;">
              ${outstanding > 0 ? outstanding.toLocaleString() : 'CLEAR'}
            </td>
          </tr>
        `;
      }).join('')}
      <tr class="highlight-row">
        <td colspan="2" style="text-align: left; padding-left: 6px;">GRAND TOTAL</td>
        ${!isProject ? `<td>${orderedMembers.reduce((sum, m) => sum + m.remainingPrevious, 0).toLocaleString()}</td>` : ''}
        ${months.map(month => {
          const sum = orderedMembers.reduce((acc, m) => {
            const txList = transactions.filter(t => t.memberId === m.id && t.monthKey === month);
            const mSum = txList.reduce((sum, item) => sum + item.amount, 0);
            return acc + mSum;
          }, 0);
          return `<td>${sum > 0 ? sum.toLocaleString() : '—'}</td>`;
        }).join('')}
        <td>${totalGoal.toLocaleString()}</td>
        <td>${totalPaid.toLocaleString()}</td>
        <td>${totalOutstanding.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
};

export const printExpensesStatement = (
  filteredExpenses: Expense[],
  filterLabel: string
) => {
  const generatedDate = new Date().toLocaleString();
  const totalAmount = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Allow popups to print reports!');
    return;
  }

  const reportHtml = `
<!DOCTYPE html>
<html lang="ur" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Expenses Report - Masjid Al Habib Noorani</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      color: #000000;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 13px;
    }
    .print-header {
      border-bottom: 4px double #000000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .print-header h1 {
      font-size: 18px;
      font-weight: 800;
      color: #000000;
      margin: 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .print-header h2 {
      font-size: 11px;
      font-weight: 700;
      color: #000000;
      margin: 4px 0 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .print-meta {
      font-size: 8.5px;
      font-family: monospace;
      color: #000000;
      margin-top: 6px;
    }
    .summary-card {
      border: 1px solid #000000;
      border-radius: 4px;
      padding: 12px;
      background-color: #f3f4f6;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      text-align: center;
    }
    .stat-box span {
      font-size: 8.5px;
      text-transform: uppercase;
      color: #000000;
      letter-spacing: 0.5px;
      display: block;
      font-weight: bold;
    }
    .stat-box strong {
      font-size: 13px;
      font-family: monospace;
      color: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
    }
    th {
      background-color: #e5e7eb;
      color: #000000;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 12px;
      border: 1px solid #000000;
      text-align: left;
    }
    td {
      padding: 6px 12px;
      border: 1px solid #000000;
      color: #000000;
    }
    tr:nth-child(even) td {
      background-color: #f9fafb;
    }
    .highlight-row {
      background-color: #e5e7eb !important;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>MASJID AL-HABIB NOORANI</h1>
    <h2>MOSQUE EXPENDITURES & OUTFLOWS REPORT</h2>
    <div class="print-meta">
      Report Generated: ${generatedDate}
      ${filterLabel ? `<div style="background-color: #ffffff; border: 2px solid #000000; padding: 6px 12px; border-radius: 4px; font-size: 14px; color: #000000; font-weight: 800; margin-top: 10px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">Month Filtered: ${filterLabel.toUpperCase()}</div>` : ''}
    </div>
  </div>

  <div class="summary-card">
    <div class="stat-box">
      <span>Total Printed Outflows</span>
      <strong>${totalAmount.toLocaleString()} Rs</strong>
    </div>
    <div class="stat-box">
      <span>Total Voucher Invoices</span>
      <strong style="color: #000000;">${filteredExpenses.length} Records</strong>
    </div>
    <div class="stat-box">
      <span>System Status</span>
      <strong style="color: #000000; text-transform: uppercase; font-size: 11px;">DIGITALLY VERIFIED</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Sr</th>
        <th>Expense Head / تفصیلِ اخراجات</th>
        <th style="text-align: center; width: 15%;">Date</th>
        <th style="text-align: right; width: 20%;">Price Outflow (Rs)</th>
        <th>In-depth Description / Details</th>
      </tr>
    </thead>
    <tbody>
      ${filteredExpenses.map((expense, idx) => `
        <tr>
          <td style="color: #000000; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: 700; color: #000000;">${expense.name}</td>
          <td style="text-align: center; font-family: monospace; color: #000000;">${new Date(expense.date).toLocaleDateString()}</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace; color: #000000;">
            ${expense.amount.toLocaleString()} Rs
          </td>
          <td style="color: #000000;">${expense.details || '—'}</td>
        </tr>
      `).join('')}
      <tr class="highlight-row">
        <td colspan="3" style="font-weight: 800;">GRAND TOTAL (کل اخراجات)</td>
        <td style="text-align: right; font-weight: 900; font-family: monospace; color: #000000; font-size: 12px;">
          ${totalAmount.toLocaleString()} Rs
        </td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
};

export const printOtherDonationsStatement = (
  filteredOthers: OtherFundEntry[],
  filterLabel: string
) => {
  const generatedDate = new Date().toLocaleString();
  const totalAmount = filteredOthers.reduce((sum, item) => sum + item.amount, 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Allow popups to print reports!');
    return;
  }

  const reportHtml = `
<!DOCTYPE html>
<html lang="ur" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Other Donations Report</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      color: #000000;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 13px;
    }
    .print-header {
      border-bottom: 4px double #000000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .print-header h1 {
      font-size: 18px;
      font-weight: 800;
      color: #000000;
      margin: 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .print-header h2 {
      font-size: 11px;
      font-weight: 700;
      color: #000000;
      margin: 4px 0 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .print-meta {
      font-size: 8.5px;
      font-family: monospace;
      color: #000000;
      margin-top: 6px;
    }
    .summary-card {
      border: 1px solid #000000;
      border-radius: 4px;
      padding: 12px;
      background-color: #f3f4f6;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      text-align: center;
    }
    .stat-box span {
      font-size: 8.5px;
      text-transform: uppercase;
      color: #000000;
      letter-spacing: 0.5px;
      display: block;
      font-weight: bold;
    }
    .stat-box strong {
      font-size: 13px;
      font-family: monospace;
      color: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
    }
    th {
      background-color: #e5e7eb;
      color: #000000;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 12px;
      border: 1px solid #000000;
      text-align: left;
    }
    td {
      padding: 6px 12px;
      border: 1px solid #000000;
      color: #000000;
    }
    tr:nth-child(even) td {
      background-color: #f9fafb;
    }
    .highlight-row {
      background-color: #e5e7eb !important;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>MASJID AL-HABIB NOORANI</h1>
    <h2>OTHER GENERAL ACHIEVED DONATIONS REPORT</h2>
    <div class="print-meta">
      Report Generated: ${generatedDate}
      ${filterLabel ? `<div style="background-color: #ffffff; border: 2px solid #000000; padding: 6px 12px; border-radius: 4px; font-size: 14px; color: #000000; font-weight: 800; margin-top: 10px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">Month Filtered: ${filterLabel.toUpperCase()}</div>` : ''}
    </div>
  </div>

  <div class="summary-card">
    <div class="stat-box">
      <span>Total Collections</span>
      <strong>${totalAmount.toLocaleString()} Rs</strong>
    </div>
    <div class="stat-box">
      <span>Total Entries count</span>
      <strong style="color: #000000;">${filteredOthers.length} Records</strong>
    </div>
    <div class="stat-box">
      <span>System Status</span>
      <strong style="color: #000000; text-transform: uppercase; font-size: 11px;">DIGITALLY VERIFIED</strong>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Sr</th>
        <th>Source Head Name / تفصیلِ آمدنی</th>
        <th style="text-align: center; width: 15%;">Date</th>
        <th style="text-align: right; width: 20%;">Amount Paid (Rs)</th>
        <th>Reference Notes</th>
      </tr>
    </thead>
    <tbody>
      ${filteredOthers.map((item, idx) => `
        <tr>
          <td style="color: #000000; font-weight: bold;">${idx + 1}</td>
          <td style="font-weight: 700; color: #000000;">${item.source}</td>
          <td style="text-align: center; font-family: monospace; color: #000000;">${new Date(item.date).toLocaleDateString()}</td>
          <td style="text-align: right; font-weight: bold; font-family: monospace; color: #000000;">
            ${item.amount.toLocaleString()} Rs
          </td>
          <td style="color: #000000;">${item.details || '—'}</td>
        </tr>
      `).join('')}
      <tr class="highlight-row">
        <td colspan="3" style="font-weight: 800;">GRAND TOTAL DIRECT INFLOWS</td>
        <td style="text-align: right; font-weight: 900; font-family: monospace; color: #000000; font-size: 12px;">
          ${totalAmount.toLocaleString()} Rs
        </td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
};

export const printAnalyticalPortfolioStatement = (
  fund: FundModule,
  months: string[],
  currentMembers: FundMember[],
  transactions: FundMemberTransaction[],
  currentOthers: OtherFundEntry[],
  currentExpenses: Expense[],
  overrideMonthFilter?: { monthIndex: number; name: string }
) => {
  const generatedDate = new Date().toLocaleString();
  
  // Totals calculations
  let totalFixed = 0;
  const filterMonthKey = overrideMonthFilter ? months[overrideMonthFilter.monthIndex] : null;

  currentMembers.forEach(mem => {
    const list = transactions.filter(t => t.memberId === mem.id && t.monthKey !== 'khatm');
    list.forEach(tx => {
       if (overrideMonthFilter) {
          if (tx.monthKey === filterMonthKey) {
             totalFixed += tx.amount;
          }
       } else {
         totalFixed += tx.amount;
       }
    });
  });
  
  const totalOthers = currentOthers.filter(o => {
     if (!overrideMonthFilter) return true;
     try { return new Date(o.date).getMonth() === overrideMonthFilter.monthIndex; } catch { return false; }
  }).reduce((sum, o) => sum + o.amount, 0);

  const totalExpenses = currentExpenses.filter(e => {
     if (!overrideMonthFilter) return true;
     try { return new Date(e.date).getMonth() === overrideMonthFilter.monthIndex; } catch { return false; }
  }).reduce((sum, e) => sum + e.amount, 0);

  const combinedIncome = totalFixed + totalOthers;
  const netReserve = combinedIncome - totalExpenses;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Allow popups to print reports!');
    return;
  }

  const reportHtml = `
<!DOCTYPE html>
<html lang="ur" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Analytical Portfolio Statement - ${fund.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      color: #000000;
      background-color: #ffffff;
      line-height: 1.4;
      font-size: 13px;
    }
    .print-header {
      border-bottom: 4px double #000000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .print-header h1 {
      font-size: 18px;
      font-weight: 800;
      color: #000000;
      margin: 0;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .print-header h2 {
      font-size: 11px;
      font-weight: 700;
      color: #000000;
      margin: 4px 0 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .print-meta {
      font-size: 8.5px;
      font-family: monospace;
      color: #000000;
      margin-top: 6px;
    }
    .summary-card {
      border: 1px solid #000000;
      border-radius: 4px;
      padding: 12px;
      background-color: #f3f4f6;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      text-align: center;
      gap: 12px;
    }
    .stat-box {
      border-right: 1px solid #000000;
    }
    .stat-box:last-child {
      border-right: none;
    }
    .stat-box span {
      font-size: 8px;
      text-transform: uppercase;
      color: #000000;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 4px;
      font-weight: bold;
    }
    .stat-box strong {
      font-size: 13px;
      font-family: monospace;
      color: #000000;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 11px;
    }
    th {
      background-color: #e5e7eb;
      color: #000000;
      font-weight: 700;
      text-transform: uppercase;
      padding: 8px 12px;
      border: 1px solid #000000;
      text-align: left;
    }
    td {
      padding: 6px 12px;
      border: 1px solid #000000;
      color: #000000;
    }
    tr:nth-child(even) td {
      background-color: #f9fafb;
    }
    .highlight-row {
      background-color: #e5e7eb !important;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>MASJID AL-HABIB NOORANI</h1>
    <h2>COMPREHENSIVE FINANCIAL PORTFOLIO STATUS — ${fund.name.toUpperCase()}</h2>
    <div class="print-meta">
      Report Generated: ${generatedDate} | System Code: AHNT-PORTFOLIO-${fund.id.toUpperCase()}
      ${overrideMonthFilter ? `<br><span style="font-size: 12px; color: #000000; font-weight: bold; margin-top: 8px; display: inline-block;">Filters Applied: Month ${overrideMonthFilter.name}</span>` : '<br><span style="font-size: 11px; margin-top: 8px; display: inline-block;">Period: Complete Ledger Lifecycle</span>'}
    </div>
  </div>

  <div class="summary-card">
    <div class="stat-box">
      <span>Fixed Registry</span>
      <strong>${totalFixed.toLocaleString()} Rs</strong>
    </div>
    <div class="stat-box">
      <span>Other Donations</span>
      <strong>${totalOthers.toLocaleString()} Rs</strong>
    </div>
    <div class="stat-box">
      <span>Sum Combined</span>
      <strong>${combinedIncome.toLocaleString()} Rs</strong>
    </div>
    <div class="stat-box">
      <span> Mosq Outflows</span>
      <strong>${totalExpenses.toLocaleString()} Rs</strong>
    </div>
    <div class="stat-box">
      <span>Net Reserve</span>
      <strong>${netReserve.toLocaleString()} Rs</strong>
    </div>
  </div>

  <div style="margin-bottom: 20px; font-size: 11px; border: 1px dashed #000000; padding: 10px; border-radius: 4px; background-color: #f3f4f6;">
    <strong>Net Liquid Balance Reserve / خالص فنڈ ریزرو بیلنس:</strong> 
    <span style="font-family: monospace; font-size: 14px; font-weight: 900; color: #000000; margin-left: 8px;">
      ${netReserve.toLocaleString()} Rs
    </span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%;">Sr</th>
        <th>Month / Phase Details</th>
        <th style="text-align: right; width: 22%;">Fixed Registry Inflow (Rs)</th>
        <th style="text-align: right; width: 22%;">Other Donations Inflow (Rs)</th>
        <th style="text-align: right; width: 22%;">Mosque Outflow / Expenses (Rs)</th>
        <th style="text-align: right; width: 22%;">Net Monthly Balance (Rs)</th>
      </tr>
    </thead>
    <tbody>
      ${months.map((m, idx) => {
        if (overrideMonthFilter && idx !== overrideMonthFilter.monthIndex) return '';
        
        let fixedMIn = 0;
        currentMembers.forEach(mem => {
          const list = transactions.filter(t => t.memberId === mem.id && t.monthKey === m);
          fixedMIn += list.reduce((sum, item) => sum + item.amount, 0);
        });

        const otherMIn = currentOthers.filter(o => {
          try {
            const oDate = new Date(o.date);
            return oDate.getMonth() === idx;
          } catch { return false; }
        }).reduce((sum, item) => sum + item.amount, 0);

        const expMOut = currentExpenses.filter(e => {
          try {
            const eDate = new Date(e.date);
            return eDate.getMonth() === idx;
          } catch { return false; }
        }).reduce((sum, item) => sum + item.amount, 0);

        const mNet = (fixedMIn + otherMIn) - expMOut;

        return `
          <tr>
            <td style="color: #000000; font-weight: bold;">${(idx + 1).toString().padStart(2, '0')}</td>
            <td style="font-weight: 700; color: #000000;">${m}</td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #000000;">
              ${fixedMIn > 0 ? `${fixedMIn.toLocaleString()} Rs` : '—'}
            </td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #000000;">
              ${otherMIn > 0 ? `${otherMIn.toLocaleString()} Rs` : '—'}
            </td>
            <td style="text-align: right; font-family: monospace; font-weight: bold; color: #000000;">
              ${expMOut > 0 ? `${expMOut.toLocaleString()} Rs` : '—'}
            </td>
            <td style="text-align: right; font-family: monospace; font-weight: 900; color: #000000;">
              ${mNet.toLocaleString()} Rs
            </td>
          </tr>
        `;
      }).join('')}
      <tr class="highlight-row">
        <td colspan="2" style="font-weight: 800;">GRAND TOTALS / کل میزان</td>
        <td style="text-align: right; font-family: monospace; font-weight: 900; color: #000000;">
          ${totalFixed.toLocaleString()} Rs
        </td>
        <td style="text-align: right; font-family: monospace; font-weight: 900; color: #000000;">
          ${totalOthers.toLocaleString()} Rs
        </td>
        <td style="text-align: right; font-family: monospace; font-weight: 900; color: #000000;">
          ${totalExpenses.toLocaleString()} Rs
        </td>
        <td style="text-align: right; font-family: monospace; font-weight: 900; color: #000000; font-size: 12px;">
          ${netReserve.toLocaleString()} Rs
        </td>
      </tr>
    </tbody>
  </table>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(reportHtml);
  printWindow.document.close();
};

interface FixedRegisterProps {
  fund: FundModule;
  project?: Project;
  members: FundMember[];
  transactions: FundMemberTransaction[];
  monthsList: string[];
  setMembers: React.Dispatch<React.SetStateAction<FundMember[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<FundMemberTransaction[]>>;
  logAudit: (action: AuditLog['action'], module: string, recordId: string, oldValue: any, newValue: any) => void;
  setSelectedReceipt: React.Dispatch<React.SetStateAction<any>>;
  isFundAdminUnlocked?: boolean;
}

function FixedFundRegister({
  fund,
  project,
  members,
  transactions,
  monthsList,
  setMembers,
  setTransactions,
  logAudit,
  setSelectedReceipt,
  isFundAdminUnlocked = false
}: FixedRegisterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeMonthFilter, setActiveMonthFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'sr' | 'name'>('sr');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Modal edit states
  const [activeCellEdit, setActiveCellEdit] = useState<{
    memberId: string;
    type: 'prev' | 'khatm' | 'month';
    monthKey?: string;
  } | null>(null);

  const [activeMemberEdit, setActiveMemberEdit] = useState<{
    memberId?: string; // empty means ADD
    name: string;
    phone: string;
    requiredAmount: number;
    remainingPrevious?: number;
    paidPrevious?: number;
    paidPreviousDate?: string;
  } | null>(null);

  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // Form values in cell editor modal
  const [cellEditAmount, setCellEditAmount] = useState<number>(1000);
  const [cellEditDate, setCellEditDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cellEditPrevRemaining, setCellEditPrevRemaining] = useState<number>(0);
  const [cellEditPrevPaid, setCellEditPrevPaid] = useState<number>(0);
  const [cellEditPrevDate, setCellEditPrevDate] = useState<string>('');

  // Synchronize values when Cell modal opens
  useEffect(() => {
    if (!activeCellEdit) return;
    const { memberId, type, monthKey } = activeCellEdit;

    if (type === 'prev') {
      const m = members.find(x => x.id === memberId);
      if (m) {
        setCellEditPrevRemaining(m.remainingPrevious || 0);
        setCellEditPrevPaid(m.paidPrevious || 0);
        setCellEditPrevDate(m.paidPreviousDate || '');
      }
    } else {
      const mKey = type === 'khatm' ? 'khatm' : (monthKey || 'January');
      const existingList = transactions.filter(t => t.memberId === memberId && t.monthKey === mKey);
      if (existingList.length > 0) {
        const totalAmount = existingList.reduce((sum, t) => sum + t.amount, 0);
        setCellEditAmount(totalAmount);
        setCellEditDate(existingList[0].paymentDate || new Date().toISOString().split('T')[0]);
      } else {
        setCellEditAmount(type === 'khatm' ? 3000 : 1000);
        setCellEditDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [activeCellEdit, members, transactions]);

  // Current active fund members only
  const currentFundMembers = members.filter(m => m.fundId === fund.id);

  // Apply default sorting
  const sortedMembers = [...currentFundMembers].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    // S# (unaltered array state representation order)
    return 0; // Natural index placement
  });

  // Dynamic filter lists
  const currentMonthNum = new Date().getMonth() + 1; // 1 to 12
  const totalMonthsCount = monthsList.length || 12;

  const processedMembers = sortedMembers.filter(m => {
    const sTerm = searchTerm.toLowerCase().trim();
    const matchSearch = m.name.toLowerCase().includes(sTerm) || m.phone.includes(sTerm);
    if (!matchSearch) return false;

    // Derived payment totals for filters
    const mTrans = transactions.filter(t => t.memberId === m.id);
    const paidSum = mTrans.filter(t => t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
    const isKhatmDone = mTrans.some(t => t.monthKey === 'khatm' && t.amount > 0);
    const remaining = m.requiredAmount - paidSum;
    const expectedRate = (m.requiredAmount / totalMonthsCount) * currentMonthNum;

    // Phase/Month specific filter
    if (activeMonthFilter) {
      const paidSpecific = mTrans.find(t => t.monthKey === activeMonthFilter && t.amount > 0);
      if (!paidSpecific) return false;
    }

    // Current month missing payment check
    const currentMonthKey = monthsList[currentMonthNum - 1] || 'January';
    const paidCurrentMonth = mTrans.some(t => t.monthKey === currentMonthKey && t.amount > 0);

    const isCleared = remaining <= 0 && (fund.type !== 'masjid' || isKhatmDone);

    if (activeFilter === 'all') return true;
    if (activeFilter === 'behind') return paidSum < expectedRate && !isCleared;
    if (activeFilter === 'track') return paidSum >= expectedRate || isCleared;
    if (activeFilter === 'partial-payers') return paidSum > 0 && paidSum < m.requiredAmount;
    if (activeFilter === 'monthly-defaulters') return !paidCurrentMonth && !isCleared;
    if (activeFilter === 'no-activity') return paidSum === 0;
    if (activeFilter === 'no-khatm') return !isKhatmDone;
    if (activeFilter === 'with-khatm') return isKhatmDone;
    if (activeFilter === 'all-cleared') return isCleared;
    if (activeFilter === 'prev-cleared') return m.remainingPrevious <= 0;

    return true;
  });

  // Custom secondary rankings sorts (High / Low contribution ranges)
  let orderedMembers = [...processedMembers];
  if (activeFilter === 'high-contributors') {
    orderedMembers.sort((a, b) => {
      const sumA = transactions.filter(t => t.memberId === a.id && t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
      const sumB = transactions.filter(t => t.memberId === b.id && t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
      return sumB - sumA;
    });
  } else if (activeFilter === 'low-contributors') {
    orderedMembers.sort((a, b) => {
      const sumA = transactions.filter(t => t.memberId === a.id && t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
      const sumB = transactions.filter(t => t.memberId === b.id && t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
      return sumA - sumB;
    });
  }

  // Pivot amounts aggregators
  const getMonthPayment = (memberId: string, monthKey: string) => {
    const items = transactions.filter(t => t.memberId === memberId && t.monthKey === monthKey);
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const getMonthDate = (memberId: string, monthKey: string) => {
    const items = transactions.filter(t => t.memberId === memberId && t.monthKey === monthKey);
    return items.map(item => item.paymentDate).filter(Boolean).join(', ');
  };

  // Saved/mutated action handles
  const handleSavePrevEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCellEdit) return;
    const mId = activeCellEdit.memberId;
    const original = members.find(m => m.id === mId);
    if (!original) return;

    const updated = {
      ...original,
      remainingPrevious: Number(cellEditPrevRemaining),
      paidPrevious: Number(cellEditPrevPaid),
      paidPreviousDate: cellEditPrevDate
    };

    const updatedList = members.map(m => m.id === mId ? updated : m);
    setMembers(updatedList);
    PortalDatabase.set('members', updatedList);
    logAudit('EDIT', 'On-Sheet Adjust Previous Dues', mId, JSON.stringify(original), JSON.stringify(updated));
    setActiveCellEdit(null);
  };

  const handleSavePaymentEdit = (shouldDelete = false) => {
    if (!activeCellEdit) return;
    const { memberId, type, monthKey } = activeCellEdit;
    const mKey = type === 'khatm' ? 'khatm' : (monthKey || 'January');

    const existingList = transactions.filter(t => t.memberId === memberId && t.monthKey === mKey);
    const existing = existingList[0];

    let updatedList: FundMemberTransaction[] = [];
    if (shouldDelete) {
      if (existingList.length > 0) {
        updatedList = transactions.filter(t => !(t.memberId === memberId && t.monthKey === mKey));
        logAudit('DELETE', `On-Sheet Clear Payment (${mKey})`, memberId, JSON.stringify(existingList), 'ENTRIES PURGED');
      } else {
        updatedList = [...transactions];
      }
    } else {
      if (existingList.length > 0) {
        const otherTxs = transactions.filter(t => !(t.memberId === memberId && t.monthKey === mKey));
        const updatedTx = { ...existing, amount: cellEditAmount, paymentDate: cellEditDate };
        updatedList = [...otherTxs, updatedTx];
        logAudit('EDIT', `On-Sheet Modify Payment (${mKey})`, memberId, JSON.stringify(existingList), JSON.stringify(updatedTx));
      } else {
        const newTx: FundMemberTransaction = {
          id: `t-${Date.now()}`,
          memberId,
          monthKey: mKey,
          amount: cellEditAmount,
          paymentDate: cellEditDate
        };
        updatedList = [...transactions, newTx];
        logAudit('ADD', `On-Sheet Record Payment (${mKey})`, memberId, '', JSON.stringify(newTx));
      }
    }

    setTransactions(updatedList);
    PortalDatabase.set('transactions', updatedList);
    setActiveCellEdit(null);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMemberEdit) return;

    if (activeMemberEdit.memberId) {
      // Edit Profile
      const mId = activeMemberEdit.memberId;
      const original = members.find(m => m.id === mId);
      if (!original) return;

      const updated = {
        ...original,
        name: activeMemberEdit.name,
        phone: activeMemberEdit.phone,
        requiredAmount: Number(activeMemberEdit.requiredAmount),
        remainingPrevious: Number(activeMemberEdit.remainingPrevious || 0),
        paidPrevious: Number(activeMemberEdit.paidPrevious || 0),
        paidPreviousDate: activeMemberEdit.paidPreviousDate || ''
      };

      const updatedList = members.map(m => m.id === mId ? updated : m);
      setMembers(updatedList);
      PortalDatabase.set('members', updatedList);
      logAudit('EDIT', 'Modify Contributor Profile', mId, JSON.stringify(original), JSON.stringify(updated));
    } else {
      // Create Profile
      const newM: FundMember = {
        id: `m-${Date.now()}`,
        fundId: fund.id,
        name: activeMemberEdit.name,
        phone: activeMemberEdit.phone,
        requiredAmount: Number(activeMemberEdit.requiredAmount),
        remainingPrevious: Number(activeMemberEdit.remainingPrevious || 0),
        paidPrevious: Number(activeMemberEdit.paidPrevious || 0),
        paidPreviousDate: activeMemberEdit.paidPreviousDate || ''
      };

      const updatedList = [...members, newM];
      setMembers(updatedList);
      PortalDatabase.set('members', updatedList);
      logAudit('ADD', 'Register Contributor Profile', newM.id, '', JSON.stringify(newM));
    }

    setActiveMemberEdit(null);
  };

  const handleDeleteMember = (mId: string) => {
    setMemberToDelete(mId);
  };

  const confirmDeleteMember = () => {
    if (!memberToDelete) return;
    const original = members.find(m => m.id === memberToDelete);
    if (!original) return;
    
    const updatedMembers = members.filter(m => m.id !== memberToDelete);
    const updatedTx = transactions.filter(t => t.memberId !== memberToDelete);

    setMembers(updatedMembers);
    PortalDatabase.set('members', updatedMembers);

    setTransactions(updatedTx);
    PortalDatabase.set('transactions', updatedTx);

    logAudit('DELETE', 'Purged Contributor Profile', memberToDelete, JSON.stringify(original), 'MEMBER PURGED');
    setMemberToDelete(null);
  };

  // Profile overlay calculations
  const profileMember = members.find(m => m.id === selectedProfileId);
  const profileTransactions = transactions.filter(t => t.memberId === selectedProfileId);
  const profilePaidSum = profileTransactions.filter(t => t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);

  // Column footers / Totals Calculations
  const getPrevRemainingTotal = () => orderedMembers.reduce((s, m) => s + (m.remainingPrevious || 0), 0);
  const getPrevPaidTotal = () => orderedMembers.reduce((s, m) => s + (m.paidPrevious || 0), 0);
  const getKhatmTotal = () => {
    if (fund.type !== 'masjid') return 0;
    return orderedMembers.reduce((s, m) => s + getMonthPayment(m.id, 'khatm'), 0);
  };
  const getMonthTotalAmount = (month: string) => orderedMembers.reduce((s, m) => s + getMonthPayment(m.id, month), 0);
  const getRequiredTotalSum = () => orderedMembers.reduce((s, m) => s + m.requiredAmount, 0);
  const getPaidTotalSum = () => orderedMembers.reduce((s, m) => {
    const mTrans = transactions.filter(t => t.memberId === m.id);
    return s + mTrans.filter(t => t.monthKey !== 'khatm').reduce((colSum, item) => colSum + item.amount, 0);
  }, 0);
  const getBalanceTotalSum = () => orderedMembers.reduce((s, m) => {
    const mTrans = transactions.filter(t => t.memberId === m.id);
    const paidSum = mTrans.filter(t => t.monthKey !== 'khatm').reduce((colSum, item) => colSum + item.amount, 0);
    return s + (m.requiredAmount - paidSum);
  }, 0);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title & Add Members widgets */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-pine-border/40 pb-4">
        <div>
          <h3 className="text-lg font-heading font-extrabold text-white uppercase tracking-tight flex items-center gap-2">
            <span className="p-1 px-1.5 bg-pine-btn/20 text-pine-btn-hover rounded font-mono font-bold text-sm">PRO</span>
            {fund.name} Dynamic Financial Register Sheet
          </h3>
          <p className="text-xs text-pine-text-muted mt-0.5">
            {fund.type === 'project' 
              ? 'Active campaign contributors, phase-wise transaction tracking audit ledger registers.' 
              : 'Active category members, monthly transactions tracking audit ledger registers.'}
          </p>
        </div>

        <div className="flex gap-2">
          {isFundAdminUnlocked && (
            <button
              onClick={() => setActiveMemberEdit({ name: '', phone: '', requiredAmount: 12000, remainingPrevious: 0, paidPrevious: 0, paidPreviousDate: '' })}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-button uppercase tracking-wider py-2 px-3.5 rounded-lg shadow-md transition-all font-sans"
            >
              <UserPlus className="w-4 h-4" /> Add Contributor
            </button>
          )}

          <button 
            onClick={() => printGeneralRegistryReport(orderedMembers, currentFundMembers, transactions, monthsList, fund)}
            className="flex items-center gap-1.5 bg-pine-bar hover:bg-pine-hover border border-pine-border font-button font-bold text-xs uppercase text-white py-2 px-4 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-pine-btn-hover" /> Print Filtered Report
          </button>
        </div>
      </div>

      {/* Control panel: Sorting & Comprehensive Filter Buttons */}
      <div className="bg-pine-card border border-pine-border/80 p-5 rounded-2xl space-y-4 shadow-xl font-sans">
        
        {/* Row 1: Term searching and S# / Name Sorting controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-pine-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search donor name or phone number..."
              className="w-full bg-pine-bar/60 border border-pine-border pl-9 pr-4 py-2 text-xs rounded-lg text-white font-sans focus:outline-none focus:border-pine-btn"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-pine-text-body font-sans">
            <span className="font-semibold text-pine-text-muted">Display Sorting:</span>
            <div className="inline-flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => setSortBy('sr')}
                className={`px-3 py-1.5 text-[11px] font-button rounded-l-md border ${
                  sortBy === 'sr' 
                    ? 'bg-pine-btn border-pine-btn text-white' 
                    : 'bg-pine-bar/40 border-pine-border text-pine-text-muted hover:bg-pine-hover/10'
                }`}
              >
                Default (S# Number)
              </button>
              <button
                type="button"
                onClick={() => setSortBy('name')}
                className={`px-3 py-1.5 text-[11px] font-button rounded-r-md border-t border-b border-r ${
                  sortBy === 'name' 
                    ? 'bg-pine-btn border-pine-btn text-white' 
                    : 'bg-pine-bar/40 border-pine-border text-pine-text-muted hover:bg-pine-hover/10'
                }`}
              >
                Alphabetical (Name A-Z)
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Comprehensive Categorized Filter Buttons */}
        <div>
          <span className="block text-[11px] uppercase tracking-wider font-extrabold text-pine-btn-hover mb-2.5">
            {fund.type === 'project' ? 'Project Phase Audit Filters:' : 'Audit Ledger Filters & Action Lists:'}
          </span>
          <div className="flex flex-wrap gap-2.5 font-sans">
            <button
              onClick={() => setActiveFilter('all')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'all' 
                  ? 'bg-pine-btn border-pine-btn text-white shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
            >
              All Members ({currentFundMembers.length})
            </button>

            <button
              onClick={() => setActiveFilter('track')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'track' 
                  ? 'bg-emerald-650 border-emerald-500 text-white shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
              title="Current total paid >= required target rate"
            >
              On Track
            </button>

            <button
              onClick={() => setActiveFilter('behind')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'behind' 
                  ? 'bg-amber-650 border-amber-500 text-zinc-900 shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
              title="Current total paid is less than annual expectation"
            >
              Behind Schedule
            </button>

            <button
              onClick={() => setActiveFilter('partial-payers')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'partial-payers' 
                  ? 'bg-sky-700 border-sky-500 text-white shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
              title="Paid something this year, but not completed yet"
            >
              Partial Payers
            </button>

            <button
              onClick={() => setActiveFilter('monthly-defaulters')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'monthly-defaulters' 
                  ? 'bg-rose-900/60 border-rose-500 text-rose-300 shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
              title={fund.type === 'project' ? "No payment recorded for the current active phase" : "No payment recorded for the current active month"}
            >
              {fund.type === 'project' ? 'Phase Defaulters' : 'Monthly Defaulters'}
            </button>

            <button
              onClick={() => setActiveFilter('no-activity')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'no-activity' 
                  ? 'bg-zinc-800 border-zinc-650 text-white shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
              title={fund.type === 'project' ? "Paid exactly 0 Rs for this project" : "Paid exactly 0 Rs this year"}
            >
              {fund.type === 'project' ? 'No Activity (Zero Paid)' : 'No Payment This Year (Zero Paid)'}
            </button>

            {fund.type === 'masjid' && (
              <>
                <button
                  onClick={() => setActiveFilter('no-khatm')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                    activeFilter === 'no-khatm' 
                      ? 'bg-blue-900/60 border-blue-500 text-blue-300 shadow-md' 
                      : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
                  }`}
                >
                  Khatm-ul-Quran Unpaid
                </button>
                <button
                  onClick={() => setActiveFilter('with-khatm')}
                  className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                    activeFilter === 'with-khatm' 
                      ? 'bg-emerald-800 border-emerald-500 text-white shadow-md' 
                      : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
                  }`}
                >
                  Khatm-ul-Quran Paid
                </button>
              </>
            )}

            <button
              onClick={() => setActiveFilter('all-cleared')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'all-cleared' 
                  ? 'bg-teal-750 border-teal-500 text-white shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
              title="Total remaining is 0 Rs and Khatm payment done"
            >
              Fully Cleared Dues
            </button>

            <button
              onClick={() => setActiveFilter('prev-cleared')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'prev-cleared' 
                  ? 'bg-fuchsia-900/60 border-fuchsia-500 text-fuchsia-250 shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
              title="Remaining dues from previous year is zero"
            >
              Prev-Year Cleared
            </button>

            <button
              onClick={() => setActiveFilter('high-contributors')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'high-contributors' 
                  ? 'bg-violet-900/65 border-violet-500 text-violet-200 shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
            >
              Top Contributors ↑
            </button>

            <button
              onClick={() => setActiveFilter('low-contributors')}
              className={`py-1.5 px-3 rounded-lg text-[10.5px] uppercase font-bold border transition-all ${
                activeFilter === 'low-contributors' 
                  ? 'bg-indigo-950/65 border-indigo-700/60 text-indigo-300 shadow-md' 
                  : 'bg-pine-bar/30 border-pine-border/60 text-pine-text-muted hover:bg-pine-hover hover:text-white'
              }`}
            >
              Low Contributors ↓
            </button>
          </div>
        </div>

        {/* Dynamic Month/Phase Filters */}
        <div className="pt-2 border-t border-pine-border/30">
          <span className="block text-[10px] uppercase tracking-[0.2em] font-black text-pine-text-muted mb-3 italic">
            Quick Filter by {fund.type === 'project' ? 'Phase' : 'Month'}:
          </span>
          <div className="flex flex-wrap gap-2">
            {monthsList.map((mKey) => (
              <button
                key={mKey}
                onClick={() => setActiveMonthFilter(mKey === activeMonthFilter ? null : mKey)}
                className={`py-1.5 px-3 rounded-lg text-[10px] uppercase font-black tracking-tight border transition-all ${
                  activeMonthFilter === mKey 
                    ? 'bg-white border-white text-black shadow-lg scale-105' 
                    : 'bg-pine-bar/40 border-pine-border/40 text-pine-text-muted hover:bg-white hover:text-black hover:border-white'
                }`}
              >
                {mKey}
              </button>
            ))}
            {activeMonthFilter && (
              <button 
                onClick={() => setActiveMonthFilter(null)}
                className="px-2 text-[10px] uppercase font-black text-rose-400 hover:text-rose-300"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Massive Pivot table container with solid scroll locks */}
      <div className="overflow-x-auto overflow-y-auto rounded-xl border border-pine-border bg-[var(--color-pine-bar)] max-h-[65vh] shadow-2xl relative">
        <div className="min-w-max">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--color-pine-bar)] sticky top-0 z-30 text-pine-text-heading font-button text-[10px] uppercase tracking-wider border-b border-pine-border select-none">
                <th className="py-3 px-3.5 sticky left-0 bg-[var(--color-pine-bar)] z-40 border-r border-pine-border text-center w-12">Sr</th>
                <th className="py-3 px-5 sticky left-12 bg-[var(--color-pine-bar)] z-40 text-left border-r border-pine-border w-52">Donor Name</th>
                {fund.type !== 'project' && (
                  <>
                    <th className="py-3 px-4 text-center">Prev Remaining</th>
                    <th className="py-3 px-4 text-center">Prev Paid</th>
                    <th className="py-3 px-4 text-center border-r border-pine-border">Prev Pay Date</th>
                  </>
                )}
                {fund.type === 'masjid' && (
                  <>
                    <th className="py-3 px-4 text-center bg-emerald-950/40 text-emerald-400">Khatm Quran</th>
                    <th className="py-3 px-4 text-center bg-emerald-950/40 text-emerald-400 border-r border-pine-border">Khatm Date</th>
                  </>
                )}
                
                {/* Scrollable Month pivots headers */}
                {monthsList.map((m) => (
                  <React.Fragment key={m}>
                    <th className="py-3 px-4 text-center border-l border-pine-border/30 bg-pine-hover/5">{m} Amount</th>
                    <th className="py-3 px-4 text-center bg-pine-hover/5 border-r border-pine-border">Pay Date</th>
                  </React.Fragment>
                ))}
                
                <th className="py-3 px-5 text-center border-l border-pine-border bg-emerald-950/15">Required</th>
                <th className="py-3 px-5 text-center bg-emerald-950/15">Paid Total</th>
                <th className="py-3 px-5 text-center bg-emerald-950/15">Balance Due</th>
                <th className="py-3 px-5 text-right border-l border-pine-border">Phone Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pine-border/45 bg-pine-bg">
              {orderedMembers.map((m, index) => {
                // S# resolves
                const naturalSNo = currentFundMembers.findIndex(x => x.id === m.id) + 1;

                const mTrans = transactions.filter(t => t.memberId === m.id);
                // Monthly paid sum limits previous / khatm entries
                const paidSum = mTrans.filter(t => t.monthKey !== 'khatm').reduce((s, item) => s + item.amount, 0);
                const isKhatmDone = mTrans.some(t => t.monthKey === 'khatm' && t.amount > 0);
                const khatmVal = mTrans.find(t => t.monthKey === 'khatm')?.amount || 0;
                const khatmDateStr = mTrans.find(t => t.monthKey === 'khatm')?.paymentDate || '';
                const balance = m.requiredAmount - paidSum;

                return (
                  <tr key={m.id} className="hover:bg-pine-hover/10 transition-colors group">
                    {/* Sticky S# Column with Admin delete option */}
                    <td className="py-3 px-3.5 text-center font-mono text-pine-text-muted sticky left-0 bg-[var(--color-pine-bar)] z-20 border-r border-pine-border">
                      {isFundAdminUnlocked ? (
                        <button 
                          onClick={() => handleDeleteMember(m.id)}
                          className="text-rose-450 hover:text-rose-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Purge contributor record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                      <span className={isFundAdminUnlocked ? "group-hover:hidden" : ""}>{naturalSNo}</span>
                    </td>

                    {/* Sticky Contributor Name with double control option */}
                    <td className="py-3 px-5 font-sans font-semibold sticky left-12 bg-[var(--color-pine-bar)] z-20 border-r border-pine-border text-white flex items-center justify-between gap-1">
                      <span 
                        onClick={() => setSelectedProfileId(m.id)}
                        className="hover:underline cursor-pointer hover:text-pine-btn-hover truncate"
                        title="Click to view Statement receipts logs"
                      >
                        {m.name}
                      </span>
                      {isFundAdminUnlocked && (
                        <button 
                          onClick={() => setActiveMemberEdit({
                            memberId: m.id,
                            name: m.name,
                            phone: m.phone,
                            requiredAmount: m.requiredAmount,
                            remainingPrevious: m.remainingPrevious,
                            paidPrevious: m.paidPrevious,
                            paidPreviousDate: m.paidPreviousDate || ''
                          })}
                          className="p-1 text-pine-btn hover:text-white rounded transition-colors"
                          title="Edit member settings"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </td>

                    {fund.type !== 'project' && (
                      <>
                        {/* Prev Year Remaining Dues */}
                        <td 
                          onClick={() => isFundAdminUnlocked ? setActiveCellEdit({ memberId: m.id, type: 'prev' }) : null}
                          className={`py-3 px-4 text-center font-bold text-rose-350 ${
                            isFundAdminUnlocked ? 'hover:bg-pine-btn/25 hover:text-white cursor-pointer' : ''
                          }`}
                        >
                          {m.remainingPrevious > 0 ? `${m.remainingPrevious.toLocaleString()} Rs` : '0 Rs'}
                        </td>

                        {/* Prev Year Paid Amount */}
                        <td 
                          onClick={() => isFundAdminUnlocked ? setActiveCellEdit({ memberId: m.id, type: 'prev' }) : null}
                          className={`py-3 px-4 text-center font-bold text-emerald-455 ${
                            isFundAdminUnlocked ? 'hover:bg-pine-btn/25 hover:text-white cursor-pointer' : ''
                          }`}
                        >
                          {m.paidPrevious > 0 ? `${m.paidPrevious.toLocaleString()} Rs` : '0 Rs'}
                        </td>

                        {/* Prev Year Payment date */}
                        <td 
                          onClick={() => isFundAdminUnlocked ? setActiveCellEdit({ memberId: m.id, type: 'prev' }) : null}
                          className={`py-3 px-4 text-center font-mono text-[10px] text-zinc-400 border-r border-pine-border ${
                            isFundAdminUnlocked ? 'hover:bg-pine-btn/25 hover:text-white cursor-pointer' : ''
                          }`}
                        >
                          {m.paidPreviousDate || '-'}
                        </td>
                      </>
                    )}

                    {/* Khatm Quran section (Masjid only) */}
                    {fund.type === 'masjid' && (
                      <>
                        <td 
                          onClick={() => isFundAdminUnlocked ? setActiveCellEdit({ memberId: m.id, type: 'khatm' }) : null}
                          className={`py-3 px-4 text-center font-bold font-sans bg-emerald-950/10 text-emerald-400 ${
                            isFundAdminUnlocked ? 'hover:bg-emerald-800/40 cursor-pointer' : ''
                          }`}
                        >
                          {khatmVal > 0 ? `${khatmVal.toLocaleString()} Rs` : '-'}
                        </td>
                        <td 
                          onClick={() => isFundAdminUnlocked ? setActiveCellEdit({ memberId: m.id, type: 'khatm' }) : null}
                          className={`py-3 px-4 text-center font-mono text-[10px] text-zinc-400 bg-emerald-950/10 border-r border-pine-border ${
                            isFundAdminUnlocked ? 'hover:bg-emerald-800/40 cursor-pointer' : ''
                          }`}
                        >
                          {khatmDateStr || '-'}
                        </td>
                      </>
                    )}

                    {/* Month columns loops */}
                    {monthsList.map((month) => {
                      const amount = getMonthPayment(m.id, month);
                      const pDate = getMonthDate(m.id, month);
                      return (
                        <React.Fragment key={month}>
                          <td 
                            onClick={() => isFundAdminUnlocked ? setActiveCellEdit({ memberId: m.id, type: 'month', monthKey: month }) : null}
                            className={`py-3 px-4 text-center font-bold border-l border-zinc-700/40 text-white ${
                              isFundAdminUnlocked ? 'hover:bg-pine-btn/30 cursor-pointer' : ''
                            }`}
                          >
                            {amount > 0 ? `${amount.toLocaleString()} Rs` : '-'}
                          </td>
                          <td 
                            onClick={() => isFundAdminUnlocked ? setActiveCellEdit({ memberId: m.id, type: 'month', monthKey: month }) : null}
                            className={`py-3 px-4 text-center font-mono text-zinc-450 text-[10px] border-r border-zinc-700/40 ${
                              isFundAdminUnlocked ? 'hover:bg-pine-btn/30 cursor-pointer' : ''
                            }`}
                          >
                            {pDate || '-'}
                          </td>
                        </React.Fragment>
                      );
                    })}

                    {/* Balance and Target values */}
                    <td className="py-3 px-5 text-center font-extrabold text-white border-l border-pine-border bg-emerald-950/5">
                      {m.requiredAmount.toLocaleString()} Rs
                    </td>
                    <td className="py-3 px-5 text-center font-extrabold text-emerald-450 bg-emerald-950/5">
                      {paidSum.toLocaleString()} Rs
                    </td>
                    <td className={`py-3 px-5 text-center font-extrabold bg-emerald-950/5 ${balance <= 0 ? 'text-blue-400' : 'text-rose-450'}`}>
                      {balance <= 0 ? 'CLEARED' : `${balance.toLocaleString()} Rs`}
                    </td>
                    
                    {/* Contributor Mobile */}
                    <td className="py-3 px-5 text-right font-mono text-zinc-400 border-l border-pine-border">
                      {m.phone}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Sum Calculations Row */}
            {orderedMembers.length > 0 && (
              <tfoot>
                <tr className="bg-[var(--color-pine-bar)] text-white border-t border-pine-border font-sans font-bold text-xs sticky bottom-0 z-30 select-none uppercase divide-y-0">
                  <td className="py-3 px-3.5 sticky left-0 bg-[var(--color-pine-bar)] z-40 border-r border-pine-border text-center">
                    SUM
                  </td>
                  <td className="py-3 px-5 sticky left-12 bg-[var(--color-pine-bar)] z-40 border-r border-pine-border text-left truncate font-medium text-[10.5px]">
                    {orderedMembers.length} contributors
                  </td>
                  
                  {/* Prev dues sums */}
                  {fund.type !== 'project' && (
                    <>
                      <td className="py-3 px-4 text-center text-rose-350">
                        {getPrevRemainingTotal().toLocaleString()} Rs
                      </td>
                      <td className="py-3 px-4 text-center text-emerald-450">
                        {getPrevPaidTotal().toLocaleString()} Rs
                      </td>
                      <td className="py-3 px-4 border-r border-pine-border"></td>
                    </>
                  )}

                  {/* Khatm sums */}
                  {fund.type === 'masjid' && (
                    <>
                      <td className="py-3 px-4 text-center text-emerald-400 bg-emerald-950/30">
                        {getKhatmTotal().toLocaleString()} Rs
                      </td>
                      <td className="py-3 px-4 bg-emerald-950/30 border-r border-pine-border"></td>
                    </>
                  )}

                  {/* Month loops totals */}
                  {monthsList.map((month) => (
                    <React.Fragment key={month}>
                      <td className="py-3 px-4 text-center border-l border-pine-border/30 bg-pine-hover/10 text-pine-btn-hover font-bold font-mono text-[11px]">
                        {getMonthTotalAmount(month).toLocaleString()} Rs
                      </td>
                      <td className="py-3 px-4 hover:bg-transparent border-r border-pine-border/40 bg-pine-hover/10"></td>
                    </React.Fragment>
                  ))}

                  {/* Cumulative targets totals */}
                  <td className="py-3 px-5 text-center text-white border-l border-pine-border bg-emerald-950/15">
                    {getRequiredTotalSum().toLocaleString()} Rs
                  </td>
                  <td className="py-3 px-5 text-center text-emerald-450 bg-emerald-950/15">
                    {getPaidTotalSum().toLocaleString()} Rs
                  </td>
                  <td className={`py-3 px-5 text-center bg-emerald-950/15 ${getBalanceTotalSum() <= 0 ? 'text-blue-400' : 'text-rose-450'}`}>
                    {getBalanceTotalSum().toLocaleString()} Rs
                  </td>
                  <td className="py-3 px-5 text-right font-mono text-zinc-400 border-l border-pine-border"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL 1: Unified Cell Amount/Date Editor Popup */}
      {activeCellEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-br from-pine-card to-pine-bar border-2 border-pine-border p-6 rounded-2xl relative shadow-2xl font-sans text-white animate-fade-in">
            <button 
              onClick={() => setActiveCellEdit(null)}
              className="absolute top-4 right-4 text-pine-text-muted hover:text-white"
            >
              ✕
            </button>

            {/* Header description */}
            <div className="mb-5 border-b border-pine-border pb-3">
              <span className="text-[10px] text-pine-btn-hover uppercase font-black tracking-wider block">Admin Cell Editor</span>
              <h4 className="text-sm font-extrabold text-white">
                {(() => {
                  const m = members.find(x => x.id === activeCellEdit.memberId);
                  return m ? `${m.name} (${activeCellEdit.type === 'prev' ? 'Previous Year Dues' : activeCellEdit.type === 'khatm' ? 'Khatm Quran' : activeCellEdit.monthKey})` : 'Update Ledger Entry';
                })()}
              </h4>
            </div>

            {activeCellEdit.type === 'prev' ? (
              <form onSubmit={handleSavePrevEdit} className="space-y-4 text-xs font-sans">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-pine-text-body mb-1">Previous Year Remaining Dues Amount (Rs)</label>
                  <input
                    type="number"
                    required
                    value={cellEditPrevRemaining}
                    onChange={(e) => setCellEditPrevRemaining(Number(e.target.value))}
                    className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-pine-text-body mb-1">Previous Year Paid Amount (Rs)</label>
                  <input
                    type="number"
                    required
                    value={cellEditPrevPaid}
                    onChange={(e) => setCellEditPrevPaid(Number(e.target.value))}
                    className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-pine-text-body mb-1">Previous dues Paid Date or verification note</label>
                  <input
                    type="text"
                    placeholder="e.g. 15-Jan-2026 or Paid"
                    value={cellEditPrevDate}
                    onChange={(e) => setCellEditPrevDate(e.target.value)}
                    className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 font-button uppercase text-[11px] text-white rounded-lg shadow-md font-bold"
                  >
                    Save Prev Dues Settings
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCellEdit(null)}
                    className="px-4 py-2 border border-pine-border hover:bg-pine-hover text-white rounded-lg font-bold text-[11px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-pine-text-body mb-1">Payment Contribution Amount (Rs)</label>
                  <input
                    type="number"
                    value={cellEditAmount}
                    onChange={(e) => setCellEditAmount(Number(e.target.value))}
                    className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg font-mono focus:outline-none"
                  />
                  
                  {/* Preset Tags */}
                  <div className="flex gap-2.5 mt-2">
                    {[1000, 2000, 3000, 5000].map((tVal) => (
                      <button
                        key={tVal}
                        type="button"
                        onClick={() => setCellEditAmount(tVal)}
                        className="py-1 px-2 border border-pine-border hover:border-pine-btn hover:text-white bg-pine-bar/30 text-[10px] rounded"
                      >
                        {tVal} Rs
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-pine-text-body mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={cellEditDate}
                    onChange={(e) => setCellEditDate(e.target.value)}
                    className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg font-mono"
                  />
                </div>

                <div className="pt-3 border-t border-pine-border/40 flex flex-wrap gap-2 justify-between">
                  {/* Delete button option */}
                  <button
                    type="button"
                    onClick={() => handleSavePaymentEdit(true)}
                    className="py-2 px-3 bg-rose-955/35 border border-rose-500/40 text-rose-350 hover:bg-rose-900/60 font-button text-[10.5px] rounded-lg uppercase"
                  >
                    Delete payment
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSavePaymentEdit(false)}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 font-button text-[10.5px] text-white rounded-lg shadow-md font-bold uppercase"
                    >
                      Save Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCellEdit(null)}
                      className="py-2 px-3 border border-pine-border hover:bg-pine-hover text-white rounded-lg text-[10.5px]"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Add or Edit Contributor Profile Details */}
      {activeMemberEdit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-gradient-to-br from-pine-card to-pine-bar border-2 border-pine-border p-6 rounded-2xl relative shadow-2xl font-sans text-white animate-fade-in text-xs">
            <button 
              onClick={() => setActiveMemberEdit(null)}
              className="absolute top-4 right-4 text-pine-text-muted hover:text-white"
            >
              ✕
            </button>

            {/* Header description */}
            <div className="mb-4 border-b border-pine-border pb-3">
              <span className="text-[10px] text-pine-btn-hover uppercase font-black tracking-wider block">Contributor Profiling</span>
              <h4 className="text-sm font-extrabold text-white">
                {activeMemberEdit.memberId ? `Modify profile: ${activeMemberEdit.name}` : 'Add New Contributor to active list'}
              </h4>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-pine-text-body mb-1">Contributor Full Name</label>
                <input
                  type="text"
                  required
                  value={activeMemberEdit.name}
                  onChange={(e) => setActiveMemberEdit({ ...activeMemberEdit, name: e.target.value })}
                  placeholder="e.g. Hafiz Muhammad Mubeen Sahib"
                  className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-pine-text-body mb-1">Mobile / Phone Line</label>
                  <input
                    type="text"
                    required
                    value={activeMemberEdit.phone}
                    onChange={(e) => setActiveMemberEdit({ ...activeMemberEdit, phone: e.target.value })}
                    placeholder="e.g. 0300-1234567"
                    className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-pine-text-body mb-1">Yearly Target Rs (Required Amount)</label>
                  <input
                    type="number"
                    required
                    value={activeMemberEdit.requiredAmount}
                    onChange={(e) => setActiveMemberEdit({ ...activeMemberEdit, requiredAmount: Number(e.target.value) })}
                    className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-xs text-white rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Configure previous totals inside form as optional settings (Only for Masjid/Bazm) */}
              {(fund.type === 'masjid' || fund.type === 'bazm') && (
                <div className="bg-pine-bar/25 p-4 rounded-xl border border-pine-border/60 grid grid-cols-3 gap-2">
                  <div className="col-span-3 mb-2 border-b border-pine-border/40 pb-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Opening Previous Year Balance Ledger</span>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-pine-text-body mb-1">Remaining dues</label>
                    <input
                      type="number"
                      value={activeMemberEdit.remainingPrevious || 0}
                      onChange={(e) => setActiveMemberEdit({ ...activeMemberEdit, remainingPrevious: Number(e.target.value) })}
                      className="w-full bg-pine-bar/50 border border-pine-border p-1.5 px-2.5 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-pine-text-body mb-1">Paid Amount</label>
                    <input
                      type="number"
                      value={activeMemberEdit.paidPrevious || 0}
                      onChange={(e) => setActiveMemberEdit({ ...activeMemberEdit, paidPrevious: Number(e.target.value) })}
                      className="w-full bg-pine-bar/50 border border-pine-border p-1.5 px-2.5 rounded text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-pine-text-body mb-1">Paid Date</label>
                    <input
                      type="text"
                      placeholder="15-Jan-2026"
                      value={activeMemberEdit.paidPreviousDate || ''}
                      onChange={(e) => setActiveMemberEdit({ ...activeMemberEdit, paidPreviousDate: e.target.value })}
                      className="w-full bg-pine-bar/50 border border-pine-border p-1.5 px-2.5 rounded text-white text-[10px]"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-pine-border/40">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-button uppercase text-xs text-white rounded-lg font-bold shadow-lg shadow-emerald-950/40"
                >
                  Save Contributor Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMemberEdit(null)}
                  className="px-5 py-2.5 border border-pine-border hover:bg-pine-hover text-white rounded-lg text-xs"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE MEMBER CONFIRMATION */}
      {memberToDelete && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-lg z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-[#091514] border-2 border-red-900/50 p-8 rounded-3xl shadow-[0_0_50px_rgba(127,29,29,0.3)] animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/40">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>
            <h3 className="text-xl font-heading font-black text-white text-center mb-2 uppercase tracking-tighter">Contributor Purge</h3>
            <p className="text-sm text-zinc-400 text-center mb-8 leading-relaxed">
              Kya aap is member aur un ke tamaam puraney record ko is register se mukkamal delete karna chahte hain? Ye amal wapas nahi liya ja sakta.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => confirmDeleteMember()}
                className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white font-button font-bold rounded-2xl transition-all shadow-lg shadow-rose-950/40"
              >
                Yes, Purge Record
              </button>
              <button
                onClick={() => setMemberToDelete(null)}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-button font-bold rounded-2xl transition-all"
              >
                No, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Ledger individual detail overlays */}
      {selectedProfileId && profileMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gradient-to-br from-pine-card to-pine-bar border border-pine-border p-8 rounded-2xl relative shadow-2xl text-white">
            <button 
              onClick={() => setSelectedProfileId(null)}
              className="absolute top-4 right-4 text-pine-text-muted hover:text-white"
            >
              ✕
            </button>

            <div className="flex gap-4 items-center mb-6 border-b border-pine-border pb-4">
              <div className="w-12 h-12 rounded-full bg-pine-btn flex items-center justify-center text-white text-lg font-bold">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-heading font-extrabold text-white">{profileMember.name}</h4>
                <p className="text-xs text-pine-text-muted flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {profileMember.phone}</p>
              </div>
            </div>



            <h5 className="text-xs uppercase tracking-wider font-button text-white mb-3">Individual Monthly Statement Breakdown</h5>
            <div className="max-h-56 overflow-y-auto rounded-lg border border-pine-border/60">
              <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-pine-bar text-pine-text-muted">
                  <tr>
                    <th className="py-2.5 px-4 font-sans">Month</th>
                    <th className="py-2.5 px-4 text-center">Amount Registered</th>
                    <th className="py-2.5 px-4 text-right">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pine-border/40">
                  {monthsList.map(month => {
                    const amt = getMonthPayment(profileMember.id, month);
                    const d = getMonthDate(profileMember.id, month);
                    return (
                      <tr key={month} className="hover:bg-pine-hover/10">
                        <td className="py-2 px-4 font-sans text-white font-medium">{month}</td>
                        <td className="py-2 px-4 text-center font-bold text-pine-success">
                          {amt > 0 ? (
                            <div className="flex items-center justify-center gap-2">
                              <span>{amt.toLocaleString()} Rs</span>
                              <button
                                onClick={() => setSelectedReceipt({
                                  id: `rec-${profileMember.id}-${month.substring(0,3)}`,
                                  memberName: profileMember.name,
                                  memberPhone: profileMember.phone,
                                  monthKey: `${month} Contribution`,
                                  amount: amt,
                                  paymentDate: d,
                                  fundName: fund.name
                                })}
                                title="Print Cash Receipt"
                                className="p-1 rounded text-pine-btn hover:bg-pine-hover/30 transition-all font-sans cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-2 px-4 text-right text-pine-text-muted text-[10px]">{d || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => {
                  if (profileMember) {
                    printMemberStatement(profileMember, profileTransactions, monthsList, fund.name);
                  }
                }}
                className="py-1.5 px-4 rounded text-xs font-button uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Printer className="w-3.5 h-3.5" /> Print Single Person Report
              </button>
              <MagneticButton 
                onClick={() => {
                  if (profileMember) {
                    printMemberStatement(profileMember, profileTransactions, monthsList, fund.name);
                  }
                }}
                className="py-1.5 px-4 text-xs font-button uppercase tracking-wider bg-pine-btn hover:bg-pine-btn-hover cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 inline mr-1" /> Print Single Person Report
              </MagneticButton>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE MEMBER INDIVIDUAL REPORT PRINT LAYOUT (HIDDEN ON SCREEN, VISIBLE ON PRINT) */}
      {selectedProfileId && profileMember && (
        <div className="hidden print:block print-report-area min-w-full text-black bg-white p-8 font-sans">
          {/* Print Header */}
          <div className="border-b-4 border-double border-zinc-900 pb-4 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900">MASJID AL-HABIB NOORANI</h2>
            <h3 className="text-xs font-bold tracking-widest text-zinc-650 mt-1 uppercase">INDIVIDUAL FINANCIAL STATEMENT REPORT — {fund.name.toUpperCase()}</h3>
            <div className="text-[9px] font-mono text-zinc-500 mt-1.5">
              Report Generated: {new Date().toLocaleString()} | Account Status Summary
            </div>
          </div>

          {/* Member Profile info block */}
          <div className="relative border border-zinc-300 rounded-xl p-5 my-6 bg-zinc-50/50 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase text-zinc-500 font-bold">Contributor Details / ممبر کی معلومات</p>
              <p className="text-base font-black text-zinc-900 mt-0.5">{profileMember.name}</p>
              <p className="text-zinc-600 font-mono mt-0.5">Phone: {profileMember.phone || 'None Provided'}</p>
              <p className="text-zinc-600 font-mono">Registry Category: {fund.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="border border-zinc-300 bg-white rounded p-1.5">
                <span className="text-[9px] text-zinc-500 uppercase block">Annual Goal (ہدف)</span>
                <span className="text-xs font-mono font-bold text-zinc-900">{profileMember.requiredAmount.toLocaleString()} Rs</span>
              </div>
              <div className="border border-zinc-300 bg-white rounded p-1.5">
                <span className="text-[9px] text-zinc-500 uppercase block">Paid Total (موصول)</span>
                <span className="text-xs font-mono font-bold text-zinc-900">{profilePaidSum.toLocaleString()} Rs</span>
              </div>
              <div className="border border-zinc-300 bg-white rounded col-span-2 p-1.5">
                <span className="text-[9px] text-zinc-500 uppercase block">Remaining Balance Dues (بقایا واجب الادا رقم)</span>
                <span className="text-sm font-mono font-black text-zinc-900">
                  {(profileMember.requiredAmount - profilePaidSum).toLocaleString()} Rs
                </span>
              </div>
            </div>
          </div>

          {/* Previous opening balances */}
          {fund.type !== 'project' && (profileMember.remainingPrevious > 0 || profileMember.paidPrevious > 0) && (
            <div className="border border-zinc-300 rounded-xl p-4 my-4 bg-zinc-50/30 text-xs">
              <h4 className="text-[10px] font-bold uppercase text-zinc-500 mb-2">Opening Previous Balance Summary</h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[9px] text-zinc-500 block">Dues Remaining</span>
                  <span className="font-mono font-bold">{profileMember.remainingPrevious.toLocaleString()} Rs</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block">Amount Paid</span>
                  <span className="font-mono font-bold">{profileMember.paidPrevious.toLocaleString()} Rs</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 block">Payment Date</span>
                  <span className="font-mono">{profileMember.paidPreviousDate || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Complete tabular monthly breakdown */}
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 mb-2 border-b border-zinc-300 pb-1">Combined Monthly Contribution Ledger — 12 Months Registry</h4>
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-100 border-t border-b border-zinc-400 text-zinc-900">
                <th className="py-2.5 px-4 font-sans font-bold">Month Index</th>
                <th className="py-2.5 px-4 text-center font-sans font-bold">Amount Paid (Rs)</th>
                <th className="py-2.5 px-4 text-right font-sans font-bold flex-nowrap shrink-0">Payment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {monthsList.map((month, idx) => {
                const amt = getMonthPayment(profileMember.id, month);
                const d = getMonthDate(profileMember.id, month);
                return (
                  <tr key={month} className="text-zinc-800">
                    <td className="py-2 px-4 font-sans font-medium text-zinc-950 flex items-center gap-1">
                      <span className="text-zinc-400 text-[10px]/none">{(idx+1).toString().padStart(2, '0')}.</span>
                      {month}
                    </td>
                    <td className="py-2 px-4 text-center font-bold text-zinc-950">
                      {amt > 0 ? `${amt.toLocaleString()} Rs` : '—'}
                    </td>
                    <td className="py-2 px-4 text-right text-zinc-500 font-mono text-[11px]">{d || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* FILTERED MEMBERS DIRECTORY REPORT (HIDDEN ON SCREEN, VISIBLE ON PRINT ONLY WHEN NO PROFILE VIEW IS ACTIVE) */}
      {!selectedProfileId && (
        <div className="hidden print:block print-report-area min-w-full text-black bg-white p-6 font-sans">
          {/* Print Header */}
          <div className="border-b-4 border-double border-zinc-900 pb-4 text-center">
            <h2 className="text-xl font-black uppercase tracking-wider text-zinc-900">MASJID AL-HABIB NOORANI</h2>
            <h3 className="text-xs font-bold tracking-widest text-zinc-650 mt-1 uppercase">GENERAL REGISTRY LEDGER REPORT — {fund.name.toUpperCase()}</h3>
            <div className="text-[9px] font-mono text-zinc-500 mt-1.5">
              Report Generated: {new Date().toLocaleString()} | Active filter results: {orderedMembers.length} contributors
            </div>
          </div>

          {/* Summary Row */}
          <div className="border border-zinc-300 rounded-xl p-4 my-4 bg-zinc-50 grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block font-bold">Total Contributors</span>
              <span className="text-xs font-bold text-zinc-900">{orderedMembers.length} Members</span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block font-bold">Combined Goal</span>
              <span className="text-xs font-mono font-bold text-zinc-900">
                {orderedMembers.reduce((sum, m) => sum + m.requiredAmount, 0).toLocaleString()} Rs
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block font-bold">Achieved Total</span>
              <span className="text-xs font-mono font-bold text-zinc-900">
                {orderedMembers.reduce((sum, m) => {
                  const mTrans = transactions.filter(t => t.memberId === m.id);
                  const paid = mTrans.filter(t => t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
                  return sum + paid;
                }, 0).toLocaleString()} Rs
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase block font-bold">Dues Outstanding</span>
              <span className="text-xs font-mono font-bold text-zinc-950">
                {orderedMembers.reduce((sum, m) => {
                  const mTrans = transactions.filter(t => t.memberId === m.id);
                  const paid = mTrans.filter(t => t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
                  return sum + (m.requiredAmount - paid);
                }, 0).toLocaleString()} Rs
              </span>
            </div>
          </div>

          {/* Directory table */}
          <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-[9px] border-collapse border border-zinc-400">
            <thead>
              <tr className="bg-zinc-100 text-zinc-900 uppercase font-sans font-bold border-b border-zinc-400 text-[8px]">
                <th className="py-2 px-1 border-r border-zinc-400 text-center">Sr</th>
                <th className="py-2 px-2 border-r border-zinc-400">Name of Contributor</th>
                {fund.type !== 'project' && (
                  <th className="py-2 px-1 border-r border-zinc-400 text-center">Prev Due</th>
                )}
                {monthsList.map(month => (
                  <th key={month} className="py-2 px-1 border-r border-zinc-400 text-center">{month.substring(0,3)}</th>
                ))}
                <th className="py-2 px-2 border-r border-zinc-400 text-center">Required</th>
                <th className="py-2 px-2 border-r border-zinc-400 text-center">Paid</th>
                <th className="py-2 px-2 text-center text-zinc-950">Outstanding</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-300">
              {orderedMembers.map((m, index) => {
                const mTrans = transactions.filter(t => t.memberId === m.id);
                const paidSum = mTrans.filter(t => t.monthKey !== 'khatm').reduce((s, x) => s + x.amount, 0);
                const balance = m.requiredAmount - paidSum;
                return (
                  <tr key={m.id} className="text-zinc-800">
                    <td className="py-1 px-1 border-r border-zinc-300 text-center font-bold text-zinc-500">{index + 1}</td>
                    <td className="py-1 px-2 border-r border-zinc-300 font-sans font-semibold text-zinc-950">{m.name}</td>
                    {fund.type !== 'project' && (
                      <td className="py-1 px-1 border-r border-zinc-300 text-center font-mono text-zinc-650">
                        {m.remainingPrevious > 0 ? `${m.remainingPrevious}` : '—'}
                      </td>
                    )}
                    {monthsList.map(month => {
                      const amt = getMonthPayment(m.id, month);
                      return (
                        <td key={month} className="py-1 px-1 border-r border-zinc-300 text-center font-bold">
                          {amt > 0 ? amt : '—'}
                        </td>
                      );
                    })}
                    <td className="py-1 px-2 border-r border-zinc-350 text-center font-bold text-zinc-900">{m.requiredAmount.toLocaleString()}</td>
                    <td className="py-1 px-2 border-r border-zinc-350 text-center font-bold text-zinc-900">{paidSum.toLocaleString()}</td>
                    <td className={`py-1 px-2 text-center font-black ${balance > 0 ? 'text-zinc-900' : 'text-emerald-700'}`}>
                      {balance > 0 ? balance.toLocaleString() : 'CLEAR'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    )}

    </div>
  );
}

// ----------------------------------------------------
// NESTED SUBCOMPONENT: OTHER FUND ACHIEVED SECTION
// ----------------------------------------------------
function OtherFundRegister(props: any) {
  const {
    fund,
    others,
    monthsList,
    setOthers,
    logAudit,
    isFundAdminUnlocked = false,
  } = props;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number | null>(null);
  const [editingEntry, setEditingEntry] = useState<OtherFundEntry | null>(null);


  // New Direct Inflow additions states
  const [newSource, setNewSource] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newDetails, setNewDetails] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddNewOtherEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource || !newAmount) return;
    const entry: OtherFundEntry = {
      id: 'other_' + Date.now(),
      fundId: fund.id,
      date: newDate,
      source: newSource,
      amount: Number(newAmount),
      details: newDetails
    };
    const updated = [...others, entry];
    setOthers(updated);
    PortalDatabase.set('other_fund_entries', updated);
    logAudit('ADD', 'Direct Other Inflow Donation Logged', entry.id, '', JSON.stringify(entry));
    
    // reset form fields
    setNewSource('');
    setNewAmount('');
    setNewDetails('');
    setShowAddForm(false);
  };

  // Month filters details
  const filteredOthers = others.filter(o => {
    const sTerm = searchTerm.toLowerCase();
    const matchSearch = o.source.toLowerCase().includes(sTerm) || o.details.toLowerCase().includes(sTerm);
    
    if (selectedMonthIdx !== null) {
      try {
        const oDate = new Date(o.date);
        return matchSearch && oDate.getMonth() === selectedMonthIdx;
      } catch { return false; }
    }
    return matchSearch;
  });

  const getSumOfSelectedList = () => filteredOthers.reduce((sum, o) => sum + o.amount, 0);

  const handleDelete = (id: string) => {
    const x = others.find(item => item.id === id);
    if (!x) return;
    if (window.confirm(`Aap donation entry [${x.source} - ${x.amount} Rs] ko delete karna chahte hain?`)) {
      const updated = others.filter(item => item.id !== id);
      setOthers(updated);
      PortalDatabase.set('other_fund_entries', updated);
      logAudit('DELETE', 'Other Donation Entry', id, JSON.stringify(x), 'DELETED');
    }
  };

  const handleSaveEdit = (edited: OtherFundEntry) => {
    const original = others.find(item => item.id === edited.id);
    if (!original) return;
    const updated = others.map(item => item.id === edited.id ? edited : item);
    setOthers(updated);
    PortalDatabase.set('other_fund_entries', updated);
    logAudit('EDIT', 'Other Donation Entry', edited.id, JSON.stringify(original), JSON.stringify(edited));
    setEditingEntry(null);
  };

  const currentFilterLabel = () => {
    let lbl = [];
    if (selectedMonthIdx !== null) lbl.push(`Month: ${monthsList[selectedMonthIdx]}`);
    if (searchTerm) lbl.push(`Keyword: "${searchTerm}"`);
    return lbl.join(' | ') || 'None';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-heading font-bold text-white uppercase tracking-tight">Other Achieved Donations</h3>
          <p className="text-xs text-pine-text-muted font-sans mt-0.5">One-time collections, general Friday boxes, Sadqah collections, and anonymous contributions.</p>
        </div>
        <div className="flex items-center gap-2">
          {isFundAdminUnlocked && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-pine-border font-button font-bold text-xs uppercase text-white py-2 px-4 rounded-lg shadow-sm transition-all"
            >
              {showAddForm ? <X className="w-4 h-4 text-rose-450" /> : <Plus className="w-4 h-4 text-emerald-400" />} 
              {showAddForm ? "Close Form" : "Add Direct Inflow"}
            </button>
          )}
          <button 
            onClick={() => printOtherDonationsStatement(filteredOthers, currentFilterLabel())}
            className="flex items-center gap-1.5 bg-pine-bar hover:bg-pine-hover border border-pine-border font-button font-bold text-xs uppercase text-white py-2 px-4 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-pine-btn-hover" /> Print Filtered Report
          </button>
        </div>
      </div>

      {/* Inline Direct Inflow Add Form */}
      {isFundAdminUnlocked && showAddForm && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-pine-bar/95 to-pine-bar shadow-xl animate-fade-in">
          <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-emerald-400" /> Log Direct Non-Donor Inflow Receipt
          </h3>
          <form onSubmit={handleAddNewOtherEntry} className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-pine-text-body mb-1 font-bold">Inflow Source / Sender</label>
                <input
                  type="text"
                  required
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  placeholder="e.g. iron scrap waste, friday general box collection"
                  className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-white rounded-lg focus:outline-none focus:border-pine-btn placeholder-pine-text-muted/40 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-pine-text-body mb-1 font-bold">Amount (Rs)</label>
                <input
                  type="number"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="amount in rs"
                  className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-white rounded-lg focus:outline-none focus:border-pine-btn placeholder-pine-text-muted/40 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-pine-text-body mb-1 font-bold">Receipt Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-white rounded-lg focus:outline-none focus:border-pine-btn font-mono font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-pine-text-body mb-1 font-bold">Extra Details / Memo</label>
              <textarea
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                placeholder="Zaruri malomat ya notes darj krein..."
                rows={2}
                className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-white rounded-lg focus:outline-none focus:border-pine-btn placeholder-pine-text-muted/40 font-semibold"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-2.5 px-4 border border-pine-border hover:bg-pine-hover text-zinc-200 text-xs uppercase rounded-lg font-bold tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-pine-btn hover:bg-pine-btn-hover text-white text-xs uppercase rounded-lg font-bold tracking-wider shadow-lg shadow-emerald-950/20"
              >
                Submit Inflow Log
              </button>
            </div>
          </form>
        </div>
      )}



      {/* Monthly buttons bar */}
      <div className="flex flex-wrap gap-2 items-center justify-center p-3 bg-pine-bar/40 rounded-xl border border-pine-border">
        <button
          onClick={() => setSelectedMonthIdx(null)}
          className={`py-1.5 px-3 rounded text-[10px] font-button uppercase tracking-wider ${
            selectedMonthIdx === null ? 'bg-pine-btn text-white' : 'hover:bg-pine-hover/10 text-pine-text-muted'
          }`}
        >
          All Months
        </button>
        {monthsList.map((m, idx) => (
          <button
            key={m}
            onClick={() => setSelectedMonthIdx(idx)}
            className={`py-1.5 px-3 rounded text-[10px] font-button uppercase tracking-wider ${
              selectedMonthIdx === idx ? 'bg-pine-btn text-white' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Advanced search toolbar */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pine-text-muted" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search other payments sources..."
          className="w-full bg-pine-bar/60 border border-pine-border pl-10 pr-4 py-2 rounded-lg text-xs font-sans text-white focus:outline-none focus:border-pine-btn"
        />
      </div>

      {/* Spreadsheet List */}
      <div className="overflow-x-auto rounded-xl border border-pine-border bg-pine-bar/25">
        <table className="w-full text-left font-sans text-xs border-collapse">
          <thead>
            <tr className="bg-pine-bar text-pine-text-heading font-button text-[10px] uppercase tracking-wider border-b border-pine-border">
              <th className="py-3.5 px-5">Receipt Date</th>
              <th className="py-3.5 px-5">Source / Contributor Name</th>
              <th className="py-3.5 px-5 text-right">Registered Amount</th>
              <th className="py-3.5 px-5">Reference Details</th>
              {isFundAdminUnlocked && (
                <th className="py-3.5 px-5 text-center w-28">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-border/40 font-mono">
            {filteredOthers.map((o) => (
              <tr key={o.id} className="hover:bg-pine-hover/5">
                <td className="py-3.5 px-5 text-pine-text-muted">{o.date}</td>
                <td className="py-3.5 px-5 font-sans font-semibold text-white">{o.source}</td>
                <td className="py-3.5 px-5 text-right font-bold text-pine-success">{o.amount.toLocaleString()} Rs</td>
                <td className="py-3.5 px-5 text-pine-text-body font-sans text-xs max-w-sm truncate">{o.details}</td>
                {isFundAdminUnlocked && (
                  <td className="py-2.5 px-5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingEntry(o)}
                        className="p-1.5 text-emerald-400 hover:text-white hover:bg-emerald-950/70 border border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(o.id)}
                        className="p-1.5 text-rose-450 hover:text-white hover:bg-rose-950/70 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredOthers.length === 0 && (
              <tr>
                <td colSpan={isFundAdminUnlocked ? 5 : 4} className="py-8 text-center text-xs text-pine-text-muted font-sans font-medium">No donation records found.</td>
              </tr>
            )}
            <tr className="bg-pine-bar/30 font-bold border-t border-pine-border">
              <td colSpan={2} className="py-4 px-5 font-button text-right text-pine-text-heading text-[10px] uppercase">Combined Total:</td>
              <td className="py-4 px-5 text-right text-pine-success text-sm">{getSumOfSelectedList().toLocaleString()} Rs</td>
              <td colSpan={isFundAdminUnlocked ? 2 : 1} className="py-4 px-5" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Edit Donation Modal Overlay */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-b from-pine-card to-pine-bar border border-pine-border p-6 rounded-2xl shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-button uppercase font-extrabold text-white tracking-widest">Edit Other Donation Record</h3>
              <p className="text-[11px] text-pine-text-muted mt-1 leading-relaxed animate-pulse">
                Record details ko tabdeel karein aur tabdeeli mehfooz karein.
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveEdit(editingEntry);
            }} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase text-zinc-400 mb-1">Receipt Date</label>
                <input 
                  type="date"
                  required
                  value={editingEntry.date}
                  onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                  className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-400 mb-1">Source / Contributor Name</label>
                <input 
                  type="text"
                  required
                  value={editingEntry.source}
                  onChange={(e) => setEditingEntry({ ...editingEntry, source: e.target.value })}
                  placeholder="e.g. anonymous donor, general friday box..."
                  className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-400 mb-1">Registered Amount (Rs)</label>
                <input 
                  type="number"
                  required
                  value={editingEntry.amount}
                  onChange={(e) => setEditingEntry({ ...editingEntry, amount: Number(e.target.value) })}
                  className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-400 mb-1">Reference / Details</label>
                <textarea 
                  value={editingEntry.details}
                  onChange={(e) => setEditingEntry({ ...editingEntry, details: e.target.value })}
                  placeholder="Voucher or other description..."
                  rows={2}
                  className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-pine-btn"
                />
              </div>

              <div className="flex gap-2 pt-2.5">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="flex-1 py-1.5 border border-pine-border hover:bg-pine-hover text-xs text-zinc-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-pine-btn hover:bg-pine-btn-hover text-xs text-white rounded-lg font-bold"
                >
                  Apply Edit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// NESTED SUBCOMPONENT: EXPENSES SECTION
// ----------------------------------------------------
interface ExpensesRegisterProps {
  fund: FundModule;
  expenses: Expense[];
  monthsList: string[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  logAudit: (action: AuditLog['action'], module: string, recordId: string, oldValue: any, newValue: any) => void;
  isFundAdminUnlocked?: boolean;
}

function ExpensesRegister({
  fund,
  expenses,
  monthsList,
  setExpenses,
  logAudit,
  isFundAdminUnlocked = false,
}: ExpensesRegisterProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // New Direct Expense Addition states
  const [newExpName, setNewExpName] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpDate, setNewExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newExpDetails, setNewExpDetails] = useState('');
  const [showAddExpForm, setShowAddExpForm] = useState(false);

  const handleAddNewExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName || !newExpAmount) return;
    const exp: Expense = {
      id: 'exp_' + Date.now(),
      fundId: fund.id,
      name: newExpName,
      amount: Number(newExpAmount),
      date: newExpDate,
      details: newExpDetails
    };
    const updated = [...expenses, exp];
    setExpenses(updated);
    PortalDatabase.set('expenses', updated);
    logAudit('ADD', 'Direct Operational Spend Registered Directly', exp.id, '', JSON.stringify(exp));

    // reset fields
    setNewExpName('');
    setNewExpAmount('');
    setNewExpDetails('');
    setShowAddExpForm(false);
  };

  const filteredExpenses = expenses.filter(e => {
    const sTerm = searchTerm.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(sTerm) || e.details.toLowerCase().includes(sTerm);

    if (selectedMonthIdx !== null) {
      try {
        const eDate = new Date(e.date);
        return matchSearch && eDate.getMonth() === selectedMonthIdx;
      } catch { return false; }
    }
    return matchSearch;
  });

  const getSumOfSelectedExpenses = () => filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const handleDeleteExpense = (id: string) => {
    const x = expenses.find(item => item.id === id);
    if (!x) return;
    if (window.confirm(`Aap expense record [${x.name} - ${x.amount} Rs] ko delete karna chahte hain?`)) {
      const updated = expenses.filter(item => item.id !== id);
      setExpenses(updated);
      PortalDatabase.set('expenses', updated);
      logAudit('DELETE', 'Expense Entry', id, JSON.stringify(x), 'DELETED');
    }
  };

  const handleSaveEditExpense = (edited: Expense) => {
    const original = expenses.find(item => item.id === edited.id);
    if (!original) return;
    const updated = expenses.map(item => item.id === edited.id ? edited : item);
    setExpenses(updated);
    PortalDatabase.set('expenses', updated);
    logAudit('EDIT', 'Expense Entry', edited.id, JSON.stringify(original), JSON.stringify(edited));
    setEditingExpense(null);
  };

  const currentFilterLabel = () => {
    let lbl = [];
    if (selectedMonthIdx !== null) lbl.push(`Month: ${monthsList[selectedMonthIdx]}`);
    if (searchTerm) lbl.push(`Keyword: "${searchTerm}"`);
    return lbl.join(' | ') || 'None';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-heading font-bold text-white uppercase tracking-tight">Mosque Bill Expenditures Logs</h3>
          <p className="text-xs text-pine-text-muted font-sans mt-0.5">Capital outflows including generator fuel, repairs, cleaner wages, imam salaries, utility and electric expenses.</p>
        </div>
        <div className="flex items-center gap-2">
          {isFundAdminUnlocked && (
            <button
              onClick={() => setShowAddExpForm(!showAddExpForm)}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-pine-border font-button font-bold text-xs uppercase text-white py-2 px-4 rounded-lg shadow-sm transition-all"
            >
              {showAddExpForm ? <X className="w-4 h-4 text-rose-450" /> : <Plus className="w-4 h-4 text-emerald-400" />} 
              {showAddExpForm ? "Close Form" : "Add Direct Expense"}
            </button>
          )}
          <button 
            onClick={() => printExpensesStatement(filteredExpenses, currentFilterLabel())}
            className="flex items-center gap-1.5 bg-pine-bar hover:bg-pine-hover border border-pine-border font-button font-bold text-xs uppercase text-white py-2 px-4 rounded-lg shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-pine-btn-hover" /> Print Filtered Report
          </button>
        </div>
      </div>

      {/* Inline Direct Expense Add Form */}
      {isFundAdminUnlocked && showAddExpForm && (
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/30 bg-gradient-to-r from-pine-bar/95 to-pine-bar shadow-xl animate-fade-in">
          <h3 className="text-sm font-button uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-rose-455" /> Log Direct Operational Spending / Outflow Expense
          </h3>
          <form onSubmit={handleAddNewExpense} className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase text-pine-text-body mb-1 font-bold">Expenditure Name</label>
                <input
                  type="text"
                  required
                  value={newExpName}
                  onChange={(e) => setNewExpName(e.target.value)}
                  placeholder="e.g. Generator Engine Oil replacement"
                  className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-white rounded-lg focus:outline-none focus:border-pine-btn placeholder-pine-text-muted/40 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-pine-text-body mb-1 font-bold">Amount (Rs)</label>
                <input
                  type="number"
                  required
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  placeholder="amount in rs"
                  className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-white rounded-lg focus:outline-none focus:border-pine-btn placeholder-pine-text-muted/40 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-pine-text-body mb-1 font-bold">Debit Date</label>
                <input
                  type="date"
                  required
                  value={newExpDate}
                  onChange={(e) => setNewExpDate(e.target.value)}
                  className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-white rounded-lg focus:outline-none focus:border-pine-btn font-mono font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-pine-text-body mb-1 font-bold">Reference / Voucher Details</label>
              <textarea
                value={newExpDetails}
                onChange={(e) => setNewExpDetails(e.target.value)}
                placeholder="Bill number, vendor, custom payment details..."
                rows={2}
                className="w-full bg-pine-bar/60 border border-pine-border py-2 px-3 text-white rounded-lg focus:outline-none focus:border-pine-btn placeholder-pine-text-muted/40 font-semibold"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddExpForm(false)}
                className="py-2.5 px-4 border border-pine-border hover:bg-pine-hover text-zinc-200 text-xs uppercase rounded-lg font-bold tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-pine-btn hover:bg-pine-btn-hover text-white text-xs uppercase rounded-lg font-bold tracking-wider shadow-lg shadow-rose-955/20"
              >
                Submit Expense Log
              </button>
            </div>
          </form>
        </div>
      )}



      {/* Monthly buttons bar */}
      <div className="flex flex-wrap gap-2 items-center justify-center p-3 bg-pine-bar/40 rounded-xl border border-pine-border">
        <button
          onClick={() => setSelectedMonthIdx(null)}
          className={`py-1.5 px-3 rounded text-[10px] font-button uppercase tracking-wider ${
            selectedMonthIdx === null ? 'bg-pine-btn text-white' : 'hover:bg-pine-hover/10 text-pine-text-muted'
          }`}
        >
          All Months
        </button>
        {monthsList.map((m, idx) => (
          <button
            key={m}
            onClick={() => setSelectedMonthIdx(idx)}
            className={`py-1.5 px-3 rounded text-[10px] font-button uppercase tracking-wider ${
              selectedMonthIdx === idx ? 'bg-pine-btn text-white' : 'hover:bg-pine-hover/10 text-pine-text-muted'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Advanced search selector */}
      <div className="relative w-full md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pine-text-muted" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search logged expense items..."
          className="w-full bg-pine-bar/60 border border-pine-border pl-10 pr-4 py-2 rounded-lg text-xs font-sans text-white focus:outline-none focus:border-pine-btn"
        />
      </div>

      {/* Expense ledger layout spreadsheet */}
      <div className="overflow-x-auto rounded-xl border border-pine-border bg-pine-bar/25">
        <table className="w-full text-left font-sans text-xs border-collapse">
          <thead>
            <tr className="bg-pine-bar text-pine-text-heading font-button text-[10px] uppercase tracking-wider border-b border-pine-border">
              <th className="py-3.5 px-5">Debit Date</th>
              <th className="py-3.5 px-5">Expenditure Name</th>
              <th className="py-3.5 px-5 text-right">Debit Amount</th>
              <th className="py-3.5 px-5">Reference/Voucher Details</th>
              {isFundAdminUnlocked && (
                <th className="py-3.5 px-5 text-center w-28">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-pine-border/40 font-mono">
            {filteredExpenses.map((e) => (
              <tr key={e.id} className="hover:bg-pine-hover/5">
                <td className="py-3.5 px-5 text-pine-text-muted">{e.date}</td>
                <td className="py-3.5 px-5 font-sans font-semibold text-white">{e.name}</td>
                <td className="py-3.5 px-5 text-right font-bold text-rose-450">{e.amount.toLocaleString()} Rs</td>
                <td className="py-3.5 px-5 text-pine-text-body font-sans text-xs max-w-sm truncate">{e.details}</td>
                {isFundAdminUnlocked && (
                  <td className="py-2.5 px-5 text-center">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingExpense(e)}
                        className="p-1.5 text-emerald-450 hover:text-white hover:bg-emerald-950/70 border border-emerald-500/20 rounded-lg transition-all cursor-pointer"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1.5 text-rose-450 hover:text-white hover:bg-rose-950/70 border border-rose-500/20 rounded-lg transition-all cursor-pointer"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={isFundAdminUnlocked ? 5 : 4} className="py-8 text-center text-xs text-pine-text-muted font-sans font-medium">No recorded expense items found.</td>
              </tr>
            )}
            <tr className="bg-pine-bar/30 font-bold border-t border-pine-border">
              <td colSpan={2} className="py-4 px-5 font-button text-right text-pine-text-heading text-[10px] uppercase">Combined Expenditure Total:</td>
              <td className="py-4 px-5 text-right text-rose-455 text-sm">{getSumOfSelectedExpenses().toLocaleString()} Rs</td>
              <td colSpan={isFundAdminUnlocked ? 2 : 1} className="py-4 px-5" />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Edit Expense Modal Overlay */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-b from-pine-card to-pine-bar border border-pine-border p-6 rounded-2xl shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-button uppercase font-extrabold text-white tracking-widest text-rose-400">Edit Mosque Expenditure Record</h3>
              <p className="text-[11px] text-pine-text-muted mt-1 leading-relaxed">
                Debit details, voucher reference ya amount tabdeel karein.
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveEditExpense(editingExpense);
            }} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase text-zinc-400 mb-1">Debit Date</label>
                <input 
                  type="date"
                  required
                  value={editingExpense.date}
                  onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                  className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-400 mb-1">Expenditure Name / Reason</label>
                <input 
                  type="text"
                  required
                  value={editingExpense.name}
                  onChange={(e) => setEditingExpense({ ...editingExpense, name: e.target.value })}
                  placeholder="e.g. Generator Fuel, Imam Salary, Mosque Repair..."
                  className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-400 mb-1">Debit Amount (Rs)</label>
                <input 
                  type="number"
                  required
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                  className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-zinc-400 mb-1">Voucher Details / Reference</label>
                <textarea 
                  value={editingExpense.details}
                  onChange={(e) => setEditingExpense({ ...editingExpense, details: e.target.value })}
                  placeholder="Voucher or verification remarks..."
                  rows={2}
                  className="w-full bg-pine-bar border border-pine-border py-2 px-3 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2.5">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="flex-1 py-1.5 border border-zinc-700 hover:bg-zinc-800 text-xs text-zinc-200 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-rose-700 hover:bg-rose-600 text-xs text-white rounded-lg font-bold"
                >
                  Apply Edit Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button 
              onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
              className="absolute -top-12 right-0 text-white hover:text-rose-400 p-2 z-50 transition-colors cursor-pointer"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] rounded object-contain border border-white/20 shadow-2xl" 
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CommitmentsRegister({
  fund,
  commitments,
  setCommitments,
  logAudit,
  isFundAdminUnlocked
}: {
  fund: FundModule;
  commitments: Commitment[];
  setCommitments: React.Dispatch<React.SetStateAction<Commitment[]>>;
  logAudit: any;
  isFundAdminUnlocked: boolean;
}) {

  const handlePrintNotice = (c: Commitment) => {
    const romanUrduTemplate = `
      Assalam-o-Alaikum, <strong style="color: #000000;">[NAME]</strong> saheb,
      <br/><br/>
      Aap ki <strong style="border-bottom: 2px solid #000000; padding: 2px 5px;">[FUND_NAME]</strong> ki mad mein commitment ki tafseel neechay di gayi hai:
      <br/><br/>
      <div style="font-size: 1.1em; border: 1px dashed #000000; padding: 15px; border-radius: 4px; background: #f3f4f6; margin: 20px 0; color: #000000;">
        <strong>Commitment Details / تفاصیل:</strong><br/>
        [NOTE]
      </div>
      <br/>
      Kul raqam jo aap ke zimme hai: <strong style="color: #000000; font-size: 1.2em;">[AMOUNT] rupay</strong>.
      <br/><br/>
      Barah-e-karam is raqam ko jald az jald jama karwayein taake kaam jaari reh sake. 
      <br/>
      Allah Ta'ala aap ke maal mein barkat ata farmaye.
      <br/><br/>
      JazakAllah Khair.
    `;

    const noticeContent = romanUrduTemplate
      .replace(/\[NAME\]/g, c.name)
      .replace(/\[PHONE\]/g, c.phone || 'N/A')
      .replace(/\[AMOUNT\]/g, c.amountDue.toLocaleString())
      .replace(/\[FUND_NAME\]/g, fund.name)
      .replace(/\[NOTE\]/g, c.notes || 'No specific details provided.');

    const downloadDoc = `
<!DOCTYPE html>
<html lang="ur" dir="ltr">
<head>
<meta charset="UTF-8">
<title>Notice - ${c.name}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: Arial, sans-serif; line-height: 1.6; font-size: 16px; width: 100%; margin: 0; box-sizing: border-box; color: #000000; background-color: #ffffff; }
  .header { text-align: left; border-bottom: 3px double #000000; padding-bottom: 20px; margin-bottom: 30px; }
  .header h2 { margin: 0; font-size: 24px; color: #000000; font-weight: 850; text-transform: uppercase; }
  .header p { margin: 5px 0 0; color: #374151; font-size: 14px; font-weight: bold; }
  .content { margin-bottom: 30px; text-align: left; color: #000000; }
  .footer { text-align: left; margin-top: 50px; border-top: 1px dashed #000000; padding-top: 20px; font-size: 14px; color: #000000; }
  @media print {
    button { display: none; }
  }
</style>
</head>
<body>
  <div class="header">
    <h2>Masjid Al-Habib Noorani Community Trust</h2>
    <p>Wah Cantt, Punjab, Pakistan</p>
  </div>
  
  <div class="content">${noticeContent}</div>
  
  <div class="footer">
    <p>This is a system generated notice.</p>
    <p>Date Generated: ${new Date().toLocaleDateString()}</p>
  </div>
  <button onclick="window.print()" style="padding: 10px 20px; background: #000000; color: #fff; border: 2px solid #000000; cursor: pointer; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Print Notice</button>
</body>
</html>`;

    const blob = new Blob([downloadDoc], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex justify-between items-end mb-6 border-b border-pine-border pb-4">
        <div>
          <h3 className="text-xl font-heading font-extrabold text-white tracking-wide flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-pine-btn-hover" /> 
            Commitments & Remaining Balances
          </h3>
          <p className="text-xs text-pine-text-muted mt-1">Pending contributions tracking for {fund.name}.</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-pine-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-sm">
            <thead>
              <tr className="bg-black/40 border-b border-pine-border text-pine-text-body">
                <th className="py-4 px-6 font-semibold w-12">#</th>
                <th className="py-4 px-6 font-semibold">Name & Contact</th>
                <th className="py-4 px-6 font-semibold text-right">Amount Due</th>
                <th className="py-4 px-6 font-semibold">Details (Note)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {commitments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-pine-text-muted text-sm italic">
                    No active commitments found for this fund.
                  </td>
                </tr>
              ) : (
                commitments.map((c, i) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6 font-mono text-zinc-500">{i + 1}</td>
                    <td className="py-4 px-6">
                      <div 
                        className="font-bold text-white mb-0.5 cursor-pointer hover:text-pine-btn-hover transition-colors underline decoration-dotted"
                        onClick={() => handlePrintNotice(c)}
                        title="Click to print notice"
                      >
                        {c.name}
                      </div>
                      <div className="text-xs font-mono text-zinc-400">{c.phone || 'No phone provided'}</div>
                    </td>
                    <td className="py-4 px-6 text-right font-mono font-bold text-rose-400">{c.amountDue.toLocaleString()} Rs</td>
                    <td className="py-4 px-6 text-zinc-400 text-xs" title={c.notes}>{c.notes || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
