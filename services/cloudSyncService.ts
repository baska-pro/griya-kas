import { GriyaKasExportData, CloudSyncConfig, Transaction, Account, Budget, Debt, SavingsGoal, RecurringBill } from "../types";
import { getFullAppData, restoreFullAppData, saveCloudSyncConfig, loadCloudSyncConfig } from "./storageService";

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp: string;
  source: 'GOOGLE_SHEETS' | 'SUPABASE';
  data?: Partial<GriyaKasExportData>;
  mergedStats?: {
    transactionsCount: number;
    accountsCount: number;
    debtsCount: number;
    billsCount: number;
    goalsCount: number;
  };
}

// =========================================================================
// SMART BI-DIRECTIONAL MERGE ENGINE (NON-DESTRUCTIVE ID-BASED MERGE)
// =========================================================================
export const mergeAppData = (
  local: GriyaKasExportData,
  remote: Partial<GriyaKasExportData>
): GriyaKasExportData => {
  // 1. Merge Transactions (Union by ID, preserve newest/complete entries)
  const txMap = new Map<string, Transaction>();
  
  (remote.transactions || []).forEach(tx => {
    if (tx && tx.id) txMap.set(tx.id, { ...tx });
  });

  (local.transactions || []).forEach(localTx => {
    if (!localTx || !localTx.id) return;
    const existing = txMap.get(localTx.id);
    if (!existing) {
      txMap.set(localTx.id, { ...localTx });
    } else {
      // If transaction exists in both, merge attributes gracefully
      txMap.set(localTx.id, {
        ...existing,
        ...localTx,
        attachmentImage: localTx.attachmentImage || existing.attachmentImage,
        notes: localTx.notes || existing.notes || '',
        relatedId: localTx.relatedId || existing.relatedId
      });
    }
  });

  const mergedTransactions: Transaction[] = Array.from(txMap.values()).sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;
    return (b.id || '').localeCompare(a.id || '');
  });

  // 2. Merge Accounts (Union by ID)
  const accMap = new Map<string, Account>();
  (remote.accounts || []).forEach(acc => {
    if (acc && acc.id) accMap.set(acc.id, { ...acc });
  });
  (local.accounts || []).forEach(acc => {
    if (acc && acc.id) {
      const existing = accMap.get(acc.id);
      accMap.set(acc.id, existing ? { ...existing, ...acc } : { ...acc });
    }
  });
  const mergedAccounts = Array.from(accMap.values());

  // 3. Merge Income & Expense Categories
  const mergedIncomeCategories = Array.from(
    new Set([...(remote.incomeCategories || []), ...(local.incomeCategories || [])])
  ).filter(Boolean);

  const mergedExpenseCategories = Array.from(
    new Set([...(remote.expenseCategories || []), ...(local.expenseCategories || [])])
  ).filter(Boolean);

  // 4. Merge Family Persons
  const personMap = new Map<string, { id: string; label: string }>();
  (remote.persons || []).forEach(p => {
    if (p && (p.id || p.label)) personMap.set(p.id || p.label, { ...p });
  });
  (local.persons || []).forEach(p => {
    if (p && (p.id || p.label)) personMap.set(p.id || p.label, { ...p });
  });
  const mergedPersons = Array.from(personMap.values());

  // 5. Merge Budgets
  const budgetMap = new Map<string, Budget>();
  (remote.budgets || []).forEach(b => {
    if (b && b.id) budgetMap.set(b.id, { ...b });
  });
  (local.budgets || []).forEach(b => {
    if (b && b.id) budgetMap.set(b.id, { ...b });
  });
  const mergedBudgets = Array.from(budgetMap.values());

  // 6. Merge Debts (Preserve payment progress and status)
  const debtMap = new Map<string, Debt>();
  (remote.debts || []).forEach(d => {
    if (d && d.id) debtMap.set(d.id, { ...d });
  });
  (local.debts || []).forEach(d => {
    if (!d || !d.id) return;
    const existing = debtMap.get(d.id);
    if (!existing) {
      debtMap.set(d.id, { ...d });
    } else {
      const maxPaid = Math.max(d.paidAmount || 0, existing.paidAmount || 0);
      const isPaid = d.isPaid || existing.isPaid || maxPaid >= (d.amount || existing.amount);
      debtMap.set(d.id, {
        ...existing,
        ...d,
        paidAmount: maxPaid,
        isPaid
      });
    }
  });
  const mergedDebts = Array.from(debtMap.values());

  // 7. Merge Savings Goals
  const goalMap = new Map<string, SavingsGoal>();
  (remote.goals || []).forEach(g => {
    if (g && g.id) goalMap.set(g.id, { ...g });
  });
  (local.goals || []).forEach(g => {
    if (!g || !g.id) return;
    const existing = goalMap.get(g.id);
    if (!existing) {
      goalMap.set(g.id, { ...g });
    } else {
      const maxAmount = Math.max(g.currentAmount || 0, existing.currentAmount || 0);
      goalMap.set(g.id, {
        ...existing,
        ...g,
        currentAmount: maxAmount
      });
    }
  });
  const mergedGoals = Array.from(goalMap.values());

  // 8. Merge Recurring Bills (Union paidMonths array)
  const billMap = new Map<string, RecurringBill>();
  (remote.bills || []).forEach(b => {
    if (b && b.id) billMap.set(b.id, { ...b });
  });
  (local.bills || []).forEach(b => {
    if (!b || !b.id) return;
    const existing = billMap.get(b.id);
    if (!existing) {
      billMap.set(b.id, { ...b });
    } else {
      const unionPaidMonths = Array.from(
        new Set([...(existing.paidMonths || []), ...(b.paidMonths || [])])
      );
      billMap.set(b.id, {
        ...existing,
        ...b,
        paidMonths: unionPaidMonths
      });
    }
  });
  const mergedBills = Array.from(billMap.values());

  return {
    app: 'GriyaKas',
    schemaVersion: 2,
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    transactions: mergedTransactions,
    accounts: mergedAccounts.length > 0 ? mergedAccounts : local.accounts,
    incomeCategories: mergedIncomeCategories.length > 0 ? mergedIncomeCategories : local.incomeCategories,
    expenseCategories: mergedExpenseCategories.length > 0 ? mergedExpenseCategories : local.expenseCategories,
    persons: mergedPersons.length > 0 ? mergedPersons : local.persons,
    budgets: mergedBudgets,
    debts: mergedDebts,
    goals: mergedGoals,
    bills: mergedBills,
    settings: {
      themeColor: local.settings?.themeColor || remote.settings?.themeColor || 'emerald',
      darkMode: local.settings?.darkMode !== undefined ? local.settings.darkMode : (remote.settings?.darkMode || false),
      hideBalance: local.settings?.hideBalance !== undefined ? local.settings.hideBalance : (remote.settings?.hideBalance || false)
    }
  };
};

