import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB8BDSVoYpGnzC4LW06VI0OCuw8HWdI26I",
  authDomain: "tasksync-ad593.firebaseapp.com",
  projectId: "tasksync-ad593",
  storageBucket: "tasksync-ad593.firebasestorage.app",
  messagingSenderId: "785038299081",
  appId: "1:785038299081:web:0bbd1265155905e9006218"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export function signIn() {
  return signInWithPopup(auth, provider);
}

export function signOut() {
  return fbSignOut(auth);
}

export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export async function syncToFirestore(state) {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, 'users', user.uid);
  await setDoc(ref, {
    tasks: state.tasks,
    timeLogs: state.timeLogs,
  });
}

export async function loadFromFirestore() {
  const user = auth.currentUser;
  if (!user) return null;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  return null;
}
