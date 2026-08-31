import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { Button } from './components/Button';
import { 
  Home, 
  PlusCircle, 
  History, 
  Settings,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit2,
  Calendar,
  User,
  CreditCard,
  FileText,
  Save,
  CheckCircle,
  X,
  Image as ImageIcon,
  AlertCircle,
  Palette,
  Eye,
  EyeOff,
  AlertTriangle,
  Lock,
  Plus,
  MinusCircle,
  Moon,
  Sun,
  Clock,
  ChevronDown,
  PieChart as PieChartIcon,
  Maximize2,
  Shield,
  FileBadge,
  Info,
  ChevronRight,
  Grid,
  Target,
  PiggyBank,
  HandCoins,
  MoreVertical,
  Banknote,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  List,
  Tags,
  Users
} from 'lucide-react';
import { 
  Transaction, 
  TransactionType, 
  PersonType, 
  FilterState,
  ThemeColor,
  Account,
  Budget,
  Debt,
  SavingsGoal
} from './types';
import { 
  THEMES
} from './config';
import { LEGAL_CONTENT } from './legal';
import { 
  saveTransactions, 
  loadTransactions, 
  exportToJSON, 
  exportToCSV, 
  convertFileToBase64,
  loadMasterAccounts,
  loadMasterIncomeCats,
  loadMasterExpenseCats,
  loadMasterPersons,
  saveMasterData,
  normalizeBackupPayload,
  clearGriyaKasData,
  loadBudgets, saveBudgets,
  loadDebts, saveDebts,
  loadGoals, saveGoals
} from './services/dataService';
import { hasAdminPin, setAdminPin, verifyAdminPin, clearAdminPin } from './services/securityService';
import { APP_VERSION } from './version';

