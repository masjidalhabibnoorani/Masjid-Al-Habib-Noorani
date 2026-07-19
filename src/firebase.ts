import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

// Initialize Firestore with the custom database ID provided in config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// List of database keys we synchronize to/from Cloud Firestore
export const SYNC_KEYS = [
  'passwords',
  'prayer_timings',
  'history_sections',
  'activities',
  'map_settings',
  'announcements',
  'administrators',
  'religious_staff',
  'funds',
  'members',
  'transactions',
  'other_fund_entries',
  'expenses',
  'projects',
  'commitments',
  'notice_template',
  'ai_extra_info',
  'custom_theme_colors',
  'custom_bg_image',
  'custom_bg_opacity',
  'section_bg_settings',
  'section_custom_colors',
  'current_theme_id'
];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Track active debounce timers and in-flight cloud saving operations to optimize write quotas
const debounceTimers = new Map<string, any>();
const activeSaves = { count: 0 };

export function isCloudBypassed(): boolean {
  try {
    const bypassUntil = localStorage.getItem('masjid_habib_cloud_bypass_until');
    if (bypassUntil) {
      const untilTime = parseInt(bypassUntil, 10);
      if (Date.now() < untilTime) {
        return true;
      } else {
        localStorage.removeItem('masjid_habib_cloud_bypass_until');
      }
    }
  } catch (e) {
    // ignore
  }
  return false;
}

export function clearCloudBypass(): void {
  try {
    localStorage.removeItem('masjid_habib_cloud_bypass_until');
  } catch (e) {
    // ignore
  }
}

function setCloudBypass() {
  try {
    const bypassTime = Date.now() + 12 * 60 * 60 * 1000; 
    localStorage.setItem('masjid_habib_cloud_bypass_until', bypassTime.toString());
  } catch (e) {
    // ignore
  }
}

function emitSyncStatus(status: 'synced' | 'syncing' | 'error' | 'idle') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cloud-sync-status', { detail: status }));
  }
}

/**
 * Saves a single key-value pair to Firestore (Debounced to protect against write quotas unless immediate is true)
 */
export async function saveToCloud(key: string, data: any, immediate = false): Promise<void> {
  if (isCloudBypassed()) {
    emitSyncStatus('synced');
    return;
  }
  const path = `portal_data/${key}`;

  const isPending = debounceTimers.has(key);

  if (isPending) {
    clearTimeout(debounceTimers.get(key));
    debounceTimers.delete(key);
  }

  const performWrite = async () => {
    try {
      const docRef = doc(db, 'portal_data', key);
      const now = Date.now();
      await setDoc(docRef, {
        data: data,
        updatedAt: now
      });

      // Update local timestamp to be in perfect sync with the cloud
      try {
        localStorage.setItem(`masjid_habib_time_${key}`, now.toString());
      } catch (e) {}
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = 
        errMessage.includes('resource-exhausted') || 
        errMessage.includes('quota') || 
        errMessage.includes('Quota limit exceeded') ||
        errMessage.includes('Limit exceeded');

      if (isQuotaError) {
        console.warn(`[Firestore Quota Protection] Cloud write limit reached for key "${key}". Saving in browser local storage only.`);
        setCloudBypass();
      } else {
        emitSyncStatus('error');
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } finally {
      activeSaves.count = Math.max(0, activeSaves.count - 1);
      if (activeSaves.count === 0) {
        emitSyncStatus('synced');
      }
    }
  };

  if (!isPending) {
    activeSaves.count++;
    emitSyncStatus('syncing');
  }

  if (immediate) {
    await performWrite();
  } else {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(async () => {
        debounceTimers.delete(key);
        try {
          await performWrite();
          resolve();
        } catch (e) {
          reject(e);
        }
      }, 2000); // 2 seconds debounce groups rapid slider drags, typing keystrokes, or color pickers into single writes

      debounceTimers.set(key, timer);
    });
  }
}

/**
 * Saves all local storage state to Cloud Firestore (Backup)
 */