// =========================================================================
// 1. GOOGLE APPS SCRIPT (GAS) SYNC ENGINE
// =========================================================================

export const testGoogleAppsScript = async (webAppUrl: string): Promise<SyncResult> => {
  const cleanUrl = (webAppUrl || '').trim();
  if (!cleanUrl.startsWith('http')) {
    return {
      success: false,
      message: 'URL Google Apps Script tidak valid. Pastikan diawali https://script.google.com/...',
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS'
    };
  }

  try {
    const payload = { action: 'test' };
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const resJson = await response.json();
    return {
      success: !!resJson.success,
      message: resJson.message || 'Berhasil terhubung ke Google Spreadsheet!',
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS'
    };
  } catch (err: any) {
    console.error('GAS Test Error:', err);
    return {
      success: false,
      message: `Gagal terhubung ke GAS: ${err.message || 'Periksa Web App Deployment (pastikan Who has access: Anyone)'}`,
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS'
    };
  }
};

export const pushDataToGoogleAppsScript = async (webAppUrl: string, data: GriyaKasExportData): Promise<SyncResult> => {
  const cleanUrl = (webAppUrl || '').trim();
  if (!cleanUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi.',
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS'
    };
  }

  try {
    const payload = {
      action: 'syncAll',
      data,
      timestamp: new Date().toISOString()
    };

    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const resJson = await response.json();
    if (resJson.success) {
      const cfg = loadCloudSyncConfig();
      cfg.googleSheets.lastSync = new Date().toISOString();
      saveCloudSyncConfig(cfg);
    }

    return {
      success: !!resJson.success,
      message: resJson.message || 'Backup ke Google Spreadsheet berhasil!',
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS'
    };
  } catch (err: any) {
    console.error('GAS Push Error:', err);
    return {
      success: false,
      message: `Gagal simpan ke Spreadsheet: ${err.message}`,
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS'
    };
  }
};

