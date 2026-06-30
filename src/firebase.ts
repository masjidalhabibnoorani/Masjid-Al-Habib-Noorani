import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
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
  'section_custom_colors'
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

/**
 * Saves a single key-value pair to Firestore
 */
export async function saveToCloud(key: string, data: any): Promise<void> {
  const path = `portal_data/${key}`;
  try {
    const docRef = doc(db, 'portal_data', key);
    await setDoc(docRef, {
      data: data,
      updatedAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetches a single key-value pair from Firestore
 */
export async function fetchFromCloud(key: string): Promise<any | null> {
  const path = `portal_data/${key}`;
  try {
    const docRef = doc(db, 'portal_data', key);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().data;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
  return null;
}

/**
 * Saves all local storage state to Cloud Firestore (Backup)
 */
export async function backupAllToCloud(): Promise<void> {
  const batch = writeBatch(db);
  let hasData = false;

  for (const key of SYNC_KEYS) {
    const localVal = localStorage.getItem(`masjid_habib_${key}`);
    if (localVal !== null) {
      try {
        const parsed = JSON.parse(localVal);
        const docRef = doc(db, 'portal_data', key);
        batch.set(docRef, {
          data: parsed,
          updatedAt: Date.now()
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
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'portal_data');
    }
  }
}

/**
 * Fetches all database states from Cloud Firestore (Restore)
 */
export async function restoreAllFromCloud(): Promise<Record<string, any>> {
  const result: Record<string, any> = {};
  try {
    const querySnapshot = await getDocs(collection(db, 'portal_data'));
    
    querySnapshot.forEach((docSnap) => {
      const key = docSnap.id;
      if (SYNC_KEYS.includes(key)) {
        const docData = docSnap.data();
        result[key] = docData.data;
      }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'portal_data');
  }

  return result;
}
