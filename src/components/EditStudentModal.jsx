import React, { useState, useEffect } from 'react';
import { 
  X, User, Globe, Briefcase, GraduationCap, 
  Users, Hash, Image, Send, Calendar, Save,
  CheckCircle2, Clock, MapPin, Layers, AlertCircle, Loader2, ChevronDown
} from 'lucide-react';
import { ref, get } from 'firebase/database'; // Import Firebase functions
import { db } from '../App'; // Ensure this points to your firebase config

const DAYS = ['ចន្ទ', 'អង្គារ៍', 'ពុធ', 'ព្រហស្បត្តិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];

const getAvatarUrl = (student) => {
  if (student['រូបថត'] && student['រូបថត'].startsWith('http')) return student['រូបថត'];
  const seed = student['អត្តលេខ'] || 'default';
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=c0aede,b6e3f4`;
};

// --- CUSTOM TOAST ---
const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800';
  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in slide-in-from-top-4 fade-in duration-300 ${styles}`}>
      <div className={`p-2 rounded-full ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><Icon size={20} strokeWidth={3} /></div>
      <div className="pr-2"><h4 className="text-sm font-bold">{type === 'success' ? 'Success' : 'Error'}</h4><p className="text-xs font-medium opacity-80">{message}</p></div>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors"><X size={16} /></button>
    </div>
  );
};

// --- TAB BUTTON ---
const TabButton = ({ active, onClick, label, icon: Icon }) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${active ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:bg-white/50'}`}>
    <Icon size={16} /> {label}
  </button>
);