export const pushToGoogleAppsScript = async (webAppUrl: string): Promise<SyncResult> => {
  const fullData = getFullAppData();
  return pushDataToGoogleAppsScript(webAppUrl, fullData);
};

export const pullFromGoogleAppsScript = async (webAppUrl: string): Promise<SyncResult> => {
  const cleanUrl = (webAppUrl || '').trim();
  if (!cleanUrl) {
    return {
      success: false,
      message: 'URL Google Apps Script belum diisi.',
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS'
    };
  }

  try {
    const payload = { action: 'fetchAll' };
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const resJson = await response.json();
    if (!resJson.success || !resJson.data) {
      throw new Error(resJson.message || 'Data tidak ditemukan di Spreadsheet');
    }

    return {
      success: true,
      message: `Berhasil memuat data dari Google Sheets!`,
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS',
      data: resJson.data
    };
  } catch (err: any) {
    console.error('GAS Pull Error:', err);
    return {
      success: false,
      message: `Gagal memulihkan dari Spreadsheet: ${err.message}`,
      timestamp: new Date().toISOString(),
      source: 'GOOGLE_SHEETS'
    };
  }
};

// =========================================================================
// 2. SUPABASE REST API SYNC ENGINE
// =========================================================================

const formatSupabaseUrl = (url: string): string => {
  let clean = (url || '').trim();
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }
  return clean.replace(/\/+$/, '');
};

export const testSupabase = async (projectUrl: string, anonKey: string): Promise<SyncResult> => {
  const base = formatSupabaseUrl(projectUrl);
  const key = (anonKey || '').trim();

  if (!base || !key) {
    return {
      success: false,
      message: 'Harap isi Project URL dan Anon Key Supabase.',
      timestamp: new Date().toISOString(),
      source: 'SUPABASE'
    };
  }

  try {
    const endpoint = `${base}/rest/v1/griyakas_storage?select=id,vault_name,updated_at&limit=1`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 404 || response.status === 401 || response.status === 403) {
      const errText = await response.text();
      throw new Error(`Supabase Error (${response.status}): ${errText || 'Akses ditolak atau tabel belum dibuat'}`);
    }

    if (!response.ok) {
      throw new Error(`Koneksi ditolak (Status ${response.status})`);
    }

    return {
      success: true,
      message: 'Koneksi ke Database Supabase Berhasil & Tabel Ditemukan!',
      timestamp: new Date().toISOString(),
      source: 'SUPABASE'
    };
  } catch (err: any) {
    console.error('Supabase Test Error:', err);
    return {
      success: false,
      message: `Gagal terhubung ke Supabase: ${err.message}. Pastikan skrip SQL tabel griyakas_storage sudah di-Run di SQL Editor.`,
      timestamp: new Date().toISOString(),
      source: 'SUPABASE'
    };
  }
};

export const pushDataToSupabase = async (projectUrl: string, anonKey: string, data: GriyaKasExportData): Promise<SyncResult> => {
  const base = formatSupabaseUrl(projectUrl);
  const key = (anonKey || '').trim();

  if (!base || !key) {
    return {
      success: false,
      message: 'Project URL atau Anon Key Supabase belum diatur.',
      timestamp: new Date().toISOString(),
      source: 'SUPABASE'
    };
  }

  try {
    const record = {
      id: 'primary_vault',
      vault_name: 'Brankas Utama GriyaKas',
      payload: data,
      updated_at: new Date().toISOString()
    };

    const endpoint = `${base}/rest/v1/griyakas_storage`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(record)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const cfg = loadCloudSyncConfig();
    cfg.supabase.lastSync = new Date().toISOString();
    saveCloudSyncConfig(cfg);

    return {
      success: true,
      message: 'Data GriyaKas berhasil disinkronkan & diamankan di Supabase!',
      timestamp: new Date().toISOString(),
      source: 'SUPABASE'
    };
  } catch (err: any) {
    console.error('Supabase Push Error:', err);
    return {
      success: false,
      message: `Gagal simpan ke Supabase: ${err.message}`,
      timestamp: new Date().toISOString(),
      source: 'SUPABASE'
    };
  }
};

export const pushToSupabase = async (projectUrl: string, anonKey: string): Promise<SyncResult> => {
  const fullData = getFullAppData();
  return pushDataToSupabase(projectUrl, anonKey, fullData);
};

