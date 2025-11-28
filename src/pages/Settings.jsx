import React, { useState, useEffect, useMemo } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../App';
import { 
  Plus, Trash2, Edit2, Save, X, BookOpen, 
  CheckCircle2, AlertCircle, Loader2, Search,
  GraduationCap, Users, Briefcase, Clock, 
  LayoutGrid, Menu, AlertTriangle
} from 'lucide-react';

// --- CONFIGURATION TABS ---
const SETTING_TABS = [
  { id: 'classes', label: 'Classes', icon: BookOpen, desc: 'Manage class codes' },
  { id: 'skills', label: 'Majors', icon: GraduationCap, desc: 'University majors' },
  { id: 'sections', label: 'Roles', icon: Briefcase, desc: 'Job titles/sections' },
  { id: 'groups', label: 'Groups', icon: Users, desc: 'Student groups' },
  { id: 'schedules', label: 'Schedules', icon: Clock, desc: 'Time slots' },
];

// --- COMPONENTS ---

// 1. Modern Toast Notification
const Toast = ({ type, msg, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-4 px-5 py-4 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border backdrop-blur-md animate-in slide-in-from-top-5 duration-300 ${type === 'error' ? 'bg-white/95 border-red-100 text-red-600' : 'bg-white/95 border-emerald-100 text-emerald-600'}`}>
      <div className={`p-2 rounded-full ${type === 'error' ? 'bg-red-50' : 'bg-emerald-50'}`}>
         {type === 'error' ? <AlertCircle size={20} strokeWidth={3} /> : <CheckCircle2 size={20} strokeWidth={3} />}
      </div>
      <div>
        <h4 className="font-extrabold text-sm leading-tight">{type === 'error' ? 'Error' : 'Success'}</h4>
        <p className="text-xs font-bold opacity-70 mt-0.5">{msg}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors ml-2"><X size={16} /></button>
    </div>
  );
};

// 2. Custom Alert Dialog (Replaces window.confirm)
const AlertDialog = ({ isOpen, onClose, onConfirm, title, message, isDangerous }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 mx-auto ${isDangerous ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'}`}>
          {isDangerous ? <Trash2 size={28} /> : <AlertTriangle size={28} />}
        </div>
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors">Cancel</button>
          <button onClick={onConfirm} className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${isDangerous ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
            {isDangerous ? 'Yes, Delete' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Settings({ setSidebarOpen }) {
  const [activeTab, setActiveTab] = useState('classes');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State
  const [newItem, setNewItem] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [notification, setNotification] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null); // For custom alert

  const currentTabConfig = SETTING_TABS.find(t => t.id === activeTab) || SETTING_TABS[0];

  // --- FIREBASE LOGIC ---
  useEffect(() => {
    setLoading(true);
    setSearchQuery(''); 
    setNewItem(''); 
    
    const dbRef = ref(db, `settings/${activeTab}`);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      setItems(data ? (Array.isArray(data) ? data : Object.values(data)) : []);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item && item.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const showToast = (type, msg) => {
    setNotification({ type, msg });
  };

  // CRUD Operations
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    if (items.some(i => i.toLowerCase() === newItem.trim().toLowerCase())) {
      showToast('error', 'Item already exists!');
      return;
    }
    try {
      await set(ref(db, `settings/${activeTab}`), [...items, newItem.trim()]);
      setNewItem('');
      showToast('success', 'Added successfully');
    } catch (error) { showToast('error', 'Failed'); }
  };

  // 1. Trigger Delete Modal
  const requestDelete = (indexToDelete) => {
    const itemToDelete = filteredItems[indexToDelete];
    setAlertConfig({
      title: 'Delete Item?',
      message: `Are you sure you want to remove "${itemToDelete}"? This action cannot be undone.`,
      isDangerous: true,
      onConfirm: () => confirmDelete(indexToDelete)
    });
  };

  // 2. Actual Delete Logic
  const confirmDelete = async (indexToDelete) => {
    const itemToDelete = filteredItems[indexToDelete];
    const realIndex = items.indexOf(itemToDelete);
    
    try {
      const updatedList = items.filter((_, index) => index !== realIndex);
      await set(ref(db, `settings/${activeTab}`), updatedList);
      showToast('success', 'Deleted successfully');
    } catch (error) { 
      showToast('error', 'Failed to delete'); 
    } finally {
      setAlertConfig(null); // Close modal
    }
  };

  const saveEdit = async () => {
    if (!editValue.trim() || editingIndex === null) return;
    try {
      const updatedList = [...items];
      updatedList[editingIndex] = editValue.trim();
      await set(ref(db, `settings/${activeTab}`), updatedList);
      setEditingIndex(null);
      showToast('success', 'Updated successfully');
    } catch (error) { showToast('error', 'Failed'); }
  };

  return (
    <div className="h-full flex flex-col bg-[#F6F8FC] overflow-hidden relative p-4 sm:p-6">
      
      {/* Toast Notification */}
      {notification && (
        <Toast type={notification.type} msg={notification.msg} onClose={() => setNotification(null)} />
      )}

      {/* Custom Alert Modal */}
      <AlertDialog 
        isOpen={!!alertConfig} 
        onClose={() => setAlertConfig(null)} 
        {...alertConfig} 
      />

      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button 
               onClick={() => setSidebarOpen(true)} 
               className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600 transition-colors"
             >
               <Menu size={24} />
             </button>
             <div>
               <h1 className="text-2xl font-black text-slate-800 tracking-tight">Configuration</h1>
               <p className="text-slate-500 font-medium text-sm sm:text-base">Manage lists & categories.</p>
             </div>
           </div>
           
           <div className="hidden sm:flex bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm items-center gap-2">
              <div className="bg-indigo-50 p-1.5 rounded-lg text-indigo-600"><LayoutGrid size={16} /></div>
              <span className="text-sm font-bold text-slate-700">{items.length} Items</span>
           </div>
        </div>

        {/* --- NAVIGATION TABS --- */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {SETTING_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105' 
                    : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }
                `}
              >
                <Icon size={16} className={isActive ? 'text-indigo-200' : 'text-slate-400'} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* --- MAIN CARD --- */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        
        {/* CONTROL BAR */}
        <div className="p-4 bg-white border-b border-slate-100 flex flex-col xl:flex-row gap-3 z-10">
           <form onSubmit={handleAddItem} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                 <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Plus size={18} /></div>
                 <input 
                    type="text" 
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder={`Add new ${currentTabConfig.label.slice(0,-1)}...`}
                    className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none rounded-xl py-3 pl-10 pr-4 font-bold text-slate-700 transition-all placeholder:font-medium placeholder:text-slate-400"
                  />
              </div>
              <button disabled={!newItem} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200">
                <span className="hidden sm:inline">Add</span><Plus size={20} className="sm:hidden" />
              </button>
           </form>

           <div className="relative w-full xl:w-64">
               <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
               <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-white border border-slate-200 focus:border-indigo-500 outline-none rounded-xl py-3 pl-10 pr-4 font-medium text-slate-600 transition-all text-sm" />
               {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><X size={14} /></button>}
           </div>
        </div>

        {/* LIST CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-slate-50/30">
          
          <div className="flex items-center justify-between mb-4 px-1">
             <div className="flex items-center gap-2 text-slate-400">
               <currentTabConfig.icon size={14} />
               <span className="text-xs font-bold uppercase tracking-wider">{currentTabConfig.desc}</span>
             </div>
             <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{filteredItems.length} Result(s)</span>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-indigo-400 opacity-50 gap-3"><Loader2 className="animate-spin" size={32}/><p className="text-sm font-bold">Fetching Data...</p></div>
          ) : filteredItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center opacity-60">
               <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">{searchQuery ? <Search size={24} /> : <currentTabConfig.icon size={24} />}</div>
               <h3 className="text-base font-bold text-slate-600">No items found</h3>
               <p className="text-xs text-slate-400 mt-1">Try adding a new {currentTabConfig.label.slice(0,-1)}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
              {filteredItems.map((item, index) => {
                const realIndex = items.indexOf(item);
                const isEditing = editingIndex === realIndex;
                return (
                  <div key={realIndex} className={`group relative bg-white border rounded-xl p-3 shadow-sm transition-all duration-200 ${isEditing ? 'border-indigo-500 ring-2 ring-indigo-500/10 z-10' : 'border-slate-100 hover:border-indigo-300 hover:shadow-md'}`}>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input autoFocus type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} className="flex-1 min-w-0 bg-slate-50 border border-indigo-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:bg-white" />
                        <button onClick={saveEdit} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:scale-105"><Save size={16} /></button>
                        <button onClick={() => setEditingIndex(null)} className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:scale-105"><X size={16} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-black flex-shrink-0">{typeof item === 'string' ? item.substring(0, 2).toUpperCase() : '#'}</div>
                            <span className="font-bold text-slate-700 truncate text-sm sm:text-base">{item}</span>
                         </div>
                         <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                           <button onClick={() => { const i = items.indexOf(item); setEditingIndex(i); setEditValue(item); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                           {/* Updated Delete Button to use requestDelete */}
                           <button onClick={() => requestDelete(index)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                         </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}