export async function backupAllToCloud(): Promise<void> {
  if (isCloudBypassed()) {
    return;
  }
  const batch = writeBatch(db);
  let hasData = false;
  const now = Date.now();

  for (const key of SYNC_KEYS) {
    const localVal = localStorage.getItem(`masjid_habib_${key}`);
    if (localVal !== null) {
      try {
        const parsed = JSON.parse(localVal);
        const docRef = doc(db, 'portal_data', key);
        batch.set(docRef, {
          data: parsed,
          updatedAt: now
        });
        hasData = true;
      } catch (e) {
        // Ignored
      }
    }
  }

  if (hasData) {
    try {
      await batch.commit();
      // Update all local timestamps to match 'now'
      for (const key of SYNC_KEYS) {
        try {
          localStorage.setItem(`masjid_habib_time_${key}`, now.toString());
        } catch (e) {}
      }
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = 
        errMessage.includes('resource-exhausted') || 
        errMessage.includes('quota') || 
        errMessage.includes('Quota limit exceeded') ||
        errMessage.includes('Limit exceeded');

      if (isQuotaError) {
        setCloudBypass();
      } else {
        handleFirestoreError(error, OperationType.WRITE, 'portal_data');
      }
    }
  }
}

/**
 * Fetches all database states from Cloud Firestore (Restore)
 */
export async function restoreAllFromCloud(): Promise<Record<string, { data: any, updatedAt: number }>> {
  const result: Record<string, { data: any, updatedAt: number }> = {};
  if (isCloudBypassed()) {
    console.warn("[Firestore Quota Protection] Cloud reads bypassed due to active quota limit protection.");
    return result;
  }
  try {
    const querySnapshot = await getDocs(collection(db, 'portal_data'));
    
    querySnapshot.forEach((docSnap) => {
      const key = docSnap.id;
      if (SYNC_KEYS.includes(key)) {
        const docData = docSnap.data();
        result[key] = {
          data: docData.data,
          updatedAt: docData.updatedAt || 0
        };
      }
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const isQuotaError = 
      errMessage.includes('resource-exhausted') || 
      errMessage.includes('quota') || 
      errMessage.includes('Quota limit exceeded') ||
      errMessage.includes('Limit exceeded');

    if (isQuotaError) {
      console.warn(`[Firestore Quota Protection] Cloud read limit reached. Bypassing cloud integration.`);
      setCloudBypass();
    } else {
      handleFirestoreError(error, OperationType.LIST, 'portal_data');
    }
  }

  return result;
}

/**
 * Fetches a single key-value pair from Firestore
 */
export async function fetchFromCloud(key: string): Promise<any | null> {
  if (isCloudBypassed()) {
    return null;
  }
  const path = `portal_data/${key}`;
  try {
    const docRef = doc(db, 'portal_data', key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const isQuotaError = 
      errMessage.includes('resource-exhausted') || 
      errMessage.includes('quota') || 
      errMessage.includes('Quota limit exceeded') ||
      errMessage.includes('Limit exceeded');

    if (isQuotaError) {
      setCloudBypass();
    } else {
      handleFirestoreError(error, OperationType.GET, path);
    }
  }
  return null;
}

/**
 * Subscribes to real-time changes from Cloud Firestore
 */
export function subscribeToCloudChanges(
  onUpdate: (key: string, data: any, updatedAt: number) => void,
  onError: (error: any) => void
): () => void {
  if (isCloudBypassed()) {
    return () => {};
  }
  
  const colRef = collection(db, 'portal_data');
  return onSnapshot(
    colRef,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        // We only care about added or modified documents
        if (change.type === 'added' || change.type === 'modified') {
          const key = change.doc.id;
          if (SYNC_KEYS.includes(key)) {
            const docData = change.doc.data();
            onUpdate(key, docData.data, docData.updatedAt || 0);
          }
        }
      });
    },
    (error) => {
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = 
        errMessage.includes('resource-exhausted') || 
        errMessage.includes('quota') || 
        errMessage.includes('Quota limit exceeded') ||
        errMessage.includes('Limit exceeded');

      if (isQuotaError) {
        console.warn(`[Firestore Quota Protection] Real-time listener reached quota limit.`);
        setCloudBypass();
      } else {
        onError(error);
      }
    }
  );
}