export const pullFromSupabase = async (projectUrl: string, anonKey: string): Promise<SyncResult> => {
  const base = formatSupabaseUrl(projectUrl);
  const key = (anonKey || '').trim();

  if (!base || !key) {
    return {
      success: false,
      message: 'Project URL atau Anon Key Supabase belum diatur.',
      timestamp: new Date().toISOString(),
      source: 'SUPABASE'
    };
  }

  try {
    const endpoint = `${base}/rest/v1/griyakas_storage?id=eq.primary_vault&select=payload,updated_at`;
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const dataArr = await response.json();
    if (!dataArr || dataArr.length === 0 || !dataArr[0].payload) {
      throw new Error('Data belum ada di database Supabase (tabel masih kosong).');
    }

    const payload: Partial<GriyaKasExportData> = dataArr[0].payload;
    return {
      success: true,
      message: `Berhasil mengambil data dari Supabase!`,
      timestamp: new Date().toISOString(),
      source: 'SUPABASE',
      data: payload
    };
  } catch (err: any) {
    console.error('Supabase Pull Error:', err);
    return {
      success: false,
      message: `Gagal memulihkan dari Supabase: ${err.message}`,
      timestamp: new Date().toISOString(),
      source: 'SUPABASE'
    };
  }
};

// =========================================================================
// 3. SMART 2-WAY SYNC ORCHESTRATOR (INITIAL SETUP & CONTINUOUS REALTIME)
// =========================================================================
/**
 * Smart Sync:
 * - If Remote is empty & Local has data -> Push Local to Remote.
 * - If Remote has data & Local is empty -> Pull Remote to Local.
 * - If Both have data -> Merge both non-destructively, push Merged to Remote, and apply Merged to Local!
 */
