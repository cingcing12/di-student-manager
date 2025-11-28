import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { db } from '../App';
import { 
  ChevronLeft, User, Briefcase, Clock, Smartphone, 
  Save, Menu, Globe, Hash, Calendar, MapPin, 
  CheckCircle2, AlertCircle, Loader2, Image, ChevronDown, 
  ArrowRight, ArrowLeft
} from 'lucide-react';

// --- HELPER ---
const getAvatarUrl = (id, photoUrl) => {
  if (photoUrl && photoUrl.startsWith('http')) return photoUrl;
  const seed = id || 'default';
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=c0aede,b6e3f4`;
};

// --- TOAST ---
const Toast = ({ message, type, show }) => {
  if (!show) return null;
  return (
    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transform transition-all duration-500 animate-in slide-in-from-top-5 ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
      <div><h4 className="font-bold text-sm">{type === 'success' ? 'Success' : 'Error'}</h4><p className="text-xs opacity-90">{message}</p></div>
    </div>
  );
};

// --- MODERN INPUT ---
const ModernInput = ({ label, value, onChange, placeholder, icon: Icon, required, fullWidth, options = [] }) => (
  <div className={`group ${fullWidth ? "md:col-span-2" : ""}`}>
    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1 group-focus-within:text-indigo-500 transition-colors">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative transition-all duration-200 focus-within:scale-[1.01]">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        {Icon && <Icon size={18} />}
      </div>
      
      {options && options.length > 0 ? (
        <div className="relative">
            <select value={value} onChange={onChange} className="w-full pl-11 pr-10 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 font-bold shadow-sm appearance-none cursor-pointer">
                <option value="">Select {label}</option>
                {options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      ) : (
        <input type="text" value={value} onChange={onChange} className="w-full pl-11 pr-4 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 text-slate-800 font-bold placeholder:text-slate-300 placeholder:font-medium shadow-sm" placeholder={placeholder} />
      )}
    </div>
  </div>
);

const DAYS = ['ចន្ទ', 'អង្គារ៍', 'ពុធ', 'ព្រហស្បត្តិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
const STEPS = [
    { id: 1, title: 'Identity', icon: User },
    { id: 2, title: 'Academic', icon: Briefcase },
    { id: 3, title: 'Schedule', icon: Clock }
];

export default function AddStudentPage({ setSidebarOpen }) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [settings, setSettings] = useState({ classes: [], skills: [], sections: [], groups: [], schedules: [] });

  const [formData, setFormData] = useState({
    id: '', 'ឈ្មោះ': '', 'ឈ្មោះឡាតាំង': '', 'ភេទ': '', 'ថ្ងៃខែឆ្នាំកំណើត': '', 'ទីកន្លែងកំណើត': '',
    'តេឡេក្រាម': '', 'រូបថត': '', 'ផ្នែកការងារ': '', 'តួនាទី': '', 'ក្រុម': '',
    'ថ្នាក់': '', 'ជំនាញ': '', 'ឆ្នាំសិក្សា': '', 'ជំនាន់': '', 'កាលវិភាគ': {}
  });

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const snapshot = await get(ref(db, 'settings'));
            if (snapshot.exists()) setSettings(snapshot.val());
        } catch (error) { console.error(error); }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (toast.show) { const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000); return () => clearTimeout(timer); }
  }, [toast]);

  const handleChange = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
  const handleScheduleChange = (day, value) => setFormData(prev => ({ ...prev, 'កាលវិភាគ': { ...prev['កាលវិភាគ'], [day]: value } }));

  const validateStep = () => {
      if (currentStep === 1 && !formData.id) { setToast({ show: true, message: 'Student ID is required.', type: 'error' }); return false; }
      return true;
  };

  const handleNext = () => { if (validateStep()) setCurrentStep(p => Math.min(p + 1, 3)); };
  const handleBack = () => setCurrentStep(p => Math.max(p - 1, 1));

  const handleSave = async () => {
    setIsSubmitting(true);
    const studentRef = ref(db, `students/${formData.id}`);
    try {
      const snapshot = await get(studentRef);
      if (snapshot.exists()) {
        setToast({ show: true, message: 'ID already exists!', type: 'error' });
        setIsSubmitting(false);
        return;
      }
      const payload = { ...formData }; delete payload.id;
      await set(studentRef, payload);
      setToast({ show: true, message: 'Profile created!', type: 'success' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      setToast({ show: true, message: 'Error saving.', type: 'error' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] relative overflow-hidden">
      <Toast show={toast.show} message={toast.message} type={toast.type} />

      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-slate-200/60 flex items-center justify-between z-30 sticky top-0 shadow-sm">
         <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-indigo-600"><Menu /></button>
             <button onClick={() => navigate('/dashboard')} className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                <ChevronLeft size={18} /> Back
             </button>
             <h1 className="text-xl font-black text-slate-800 tracking-tight">Registration</h1>
         </div>
         
         {/* Step Indicator */}
         <div className="flex items-center gap-2">
            {STEPS.map((step) => (
                <div key={step.id} className={`h-2 rounded-full transition-all duration-500 ${currentStep >= step.id ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
            ))}
         </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Live Preview (Sticky) */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 animate-in slide-in-from-left-4 duration-700">
             <div className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl shadow-indigo-100/50 flex flex-col items-center text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 group-hover:scale-105 transition-transform duration-700"></div>
                <div className="relative z-10 mt-12 mb-4">
                    <div className="p-1.5 bg-white rounded-full shadow-lg inline-block">
                       <img src={getAvatarUrl(formData.id, formData['រូបថត'])} alt="Preview" className="w-32 h-32 rounded-full border-4 border-white bg-slate-100 object-cover" />
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{formData['ឈ្មោះ'] || 'Student Name'}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">{formData['ឈ្មោះឡាតាំង'] || 'LATIN NAME'}</p>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ID Code</p>
                       <p className="font-mono text-lg font-black text-indigo-600">{formData.id || '---'}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group</p>
                       <p className="font-bold text-slate-700">{formData['ក្រុម'] || '--'}</p>
                    </div>
                </div>
             </div>
          </div>

          {/* RIGHT: Multi-Step Form */}
          <div className="lg:col-span-8 bg-white rounded-[32px] border border-slate-200 shadow-sm p-6 sm:p-10 relative min-h-[600px] flex flex-col animate-in slide-in-from-bottom-8 duration-700">
             
             {/* Step Header */}
             <div className="mb-8">
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">Step {currentStep} of 3</span>
                <h2 className="text-3xl font-black text-slate-800 mt-3">{STEPS[currentStep-1].title}</h2>
                <p className="text-slate-500 font-medium mt-1">Please fill in the details correctly.</p>
             </div>

             {/* Form Content */}
             <div className="flex-1 space-y-6">
                
                {/* STEP 1: IDENTITY */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <ModernInput icon={Hash} label="Student ID" required value={formData.id} onChange={e => handleChange('id', e.target.value)} placeholder="e.g. 428" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ModernInput icon={User} label="Khmer Name" value={formData['ឈ្មោះ']} onChange={e => handleChange('ឈ្មោះ', e.target.value)} placeholder="រួត រ៉ាស៊ី" />
                            <ModernInput icon={Globe} label="Latin Name" value={formData['ឈ្មោះឡាតាំង']} onChange={e => handleChange('ឈ្មោះឡាតាំង', e.target.value)} placeholder="ROUT RASY" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">Gender</label>
                                <div className="relative">
                                    <select value={formData['ភេទ']} onChange={e => handleChange('ភេទ', e.target.value)} className="w-full pl-11 pr-10 py-3.5 rounded-xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-indigo-500 outline-none font-bold text-slate-800 appearance-none cursor-pointer">
                                        <option value="">Select Gender</option><option value="ប្រុស">Male</option><option value="ស្រី">Female</option>
                                    </select>
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"><User size={18} /></div>
                                </div>
                            </div>
                            <ModernInput icon={Calendar} label="Date of Birth" value={formData['ថ្ងៃខែឆ្នាំកំណើត']} onChange={e => handleChange('ថ្ងៃខែឆ្នាំកំណើត', e.target.value)} placeholder="DD-MM-YYYY" />
                        </div>
                        <ModernInput icon={MapPin} label="Place of Birth" value={formData['ទីកន្លែងកំណើត']} onChange={e => handleChange('ទីកន្លែងកំណើត', e.target.value)} placeholder="Province" />
                        <ModernInput icon={Image} label="Photo URL" value={formData['រូបថត']} onChange={e => handleChange('រូបថត', e.target.value)} placeholder="https://..." />
                    </div>
                )}

                {/* STEP 2: ACADEMIC */}
                {currentStep === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                        <ModernInput icon={Briefcase} label="Major" fullWidth value={formData['ជំនាញ']} onChange={e => handleChange('ជំនាញ', e.target.value)} options={settings.skills} />
                        <ModernInput icon={Briefcase} label="Role" value={formData['តួនាទី']} onChange={e => handleChange('តួនាទី', e.target.value)} options={settings.sections} />
                        <ModernInput icon={Briefcase} label="Department" value={formData['ផ្នែកការងារ']} onChange={e => handleChange('ផ្នែកការងារ', e.target.value)} options={settings.sections} />
                        <ModernInput icon={Hash} label="Class" value={formData['ថ្នាក់']} onChange={e => handleChange('ថ្នាក់', e.target.value)} options={settings.classes} />
                        <ModernInput icon={Briefcase} label="Group" value={formData['ក្រុម']} onChange={e => handleChange('ក្រុម', e.target.value)} options={settings.groups} />
                        <ModernInput icon={Calendar} label="Year" value={formData['ឆ្នាំសិក្សា']} onChange={e => handleChange('ឆ្នាំសិក្សា', e.target.value)} />
                        <ModernInput icon={Calendar} label="Generation" value={formData['ជំនាន់']} onChange={e => handleChange('ជំនាន់', e.target.value)} />
                        <ModernInput icon={Smartphone} label="Telegram" value={formData['តេឡេក្រាម']} onChange={e => handleChange('តេឡេក្រាម', e.target.value)} placeholder="@username" />
                    </div>
                )}

                {/* STEP 3: SCHEDULE */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
                            <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><Clock size={20} /></div>
                            <p className="text-sm font-medium text-indigo-800">Set the weekly work/study shifts for this student.</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {DAYS.map(day => {
                                const hasValue = formData['កាលវិភាគ']?.[day];
                                return (
                                    <div key={day} className={`p-1 rounded-2xl border-2 transition-all ${hasValue ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                                        <label className={`text-[10px] font-bold uppercase tracking-wider px-2 pt-2 block ${hasValue ? 'text-indigo-600' : 'text-slate-400'}`}>{day}</label>
                                        {settings.schedules?.length > 0 ? (
                                            <select className="w-full bg-transparent p-2 text-sm font-bold text-slate-800 outline-none cursor-pointer" value={formData['កាលវិភាគ']?.[day] || ''} onChange={e => handleScheduleChange(day, e.target.value)}>
                                                <option value="">Off</option>
                                                {settings.schedules.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                            </select>
                                        ) : (
                                            <input type="text" className="w-full bg-transparent p-2 text-sm font-bold text-slate-800 outline-none" placeholder="Off" value={formData['កាលវិភាគ']?.[day] || ''} onChange={e => handleScheduleChange(day, e.target.value)} />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
             </div>

             {/* Footer Actions */}
             <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
                {currentStep > 1 ? (
                    <button onClick={handleBack} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2">
                        <ArrowLeft size={18} /> Back
                    </button>
                ) : (
                    <div /> 
                )}

                {currentStep < 3 ? (
                    <button onClick={handleNext} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95">
                        Next Step <ArrowRight size={18} />
                    </button>
                ) : (
                    <button onClick={handleSave} disabled={isSubmitting} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Complete Registration
                    </button>
                )}
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}