import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocFromServer,
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  onSnapshot,
  enableIndexedDbPersistence,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Enable Offline Persistence for Firestore in browser
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence enabled in primary tab only.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support offline persistence.');
    }
  });

  // Verify connection to Firestore server as required by Firebase skill
  getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info('Firestore is running in offline mode with cached data.');
    }
  });
}

// Enum and Error Handler as required by Firebase skill
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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Authentication Helpers
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error('Google Sign-in failed:', error);
    throw error;
  }
}

export async function loginAnonymously() {
  try {
    const result = await firebaseSignInAnonymously(auth);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error('Anonymous Sign-in failed:', error);
    throw error;
  }
}

export async function logoutUser() {
  return firebaseSignOut(auth);
}

export async function syncUserProfile(user: User) {
  if (!user) return;
  const userRef = doc(db, 'users', user.uid);
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || 'anonymous@utilityhub.app',
        displayName: user.displayName || 'Khách Ghé Thăm',
        photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Firestore Data Storage Helpers
export interface SavedProject {
  id: string;
  userId: string;
  title: string;
  toolCategory: 'image' | 'video' | 'speech' | 'code';
  stepData?: string;
  outputContent: string;
  tags?: string[];
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function saveCloudProject(
  userId: string,
  projectData: Omit<SavedProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
) {
  const projectId = 'proj_' + Date.now();
  const path = `users/${userId}/projects/${projectId}`;
  const docRef = doc(db, 'users', userId, 'projects', projectId);
  
  const payload: SavedProject = {
    id: projectId,
    userId,
    title: projectData.title,
    toolCategory: projectData.toolCategory,
    stepData: projectData.stepData || '',
    outputContent: projectData.outputContent,
    tags: projectData.tags || [],
    isFavorite: projectData.isFavorite || false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteCloudProject(userId: string, projectId: string) {
  const path = `users/${userId}/projects/${projectId}`;
  const docRef = doc(db, 'users', userId, 'projects', projectId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export function subscribeUserProjects(
  userId: string,
  onProjects: (projects: SavedProject[]) => void
) {
  const collRef = collection(db, 'users', userId, 'projects');
  const path = `users/${userId}/projects`;

  return onSnapshot(
    query(collRef, orderBy('createdAt', 'desc')),
    (snapshot) => {
      const projects: SavedProject[] = [];
      snapshot.forEach((doc) => {
        projects.push(doc.data() as SavedProject);
      });
      onProjects(projects);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function logToolHistory(
  userId: string,
  toolId: string,
  toolName: string,
  inputSummary: string,
  outputSummary: string
) {
  const historyId = 'hist_' + Date.now();
  const path = `users/${userId}/history/${historyId}`;
  const docRef = doc(db, 'users', userId, 'history', historyId);

  try {
    await setDoc(docRef, {
      id: historyId,
      userId,
      toolId,
      toolName,
      inputSummary,
      outputSummary,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Logging history fallback (offline/permission):', error);
  }
}

// Voice & Story Studio Firestore Helpers
import type { VoiceStoryProject, StoryCharacter } from '@/types/story';

export async function saveVoiceStoryProject(userId: string, project: VoiceStoryProject) {
  const projectId = project.id || 'story_' + Date.now();
  const path = `users/${userId}/story_projects/${projectId}`;
  const docRef = doc(db, 'users', userId, 'story_projects', projectId);

  const payload: VoiceStoryProject = {
    ...project,
    id: projectId,
    userId,
    updatedAt: new Date().toISOString(),
    createdAt: project.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteVoiceStoryProject(userId: string, projectId: string) {
  const path = `users/${userId}/story_projects/${projectId}`;
  const docRef = doc(db, 'users', userId, 'story_projects', projectId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export function subscribeVoiceStoryProjects(
  userId: string,
  onProjects: (projects: VoiceStoryProject[]) => void
) {
  const collRef = collection(db, 'users', userId, 'story_projects');
  const path = `users/${userId}/story_projects`;

  return onSnapshot(
    query(collRef, orderBy('updatedAt', 'desc')),
    (snapshot) => {
      const projects: VoiceStoryProject[] = [];
      snapshot.forEach((doc) => {
        projects.push(doc.data() as VoiceStoryProject);
      });
      onProjects(projects);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function saveUserCharacter(userId: string, character: StoryCharacter) {
  const charId = character.id || 'char_' + Date.now();
  const path = `users/${userId}/characters/${charId}`;
  const docRef = doc(db, 'users', userId, 'characters', charId);

  const payload: StoryCharacter = {
    ...character,
    id: charId,
    updatedAt: new Date().toISOString(),
    createdAt: character.createdAt || new Date().toISOString(),
  };

  try {
    await setDoc(docRef, payload, { merge: true });
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteUserCharacter(userId: string, characterId: string) {
  const path = `users/${userId}/characters/${characterId}`;
  const docRef = doc(db, 'users', userId, 'characters', characterId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

export function subscribeUserCharacters(
  userId: string,
  onCharacters: (characters: StoryCharacter[]) => void
) {
  const collRef = collection(db, 'users', userId, 'characters');
  const path = `users/${userId}/characters`;

  return onSnapshot(
    query(collRef, orderBy('updatedAt', 'desc')),
    (snapshot) => {
      const characters: StoryCharacter[] = [];
      snapshot.forEach((doc) => {
        characters.push(doc.data() as StoryCharacter);
      });
      onCharacters(characters);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