export const smartSyncCloud = async (configOverride?: CloudSyncConfig): Promise<SyncResult> => {
  const cfg = configOverride || loadCloudSyncConfig();
  const localData = getFullAppData();
  const localTxCount = localData.transactions?.length || 0;

  // Check which provider is enabled
  if (cfg.supabase.enabled && cfg.supabase.projectUrl && cfg.supabase.anonKey) {
    try {
      const pullRes = await pullFromSupabase(cfg.supabase.projectUrl, cfg.supabase.anonKey);
      
      if (pullRes.success && pullRes.data && (pullRes.data.transactions?.length || pullRes.data.accounts?.length)) {
        // Remote has data
        const remoteData = pullRes.data;
        const remoteTxCount = remoteData.transactions?.length || 0;

        if (localTxCount === 0 && (!localData.debts?.length && !localData.goals?.length)) {
          // Local is fresh/empty -> Restore directly from remote
          restoreFullAppData(remoteData);
          cfg.supabase.lastSync = new Date().toISOString();
          saveCloudSyncConfig(cfg);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('griyakas-data-synced', { detail: { source: 'SUPABASE' } }));
          }

          return {
            success: true,
            message: `Aplikasi berhasil diperbarui dari database Supabase (${remoteTxCount} transaksi termuat)!`,
            timestamp: new Date().toISOString(),
            source: 'SUPABASE',
            data: remoteData
          };
        } else {
          // Both local and remote have data -> Smart non-destructive merge!
          const merged = mergeAppData(localData, remoteData);
          
          // Push merged data back to remote to sync database
          await pushDataToSupabase(cfg.supabase.projectUrl, cfg.supabase.anonKey, merged);
          
          // Save merged data locally
          restoreFullAppData(merged);
          cfg.supabase.lastSync = new Date().toISOString();
          saveCloudSyncConfig(cfg);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('griyakas-data-synced', { detail: { source: 'SUPABASE' } }));
          }

          return {
            success: true,
            message: `Sinkronisasi selesai: data lokal & cloud digabungkan (${merged.transactions.length} transaksi aman)!`,
            timestamp: new Date().toISOString(),
            source: 'SUPABASE',
            data: merged,
            mergedStats: {
              transactionsCount: merged.transactions.length,
              accountsCount: merged.accounts.length,
              debtsCount: merged.debts.length,
              billsCount: merged.bills.length,
              goalsCount: merged.goals.length
            }
          };
        }
      } else {
        // Remote is empty -> Push all local data to Supabase
        const pushRes = await pushDataToSupabase(cfg.supabase.projectUrl, cfg.supabase.anonKey, localData);
        return {
          success: pushRes.success,
          message: pushRes.success
            ? `Semua data lokal (${localTxCount} transaksi) berhasil diunggah & diamankan ke database Supabase!`
            : pushRes.message,
          timestamp: new Date().toISOString(),
          source: 'SUPABASE',
          data: localData
        };
      }
    } catch (err: any) {
      console.error('SmartSync Supabase Error:', err);
      // Fallback: push local data
      const pushRes = await pushDataToSupabase(cfg.supabase.projectUrl, cfg.supabase.anonKey, localData);
      return pushRes;
    }
  }

  if (cfg.googleSheets.enabled && cfg.googleSheets.webAppUrl) {
    try {
      const pullRes = await pullFromGoogleAppsScript(cfg.googleSheets.webAppUrl);

      if (pullRes.success && pullRes.data && (pullRes.data.transactions?.length || pullRes.data.accounts?.length)) {
        // Remote has data
        const remoteData = pullRes.data;
        const remoteTxCount = remoteData.transactions?.length || 0;

        if (localTxCount === 0 && (!localData.debts?.length && !localData.goals?.length)) {
          // Local is fresh/empty -> Restore directly from Google Sheets
          restoreFullAppData(remoteData);
          cfg.googleSheets.lastSync = new Date().toISOString();
          saveCloudSyncConfig(cfg);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('griyakas-data-synced', { detail: { source: 'GOOGLE_SHEETS' } }));
          }

          return {
            success: true,
            message: `Aplikasi berhasil diperbarui dari Google Spreadsheet (${remoteTxCount} transaksi termuat)!`,
            timestamp: new Date().toISOString(),
            source: 'GOOGLE_SHEETS',
            data: remoteData
          };
        } else {
          // Both have data -> Merge
          const merged = mergeAppData(localData, remoteData);
          await pushDataToGoogleAppsScript(cfg.googleSheets.webAppUrl, merged);
          restoreFullAppData(merged);

          cfg.googleSheets.lastSync = new Date().toISOString();
          saveCloudSyncConfig(cfg);

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('griyakas-data-synced', { detail: { source: 'GOOGLE_SHEETS' } }));
          }

          return {
            success: true,
            message: `Sinkronisasi Cerdas Selesai: Data lokal & Spreadsheet digabungkan (${merged.transactions.length} transaksi aman)!`,
            timestamp: new Date().toISOString(),
            source: 'GOOGLE_SHEETS',
            data: merged,
            mergedStats: {
              transactionsCount: merged.transactions.length,
              accountsCount: merged.accounts.length,
              debtsCount: merged.debts.length,
              billsCount: merged.bills.length,
              goalsCount: merged.goals.length
            }
          };
        }
      } else {
        // Remote is empty -> Push local data to Google Sheets
        const pushRes = await pushDataToGoogleAppsScript(cfg.googleSheets.webAppUrl, localData);
        return {
          success: pushRes.success,
          message: pushRes.success
            ? `Semua data lokal (${localTxCount} transaksi) berhasil diunggah ke Google Spreadsheet!`
            : pushRes.message,
          timestamp: new Date().toISOString(),
          source: 'GOOGLE_SHEETS',
          data: localData
        };
      }
    } catch (err: any) {
      console.error('SmartSync GAS Error:', err);
      const pushRes = await pushDataToGoogleAppsScript(cfg.googleSheets.webAppUrl, localData);
      return pushRes;
    }
  }

  return {
    success: false,
    message: 'Belum ada konfigurasi Cloud Database yang aktif (Google Sheets atau Supabase).',
    timestamp: new Date().toISOString(),
    source: 'GOOGLE_SHEETS'
  };
};

// =========================================================================
// 4. BACKGROUND AUTO-SYNC DISPATCHER WITH DEBOUNCE & REALTIME POLLING
// =========================================================================
let autoSyncDebounceTimer: any = null;

export const triggerAutoSync = async (): Promise<void> => {
  if (autoSyncDebounceTimer) {
    clearTimeout(autoSyncDebounceTimer);
  }

  autoSyncDebounceTimer = setTimeout(async () => {
    const cfg = loadCloudSyncConfig();
    const isSupaAuto = cfg.supabase.enabled && cfg.supabase.autoSync && cfg.supabase.projectUrl && cfg.supabase.anonKey;
    const isGasAuto = cfg.googleSheets.enabled && cfg.googleSheets.autoSync && cfg.googleSheets.webAppUrl;

    if (isSupaAuto || isGasAuto) {
      try {
        await smartSyncCloud(cfg);
      } catch (err) {
        console.warn('Background auto-sync failed:', err);
      }
    }
  }, 400);
};
