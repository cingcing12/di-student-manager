import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddStudentPage from './pages/AddStudentPage';
import Settings from './pages/Settings'; // <--- 1. Import Settings Page

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyAc2g-t9A7du3K_nI2fJnw_OGxhmLfpP6s",
  authDomain: "dilistname.firebaseapp.com",
  databaseURL: "https://dilistname-default-rtdb.firebaseio.com",
  projectId: "dilistname",
  storageBucket: "dilistname.firebasestorage.app",
  messagingSenderId: "897983357871",
  appId: "1:897983357871:web:42a046bc9fb3e0543dc55a",
  measurementId: "G-NQ798D9J6K"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
const auth = getAuth(app);

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Data Loader
  useEffect(() => {
    signInAnonymously(auth).then(() => {
      onValue(ref(db, 'students'), (snapshot) => {
        const data = snapshot.val();
        setStudents(data ? Object.entries(data).map(([key, value]) => ({ id: key, ...value })) : []);
        setLoading(false);
      });
    }).catch(console.error);
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-400 font-medium animate-pulse">Loading DI Manager...</p>
    </div>
  );

  return (
    <Router>
      <div className="flex h-screen bg-slate-50/50 font-sans text-slate-900 overflow-hidden selection:bg-indigo-100 selection:text-indigo-700">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            <Route 
              path="/dashboard" 
              element={
                <Dashboard 
                  students={students} 
                  setSidebarOpen={setSidebarOpen} 
                />
              } 
            />
            
            <Route 
              path="/add" 
              element={
                <AddStudentPage setSidebarOpen={setSidebarOpen} />
              } 
            />

            {/* <--- FIXED: Passed setSidebarOpen prop here */}
            <Route 
              path="/settings" 
              element={
                <Settings setSidebarOpen={setSidebarOpen} />
              } 
            />

          </Routes>
        </div>

        {/* Global Styles Injection */}
        <style>{`
          .label { @apply block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 ml-1; }
          .input { @apply w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 font-medium placeholder:text-slate-400; }
          .btn-primary { @apply flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200; }
          .btn-secondary { @apply flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 font-bold rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-200; }
          .btn-danger { @apply flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-rose-600 font-bold rounded-xl border border-rose-200 hover:bg-rose-50 hover:border-rose-300 active:scale-95 transition-all duration-200; }
          .btn-ghost { @apply px-4 py-2 text-slate-500 font-bold hover:text-slate-800 transition-colors; }
          .card { @apply bg-white p-6 rounded-2xl border border-slate-100 shadow-sm; }
          .section-title { @apply text-sm font-bold text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2 pb-3 border-b border-slate-100; }
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        `}</style>
      </div>
    </Router>
  );
}