// --- Helpers ---
const formatCurrency = (amount: number, hidden: boolean = false) => {
  if (hidden) return "Rp •••••••";
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const cleanNumber = (input: any): number => {
  if (!input) return 0;
  const str = String(input);
  const cleaned = str.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
};

// --- Components ---

const Toast = ({ message, type, isVisible, onClose }: { message: string, type: 'success'|'error', isVisible: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[140] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 fade-in duration-300 border ${type === 'success' ? 'bg-white text-emerald-700 border-emerald-100' : 'bg-white text-rose-700 border-rose-100'}`}>
      <div className={`p-1 rounded-full ${type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'}`}>
        {type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
      </div>
      <span className="text-xs font-bold">{message}</span>
    </div>
  );
};

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Ya, Lanjutkan", cancelText = "Batal", isDestructive = false }: { isOpen: boolean, title: string, message: React.ReactNode, onConfirm: () => void, onCancel: () => void, confirmText?: string, cancelText?: string, isDestructive?: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-xs shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-white/20">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
           {isDestructive ? <AlertTriangle size={24}/> : <Info size={24}/>}
        </div>
        <h3 className="font-black text-xl text-slate-900 dark:text-white mb-2">{title}</h3>
        <div className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed font-medium">{message}</div>
        <div className="flex flex-col gap-3">
          <button onClick={() => onConfirm()} className={`w-full py-3.5 font-bold rounded-xl text-sm text-white shadow-lg transition-transform active:scale-95 ${isDestructive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}>{confirmText}</button>
          <button onClick={() => onCancel()} className="w-full py-3.5 bg-transparent text-slate-500 dark:text-slate-400 font-bold rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">{cancelText}</button>
        </div>
      </div>
    </div>
  );
};

// Action input modal
const ActionInputModal = ({ 
  isOpen, 
  title, 
  amountLabel,
  accounts, 
  onConfirm, 
  onCancel,
  prefillAmount = 0
}: { 
  isOpen: boolean, 
  title: string, 
  amountLabel: string,
  accounts: Account[], 
  onConfirm: (amount: number, accountId: string) => void, 
  onCancel: () => void,
  prefillAmount?: number
}) => {
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');

  // Fix: Do not depend on `accounts` to avoid infinite reset loops if parent creates new array refs
  useEffect(() => {
    if(isOpen) {
      setAmount(prefillAmount > 0 ? prefillAmount.toString() : '');
      if (accounts.length > 0) {
         setAccountId(accounts[0].id);
      }
    }
  }, [isOpen, prefillAmount]); 

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
       <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <h3 className="font-bold text-lg dark:text-white mb-4">{title}</h3>
          
          <div className="space-y-4 mb-6">
             <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">{amountLabel}</label>
                <input 
                  type="tel" inputMode="numeric"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-lg outline-none border border-slate-200 dark:border-slate-700 focus:border-indigo-500 transition-colors"
                  placeholder="0"
                  autoFocus
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Sumber Dana / Akun</label>
                <select 
                   value={accountId}
                   onChange={e => setAccountId(e.target.value)}
                   className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none border border-slate-200 dark:border-slate-700"
                >
                   {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                </select>
             </div>
          </div>

          <div className="flex gap-3">
             <button onClick={onCancel} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-sm">Batal</button>
             <button onClick={() => onConfirm(cleanNumber(amount), accountId)} className="flex-[2] py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/30">Konfirmasi</button>
          </div>
       </div>
    </div>
  );
};

const LegalModal = ({ type, onClose }: { type: 'PRIVACY' | 'TERMS' | 'DISCLAIMER' | null, onClose: () => void }) => {
  if (!type) return null;
  const content = LEGAL_CONTENT[type];
  return (
    <div className="fixed inset-0 z-[120] bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm flex flex-col animate-in slide-in-from-bottom duration-300">
       <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center sticky top-0 z-10 shadow-sm">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800 rounded-full mr-3"><X size={20}/></button>
          <div className="flex-1">
            <h2 className="font-black text-xl text-slate-800 dark:text-white tracking-tight">{content.title}</h2>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mt-0.5">{content.date}</p>
          </div>
       </div>
       <div className="flex-1 overflow-y-auto p-6 pb-24">
          <div className="max-w-2xl mx-auto space-y-8">
            {content.sections.map((section, idx) => (
              <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3">{section.heading}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}
            <div className="text-center pt-8">
              <button onClick={onClose} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg">Saya Mengerti</button>
            </div>
          </div>
       </div>
    </div>
  );
};

// ... [ImageViewer, ImportChoiceModal, PinModal remain unchanged] ...
const ImageViewer = ({ src, onClose }: { src: string, onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startRef = useRef({ x: 0, y: 0 });
  
  // Pinch zoom logic
  const [initialDist, setInitialDist] = useState(0);
  const [initialScale, setInitialScale] = useState(1);

  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (scale > 1) {
      setIsDragging(true);
      startRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setOffset({
        x: e.clientX - startRef.current.x,
        y: e.clientY - startRef.current.y
      });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      setInitialDist(getDistance(e.touches));
      setInitialScale(scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const currentDist = getDistance(e.touches);
      const scaleFactor = currentDist / initialDist;
      const newScale = Math.min(Math.max(1, initialScale * scaleFactor), 4);
      setScale(newScale);
      if (newScale === 1) setOffset({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => {
      const newScale = Math.max(prev - 0.5, 1);
      if (newScale === 1) setOffset({x: 0, y: 0});
      return newScale;
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setOffset({x: 0, y: 0});
  };

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/95 flex flex-col animate-in fade-in duration-200 touch-none overflow-hidden" 
      onClick={onClose}
    >
       <div className="absolute top-4 right-4 z-50 flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-2 py-1">
             <button onClick={handleZoomOut} className="p-2 text-white hover:text-rose-400 transition-colors"><ZoomOut size={20}/></button>
             <span className="text-xs font-mono text-white w-8 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={handleZoomIn} className="p-2 text-white hover:text-emerald-400 transition-colors"><ZoomIn size={20}/></button>
             <button onClick={handleReset} className="p-2 text-white hover:text-blue-400 transition-colors border-l border-white/20 ml-1 pl-3"><RefreshCw size={16}/></button>
          </div>
          <button onClick={onClose} className="bg-white/20 p-3 rounded-full text-white backdrop-blur-sm hover:bg-white/30 transition-colors"><X size={24}/></button>
       </div>
       <div 
          className="flex-1 w-full h-full flex items-center justify-center overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
       >
         <img 
            src={src} 
            className="max-w-full max-h-full object-contain transition-transform duration-75" 
            style={{ 
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
               e.stopPropagation();
               if(scale > 1) { setScale(1); setOffset({x:0,y:0}); } else { setScale(2.5); }
            }}
            alt="Full view" 
            draggable={false}
         />
       </div>
       <div className="absolute bottom-10 left-0 w-full text-center pointer-events-none">
          <p className="text-white/50 text-xs bg-black/30 inline-block px-3 py-1 rounded-full backdrop-blur-sm">Double tap / Pinch to zoom. Drag to move.</p>
       </div>
    </div>
  );
};

const ImportChoiceModal = ({ isOpen, onMerge, onReplace, onCancel, count, isFullRestore }: { isOpen: boolean, onMerge: () => void, onReplace: () => void, onCancel: () => void, count: number, isFullRestore: boolean }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xs shadow-2xl p-6 animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
        <h3 className="font-black text-lg text-slate-800 dark:text-white mb-2">Impor Data {isFullRestore ? '(Full Backup)' : `(${count})`}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Pilih metode impor:</p>
        <div className="space-y-3"><button onClick={onMerge} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm">Gabungkan (Merge)</button><button onClick={onReplace} className="w-full py-3 bg-rose-600 text-white font-bold rounded-xl text-sm">Ganti Semua (Replace)</button><button onClick={onCancel} className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold text-sm">Batal</button></div>
      </div>
    </div>
  );
};

const PinModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [busy, setBusy] = useState(false);
  const configured = hasAdminPin();

  useEffect(() => {
    if (!isOpen) {
      setPinValue('');
      setConfirmPin('');
      setBusy(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(pin)) {
      alert('PIN harus terdiri dari 4-8 digit.');
      return;
    }
    setBusy(true);
    try {
      if (!configured) {
        if (pin !== confirmPin) {
          alert('Konfirmasi PIN tidak sama.');
          return;
        }
        await setAdminPin(pin);
        onSuccess();
      } else if (await verifyAdminPin(pin)) {
        onSuccess();
      } else {
        alert('PIN salah.');
      }
    } finally {
      setBusy(false);
      setPinValue('');
      setConfirmPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xs p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-lg dark:text-white">{configured ? 'Akses Admin' : 'Buat PIN Admin'}</h3>
            <p className="text-xs text-slate-500 mt-1">{configured ? 'Masukkan PIN untuk membuka pengaturan data.' : 'PIN ini melindungi menu pengelolaan data dari akses kasual.'}</p>
          </div>
          <button onClick={onClose} className="dark:text-white"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={8} className="w-full text-center text-3xl font-black tracking-widest border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 focus:border-rose-500 outline-none" placeholder="••••" autoFocus value={pin} onChange={e => setPinValue(e.target.value.replace(/\D/g, ''))} />
          {!configured && <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={8} className="w-full text-center text-xl font-black tracking-widest border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl py-3 focus:border-rose-500 outline-none" placeholder="Ulangi PIN" value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))} />}
          <Button type="submit" fullWidth className="bg-rose-600 text-white" disabled={busy}>{busy ? 'Memproses...' : configured ? 'Masuk' : 'Simpan PIN'}</Button>
        </form>
      </div>
    </div>
  );
};

// --- REBUILT ADMIN PANEL WITH EDIT FEATURE ---
const AdminPanel: React.FC<any> = ({ isOpen, onClose, data, actions, openConfirm, showToast }) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'IN_CATS' | 'EX_CATS' | 'PERSONS'>('ACCOUNTS');
  const [tempVal, setTempVal] = useState('');
  const [tempType, setTempType] = useState('REKENING');
  
  // State for Editing
  const [editingItem, setEditingItem] = useState<{id: string, val: string, type?: string} | null>(null);

  if(!isOpen) return null;

  const handleAdd = () => {
    if(!tempVal) return;
    
    // Logic for ADD
    if(activeTab === 'ACCOUNTS') {
      const newAcc: Account = { id: `acc_${Date.now()}`, name: tempVal, type: tempType as any, icon: 'Wallet', color: 'bg-blue-500' };
      actions.setAccounts([...data.accounts, newAcc]);
    } else if (activeTab === 'IN_CATS') {
      actions.setIncomeCats([...data.incomeCats, tempVal]);
    } else if (activeTab === 'EX_CATS') {
      actions.setExpenseCats([...data.expenseCats, tempVal]);
    } else if (activeTab === 'PERSONS') {
      const newId = tempVal.toUpperCase().replace(/\s/g, '');
      actions.setPersons([...data.persons, { id: newId, label: tempVal }]);
    }
    setTempVal('');
    showToast('Data berhasil ditambahkan!', 'success');
  };

  const handleUpdate = () => {
    if (!editingItem || !tempVal) return;

    if (activeTab === 'ACCOUNTS') {
      actions.setAccounts(data.accounts.map((a: any) => a.id === editingItem.id ? { ...a, name: tempVal, type: tempType } : a));
    } else if (activeTab === 'IN_CATS') {
      actions.setIncomeCats(data.incomeCats.map((c: string) => c === editingItem.id ? tempVal : c));
    } else if (activeTab === 'EX_CATS') {
      actions.setExpenseCats(data.expenseCats.map((c: string) => c === editingItem.id ? tempVal : c));
    } else if (activeTab === 'PERSONS') {
      actions.setPersons(data.persons.map((p: any) => p.id === editingItem.id ? { ...p, label: tempVal } : p));
    }

    setEditingItem(null);
    setTempVal('');
    showToast('Perubahan disimpan!', 'success');
  };

  const startEdit = (item: any, type?: string) => {
    // Determine the ID and initial value based on what 'item' is (string or object)
    let id = '';
    let val = '';
    
    if (typeof item === 'string') {
        id = item;
        val = item;
    } else {
        id = item.id;
        val = item.name || item.label; // Account uses 'name', Person uses 'label'
    }

    setEditingItem({ id, val, type: type || 'REKENING' });
    setTempVal(val);
    if(type) setTempType(type);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setTempVal('');
  };

  const handleDelete = (idOrVal: string) => {
    openConfirm(
      'Hapus Item?', 
      'Tindakan ini tidak dapat dibatalkan.', 
      () => {
        if(activeTab === 'ACCOUNTS') actions.setAccounts(data.accounts.filter((a: any) => a.id !== idOrVal));
        else if(activeTab === 'IN_CATS') actions.setIncomeCats(data.incomeCats.filter((c: string) => c !== idOrVal));
        else if(activeTab === 'EX_CATS') actions.setExpenseCats(data.expenseCats.filter((c: string) => c !== idOrVal));
        else if(activeTab === 'PERSONS') actions.setPersons(data.persons.filter((p: any) => p.id !== idOrVal));
        
        showToast('Item berhasil dihapus.', 'success');
      }, 
      true
    );
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-50 dark:bg-slate-900 flex flex-col animate-in slide-in-from-bottom duration-300">
       <div className="bg-slate-900 dark:bg-black text-white p-4 flex items-center justify-between sticky top-0 z-10 shadow-lg">
         <div className="flex items-center gap-2"><Lock size={18} className="text-rose-400" /><h2 className="font-bold">Admin Panel</h2></div>
         <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20"><X size={20}/></button>
       </div>
       
       <div className="flex bg-white dark:bg-slate-800 p-2 overflow-x-auto shadow-sm gap-2">
          {[
            {id: 'ACCOUNTS', label: 'Akun', icon: CreditCard}, 
            {id: 'IN_CATS', label: 'Kat. Masuk', icon: ArrowUpCircle},
            {id: 'EX_CATS', label: 'Kat. Keluar', icon: ArrowDownCircle},
            {id: 'PERSONS', label: 'Orang', icon: Users}
          ].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id as any); cancelEdit(); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
              <tab.icon size={14}/> {tab.label}
            </button>
          ))}
       </div>

       <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex gap-2 mb-4 items-end">
             <div className="flex-1">
               <label className="text-[10px] font-bold text-slate-400 mb-1 block">{editingItem ? 'Edit Nama' : 'Nama Baru'}</label>
               <input value={tempVal} onChange={e => setTempVal(e.target.value)} placeholder="..." className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold outline-none" />
             </div>
             {activeTab === 'ACCOUNTS' && (
               <div>
                 <label className="text-[10px] font-bold text-slate-400 mb-1 block">Tipe</label>
                 <select value={tempType} onChange={e => setTempType(e.target.value)} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none h-[46px]">
                   {['Cash','Rekening','E-money','Tabungan','Tabungan','Investasi','Deposito','Kartu Kredit','PayLater','Dana Darurat','Piutang','Aset'].map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
               </div>
             )}
             
             {editingItem ? (
               <div className="flex gap-1">
                 <button onClick={handleUpdate} className="h-[46px] px-4 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-500/30">Update</button>
                 <button onClick={cancelEdit} className="h-[46px] px-3 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"><X size={16}/></button>
               </div>
             ) : (
               <button onClick={handleAdd} className="h-[46px] px-4 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-1"><Plus size={16}/> Add</button>
             )}
          </div>

          <div className="space-y-2">
            {activeTab === 'ACCOUNTS' && data.accounts.map((item: any) => (
              <div key={item.id} className={`flex justify-between items-center p-3 rounded-xl border ${editingItem?.id === item.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <div><div className="font-bold text-sm dark:text-white">{item.name}</div><div className="text-[10px] text-slate-400">{item.type}</div></div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(item, item.type)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(item.id)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {(activeTab === 'IN_CATS' ? data.incomeCats : activeTab === 'EX_CATS' ? data.expenseCats : []).map((item: string) => (
              <div key={item} className={`flex justify-between items-center p-3 rounded-xl border ${editingItem?.id === item ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                <span className="font-bold text-sm dark:text-white">{item}</span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(item)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(item)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
            {activeTab === 'PERSONS' && data.persons.map((item: any) => (
              <div key={item.id} className={`flex justify-between items-center p-3 rounded-xl border ${editingItem?.id === item.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                <div><div className="font-bold text-sm dark:text-white">{item.label}</div><div className="text-[10px] text-slate-400">ID: {item.id}</div></div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(item)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(item.id)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
       </div>

       <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button 
            onClick={() => actions.resetAllData()} 
            className="w-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-6 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-rose-200"
          >
            <AlertTriangle size={14}/> Factory Reset Data (Hati-hati)
          </button>
       </div>
    </div>
  )
};

// ... [TransactionItem, TransactionDetailModal remain unchanged] ...
const TransactionItem: React.FC<any> = ({ t, onClick, hidden, accounts, persons }) => {
  const isIncome = t.type === 'INCOME';
  const isTransfer = t.type === 'TRANSFER';
  const getIconColor = () => { if (isTransfer) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'; if (isIncome) return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'; return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'; };
  const getTextColor = () => { if (isTransfer) return 'text-blue-600 dark:text-blue-400'; if (isIncome) return 'text-emerald-600 dark:text-emerald-400'; return 'text-rose-600 dark:text-rose-400'; };
  const personName = persons.find((p:any) => p.id === t.person)?.label || t.person;
  const targetAccName = accounts.find((a:any) => a.id === t.targetAccountId)?.name || 'Unknown';
  return (
    <div onClick={() => onClick(t)} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer hover:border-slate-300 dark:hover:border-slate-700">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getIconColor()}`}>{isTransfer ? <ArrowRightLeft size={18} /> : isIncome ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}</div>
        <div className="min-w-0"><h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{isTransfer ? 'Transfer' : t.category}</h4><div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span>{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span><span>•</span><span className="capitalize">{personName}</span>{isTransfer && <span>• ke {targetAccName}</span>}</div></div>
      </div>
      <div className="flex flex-col items-end pl-2"><span className={`font-bold text-sm ${getTextColor()}`}>{isTransfer ? '' : isIncome ? '+' : '-'}{formatCurrency(t.amount, hidden)}</span>{t.attachment && <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1"><ImageIcon size={10} /> Foto</span>}</div>
    </div>
  );
};

const TransactionDetailModal = ({ t, isOpen, onClose, onEdit, onDeleteRequest, accounts, persons, onImageClick }: any) => {
  if (!isOpen || !t) return null;
  const isTransfer = t.type === 'TRANSFER';
  const headerColorClass = isTransfer ? 'bg-blue-600' : t.type === 'INCOME' ? 'bg-emerald-600' : 'bg-rose-600';
  const getAccName = (id: string) => accounts.find((a:any) => a.id === id)?.name || id;
  return (
    <div onClick={onClose} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 relative border dark:border-slate-800">
        <div className={`${headerColorClass} p-6 text-white text-center relative`}><button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-3 right-3 text-white/90 hover:text-white bg-black/20 hover:bg-black/30 rounded-full p-2 transition-colors z-50"><X size={20}/></button><div className="mb-2 opacity-90 text-sm font-medium uppercase tracking-wider">{isTransfer ? 'Bukti Transfer' : t.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</div><div className="text-3xl font-black">{formatCurrency(t.amount)}</div><div className="text-sm opacity-90 mt-1">{new Date(t.date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</div></div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4 text-sm">
             <div><label className="block text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Kategori</label><div className="font-bold text-slate-800 dark:text-white">{t.category || '-'}</div></div>
             <div><label className="block text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mb-1">Dari Akun</label><div className="font-bold text-slate-800 dark:text-white">{getAccName(t.accountId)}</div></div>
          </div>
          {t.notes && <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300"><span className="font-bold block text-xs text-slate-400 dark:text-slate-500 mb-1">Catatan:</span>"{t.notes}"</div>}
          {t.attachmentImage && <div className="mt-4"><label className="block text-xs text-slate-400 dark:text-slate-500 font-bold uppercase mb-2">Bukti Foto</label><div className="relative group cursor-pointer" onClick={() => onImageClick(t.attachmentImage!)}><img src={t.attachmentImage} alt="Bukti" className="w-full rounded-xl border border-slate-200 dark:border-slate-700" /></div></div>}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3"><button onClick={onEdit} className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-slate-100 transition-colors"><Edit2 size={16} /> Edit</button><button onClick={onDeleteRequest} className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors"><Trash2 size={16} /> Hapus</button></div>
      </div>
    </div>
  );
};

enum Screen { DASHBOARD, ADD, HISTORY, SETTINGS, REKAP, FEATURES }

export default function App() {
  // ... [Previous state definitions remain the same] ...
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [accounts, setAccounts] = useState<Account[]>(() => loadMasterAccounts());
  const [incomeCats, setIncomeCats] = useState<string[]>(() => loadMasterIncomeCats().sort((a,b) => a.localeCompare(b)));
  const [expenseCats, setExpenseCats] = useState<string[]>(() => loadMasterExpenseCats().sort((a,b) => a.localeCompare(b)));
  const [persons, setPersons] = useState<{id: string, label: string}[]>(() => loadMasterPersons());
  
  // New Feature States
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets());
  const [debts, setDebts] = useState<Debt[]>(() => loadDebts());
  const [goals, setGoals] = useState<SavingsGoal[]>(() => loadGoals());
  
  const [activeFeatureTab, setActiveFeatureTab] = useState<'REKAP' | 'BUDGET' | 'DEBT' | 'GOALS'>('REKAP');
  
  // Modals & Screen
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [featureModalType, setFeatureModalType] = useState<'BUDGET'|'DEBT'|'GOAL'>('BUDGET');
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null); 
  const [featureForm, setFeatureForm] = useState<{name: string, category: string, amount: string, type: 'HUTANG'|'PIUTANG', notes: string, dueDate: string}>({ name: '', category: '', amount: '', type: 'HUTANG', notes: '', dueDate: '' });
  const [activeDebt, setActiveDebt] = useState<Debt | null>(null);
  const [activeGoal, setActiveGoal] = useState<SavingsGoal | null>(null);
  const [actionModal, setActionModal] = useState<{isOpen: boolean; mode: 'DEBT_PAY' | 'DEBT_ADD' | 'GOAL_ADD' | 'GOAL_WITHDRAW' | null; title: string; label: string;}>({ isOpen: false, mode: null, title: '', label: '' });
  
  const [screen, setScreen] = useState<Screen>(Screen.DASHBOARD);
  const [themeColor, setThemeColor] = useState<ThemeColor>('rose'); 
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0); 
  
  const [rekapMonth, setRekapMonth] = useState(new Date().getMonth());
  const [rekapYear, setRekapYear] = useState(new Date().getFullYear());
  const [rekapType, setRekapType] = useState<'INCOME'|'EXPENSE'>('EXPENSE');
  const [rekapPerson, setRekapPerson] = useState<string | 'ALL'>('ALL');
  
  const [time, setTime] = useState(new Date());
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [legalView, setLegalView] = useState<'PRIVACY' | 'TERMS' | 'DISCLAIMER' | null>(null);
  const [pendingImport, setPendingImport] = useState<any | null>(null);

  const [toast, setToast] = useState<{msg: string, type: 'success'|'error', visible: boolean}>({msg:'', type:'success', visible: false});
  
  // Enhanced Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, msg: React.ReactNode, action: () => void, isDestructive: boolean, confirmText?: string, cancelText?: string}>({
    isOpen: false, title: '', msg: '', action: () => {}, isDestructive: false
  });

  // ... [useEffect hooks remain same] ...
  const touchStartRef = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => { const timer = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const savedTheme = (localStorage.getItem('griyakas_theme') ?? localStorage.getItem('dompetku_theme')) as ThemeColor;
    if (savedTheme && THEMES.some(t => t.value === savedTheme)) setThemeColor(savedTheme);
    const savedBalancePref = localStorage.getItem('griyakas_show_balance') ?? localStorage.getItem('dompetku_show_balance');
    if (savedBalancePref !== null) setShowBalance(savedBalancePref === 'true');
    const savedDarkMode = localStorage.getItem('griyakas_dark_mode') ?? localStorage.getItem('dompetku_dark_mode');
    if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
  }, []);
  useEffect(() => { if (accounts.length > 0 && !formData.accountId) setFormData(prev => ({...prev, accountId: accounts[0].id})); if (persons.length > 0 && !formData.person) setFormData(prev => ({...prev, person: persons[0].id as PersonType})); }, [accounts, persons]);
  
  // Persistence
  useEffect(() => { saveTransactions(transactions); }, [transactions]);
  useEffect(() => { saveMasterData('griyakas_master_accounts', accounts); }, [accounts]);
  useEffect(() => { saveMasterData('griyakas_master_income_cats', incomeCats); }, [incomeCats]);
  useEffect(() => { saveMasterData('griyakas_master_expense_cats', expenseCats); }, [expenseCats]);
  useEffect(() => { saveMasterData('griyakas_master_persons', persons); }, [persons]);
  useEffect(() => { saveBudgets(budgets); }, [budgets]);
  useEffect(() => { saveDebts(debts); }, [debts]);
  useEffect(() => { saveGoals(goals); }, [goals]);
  useEffect(() => { localStorage.setItem('griyakas_theme', themeColor); localStorage.setItem('griyakas_show_balance', String(showBalance)); localStorage.setItem('griyakas_dark_mode', String(darkMode)); }, [themeColor, showBalance, darkMode]);

  // Swipe Logic (same as before)
  const onTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.targetTouches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.changedTouches[0].clientX;
    const distance = touchStartRef.current - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if(isModalOpen || zoomImage || showPinModal || showAdminPanel || pendingImport || legalView || featureModalOpen || activeDebt || activeGoal) return;
    if (screen === Screen.ADD) return;
    if (isLeftSwipe) {
       if(screen === Screen.DASHBOARD) setScreen(Screen.HISTORY);
       else if(screen === Screen.HISTORY) setScreen(Screen.FEATURES);
       else if(screen === Screen.FEATURES) setScreen(Screen.SETTINGS);
    } 
    if (isRightSwipe) {
       if(screen === Screen.SETTINGS) setScreen(Screen.FEATURES);
       else if(screen === Screen.FEATURES) setScreen(Screen.HISTORY);
       else if(screen === Screen.HISTORY) setScreen(Screen.DASHBOARD);
    }
  };

  // ... [Calculated Memos remain same] ...
  const balances = useMemo<Record<string, number>>(() => { const accBalances: Record<string, number> = {}; accounts.forEach(a => accBalances[a.id] = 0); const activePersonId = activeCardIndex === 0 ? null : persons[activeCardIndex - 1].id; transactions.forEach(t => { if (activePersonId && t.person !== activePersonId) return; if (t.type === 'INCOME') accBalances[t.accountId] = (accBalances[t.accountId] || 0) + t.amount; else if (t.type === 'EXPENSE') accBalances[t.accountId] = (accBalances[t.accountId] || 0) - t.amount; else if (t.type === 'TRANSFER' && t.targetAccountId) { accBalances[t.accountId] = (accBalances[t.accountId] || 0) - t.amount; accBalances[t.targetAccountId] = (accBalances[t.targetAccountId] || 0) + t.amount; } }); return accBalances; }, [transactions, accounts, activeCardIndex, persons]);
  const totalBalance = Object.values(balances).reduce((a: number, b: number) => a + b, 0);
  const allTimeStats = useMemo<{ income: number; expense: number }>(() => { let income = 0; let expense = 0; const activePersonId = activeCardIndex === 0 ? null : persons[activeCardIndex - 1].id; transactions.forEach(t => { if (activePersonId && t.person !== activePersonId) return; if (t.type === 'INCOME') income += t.amount; if (t.type === 'EXPENSE') expense += t.amount; }); return { income, expense }; }, [transactions, activeCardIndex, persons]);
  const personStats = useMemo(() => { const stats: Record<string, { income: number, expense: number, balance: number }> = {}; persons.forEach(p => stats[p.id] = { income: 0, expense: 0, balance: 0 }); transactions.forEach(t => { if (stats[t.person]) { if (t.type === 'INCOME') { stats[t.person].income += t.amount; stats[t.person].balance += t.amount; } else if (t.type === 'EXPENSE') { stats[t.person].expense += t.amount; stats[t.person].balance -= t.amount; } } }); return stats; }, [transactions, persons]);
  const [filters, setFilters] = useState<FilterState & { accountId: string | 'ALL', person: string | 'ALL' }>({ month: new Date().getMonth(), year: new Date().getFullYear(), type: 'ALL', person: 'ALL', accountId: 'ALL' });
  const [formData, setFormData] = useState<Partial<Transaction>>({ type: 'EXPENSE', date: new Date().toISOString().split('T')[0], person: '', accountId: '', amount: 0, category: '', notes: '' });
  const [initialFormData, setInitialFormData] = useState<Partial<Transaction>>({});
  const [displayAmount, setDisplayAmount] = useState('');
  const filteredTransactions = useMemo<Transaction[]>(() => { return transactions.filter(t => { const d = new Date(t.date); const matchMonth = d.getMonth() === filters.month; const matchYear = d.getFullYear() === filters.year; const matchType = filters.type === 'ALL' || t.type === filters.type; const matchPerson = filters.person === 'ALL' || t.person === filters.person; const matchAccount = filters.accountId === 'ALL' || t.accountId === filters.accountId || t.targetAccountId === filters.accountId; return matchMonth && matchYear && matchType && matchPerson && matchAccount; }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); }, [transactions, filters]);
  const groupedTransactions = useMemo(() => { const groups: Record<string, Transaction[]> = {}; filteredTransactions.forEach(t => { const dateKey = t.date; if (!groups[dateKey]) groups[dateKey] = []; groups[dateKey].push(t); }); return groups; }, [filteredTransactions]);
  const sortedHistoryDates = useMemo(() => { return Object.keys(groupedTransactions).sort((a,b) => new Date(b).getTime() - new Date(a).getTime()); }, [groupedTransactions]);
  const dashboardTransactions = useMemo(() => { const activePersonId = activeCardIndex === 0 ? null : persons[activeCardIndex - 1].id; return transactions.filter(t => activePersonId ? t.person === activePersonId : true).slice(0, 10); }, [transactions, activeCardIndex, persons]);

  // Helpers
  const showToast = useCallback((msg: string, type: 'success'|'error' = 'success') => { setToast({ msg, type, visible: true }); }, []);
  const handleCloseToast = useCallback(() => { setToast(prev => ({...prev, visible: false})); }, []);
  const openConfirm = (title: string, msg: React.ReactNode, action: () => void, isDestructive = false) => { setConfirmDialog({ isOpen: true, title, msg, action: () => { action(); setConfirmDialog(prev => ({...prev, isOpen: false})); }, isDestructive, confirmText: isDestructive ? "Hapus" : "Ya, Lanjutkan", cancelText: "Batal" }); };

  // Transaction handlers
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => { const rawValue = e.target.value.replace(/\D/g, ''); const numValue = parseFloat(rawValue); setFormData({ ...formData, amount: isNaN(numValue) ? 0 : numValue }); if (rawValue) { setDisplayAmount(rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")); } else { setDisplayAmount(''); } };
  const handleSaveTransaction = () => {
    if (!formData.amount || formData.amount <= 0) { showToast("Nominal harus lebih dari 0.", 'error'); return; }
    if (formData.type !== 'TRANSFER' && !formData.category) { showToast("Pilih kategori terlebih dahulu.", 'error'); return; }
    if (!formData.accountId) { showToast("Pilih akun sumber.", 'error'); return; }
    if (formData.type === 'TRANSFER' && (!formData.targetAccountId || formData.accountId === formData.targetAccountId)) { showToast("Pilih akun tujuan yang berbeda.", 'error'); return; }
    let autoLinkedGoalId = undefined; let autoLinkedGoalName = '';
    if (formData.category === 'Tabungan / Investasi' && formData.notes) { const goalName = (formData.notes || '').trim(); const existingGoal = goals.find(g => g.name.toLowerCase() === goalName.toLowerCase()); if (existingGoal) { autoLinkedGoalId = existingGoal.id; autoLinkedGoalName = existingGoal.name; } else { const newGoalId = Date.now().toString(); const newGoal: SavingsGoal = { id: newGoalId, name: goalName, targetAmount: Number(formData.amount), currentAmount: 0, color: 'bg-emerald-500' }; setGoals(prev => [...prev, newGoal]); autoLinkedGoalId = newGoalId; autoLinkedGoalName = goalName; } }
    const newTransaction: Transaction = { id: editingId || Date.now().toString(), date: formData.date!, type: formData.type!, category: formData.type === 'TRANSFER' ? 'Transfer Dana' : formData.category!, amount: Number(formData.amount), accountId: formData.accountId!, targetAccountId: formData.type === 'TRANSFER' ? formData.targetAccountId : undefined, person: formData.person as PersonType, notes: formData.notes || '', attachment: formData.attachment, attachmentImage: formData.attachmentImage, relatedId: autoLinkedGoalId };
    if (autoLinkedGoalId) { setGoals(prev => prev.map(g => g.id === autoLinkedGoalId ? {...g, currentAmount: g.currentAmount + newTransaction.amount} : g)); }
    if (editingId) { setTransactions(prev => prev.map(t => t.id === editingId ? newTransaction : t)); } else { setTransactions(prev => [newTransaction, ...prev]); }
    setEditingId(null); setScreen(Screen.HISTORY); setSelectedTx(newTransaction); setIsModalOpen(true); 
    if (autoLinkedGoalId) { showToast(`Transaksi tersimpan & Tabungan "${autoLinkedGoalName}" bertambah!`); } else { showToast("Transaksi berhasil disimpan!"); }
    resetForm();
  };
  const resetForm = () => { const defaultForm = { type: 'EXPENSE' as TransactionType, date: new Date().toISOString().split('T')[0], person: persons[0]?.id as PersonType, accountId: accounts[0]?.id, amount: 0, category: '', notes: '', attachment: undefined, attachmentImage: undefined }; setFormData(defaultForm); setInitialFormData(defaultForm); setDisplayAmount(''); };
  const requestDelete = () => { if (selectedTx) { openConfirm('Hapus Transaksi?', 'Data transaksi yang dihapus tidak dapat dikembalikan.', () => { setTransactions(prev => prev.filter(t => t.id !== selectedTx.id)); setIsModalOpen(false); setSelectedTx(null); showToast("Transaksi dihapus.", 'success'); }, true); } };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { try { if (file.size > 12 * 1024 * 1024) { showToast("Ukuran foto terlalu besar (maks. 12 MB).", 'error'); return; } const base64 = await convertFileToBase64(file); setFormData({ ...formData, attachment: file.name, attachmentImage: base64 }); } catch (err) { showToast("Gagal memproses gambar.", 'error'); } } };
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 20 * 1024 * 1024) { showToast("File backup terlalu besar (maks. 20 MB).", 'error'); e.target.value = ''; return; } const reader = new FileReader(); reader.onload = (event) => { try { const parsed = JSON.parse(String(event.target?.result || '')); const imported = normalizeBackupPayload(parsed); if (!imported) throw new Error('Format backup tidak valid'); setPendingImport(imported); } catch (err) { showToast("File backup tidak valid atau rusak.", 'error'); } finally { e.target.value = ''; } }; reader.onerror = () => { showToast("Gagal membaca file backup.", 'error'); e.target.value = ''; }; reader.readAsText(file); };
  const executeImport = (mode: 'MERGE' | 'REPLACE') => { if (!pendingImport) return; const incoming = pendingImport.transactions || []; const mergeById = <T extends { id: string }>(current: T[], next: T[]) => Array.from(new Map([...current, ...next].map(item => [item.id, item])).values()); if (mode === 'REPLACE') { setTransactions(incoming); setBudgets(pendingImport.budgets || []); setDebts(pendingImport.debts || []); setGoals(pendingImport.goals || []); } else { setTransactions(prev => mergeById(prev, incoming)); setBudgets(prev => Array.from(new Map([...prev, ...(pendingImport.budgets || [])].map(item => [item.category, item])).values())); setDebts(prev => mergeById(prev, pendingImport.debts || [])); setGoals(prev => mergeById(prev, pendingImport.goals || [])); } setPendingImport(null); showToast("Data berhasil dipulihkan!", 'success'); setScreen(Screen.HISTORY); };
  const handleEditInit = (tx: Transaction) => { setFormData(tx); setInitialFormData(tx); setDisplayAmount(tx.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")); setEditingId(tx.id); setIsModalOpen(false); setScreen(Screen.ADD); };
  const handleInitAdd = () => { resetForm(); setEditingId(null); setScreen(Screen.ADD); setSelectedTx(null); };

  // Feature Handlers
  const openFeatureModal = (type: 'BUDGET' | 'DEBT' | 'GOAL', editItem?: any) => { setFeatureModalType(type); setEditingFeatureId(editItem ? editItem.id : null); if (editItem) { setFeatureForm({ name: editItem.name || '', category: editItem.category || expenseCats[0], amount: String(editItem.amount || editItem.limit || editItem.targetAmount || ''), type: editItem.type || 'HUTANG', notes: editItem.notes || '', dueDate: editItem.dueDate || '' }); } else { setFeatureForm({ name: '', category: expenseCats[0], amount: '', type: 'HUTANG', notes: '', dueDate: '' }); } setFeatureModalOpen(true); };
  const handleSaveFeature = () => { const amt = cleanNumber(featureForm.amount); if (featureModalType === 'BUDGET') { if (!featureForm.category || !amt) { showToast("Lengkapi data", 'error'); return; } setBudgets(prev => { const exists = prev.find(b => b.category === featureForm.category); if(exists) return prev.map(b => b.category === featureForm.category ? { ...b, limit: amt } : b); return [...prev, { category: featureForm.category, limit: amt }]; }); } else if (featureModalType === 'DEBT') { if (!featureForm.name || !amt) { showToast("Lengkapi data", 'error'); return; } if (editingFeatureId) { setDebts(prev => prev.map(d => d.id === editingFeatureId ? { ...d, name: featureForm.name, type: featureForm.type, amount: amt, notes: featureForm.notes, dueDate: featureForm.dueDate } : d)); } else { const newDebt: Debt = { id: Date.now().toString(), name: featureForm.name, type: featureForm.type, amount: amt, notes: featureForm.notes, isPaid: false, dueDate: featureForm.dueDate }; setDebts(prev => [newDebt, ...prev]); } } else if (featureModalType === 'GOAL') { if (!featureForm.name || !amt) { showToast("Lengkapi data", 'error'); return; } if (editingFeatureId) { setGoals(prev => prev.map(g => g.id === editingFeatureId ? { ...g, name: featureForm.name, targetAmount: amt } : g)); } else { setGoals(prev => [...prev, { id: Date.now().toString(), name: featureForm.name, targetAmount: amt, currentAmount: 0, color: 'bg-emerald-500' }]); } } setFeatureModalOpen(false); setEditingFeatureId(null); showToast("Berhasil disimpan!"); };
  const handleProcessAction = (amt: any, accountId: string) => { let amountNumber = Number(amt) || 0; if (!actionModal.mode) return; if (amountNumber <= 0) { showToast('Nominal harus lebih dari 0.', 'error'); return; } if (actionModal.mode === 'DEBT_PAY') { if(!activeDebt) return; amountNumber = Math.min(amountNumber, activeDebt.amount); const newAmount = Math.max(0, activeDebt.amount - amountNumber); const isFullyPaid = newAmount <= 0; setDebts(prev => prev.map(d => d.id === activeDebt.id ? { ...d, amount: newAmount, isPaid: isFullyPaid } : d)); const txType: TransactionType = activeDebt.type === 'HUTANG' ? 'EXPENSE' : 'INCOME'; const tx: Transaction = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], type: txType, category: 'Cicilan Utang', amount: amountNumber, accountId: accountId, person: persons[0].id as PersonType, notes: `Pembayaran ${activeDebt.type} - ${activeDebt.name}`, relatedId: activeDebt.id }; setTransactions(prev => [tx, ...prev]); showToast(isFullyPaid ? "Lunas!" : "Pembayaran tercatat!"); } else if (actionModal.mode === 'DEBT_ADD') { if(!activeDebt) return; const newAmount = activeDebt.amount + amountNumber; setDebts(prev => prev.map(d => d.id === activeDebt.id ? { ...d, amount: newAmount, isPaid: false } : d)); const txType: TransactionType = activeDebt.type === 'HUTANG' ? 'INCOME' : 'EXPENSE'; const tx: Transaction = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], type: txType, category: 'Tambah Utang/Piutang', amount: amountNumber, accountId: accountId, person: persons[0].id as PersonType, notes: `Tambah ${activeDebt.type} - ${activeDebt.name}`, relatedId: activeDebt.id }; setTransactions(prev => [tx, ...prev]); showToast("Jumlah hutang bertambah."); } else if (actionModal.mode === 'GOAL_ADD') { if(!activeGoal) return; if (accountId === 'EXTERNAL_SOURCE') { setGoals(prev => prev.map(g => g.id === activeGoal.id ? { ...g, currentAmount: g.currentAmount + amountNumber } : g)); const tx: Transaction = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], type: 'INCOME', category: 'Bunga Tabungan', amount: amountNumber, accountId: 'EXTERNAL_SOURCE', person: persons[0].id as PersonType, notes: `Bunga/Pajak untuk: ${activeGoal.name}`, relatedId: activeGoal.id }; setTransactions(prev => [tx, ...prev]); showToast("Saldo bertambah dari Bunga Tabungan!"); } else { setGoals(prev => prev.map(g => g.id === activeGoal.id ? { ...g, currentAmount: g.currentAmount + amountNumber } : g)); const tx: Transaction = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], type: 'EXPENSE', category: 'Tabungan / Investasi', amount: amountNumber, accountId: accountId, person: persons[0].id as PersonType, notes: `Tabungan: ${activeGoal.name}`, relatedId: activeGoal.id }; setTransactions(prev => [tx, ...prev]); showToast("Berhasil ditabung!"); } } else if (actionModal.mode === 'GOAL_WITHDRAW') { if(!activeGoal || activeGoal.currentAmount <= 0) return; amountNumber = Math.min(amountNumber, activeGoal.currentAmount); const newAmount = Math.max(0, activeGoal.currentAmount - amountNumber); setGoals(prev => prev.map(g => g.id === activeGoal.id ? { ...g, currentAmount: newAmount } : g)); const isExternal = accountId === 'EXTERNAL_DESTINATION'; const txCategory = isExternal ? 'Biaya Admin / Pajak' : 'Tarik Tabungan'; const txNote = isExternal ? `Pajak/Biaya dari: ${activeGoal.name}` : `Tarik dari: ${activeGoal.name}`; const txAcc = isExternal ? 'EXTERNAL_DESTINATION' : accountId; const tx: Transaction = { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], type: 'INCOME', category: txCategory, amount: amountNumber, accountId: txAcc, person: persons[0].id as PersonType, notes: txNote, relatedId: activeGoal.id }; setTransactions(prev => [tx, ...prev]); showToast(isExternal ? "Biaya/Pajak ditarik!" : "Saldo ditarik!"); } setActionModal({ ...actionModal, isOpen: false }); if(activeDebt) setActiveDebt(null); if(activeGoal) setActiveGoal(null); };
  const deleteDebt = () => { if(!activeDebt) return; openConfirm('Hapus Catatan?', 'Menghapus catatan hutang tidak akan menghapus transaksi pembayaran yang sudah terjadi.', () => { setDebts(prev => prev.filter(d => d.id !== activeDebt.id)); setActiveDebt(null); showToast("Dihapus."); }, true); };
  const deleteGoal = () => { if(!activeGoal) return; openConfirm('Hapus Target?', 'Data target tabungan akan dihapus permanen.', () => { setGoals(prev => prev.filter(g => g.id !== activeGoal.id)); setActiveGoal(null); showToast("Target dihapus."); }, true); };

  const renderDashboard = () => {
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollLeft = e.currentTarget.scrollLeft;
      const width = e.currentTarget.offsetWidth;
      const index = Math.round(scrollLeft / width);
      if (index !== activeCardIndex) {
        setActiveCardIndex(index);
      }
    };

    // Warna yang berbeda untuk setiap person (10 warna berbeda)
    const personColors = [
      'bg-gradient-to-br from-rose-600 to-rose-800',
      'bg-gradient-to-br from-blue-600 to-blue-800', 
      'bg-gradient-to-br from-emerald-600 to-emerald-800',
      'bg-gradient-to-br from-amber-600 to-amber-800',
      'bg-gradient-to-br from-violet-600 to-violet-800',
      'bg-gradient-to-br from-cyan-600 to-cyan-800',
      'bg-gradient-to-br from-lime-600 to-lime-800',
      'bg-gradient-to-br from-pink-600 to-pink-800',
      'bg-gradient-to-br from-indigo-600 to-indigo-800',
      'bg-gradient-to-br from-teal-600 to-teal-800'
    ];

    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* HEADER & CARDS SECTION - TETAP DI ATAS */}
        <div className="shrink-0">
          <div className="p-6 pb-0 space-y-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                   <Wallet size={20} />
                 </div>
                 <div>
                    <h1 className="text-2xl font-black indo-flag-text tracking-tight">GriyaKas</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Keuangan keluarga, tersusun rapi.</p>
                 </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-2 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold shadow-sm">
                   <Clock size={12} />
                   <span>{time.toLocaleTimeString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Horizontal Scrollable Cards - TETAP DI ATAS */}
            <div 
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-6 px-6 pb-4 gap-4" 
              onScroll={handleScroll}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              {/* CARD TOTAL KELUARGA */}
              <div className="min-w-[100%] snap-center">
                <div className={`bg-gradient-to-br from-${themeColor}-600 to-${themeColor}-800 rounded-2xl p-6 text-white shadow-xl shadow-${themeColor}-900/10 relative overflow-hidden h-full flex flex-col justify-between`}>
                  <div className="relative z-10">
                     <div className="flex justify-between items-center">
                        <span className="text-white/80 text-sm font-medium">Total Keluarga</span>
                        <button onClick={() => setShowBalance(!showBalance)} className="text-white/70 hover:text-white transition-colors">
                           {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                     </div>
                     <div className="text-3xl font-black mt-2 mb-6 tracking-tight">{formatCurrency(totalBalance, !showBalance)}</div>
                     <div className="flex gap-4">
                       <div className="bg-white/10 p-3 rounded-xl flex-1 backdrop-blur-md border border-white/10">
                          <div className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">Pemasukan</div>
                          <div className="font-bold text-sm sm:text-lg truncate">{formatCurrency(allTimeStats.income, !showBalance)}</div>
                       </div>
                       <div className="bg-white/10 p-3 rounded-xl flex-1 backdrop-blur-md border border-white/10">
                          <div className="text-rose-300 text-[10px] font-bold uppercase tracking-wider mb-1">Pengeluaran</div>
                          <div className="font-bold text-sm sm:text-lg truncate">{formatCurrency(allTimeStats.expense, !showBalance)}</div>
                       </div>
                     </div>
                  </div>
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-black opacity-10 rounded-full blur-2xl"></div>
                </div>
              </div>

              {/* CARD SETIAP PERSON DENGAN WARNA BERBEDA */}
              {persons.map((p, index) => {
                 const stats = personStats[p.id] || { income: 0, expense: 0, balance: 0 };
                 const personColorClass = personColors[index % personColors.length];
                 
                 return (
                  <div key={p.id} className="min-w-[100%] snap-center">
                    <div className={`${personColorClass} rounded-2xl p-6 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between`}>
                      <div className="relative z-10">
                         <div className="flex justify-between items-center">
                            <span className="text-white/80 text-sm font-medium flex items-center gap-2"><User size={14}/> {p.label}</span>
                            <button onClick={() => setShowBalance(!showBalance)} className="text-white/70 hover:text-white transition-colors">
                               {showBalance ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                         </div>
                         <div className="text-3xl font-black mt-2 mb-6 tracking-tight">{formatCurrency(stats.balance, !showBalance)}</div>
                         <div className="flex gap-4">
                           <div className="bg-white/10 p-3 rounded-xl flex-1 backdrop-blur-md border border-white/10">
                              <div className="text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">Masuk</div>
                              <div className="font-bold text-sm sm:text-lg truncate">{formatCurrency(stats.income, !showBalance)}</div>
                           </div>
                           <div className="bg-white/10 p-3 rounded-xl flex-1 backdrop-blur-md border border-white/10">
                              <div className="text-rose-300 text-[10px] font-bold uppercase tracking-wider mb-1">Keluar</div>
                              <div className="font-bold text-sm sm:text-lg truncate">{formatCurrency(stats.expense, !showBalance)}</div>
                           </div>
                         </div>
                      </div>
                      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                    </div>
                  </div>
                 );
              })}
            </div>
            
            <div className="flex justify-center gap-1.5 -mt-2">
               <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activeCardIndex === 0 ? `bg-${themeColor}-500 w-4` : 'bg-slate-300 dark:bg-slate-700'}`}></div>
               {persons.map((p, idx) => {
                 const personColor = personColors[idx % personColors.length];
                 const colorName = personColor.includes('rose') ? 'rose' : 
                                  personColor.includes('blue') ? 'blue' :
                                  personColor.includes('emerald') ? 'emerald' :
                                  personColor.includes('amber') ? 'amber' :
                                  personColor.includes('violet') ? 'violet' :
                                  personColor.includes('cyan') ? 'cyan' :
                                  personColor.includes('lime') ? 'lime' :
                                  personColor.includes('pink') ? 'pink' :
                                  personColor.includes('indigo') ? 'indigo' : 'teal';
                 
                 return (
                   <div key={p.id} className={`w-2 h-2 rounded-full transition-all duration-300 ${activeCardIndex === idx + 1 ? `bg-${colorName}-500 w-4` : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                 );
               })}
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT - BAGIAN INI YANG BISA DI-SCROLL */}
        <div className="flex-1 overflow-y-auto px-6 pt-3 pb-24 space-y-6">
          {/* DAFTAR AKUN */}
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2 text-sm">
               <CreditCard size={16} /> 
               {activeCardIndex === 0 ? 'Akun Saya (Semua)' : `Akun Saya (${persons[activeCardIndex - 1].label})`}
            </h3>
            <div 
               className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6"
               onTouchStart={(e) => e.stopPropagation()}
               onTouchEnd={(e) => e.stopPropagation()}
            >
               {accounts.map(acc => {
                 return (
                 <div key={acc.id} className="min-w-[125px] bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between h-24 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between">
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold truncate">{acc.name}</span>
                       <div className={`w-2 h-2 rounded-full ${acc.color}`}></div>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-white text-sm">{formatCurrency(balances[acc.id] || 0, !showBalance)}</span>
                 </div>
               )})}
               {accounts.length === 0 && <div className="text-slate-400 text-xs italic p-4">Belum ada akun. Tambahkan di menu Admin.</div>}
            </div>
          </div>

          {/* TRANSAKSI TERAKHIR */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                Transaksi Terakhir {activeCardIndex > 0 ? `(${persons[activeCardIndex - 1].label})` : ''}
              </h3>
              <button onClick={() => setScreen(Screen.HISTORY)} className={`text-xs text-${themeColor}-600 dark:text-${themeColor}-400 font-bold hover:underline`}>Lihat Semua</button>
            </div>
            <div className="space-y-3">
                {dashboardTransactions.map(t => (
                   <TransactionItem key={t.id} t={t} onClick={(tx: any) => { setSelectedTx(tx); setIsModalOpen(true); }} themeColor={themeColor} hidden={!showBalance} accounts={accounts} persons={persons} />
                ))}
                {dashboardTransactions.length === 0 && (
                   <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm bg-slate-50 dark:bg-slate-900 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-800 mx-0">
                      <FileText size={40} className="mx-auto mb-3 opacity-20"/>
                      Belum ada transaksi untuk {activeCardIndex === 0 ? 'saat ini' : persons[activeCardIndex-1].label}.
                   </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddForm = () => {
    const isTransfer = formData.type === 'TRANSFER';
    const isIncome = formData.type === 'INCOME';
    // ...
    return (
      <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 animate-in slide-in-from-bottom duration-300">
          <div className="px-6 pt-6 pb-4 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-20">
             <button onClick={() => setScreen(Screen.DASHBOARD)} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X size={24}/></button>
             <h2 className="font-bold text-lg text-slate-800 dark:text-white">{editingId ? 'Edit Transaksi' : 'Transaksi Baru'}</h2>
             <div className="w-8"></div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-24">
             {/* Type Selector */}
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
                <button onClick={() => setFormData({...formData, type: 'EXPENSE'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.type === 'EXPENSE' ? 'bg-white dark:bg-slate-700 shadow text-rose-600' : 'text-slate-500'}`}>Pengeluaran</button>
                <button onClick={() => setFormData({...formData, type: 'INCOME'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.type === 'INCOME' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600' : 'text-slate-500'}`}>Pemasukan</button>
                <button onClick={() => setFormData({...formData, type: 'TRANSFER'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.type === 'TRANSFER' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}>Transfer</button>
             </div>

             {/* Amount */}
             <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nominal (Rp)</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                   <input 
                     type="text" 
                     inputMode="numeric" 
                     className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 text-2xl font-black text-slate-800 dark:text-white outline-none transition-colors placeholder:text-slate-300"
                     placeholder="0"
                     value={displayAmount}
                     onChange={handleAmountChange}
                   />
                </div>
             </div>

             {/* Date & Person Row */}
             <div className="flex gap-4 mb-6">
                <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tanggal</label>
                   <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <input 
                        type="date" 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                      />
                   </div>
                </div>
                <div className="flex-1">
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Oleh</label>
                   <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <select 
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-3 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 appearance-none"
                        value={formData.person}
                        onChange={e => setFormData({...formData, person: e.target.value as PersonType})}
                      >
                         {persons.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                   </div>
                </div>
             </div>

             {/* Category (if not transfer) */}
             {!isTransfer && (
                <div className="mb-6">
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Kategori</label>
                   <div className="grid grid-cols-3 gap-2">
                      {(formData.type === 'INCOME' ? incomeCats : expenseCats).map(cat => (
                         <button 
                           key={cat}
                           onClick={() => setFormData({...formData, category: cat})}
                           className={`px-2 py-2 rounded-xl text-[10px] font-bold border transition-all ${formData.category === cat ? `bg-${themeColor}-600 border-${themeColor}-600 text-white shadow-lg shadow-${themeColor}-500/30` : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'}`}
                         >
                           {cat}
                         </button>
                      ))}
                   </div>
                </div>
             )}

             {/* Accounts */}
             <div className="mb-6 space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Sumber Dana</label>
                   <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                      <select 
                         className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-10 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 appearance-none"
                         value={formData.accountId}
                         onChange={e => setFormData({...formData, accountId: e.target.value})}
                      >
                         {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                   </div>
                </div>

                {isTransfer && (
                   <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Tujuan Transfer</label>
                      <div className="relative">
                         <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                         <select 
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-10 pr-10 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 appearance-none"
                            value={formData.targetAccountId}
                            onChange={e => setFormData({...formData, targetAccountId: e.target.value})}
                         >
                            <option value="">Pilih Akun Tujuan</option>
                            {accounts.filter(a => a.id !== formData.accountId).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                         </select>
                         <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                      </div>
                   </div>
                )}
             </div>

             {/* Notes */}
             <div className="mb-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Catatan</label>
                <textarea 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500 resize-none h-24"
                  placeholder="Keterangan transaksi..."
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                ></textarea>
             </div>

             {/* Attachment */}
             <div className="mb-8">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Bukti / Struk</label>
                {!formData.attachmentImage ? (
                   <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Upload size={24} className="text-slate-400 mb-1"/>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload Foto Bukti</span>
                      <span className="text-[10px] text-slate-400 mt-1">JPG, PNG, WebP • maks. 12 MB sebelum kompresi</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" />
                   </label>
                ) : (
                   <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group">
                      <img src={formData.attachmentImage} alt="Preview bukti transaksi" className="w-full h-48 object-cover" />
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                         <label className="bg-white text-slate-700 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                            <Upload size={14}/> Ganti Foto
                            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} className="hidden" />
                         </label>
                         <button type="button" onClick={() => setFormData({...formData, attachment: undefined, attachmentImage: undefined})} className="bg-rose-500 text-white px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform">
                            <Trash2 size={14}/> Hapus
                         </button>
                      </div>
                   </div>
                )}
             </div>

          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-3 sticky bottom-0 z-20">
             <Button variant="secondary" onClick={() => { resetForm(); setScreen(Screen.DASHBOARD); }} className="flex-1">Batal</Button>
             <Button onClick={handleSaveTransaction} className="flex-[2] bg-indigo-600 shadow-indigo-500/30 text-white" disabled={!formData.amount}>
                <Save size={18} /> Simpan Transaksi
             </Button>
          </div>
       </div>
    );
  };

  const renderHistory = () => (
     <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-in fade-in duration-500">
        <div className="bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-10 space-y-3">
           <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl text-slate-800 dark:text-white">Riwayat</h2>
              <div className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 dark:text-slate-400">{filteredTransactions.length} Data</div>
           </div>
           
           {/* Modern Two-Row Filter */}
           <div className="space-y-2">
              {/* Row 1: Period Selection */}
              <div className="flex gap-2">
                 <select 
                   value={filters.month} 
                   onChange={e => setFilters({...filters, month: parseInt(String(e.target.value))})}
                   className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-bold p-2.5 rounded-xl outline-none"
                 >
                    {Array.from({length: 12}, (_, i) => i).map((i) => <option key={i} value={i}>{new Date(2024, i, 1).toLocaleDateString('id-ID', {month: 'long'})}</option>)}
                 </select>
                 <select 
                   value={filters.year} 
                   onChange={e => setFilters({...filters, year: parseInt(String(e.target.value))})}
                   className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white text-xs font-bold p-2.5 rounded-xl outline-none"
                 >
                    {[2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>

              {/* Row 2: Type & Person */}
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                 {/* Type Chips */}
                 <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
                    <button onClick={() => setFilters({...filters, type: 'ALL'})} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filters.type === 'ALL' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>All</button>
                    <button onClick={() => setFilters({...filters, type: 'INCOME'})} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filters.type === 'INCOME' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600' : 'text-slate-500'}`}>Masuk</button>
                    <button onClick={() => setFilters({...filters, type: 'EXPENSE'})} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${filters.type === 'EXPENSE' ? 'bg-white dark:bg-slate-700 shadow text-rose-600' : 'text-slate-500'}`}>Keluar</button>
                 </div>

                 {/* Person Dropdown */}
                 <div className="relative shrink-0">
                    <select 
                      value={filters.person}
                      onChange={e => setFilters({...filters, person: e.target.value as PersonType | 'ALL'})}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white text-[10px] font-bold py-2 px-3 pr-8 rounded-xl outline-none appearance-none h-full"
                    >
                       <option value="ALL">Semua Orang</option>
                       {persons.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-6">
           {sortedHistoryDates.length > 0 ? sortedHistoryDates.map(date => (
              <div key={date}>
                 <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap">{new Date(date).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}</h3>
                    <div className="h-[1px] bg-slate-200 dark:bg-slate-800 w-full"></div>
                 </div>
                 <div className="space-y-3">
                    {groupedTransactions[date].map(t => (
                       <TransactionItem key={t.id} t={t} onClick={(tx: any) => { setSelectedTx(tx); setIsModalOpen(true); }} themeColor={themeColor} hidden={!showBalance} accounts={accounts} persons={persons} />
                    ))}
                 </div>
              </div>
           )) : (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                 <Filter size={40} className="mx-auto mb-4 opacity-20"/>
                 <p className="text-sm">Tidak ada transaksi yang cocok.</p>
              </div>
           )}
        </div>
     </div>
  );

  // ... [renderFeatureModal, renderFeatures remain same] ...
  // Keep implementations
  const renderFeatureModal = () => {
    if (!featureModalOpen) return null;

    const titles = { BUDGET: 'Tambah Anggaran', DEBT: editingFeatureId ? 'Edit Catatan' : 'Catat Hutang/Piutang', GOAL: editingFeatureId ? 'Edit Target' : 'Target Tabungan' };

    return (
      <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
         <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-lg dark:text-white">{titles[featureModalType]}</h3>
               <button onClick={() => setFeatureModalOpen(false)}><X size={20} className="text-slate-400"/></button>
            </div>

            <div className="space-y-4 mb-6">
               {/* BUDGET FIELDS */}
               {featureModalType === 'BUDGET' && (
                 <>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Kategori</label>
                      <select 
                         value={featureForm.category}
                         onChange={e => setFeatureForm({...featureForm, category: e.target.value})}
                         className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none"
                      >
                         {expenseCats.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Batas Maksimal (Rp)</label>
                      <input 
                        type="tel" inputMode="numeric"
                        value={featureForm.amount}
                        onChange={e => setFeatureForm({...featureForm, amount: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none"
                        placeholder="Contoh: 1000000"
                      />
                   </div>
                 </>
               )}

               {/* DEBT FIELDS */}
               {featureModalType === 'DEBT' && (
                 <>
                   <div className="flex gap-2">
                      <button onClick={() => setFeatureForm({...featureForm, type: 'HUTANG'})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${featureForm.type === 'HUTANG' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>Saya Berhutang</button>
                      <button onClick={() => setFeatureForm({...featureForm, type: 'PIUTANG'})} className={`flex-1 py-2 rounded-lg text-xs font-bold ${featureForm.type === 'PIUTANG' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>Meminjamkan</button>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Nama Orang</label>
                      <input 
                        value={featureForm.name}
                        onChange={e => setFeatureForm({...featureForm, name: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none"
                        placeholder="Nama..."
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Jumlah {editingFeatureId ? 'Total' : ''} (Rp)</label>
                      <input 
                        type="tel" inputMode="numeric"
                        value={featureForm.amount}
                        onChange={e => setFeatureForm({...featureForm, amount: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none"
                        placeholder="0"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Tanggal Jatuh Tempo (Opsional)</label>
                      <input 
                        type="date"
                        value={featureForm.dueDate}
                        onChange={e => setFeatureForm({...featureForm, dueDate: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Catatan</label>
                      <textarea 
                        value={featureForm.notes}
                        onChange={e => setFeatureForm({...featureForm, notes: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none"
                        placeholder="..."
                      />
                   </div>
                 </>
               )}

               {/* GOAL FIELDS */}
               {featureModalType === 'GOAL' && (
                 <>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Nama Tabungan</label>
                      <input 
                        value={featureForm.name}
                        onChange={e => setFeatureForm({...featureForm, name: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none"
                        placeholder="Contoh: iPhone 15"
                      />
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Harga Target (Rp)</label>
                      <input 
                        type="tel" inputMode="numeric"
                        value={featureForm.amount}
                        onChange={e => setFeatureForm({...featureForm, amount: e.target.value})}
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-sm outline-none"
                        placeholder="0"
                      />
                   </div>
                 </>
               )}
            </div>

            <Button onClick={handleSaveFeature} fullWidth>Simpan</Button>
         </div>
      </div>
    );
  };

  const renderFeatures = () => {
    // REKAP LOGIC
    const rekapTxs = transactions.filter(t => {
      const d = new Date(t.date);
      const personMatch = rekapPerson === 'ALL' || t.person === rekapPerson;
      return d.getMonth() === rekapMonth && d.getFullYear() === rekapYear && t.type === rekapType && personMatch;
    });
    const totalIncome = transactions
      .filter(t => { const d = new Date(t.date); const personMatch = rekapPerson === 'ALL' || t.person === rekapPerson; return d.getMonth() === rekapMonth && d.getFullYear() === rekapYear && t.type === 'INCOME' && personMatch; })
      .reduce<number>((a, b) => a + b.amount, 0);
    const totalExpense = transactions
      .filter(t => { const d = new Date(t.date); const personMatch = rekapPerson === 'ALL' || t.person === rekapPerson; return d.getMonth() === rekapMonth && d.getFullYear() === rekapYear && t.type === 'EXPENSE' && personMatch; })
      .reduce<number>((a, b) => a + b.amount, 0);
    const net = totalIncome - totalExpense;
    const categoryStats: Record<string, { count: number, total: number }> = {};
    rekapTxs.forEach(t => { if(!categoryStats[t.category]) { categoryStats[t.category] = { count: 0, total: 0 }; } categoryStats[t.category].count += 1; categoryStats[t.category].total += t.amount; });
    const sortedCats = Object.keys(categoryStats).map(key => ({ name: key, ...categoryStats[key] })).sort((a,b) => b.total - a.total);
    const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'];
    const totalForType = rekapType === 'INCOME' ? totalIncome : totalExpense;
    let currentDeg = 0;
    const gradientParts = sortedCats.map((cat, i) => { const value = cat.total; const percentage = totalForType > 0 ? value / totalForType : 0; const deg = percentage * 360; const color = COLORS[i % COLORS.length]; const start = currentDeg; const end = currentDeg + deg; currentDeg = end; return `${color} ${start}deg ${end}deg`; });
    const conicGradient = gradientParts.length > 0 ? `conic-gradient(${gradientParts.join(', ')})` : `conic-gradient(#e2e8f0 0deg 360deg)`;

    const getActionAccounts = () => {
        if (actionModal.mode === 'GOAL_ADD') {
            return [{id: 'EXTERNAL_SOURCE', name: 'Bunga Tabungan (Tidak Potong Saldo)', type: 'LAINNYA', icon: 'Banknote', color: 'bg-emerald-500'} as Account, ...accounts];
        } else if (actionModal.mode === 'GOAL_WITHDRAW') {
            return [{id: 'EXTERNAL_DESTINATION', name: 'Biaya Admin / Pajak (Tidak Masuk Saldo)', type: 'LAINNYA', icon: 'FileText', color: 'bg-gray-500'} as Account, ...accounts];
        }
        return accounts;
    };

    return (
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="bg-white dark:bg-slate-900 p-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 shadow-sm">
            <h2 className="font-bold text-xl text-slate-800 dark:text-white mb-4">Fitur Tambahan</h2>
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
               <button onClick={() => setActiveFeatureTab('REKAP')} className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeFeatureTab === 'REKAP' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Analisis</button>
               <button onClick={() => setActiveFeatureTab('BUDGET')} className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeFeatureTab === 'BUDGET' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Anggaran</button>
               <button onClick={() => setActiveFeatureTab('DEBT')} className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeFeatureTab === 'DEBT' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Hutang</button>
               <button onClick={() => setActiveFeatureTab('GOALS')} className={`flex-1 py-2 px-3 text-[10px] sm:text-xs font-bold rounded-lg transition-all whitespace-nowrap ${activeFeatureTab === 'GOALS' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500'}`}>Tabungan</button>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
            {/* REKAP TAB */}
            {activeFeatureTab === 'REKAP' && (
               <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                  <div className="flex flex-col gap-3">
                     <div className="flex gap-2">
                        <select className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold p-2.5 text-slate-700 dark:text-white outline-none" value={rekapMonth} onChange={(e) => setRekapMonth(Number(String(e.target.value)))}>
                           {Array.from({length: 12}, (_, i) => i).map((i) => <option key={i} value={i}>{new Date(2024, i, 1).toLocaleDateString('id-ID', {month: 'long'})}</option>)}
                        </select>
                        <select className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold p-2.5 text-slate-700 dark:text-white outline-none" value={rekapYear} onChange={(e) => setRekapYear(Number(String(e.target.value)))}>
                           {[2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                     </div>
                     <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button onClick={() => setRekapPerson('ALL')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-colors ${rekapPerson === 'ALL' ? `bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900` : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>Semua Orang</button>
                        {persons.map(p => (<button key={p.id} onClick={() => setRekapPerson(p.id)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap border transition-colors ${rekapPerson === p.id ? `bg-${themeColor}-100 text-${themeColor}-700 border-${themeColor}-200 dark:bg-${themeColor}-900/30 dark:text-${themeColor}-400` : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'}`}>{p.label}</button>))}
                     </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                     <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-2xl border border-emerald-100 dark:border-emerald-900/30"><div className="text-emerald-500 text-[10px] font-bold uppercase mb-1">Masuk</div><div className="text-emerald-700 dark:text-emerald-400 font-bold text-xs truncate">{formatCurrency(totalIncome)}</div></div>
                     <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-2xl border border-rose-100 dark:border-rose-900/30"><div className="text-rose-500 text-[10px] font-bold uppercase mb-1">Keluar</div><div className="text-rose-700 dark:text-rose-400 font-bold text-xs truncate">{formatCurrency(totalExpense)}</div></div>
                     <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/30"><div className="text-blue-500 text-[10px] font-bold uppercase mb-1">Sisa</div><div className="text-blue-700 dark:text-blue-400 font-bold text-xs truncate">{formatCurrency(net)}</div></div>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><PieChartIcon size={16} className={`text-${themeColor}-500`}/> Proporsi {rekapType === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}</h3>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                           <button onClick={() => setRekapType('INCOME')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${rekapType === 'INCOME' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600' : 'text-slate-400'}`}>Masuk</button>
                           <button onClick={() => setRekapType('EXPENSE')} className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${rekapType === 'EXPENSE' ? 'bg-white dark:bg-slate-700 shadow text-rose-600' : 'text-slate-400'}`}>Keluar</button>
                        </div>
                     </div>
                     <div className="flex items-center gap-6">
                        <div className="relative w-32 h-32 shrink-0"><div className="w-full h-full rounded-full transition-all duration-500" style={{ background: conicGradient }}></div><div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center"><span className="text-[10px] font-bold text-slate-400">Total</span></div></div>
                        <div className="flex-1 space-y-2 min-w-0">{sortedCats.slice(0, 3).map((cat, i) => (<div key={i} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }}></div><div className="flex-1 truncate text-xs font-medium text-slate-600 dark:text-slate-300">{cat.name}</div><div className="text-xs font-bold text-slate-800 dark:text-white">{Math.round((cat.total / totalForType) * 100)}%</div></div>))}{sortedCats.length === 0 && <div className="text-xs text-slate-400 italic">Belum ada data</div>}</div>
                     </div>
                  </div>
                  <div className="space-y-3">
                     <h3 className="font-bold text-sm text-slate-800 dark:text-white px-1">Detail Kategori</h3>
                     {sortedCats.map((cat, idx) => {
                        const percent = totalForType > 0 ? (cat.total / totalForType) * 100 : 0;
                        return (<div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden"><div className="flex justify-between items-center mb-2 relative z-10"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500" style={{ color: COLORS[idx % COLORS.length] }}>{idx + 1}</div><div><div className="font-bold text-sm text-slate-800 dark:text-white">{cat.name}</div><div className="text-[10px] text-slate-400">{cat.count} transaksi</div></div></div><div className="text-right"><div className={`font-bold text-sm ${rekapType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(cat.total)}</div><div className="text-[10px] font-bold text-slate-400">{percent.toFixed(1)}%</div></div></div><div className="absolute bottom-0 left-0 h-1 bg-slate-100 dark:bg-slate-800 w-full"><div className={`h-full opacity-50`} style={{ width: `${percent}%`, backgroundColor: COLORS[idx % COLORS.length] }}></div></div></div>);
                     })}
                     {sortedCats.length === 0 && (<div className="text-center py-8 text-slate-400 text-xs">Tidak ada data untuk periode ini.</div>)}
                  </div>
               </div>
            )}

            {/* ... [BUDGET, DEBT, GOALS Tabs render logic stays the same] ... */}
            {activeFeatureTab === 'BUDGET' && (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-4 flex items-start gap-3"><Info className="text-blue-500 mt-0.5 shrink-0" size={18}/><p className="text-xs text-blue-700 dark:text-blue-300">Tetapkan batas maksimal pengeluaran bulanan per kategori. Bar akan merah jika melebihi batas.</p></div>
                {budgets.length === 0 && <div className="text-center text-slate-400 text-sm py-8">Belum ada anggaran.</div>}
                <div className="space-y-3">{budgets.map((b, i) => { const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear(); const spent = transactions.filter(t => { const txDate = new Date(t.date); return t.type === 'EXPENSE' && t.category === b.category && txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear; }).reduce<number>((acc, t) => acc + t.amount, 0); const percent = Math.min((spent / b.limit) * 100, 100); const isOver = spent > b.limit; return (
                  <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative">
                     <div className="absolute top-2 right-2 flex gap-2">
                        <button onClick={() => openFeatureModal('BUDGET', b)} className="text-slate-300 hover:text-blue-500 p-1.5 transition-colors"><Edit2 size={14}/></button>
                        <button onClick={() => { openConfirm("Hapus Anggaran", `Hapus anggaran untuk ${b.category}?`, () => { setBudgets(prev => prev.filter((_, idx) => idx !== i)); showToast("Anggaran dihapus."); }, true); }} className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={14}/></button>
                     </div>
                     <div className="flex justify-between mb-2 pr-16"><span className="font-bold text-sm dark:text-white">{b.category}</span><span className="text-xs font-bold text-slate-500">{formatCurrency(spent)} / {formatCurrency(b.limit)}</span></div>
                     <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }}></div></div>{isOver && <span className="text-[10px] text-red-500 font-bold mt-1 block">Melebihi Anggaran!</span>}
                  </div>); 
                })}</div>
                <button onClick={() => openFeatureModal('BUDGET')} className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"><Plus size={16}/> Tambah Anggaran</button>
              </div>
            )}

            {/* DEBT TAB */}
            {activeFeatureTab === 'DEBT' && (
               <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                 <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-rose-50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-100"><span className="text-[10px] uppercase font-bold text-rose-500">Total Hutang (Saya Pinjam)</span><div className="font-black text-rose-700 dark:text-rose-400">{formatCurrency(debts.filter(d => d.type === 'HUTANG' && !d.isPaid).reduce<number>((a, b)=>a+b.amount,0))}</div></div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100"><span className="text-[10px] uppercase font-bold text-emerald-500">Total Piutang (Dipinjam Orang)</span><div className="font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(debts.filter(d => d.type === 'PIUTANG' && !d.isPaid).reduce<number>((a, b)=>a+b.amount,0))}</div></div>
                 </div>

                 {debts.length === 0 && <div className="text-center text-slate-400 text-sm py-8">Belum ada catatan hutang/piutang.</div>}

                 <div className="space-y-3">
                   {debts.map((d) => (
                      <div 
                        key={d.id} 
                        onClick={() => setActiveDebt(d)}
                        className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border shadow-sm relative overflow-hidden active:scale-98 transition-transform cursor-pointer ${d.isPaid ? 'opacity-50 border-slate-100 dark:border-slate-800' : 'border-slate-200 dark:border-slate-700'}`}
                      >
                         {d.isPaid && <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full">LUNAS</div>}
                         {!d.isPaid && <div className="absolute top-3 right-3 text-slate-300"><MoreVertical size={16}/></div>}
                         
                         <div className="flex justify-between items-start mb-2 pr-6">
                            <div>
                               <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit mb-1 ${d.type === 'HUTANG' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{d.type}</div>
                               <h4 className="font-bold text-slate-800 dark:text-white">{d.name}</h4>
                               {d.dueDate && (
                                 <div className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${new Date(d.dueDate) < new Date() && !d.isPaid ? 'text-red-500' : 'text-slate-400'}`}>
                                   <CalendarClock size={12}/> Jatuh Tempo: {new Date(d.dueDate).toLocaleDateString('id-ID')}
                                 </div>
                               )}
                               <p className="text-xs text-slate-500 mt-1">{d.notes}</p>
                            </div>
                            <div className="text-right mt-6">
                               <div className="font-black text-lg text-slate-800 dark:text-white">{formatCurrency(d.amount)}</div>
                            </div>
                         </div>
                      </div>
                   ))}
                 </div>
                 <button onClick={() => openFeatureModal('DEBT')} className="w-full mt-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                    <HandCoins size={16}/> Catat Baru
                 </button>
               </div>
            )}

            {/* GOALS TAB */}
            {activeFeatureTab === 'GOALS' && (
               <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                 {goals.length === 0 && <div className="text-center text-slate-400 text-sm py-8">Belum ada target tabungan.</div>}
                 
                 <div className="space-y-3">
                   {goals.map((g) => {
                      const percent = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                      return (
                         <div 
                            key={g.id} 
                            onClick={() => setActiveGoal(g)}
                            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative active:scale-98 transition-transform cursor-pointer"
                         >
                            <div className="absolute top-3 right-3 text-slate-300"><MoreVertical size={16}/></div>

                            <div className="flex items-center gap-3 mb-3 pr-6">
                               <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600">
                                  <Target size={20}/>
                                </div>
                               <div className="flex-1">
                                  <h4 className="font-bold text-slate-800 dark:text-white">{g.name}</h4>
                                  <div className="text-xs text-slate-500">Terkumpul {formatCurrency(g.currentAmount)} dari {formatCurrency(g.targetAmount)}</div>
                               </div>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                               <div className="h-full bg-indigo-500 transition-all duration-500 rounded-full" style={{ width: `${percent}%` }}></div>
                            </div>
                            <div className="text-right text-[10px] font-bold text-indigo-500 mt-1">{Math.round(percent)}%</div>
                         </div>
                      )
                   })}
                 </div>
                 <button onClick={() => openFeatureModal('GOAL')} className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2">
                    <PiggyBank size={16}/> Tambah Target Tabungan
                 </button>
               </div>
            )}

         </div>

         {/* ACTION SHEETS (Debt/Goal) remain unchanged, omitted for brevity as they were correct in previous version */}
         {activeDebt && (
            <div className="fixed inset-0 z-[105] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveDebt(null)}>
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-[80vh] rounded-t-3xl p-0 flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg dark:text-white">Detail Hutang</h3>
                        <button onClick={() => setActiveDebt(null)}><X size={20} className="text-slate-400"/></button>
                     </div>
                     <div className="flex justify-between items-end">
                        <div>
                           <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded w-fit mb-1 ${activeDebt.type === 'HUTANG' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{activeDebt.type}</div>
                           <div className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(activeDebt.amount)}</div>
                        </div>
                        {activeDebt.dueDate && <div className="text-xs text-slate-500">Jatuh Tempo: {new Date(activeDebt.dueDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</div>}
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
                     <h4 className="font-bold text-xs text-slate-500 uppercase mb-3">Riwayat Transaksi</h4>
                     <div className="space-y-3">
                        {transactions.filter(t => t.relatedId === activeDebt.id).length > 0 ? (
                           transactions.filter(t => t.relatedId === activeDebt.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                              <div key={t.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                 <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-white">{new Date(t.date).toLocaleDateString('id-ID')}</div>
                                    <div className="text-[10px] text-slate-500">{t.category}</div>
                                 </div>
                                 <div className={`font-bold text-sm ${t.category.startsWith('Tambah') ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatCurrency(t.amount)}</div>
                              </div>
                           ))
                        ) : (
                           <div className="text-center text-slate-400 text-xs py-4">Belum ada riwayat pembayaran.</div>
                        )}
                     </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-3">
                     {!activeDebt.isPaid && (
                       <>
                         <button onClick={() => setActionModal({isOpen: true, mode: 'DEBT_ADD', title: 'Tambah Jumlah Hutang', label: 'Nominal Tambahan (Rp)'})} className="col-span-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700">
                            <TrendingUp size={18} className="text-red-500"/> Tambah
                         </button>
                         <button onClick={() => setActionModal({isOpen: true, mode: 'DEBT_PAY', title: 'Bayar / Cicil Hutang', label: 'Nominal Pembayaran (Rp)'})} className="col-span-2 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 flex justify-center items-center gap-2">
                            <CheckCircle size={18}/> Bayar/Cicil
                         </button>
                       </>
                     )}
                     {activeDebt.isPaid && <div className="col-span-4 text-center text-emerald-600 font-bold py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">Lunas!</div>}
                     
                     <button onClick={() => openFeatureModal('DEBT', activeDebt)} className="col-span-2 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-slate-200">
                        <Edit2 size={18}/> Edit
                     </button>
                     <button onClick={deleteDebt} className="col-span-2 py-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-rose-200">
                        <Trash2 size={18}/> Hapus
                     </button>
                  </div>
               </div>
            </div>
         )}

         {activeGoal && (
            <div className="fixed inset-0 z-[105] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveGoal(null)}>
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm h-[80vh] rounded-t-3xl p-0 flex flex-col animate-in slide-in-from-bottom duration-300 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg dark:text-white">Aksi Tabungan</h3>
                        <button onClick={() => setActiveGoal(null)}><X size={20} className="text-slate-400"/></button>
                     </div>
                     <div className="space-y-2">
                        <h4 className="font-bold text-2xl text-slate-800 dark:text-white">{formatCurrency(activeGoal.currentAmount)} <span className="text-sm font-medium text-slate-400">/ {formatCurrency(activeGoal.targetAmount)}</span></h4>
                        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                           <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min((activeGoal.currentAmount / activeGoal.targetAmount) * 100, 100)}%` }}></div>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950">
                     <h4 className="font-bold text-xs text-slate-500 uppercase mb-3">Riwayat Tabungan</h4>
                     <div className="space-y-3">
                        {transactions.filter(t => t.relatedId === activeGoal.id).length > 0 ? (
                           transactions.filter(t => t.relatedId === activeGoal.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                              <div key={t.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                 <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-white">{new Date(t.date).toLocaleDateString('id-ID')}</div>
                                    <div className="text-[10px] text-slate-500">{t.type === 'EXPENSE' ? 'Setor' : t.category === 'Biaya Admin / Pajak' ? 'Pajak' : 'Tarik'}</div>
                                 </div>
                                 <div className={`font-bold text-sm ${t.type === 'INCOME' ? 'text-red-500' : 'text-emerald-600'}`}>
                                    {t.type === 'INCOME' ? '-' : '+'}{formatCurrency(t.amount)}
                                 </div>
                              </div>
                           ))
                        ) : (
                           <div className="text-center text-slate-400 text-xs py-4">Belum ada riwayat transaksi.</div>
                        )}
                     </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                     <button onClick={() => setActionModal({isOpen: true, mode: 'GOAL_ADD', title: 'Isi Tabungan', label: 'Nominal Setor (Rp)'})} className="py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 font-bold rounded-xl flex items-center justify-center gap-2">
                        <TrendingUp size={18}/> Tambah / Isi
                     </button>
                     <button onClick={() => setActionModal({isOpen: true, mode: 'GOAL_WITHDRAW', title: 'Tarik Tabungan', label: 'Nominal Tarik (Rp)'})} className="py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 font-bold rounded-xl flex items-center justify-center gap-2">
                        <TrendingDown size={18}/> Tarik / Kurangi
                     </button>
                     <button onClick={() => openFeatureModal('GOAL', activeGoal)} className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2">
                        <Edit2 size={18}/> Edit
                     </button>
                     <button onClick={deleteGoal} className="py-3 bg-rose-100 dark:bg-rose-900/20 text-rose-600 font-bold rounded-xl flex items-center justify-center gap-2">
                        <Trash2 size={18}/> Hapus
                     </button>
                  </div>
               </div>
            </div>
         )}

         <ActionInputModal 
            isOpen={actionModal.isOpen} 
            title={actionModal.title} 
            amountLabel={actionModal.label}
            accounts={getActionAccounts()} 
            onConfirm={handleProcessAction} 
            onCancel={() => setActionModal({...actionModal, isOpen: false})} 
         />

      </div>
    );
  };

  const renderSettings = () => (
     <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
        {/* ... Settings Content ... */}
        <h2 className="font-bold text-lg mb-6 text-slate-800 dark:text-white">Pengaturan & Data</h2>
        <div className="space-y-4">
           {/* Dark Mode, Themes, Export/Import, Privacy, About Sections (Unchanged but using updated components if any) */}
           <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex justify-between items-center"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300">{darkMode ? <Moon size={20} /> : <Sun size={20} />}</div><div><h3 className="font-bold text-sm text-slate-800 dark:text-white">Mode Gelap</h3><p className="text-xs text-slate-500 dark:text-slate-400">Tampilan nyaman di mata</p></div></div><button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}><div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`}></div></button></div>
           <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"><h3 className="font-bold text-sm mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Palette size={16} /> Tema Warna</h3><div className="grid grid-cols-4 gap-2">{THEMES.map((t) => (<button key={t.value} onClick={() => setThemeColor(t.value)} className={`flex flex-col items-center gap-2 p-2 rounded-2xl border-2 transition-all ${themeColor === t.value ? `border-${t.value}-500 bg-${t.value}-50 dark:bg-${t.value}-900/30 scale-105` : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}><div className={`w-10 h-10 rounded-full ${t.class} shadow-sm border-2 border-white dark:border-slate-700`}></div><span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 truncate w-full text-center">{t.name}</span></button>))}</div></div>
           <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"><h3 className="font-bold text-sm mb-2 text-slate-800 dark:text-white">Ekspor & Impor Data</h3><p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Kelola data keuangan Anda dengan aman.</p><div className="space-y-3"><div className="flex gap-3"><button onClick={() => exportToCSV(transactions)} className={`flex-1 py-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors`}><FileText size={16} /> Ke Excel (CSV)</button><button onClick={() => exportToJSON({ transactions, budgets, debts, goals })} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Download size={16} /> Backup JSON</button></div><label className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 transition-all"><Upload size={16} /> Pulihkan dari Backup JSON<input type="file" accept=".json" onChange={handleImportFile} className="hidden" /></label></div></div>
           <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"><div className="flex items-start gap-4"><AlertCircle className={`text-${themeColor}-500 shrink-0`} size={24} /><div className="flex-1"><h3 className="font-bold text-sm mb-1 text-slate-800 dark:text-white">Privasi & Penyimpanan</h3><p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">Data transaksi dan foto disimpan lokal di browser perangkat ini. GriyaKas tidak mengirim data ke server aplikasi.</p><button onClick={() => setShowPinModal(true)} className="mt-3 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-2"><Lock size={14}/> Kelola Data & Master</button></div></div></div>
           <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"><h3 className="font-bold text-sm mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Info size={16} /> Tentang Aplikasi</h3><div className="space-y-1"><button onClick={() => setLegalView('PRIVACY')} className="w-full p-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full bg-${themeColor}-100 dark:bg-${themeColor}-900/30 flex items-center justify-center text-${themeColor}-600 dark:text-${themeColor}-400`}><Shield size={14} /></div><span className="text-xs font-bold text-slate-700 dark:text-slate-200">Kebijakan Privasi</span></div><ChevronRight size={16} className="text-slate-400" /></button><button onClick={() => setLegalView('TERMS')} className="w-full p-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full bg-${themeColor}-100 dark:bg-${themeColor}-900/30 flex items-center justify-center text-${themeColor}-600 dark:text-${themeColor}-400`}><FileBadge size={14} /></div><span className="text-xs font-bold text-slate-700 dark:text-slate-200">Syarat & Ketentuan</span></div><ChevronRight size={16} className="text-slate-400" /></button><button onClick={() => setLegalView('DISCLAIMER')} className="w-full p-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full bg-${themeColor}-100 dark:bg-${themeColor}-900/30 flex items-center justify-center text-${themeColor}-600 dark:text-${themeColor}-400`}><AlertCircle size={14} /></div><span className="text-xs font-bold text-slate-700 dark:text-slate-200">Disclaimer</span></div><ChevronRight size={16} className="text-slate-400" /></button></div></div>
        </div>
        <div className="mt-8 text-center pb-8"><p className="text-xs font-bold text-slate-400">GriyaKas v{APP_VERSION} • Published by Lathif Baska</p><p className="text-[10px] text-slate-300 mt-1">Local-first family finance manager</p></div>
     </div>
  );

  return (
    <Layout darkMode={darkMode} themeColor={themeColor}>
      <div 
        className="h-full flex flex-col relative bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
         <Toast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={handleCloseToast} />
         <ConfirmDialog 
            isOpen={confirmDialog.isOpen} 
            title={confirmDialog.title} 
            message={confirmDialog.msg} 
            onConfirm={confirmDialog.action} 
            onCancel={() => setConfirmDialog(prev => ({...prev, isOpen: false}))} 
            isDestructive={confirmDialog.isDestructive} 
            confirmText={confirmDialog.confirmText}
            cancelText={confirmDialog.cancelText}
         />
         
         <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={() => { setShowPinModal(false); setShowAdminPanel(true); }} />
         
         {renderFeatureModal()}

         {zoomImage && (
            <ImageViewer src={zoomImage} onClose={() => setZoomImage(null)} />
         )}

         <LegalModal type={legalView} onClose={() => setLegalView(null)} />

         <ImportChoiceModal 
            isOpen={!!pendingImport} 
            count={pendingImport ? (Array.isArray(pendingImport) ? pendingImport.length : (pendingImport.transactions?.length || 0)) : 0}
            isFullRestore={!!pendingImport && !Array.isArray(pendingImport)}
            onMerge={() => executeImport('MERGE')}
            onReplace={() => executeImport('REPLACE')}
            onCancel={() => { setPendingImport(null); showToast("Impor dibatalkan", 'error'); }}
         />

         <AdminPanel 
           isOpen={showAdminPanel} 
           onClose={() => setShowAdminPanel(false)} 
           data={{ accounts, incomeCats, expenseCats, persons }}
           openConfirm={openConfirm}
           showToast={showToast}
           actions={{
             setAccounts,
             setIncomeCats,
             setExpenseCats,
             setPersons,
             resetAllData: () => {
               openConfirm("Factory Reset?", "PERINGATAN: Semua data transaksi, akun, kategori, dan foto akan dihapus permanen.", () => {
                 setTransactions([]);
                 setBudgets([]);
                 setDebts([]);
                 setGoals([]);
                 clearGriyaKasData();
                 clearAdminPin();
                 window.location.reload();
               }, true);
             }
           }}
           transactions={transactions}
         />

         <div className="flex-1 overflow-hidden relative flex flex-col">
            {screen === Screen.DASHBOARD && renderDashboard()}
            {screen === Screen.ADD && renderAddForm()}
            {screen === Screen.HISTORY && renderHistory()}
            {screen === Screen.FEATURES && renderFeatures()}
            {screen === Screen.SETTINGS && renderSettings()}
         </div>

         {screen !== Screen.ADD && (
            <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-2 py-3 flex justify-around items-center absolute bottom-0 w-full z-50 rounded-t-3xl shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
               <button onClick={() => setScreen(Screen.DASHBOARD)} className={`p-2 flex flex-col items-center gap-1 transition-colors ${screen === Screen.DASHBOARD ? `text-${themeColor}-600 dark:text-${themeColor}-400` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  <Home size={22} strokeWidth={screen === Screen.DASHBOARD ? 2.5 : 2} />
                  <span className="text-[9px] font-bold">Home</span>
               </button>
               <button onClick={() => setScreen(Screen.HISTORY)} className={`p-2 flex flex-col items-center gap-1 transition-colors ${screen === Screen.HISTORY ? `text-${themeColor}-600 dark:text-${themeColor}-400` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  <History size={22} strokeWidth={screen === Screen.HISTORY ? 2.5 : 2} />
                  <span className="text-[9px] font-bold">Riwayat</span>
               </button>
               
               <div className="-mt-12">
                  <button onClick={handleInitAdd} className={`w-14 h-14 bg-${themeColor}-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-${themeColor}-500/40 hover:scale-105 active:scale-95 transition-all border-4 border-slate-50 dark:border-slate-950`}>
                     <PlusCircle size={28} />
                  </button>
               </div>

               <button onClick={() => setScreen(Screen.FEATURES)} className={`p-2 flex flex-col items-center gap-1 transition-colors ${screen === Screen.FEATURES ? `text-${themeColor}-600 dark:text-${themeColor}-400` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  <Grid size={22} strokeWidth={screen === Screen.FEATURES ? 2.5 : 2} />
                  <span className="text-[9px] font-bold">Fitur</span>
               </button>

               <button onClick={() => setScreen(Screen.SETTINGS)} className={`p-2 flex flex-col items-center gap-1 transition-colors ${screen === Screen.SETTINGS ? `text-${themeColor}-600 dark:text-${themeColor}-400` : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
                  <Settings size={22} strokeWidth={screen === Screen.SETTINGS ? 2.5 : 2} />
                  <span className="text-[9px] font-bold">Setting</span>
               </button>
            </div>
         )}
      </div>

      <TransactionDetailModal 
        isOpen={isModalOpen} 
        t={selectedTx} 
        onClose={() => setIsModalOpen(false)}
        onEdit={() => { if(selectedTx) { handleEditInit(selectedTx); }}} 
        onDeleteRequest={requestDelete}
        themeColor={themeColor}
        accounts={accounts}
        persons={persons}
        onImageClick={(src: any) => setZoomImage(src)}
      />
    </Layout>
  );
}