// --- UPDATED INPUT FIELD (SUPPORTS SELECT) ---
const InputField = ({ label, value, onChange, icon: Icon, placeholder, options = [] }) => (
  <div className="space-y-1.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {Icon && <Icon size={18} />}
      </div>
      
      {options.length > 0 ? (
        // RENDER SELECT DROPDOWN
        <div className="relative">
          <select 
            value={value} 
            onChange={onChange}
            className="w-full pl-12 pr-10 py-3.5 rounded-2xl border-none bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm ring-1 ring-slate-100 appearance-none cursor-pointer"
          >
            <option value="">Select {label}</option>
            {options.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      ) : (
        // RENDER TEXT INPUT
        <input 
          type="text" 
          value={value} 
          onChange={onChange} 
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-slate-50 text-slate-800 font-semibold placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm ring-1 ring-slate-100"
          placeholder={placeholder} 
        />
      )}
    </div>
  </div>
);

// --- SCHEDULE INPUT ---
const ScheduleInput = ({ day, value, onChange, options = [] }) => {
  const isActive = value && value !== '';
  return (
    <div className={`relative p-3 rounded-2xl border transition-all duration-200 ${isActive ? 'bg-white border-indigo-200 shadow-md shadow-indigo-50' : 'bg-slate-50 border-transparent'}`}>
      <label className={`text-[10px] font-bold uppercase tracking-wider mb-2 block ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</label>
      
      {options.length > 0 ? (
          <select 
            value={value} 
            onChange={onChange}
            className={`w-full bg-transparent text-sm font-bold outline-none appearance-none cursor-pointer ${isActive ? 'text-slate-800' : 'text-slate-400'}`}
          >
            <option value="">Off</option>
            {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
          </select>
      ) : (
          <input 
            type="text" 
            value={value} 
            onChange={onChange} 
            className={`w-full bg-transparent text-sm font-bold outline-none ${isActive ? 'text-slate-800' : 'text-slate-400 placeholder:text-slate-300'}`}
            placeholder="Off" 
          />
      )}
    </div>
  );
};


// --- MAIN COMPONENT ---
export default function EditStudentModal({ student, isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState(student || {});
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState(null);

  // --- SETTINGS STATE ---
  const [settings, setSettings] = useState({
    classes: [],
    skills: [],
    sections: [],
    groups: [],
    schedules: []
  });

  // Load Settings on Mount
  useEffect(() => {
    if (isOpen) {
      const fetchSettings = async () => {
        try {
          const snapshot = await get(ref(db, 'settings'));
          if (snapshot.exists()) {
            setSettings(snapshot.val());
          }
        } catch (error) {
          console.error("Failed to load settings", error);
        }
      };
      fetchSettings();
    }
  }, [isOpen]);
  
  useEffect(() => { if(student) setFormData(student); }, [student]);
  
  if (!isOpen || !student) return null;

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const handleScheduleChange = (day, value) => setFormData(prev => ({ ...prev, 'កាលវិភាគ': { ...(prev['កាលវិភាគ'] || {}), [day]: value } }));

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      setNotification({ type: 'success', message: 'Updated successfully!' });
      setTimeout(() => { setIsSaving(false); onClose(); setNotification(null); }, 1000);
    } catch (error) {
      setIsSaving(false);
      setNotification({ type: 'error', message: 'Failed to update.' });
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      {notification && <Toast type={notification.type} message={notification.message} onClose={() => setNotification(null)} />}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
      
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <div><h2 className="text-lg font-bold text-slate-800">Edit Profile</h2><p className="text-xs text-slate-500 font-medium">ID: <span className="font-mono text-indigo-600">{formData.id}</span></p></div>
            <button onClick={onClose} className="p-2 bg-white text-slate-400 hover:text-slate-700 rounded-full shadow-sm hover:shadow transition-all"><X size={20} /></button>
          </div>
          <div className="px-6 pb-4">
            <div className="flex p-1 bg-slate-200/50 rounded-xl">
              <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Profile Info" icon={User} />
              <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} label="Schedule" icon={Clock} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 bg-white">
          
          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
              
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
                  <img src={getAvatarUrl(formData)} alt="Avatar" className="w-28 h-28 rounded-full border-4 border-white shadow-xl object-cover bg-white relative z-10" />
                  <div className="absolute bottom-1 right-1 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center z-20 text-indigo-600"><Image size={14} /></div>
                </div>
              </div>

              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-indigo-500 rounded-full"></div> Identity</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField label="Khmer Name" icon={User} value={formData['ឈ្មោះ']} onChange={e => handleChange('ឈ្មោះ', e.target.value)} />
                  <InputField label="Latin Name" icon={Globe} value={formData['ឈ្មោះឡាតាំង']} onChange={e => handleChange('ឈ្មោះឡាតាំង', e.target.value)} />
                  
                  {/* Gender Select */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                    <div className="relative"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                      <select value={formData['ភេទ']} onChange={e => handleChange('ភេទ', e.target.value)} className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-none bg-slate-50 text-slate-800 font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-sm ring-1 ring-slate-100 appearance-none cursor-pointer">
                          <option value="ប្រុស">Male</option><option value="ស្រី">Female</option>
                      </select>
                    </div>
                  </div>

                  {/* Role Select (Dynamic) */}
                  <InputField label="Role / Title" icon={Briefcase} value={formData['តួនាទី']} onChange={e => handleChange('តួនាទី', e.target.value)} options={settings.sections} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-blue-500 rounded-full"></div> Academic</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Dynamic Dropdowns from Settings */}
                  <InputField label="Major" icon={GraduationCap} value={formData['ជំនាញ']} onChange={e => handleChange('ជំនាញ', e.target.value)} options={settings.skills} />
                  <InputField label="Class" icon={Hash} value={formData['ថ្នាក់']} onChange={e => handleChange('ថ្នាក់', e.target.value)} options={settings.classes} />
                  <InputField label="Group" icon={Users} value={formData['ក្រុម']} onChange={e => handleChange('ក្រុម', e.target.value)} options={settings.groups} />
                  
                  <InputField label="Generation" icon={Layers} value={formData['ជំនាន់']} onChange={e => handleChange('ជំនាន់', e.target.value)} />
                  <InputField label="Year" icon={Calendar} value={formData['ឆ្នាំសិក្សា']} onChange={e => handleChange('ឆ្នាំសិក្សា', e.target.value)} />
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-emerald-500 rounded-full"></div> Contact & Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField label="Telegram" icon={Send} value={formData['តេឡេក្រាម']} onChange={e => handleChange('តេឡេក្រាម', e.target.value)} placeholder="username" />
                  <InputField label="DOB" icon={Calendar} value={formData['ថ្ងៃខែឆ្នាំកំណើត']} onChange={e => handleChange('ថ្ងៃខែឆ្នាំកំណើត', e.target.value)} />
                  <div className="sm:col-span-2"><InputField label="Photo URL" icon={Image} value={formData['រូបថត']} onChange={e => handleChange('រូបថត', e.target.value)} placeholder="https://..." /></div>
                  <div className="sm:col-span-2"><InputField label="Place of Birth" icon={MapPin} value={formData['ទីកន្លែងកំណើត']} onChange={e => handleChange('ទីកន្លែងកំណើត', e.target.value)} /></div>
                </div>
              </section>
            </div>
          )}

          {/* TAB: SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300 h-full flex flex-col">
              <div className="bg-indigo-50 p-6 rounded-[24px] border border-indigo-100 mb-6 text-center">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3"><Clock size={24} /></div>
                <h3 className="text-lg font-bold text-indigo-900">Weekly Shifts</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-4">
                {DAYS.map(day => (
                  <ScheduleInput 
                    key={day} 
                    day={day} 
                    value={formData['កាលវិភាគ']?.[day] || ''} 
                    onChange={e => handleScheduleChange(day, e.target.value)} 
                    options={settings.schedules} // Use settings.schedules here
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white z-20 flex gap-3">
           <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors" disabled={isSaving}>Cancel</button>
           <button onClick={handleSaveClick} disabled={isSaving} className="flex-[2] py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2">
             {isSaving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : <><Save size={18} /> Save Changes</>}
           </button>
        </div>
      </div>
    </div>
  );
}