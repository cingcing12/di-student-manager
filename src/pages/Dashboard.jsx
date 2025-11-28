import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ref, update, remove, get } from 'firebase/database'; // Added 'get'
import { db } from '../App';
import { 
  Search, User, Menu, X, Users, GraduationCap, 
  CheckSquare, Square, Edit2, CheckCircle2, Check, 
  Sparkles, Hash, Type, LayoutGrid, List, Filter, MoreHorizontal,
  AlertCircle, Trash2, Loader2, Calendar, Phone, BookOpen, MapPin, 
  Send, Layers, Briefcase, Globe, Image as ImageIcon, Clock, ChevronDown
} from 'lucide-react';
import StudentDetailModal from '../components/StudentDetailModal';
import EditStudentModal from '../components/EditStudentModal';

// --- CONSTANTS ---
const DAYS = ['ចន្ទ', 'អង្គារ៍', 'ពុធ', 'ព្រហស្បត្តិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];

// --- UTILS ---
const getAvatarUrl = (student) => {
  if (student['រូបថត'] && student['រូបថត'].startsWith('http')) return student['រូបថត'];
  const seed = student['អត្តលេខ'] || 'default';
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=eef2ff,f0fdf4,fef2f2`;
};

// --- HOOK: SCROLL REVEAL ---
const useOnScreen = (options) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, options]);
  return [ref, isVisible];
};

// --- HOOK: ROBUST DRAG TO SCROLL ---
const useDraggableScroll = () => {
  const ref = useRef(null);

  useEffect(() => {
    const slider = ref.current;
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let startY;
    let scrollTop;

    const onMouseDown = (e) => {
      if (
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'SELECT' || // Added SELECT
        e.target.tagName === 'BUTTON' || 
        e.target.tagName === 'TEXTAREA' ||
        e.target.closest('.no-drag') 
      ) {
        return;
      }

      isDown = true;
      slider.classList.add('active');
      slider.style.cursor = 'grabbing';
      slider.style.userSelect = 'none';

      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
      startY = e.pageY - slider.offsetTop;
      scrollTop = slider.scrollTop;
    };

    const onMouseLeave = () => {
      isDown = false;
      slider.style.cursor = 'grab';
      slider.style.removeProperty('user-select');
      slider.classList.remove('active');
    };

    const onMouseUp = () => {
      isDown = false;
      slider.style.cursor = 'grab';
      slider.style.removeProperty('user-select');
      slider.classList.remove('active');
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walkX = (x - startX) * 2; 
      const y = e.pageY - slider.offsetTop;
      const walkY = (y - startY) * 2;
      slider.scrollLeft = scrollLeft - walkX;
      slider.scrollTop = scrollTop - walkY;
    };

    slider.addEventListener('mousedown', onMouseDown);
    slider.addEventListener('mouseleave', onMouseLeave);
    slider.addEventListener('mouseup', onMouseUp);
    slider.addEventListener('mousemove', onMouseMove);

    return () => {
      slider.removeEventListener('mousedown', onMouseDown);
      slider.removeEventListener('mouseleave', onMouseLeave);
      slider.removeEventListener('mouseup', onMouseUp);
      slider.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return ref;
};

// --- SUB-COMPONENTS ---

const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = type === 'success' 
    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
    : 'bg-rose-50 border-rose-100 text-rose-800';

  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in slide-in-from-top-4 fade-in zoom-in-95 duration-300 ${styles}`}>
      <div className={`p-2 rounded-full ${type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
        <Icon size={18} strokeWidth={3} />
      </div>
      <div className="pr-2">
        <h4 className="text-sm font-bold">{type === 'success' ? 'Success' : 'Error'}</h4>
        <p className="text-xs font-medium opacity-90">{message}</p>
      </div>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full transition-colors">
        <X size={16} />
      </button>
    </div>
  );
};

// --- UPDATED EDITABLE CELL (SUPPORTS SELECT) ---
const EditableCell = ({ value, onSave, type = "text", className = "", placeholder = "-", options = [] }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  useEffect(() => { setCurrentValue(value); }, [value]);

  const handleFinish = () => {
    setIsEditing(false);
    if (currentValue !== value) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleFinish();
    else if (e.key === 'Escape') {
      setIsEditing(false);
      setCurrentValue(value);
    }
  };

  if (isEditing) {
    // Render Select if options exist
    if (options.length > 0) {
        return (
            <select
                autoFocus
                value={currentValue || ''}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleFinish}
                onKeyDown={handleKeyDown}
                onMouseDown={(e) => e.stopPropagation()} 
                onClick={(e) => e.stopPropagation()}
                className={`w-full min-w-[80px] bg-white border-2 border-indigo-500 rounded px-1 py-1 outline-none text-xs font-bold text-slate-800 shadow-lg z-50 appearance-none cursor-pointer ${className}`}
            >
                <option value="">- Select -</option>
                {options.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                ))}
            </select>
        )
    }

    // Render Text Input
    return (
      <input
        autoFocus
        type={type}
        value={currentValue || ''}
        onChange={(e) => setCurrentValue(e.target.value)}
        onBlur={handleFinish}
        onKeyDown={handleKeyDown}
        onMouseDown={(e) => e.stopPropagation()} 
        onClick={(e) => e.stopPropagation()}
        className={`w-full min-w-[60px] bg-white border-2 border-indigo-500 rounded px-1.5 py-1 outline-none text-xs font-bold text-slate-800 shadow-lg z-50 ${className}`}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:bg-slate-100 hover:text-indigo-600 rounded px-1.5 py-1 transition-colors border border-transparent hover:border-slate-200 truncate ${className} ${!value ? 'text-slate-300 italic' : ''}`}
      title="Click to edit"
    >
      {value || placeholder}
    </div>
  );
};

// Minimal Stat Card
const ModernStatCard = ({ label, value, icon: Icon, type }) => {
  const styles = {
    total: { bg: "bg-gradient-to-br from-indigo-500 to-violet-600", text: "text-white", subText: "text-indigo-100", iconBg: "bg-white/20" },
    male: { bg: "bg-white border-slate-100", text: "text-slate-800", subText: "text-slate-400", iconBg: "bg-blue-50 text-blue-600", border: "border border-slate-100" },
    female: { bg: "bg-white border-slate-100", text: "text-slate-800", subText: "text-slate-400", iconBg: "bg-pink-50 text-pink-500", border: "border border-slate-100" }
  };
  const style = styles[type] || styles.total;

  return (
    <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm flex-1 min-w-[100px] sm:min-w-[130px] ${style.bg} ${style.border || ''}`}>
      <div className="absolute -right-4 -bottom-4 opacity-10 rotate-[-15deg] hidden sm:block"><Icon size={80} /></div>
      <div className="relative z-10 flex flex-col justify-between h-full gap-1 sm:gap-3">
        <div className={`w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm ${style.iconBg}`}>
          <Icon size={14} className={`sm:hidden ${type === 'total' ? 'text-white' : ''}`} />
          <Icon size={18} className={`hidden sm:block ${type === 'total' ? 'text-white' : ''}`} />
        </div>
        <div>
          <h4 className={`text-lg sm:text-2xl font-black tracking-tight ${style.text}`}>{value}</h4>
          <p className={`text-[9px] sm:text-xs font-bold uppercase tracking-wider mt-0 sm:mt-1 ${style.subText}`}>{label}</p>
        </div>
      </div>
    </div>
  );
};

// Student Card (Grid View)
const StudentCard = ({ student, onClick, isSelected, toggleSelect, filterClass, isSelectionMode }) => {
  const [ref, isVisible] = useOnScreen({ threshold: 0.1 }); 
  const isClassMatch = filterClass && student['ថ្នាក់'] && student['ថ្នាក់'].toLowerCase().includes(filterClass.toLowerCase());

  return (
    <div 
      ref={ref}
      onClick={onClick}
      className={`group bg-white rounded-xl sm:rounded-3xl p-2.5 sm:p-5 border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] cursor-pointer relative overflow-hidden transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} 
        ${isSelected 
          ? 'border-indigo-500 ring-1 sm:ring-2 ring-indigo-500/20 bg-indigo-50/20' 
          : 'border-slate-100 hover:shadow-lg'
        }`}
    >
      <div 
        className={`absolute top-0 right-0 p-2 sm:p-3 z-30 transition-all duration-300 ${isSelectionMode ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}
        onClick={(e) => { e.stopPropagation(); toggleSelect(); }}
      >
        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-200 border shadow-sm
          ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white scale-110' : 'bg-white border-slate-200 text-transparent hover:border-indigo-300'}`}>
          <Check size={12} strokeWidth={4} />
        </div>
      </div>

      <div className="absolute top-0 left-0 w-full h-12 sm:h-24 bg-gradient-to-br from-indigo-50/50 to-purple-50/50"></div>
      
      <div className="relative flex flex-col items-center text-center mt-2 sm:mt-4">
        <div className="relative">
          <img src={getAvatarUrl(student)} loading="lazy" className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white object-cover shadow-sm border-2 sm:border-4 border-white" alt="" />
        </div>
        
        <div className="mt-1.5 sm:mt-3 mb-1 w-full">
          <h3 className="font-bold text-slate-800 text-xs sm:text-lg leading-tight truncate px-1">{student['ឈ្មោះ']}</h3>
          <p className="text-[9px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5 sm:mt-1 truncate">{student['ឈ្មោះឡាតាំង']}</p>
        </div>

        <span className="inline-block px-1.5 py-0.5 rounded-md text-[8px] sm:text-[10px] font-bold bg-slate-100 text-slate-500 mb-2 sm:mb-4">ID: {student.id}</span>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2">
          <div className={`rounded-lg sm:rounded-xl p-1 sm:p-2.5 border transition-colors duration-500 ${isClassMatch ? 'bg-amber-100 border-amber-200' : 'bg-slate-50 border-slate-100/50'}`}>
            <span className={`hidden sm:block text-[10px] font-bold uppercase mb-0.5 ${isClassMatch ? 'text-amber-600' : 'text-slate-400'}`}>Class</span>
            <div className="flex items-center justify-center gap-1">
              {isClassMatch && <Sparkles size={8} className="text-amber-500 animate-pulse" />}
              <span className={`text-[10px] sm:text-xs font-bold truncate block ${isClassMatch ? 'text-amber-700' : 'text-indigo-600'}`}>{student['ថ្នាក់'] || '-'}</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-1 sm:p-2.5 border border-slate-100/50 hidden sm:block">
              <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Role</span>
              <span className="text-xs font-bold text-slate-700 truncate block">{student['តួនាទី'] || 'Std'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- LIST ROW COMPONENT (UPDATED WITH SETTINGS) ---
const StudentRow = ({ student, onDoubleClick, isSelected, toggleSelect, filterClass, isSelectionMode, onInlineUpdate, settings }) => {
  const isClassMatch = filterClass && student['ថ្នាក់'] && student['ថ្នាក់'].toLowerCase().includes(filterClass.toLowerCase());
  
  const handleSave = (field, newVal) => {
    onInlineUpdate(student.id, field, newVal);
  };

  const handleScheduleSave = (day, newVal) => {
    onInlineUpdate(student.id, `កាលវិភាគ/${day}`, newVal);
  };

  return (
    <tr 
      onDoubleClick={onDoubleClick}
      className={`group border-b border-slate-50 last:border-0 transition-colors select-none
        ${isSelected ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-slate-50/80'}
      `}
    >
      <td className="p-3 pl-4 w-12 sticky left-0 z-20 bg-slate-50/95 group-hover:bg-indigo-50/95 border-r border-transparent">
        <div 
           onClick={(e) => { e.stopPropagation(); toggleSelect(); }}
           className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer
             ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300 hover:border-indigo-400'}
           `}
        >
          {isSelected && <Check size={12} strokeWidth={4} />}
        </div>
      </td>

      <td className="p-3 min-w-[80px]">
         <span className="text-xs font-mono font-bold text-slate-500">{student.id}</span>
      </td>

      <td className="p-3 min-w-[220px]">
        <div className="flex items-center gap-3">
          <img src={getAvatarUrl(student)} className="w-10 h-10 rounded-full bg-slate-100 object-cover border-2 border-white shadow-sm" alt=""/>
          <div className="flex flex-col w-full">
            <EditableCell value={student['ឈ្មោះ']} onSave={(val) => handleSave('ឈ្មោះ', val)} className="text-sm font-bold text-slate-800" placeholder="Khmer Name" />
            <EditableCell value={student['ឈ្មោះឡាតាំង']} onSave={(val) => handleSave('ឈ្មោះឡាតាំង', val)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wide" placeholder="LATIN NAME" />
          </div>
        </div>
      </td>

      <td className="p-3 min-w-[80px]">
        {/* Gender Select */}
        <EditableCell value={student['ភេទ']} onSave={(val) => handleSave('ភេទ', val)} className={`text-xs font-bold ${student['ភេទ'] === 'ស្រី' ? 'text-pink-500' : 'text-blue-600'}`} options={['ប្រុស', 'ស្រី']} />
      </td>

      <td className="p-3 min-w-[120px]">
         <div className="flex items-center gap-1.5 text-slate-500">
            <Briefcase size={12} className="opacity-50"/>
            <EditableCell value={student['តួនាទី']} onSave={(val) => handleSave('តួនាទី', val)} className="text-xs font-bold text-slate-600" options={settings.sections} />
         </div>
      </td>

      <td className="p-3 min-w-[180px]">
        <div className="flex items-center gap-1.5 text-slate-500">
            <GraduationCap size={12} className="opacity-50"/>
            <EditableCell value={student['ជំនាញ']} onSave={(val) => handleSave('ជំនាញ', val)} className="text-xs font-medium" options={settings.skills} />
        </div>
      </td>

      <td className="p-3 min-w-[80px]">
        <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs font-bold transition-all
             ${isClassMatch ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-indigo-600 border-indigo-100'}
        `}>
          {isClassMatch && <Sparkles size={8} className="text-amber-500" />}
          <EditableCell value={student['ថ្នាក់']} onSave={(val) => handleSave('ថ្នាក់', val)} options={settings.classes} />
        </div>
      </td>

      <td className="p-3 min-w-[80px]">
        <div className="flex items-center gap-1.5">
            <Users size={12} className="text-slate-400" />
            <EditableCell value={student['ក្រុម']} onSave={(val) => handleSave('ក្រុម', val)} className="text-xs font-bold text-slate-700" options={settings.groups} />
        </div>
      </td>

      <td className="p-3 min-w-[100px]">
         <div className="flex items-center gap-1.5 text-slate-500">
            <Layers size={12} className="opacity-50"/>
            <EditableCell value={student['ជំនាន់']} onSave={(val) => handleSave('ជំនាន់', val)} className="text-xs font-medium" placeholder="Gen ?" />
         </div>
      </td>

       <td className="p-3 min-w-[100px]">
         <EditableCell value={student['ឆ្នាំសិក្សា']} onSave={(val) => handleSave('ឆ្នាំសិក្សា', val)} className="text-xs font-medium" placeholder="Year 1" />
      </td>

      {/* --- SCHEDULE COLUMNS --- */}
      {DAYS.map(day => (
        <td key={day} className="p-3 min-w-[120px] bg-slate-50/30">
           <EditableCell 
             value={student['កាលវិភាគ']?.[day] || ''} 
             onSave={(val) => handleScheduleSave(day, val)} 
             className="text-xs font-medium text-slate-600 bg-white/50" 
             placeholder="Off" 
             options={settings.schedules} // Schedule Dropdown
           />
        </td>
      ))}

      <td className="p-3 min-w-[130px]">
         <div className="flex items-center gap-1.5 text-slate-500">
            <Phone size={12} className="opacity-50"/>
            <EditableCell value={student['លេខទូរស័ព្ទ']} onSave={(val) => handleSave('លេខទូរស័ព្ទ', val)} className="text-xs font-mono font-medium" />
         </div>
      </td>

      <td className="p-3 min-w-[130px]">
         <div className="flex items-center gap-1.5 text-sky-500">
            <Send size={12} className="opacity-70"/>
            <EditableCell value={student['តេឡេក្រាម']} onSave={(val) => handleSave('តេឡេក្រាម', val)} className="text-xs font-medium text-sky-600" placeholder="@username" />
         </div>
      </td>

      {/* --- DATE OF BIRTH (Checking both Keys) --- */}
      <td className="p-3 min-w-[120px]">
         <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar size={12} className="opacity-50"/>
            <EditableCell 
                value={student['ថ្ងៃខែឆ្នាំកំណើត'] || student['ថ្ងៃកំណើត']} 
                onSave={(val) => handleSave('ថ្ងៃខែឆ្នាំកំណើត', val)} 
                className="text-xs font-medium" 
                placeholder="DD/MM/YYYY"
            />
         </div>
      </td>

      <td className="p-3 min-w-[180px]">
         <div className="flex items-center gap-1.5 text-slate-500">
            <MapPin size={12} className="opacity-50"/>
            <EditableCell value={student['ទីកន្លែងកំណើត']} onSave={(val) => handleSave('ទីកន្លែងកំណើត', val)} className="text-xs font-medium truncate max-w-[180px]" />
         </div>
      </td>

      <td className="p-3 min-w-[150px]">
         <div className="flex items-center gap-1.5 text-slate-400">
            <ImageIcon size={12} className="opacity-50"/>
            <EditableCell value={student['រូបថត']} onSave={(val) => handleSave('រូបថត', val)} className="text-[10px] text-slate-400 truncate max-w-[140px]" placeholder="https://..." />
         </div>
      </td>

    </tr>
  );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function Dashboard({ students, loading, setSidebarOpen }) {
  const [filters, setFilters] = useState({ name: '', classVal: '', id: '' });
  const [displayMode, setDisplayMode] = useState('grid');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); 
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({
    classes: [],
    skills: [],
    sections: [],
    groups: [],
    schedules: []
  });

  // Scroll Ref
  const scrollRef = useDraggableScroll();
  const [notification, setNotification] = useState(null); 

  // FETCH SETTINGS
  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const snapshot = await get(ref(db, 'settings'));
            if (snapshot.exists()) {
                setSettings(snapshot.val());
            }
        } catch (error) {
            console.error(error);
        }
    };
    fetchSettings();
  }, []);

  const showToast = (type, message) => {
    setNotification({ type, message });
  };

  const filtered = useMemo(() => students.filter(s => {
    const matchesName = !filters.name || (s['ឈ្មោះ'] && s['ឈ្មោះ'].toLowerCase().includes(filters.name.toLowerCase())) || (s['ឈ្មោះឡាតាំង'] && s['ឈ្មោះឡាតាំង'].toLowerCase().includes(filters.name.toLowerCase()));
    const matchesClass = !filters.classVal || (s['ថ្នាក់'] && s['ថ្នាក់'].toLowerCase().includes(filters.classVal.toLowerCase()));
    const matchesID = !filters.id || (s.id && s.id.toString().includes(filters.id));
    return matchesName && matchesClass && matchesID;
  }), [students, filters]);

  const stats = useMemo(() => {
    const total = students.length;
    const female = students.filter(s => s['ភេទ'] === 'ស្រី').length;
    return { total, female, male: total - female };
  }, [students]);

  const handleFilterChange = (field, value) => setFilters(prev => ({ ...prev, [field]: value }));
  
  const clearFilters = () => { 
    setFilters({ name: '', classVal: '', id: '' }); 
    setIsSelectionMode(false); 
    setSelectedIds(new Set()); 
    setIsMobileSearchOpen(false); 
  };
  
  const toggleSelection = (id) => { 
    const newSet = new Set(selectedIds); 
    if (newSet.has(id)) newSet.delete(id); 
    else newSet.add(id); 
    setSelectedIds(newSet); 
  };
  
  const selectAllFiltered = () => { 
    if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set()); 
    else setSelectedIds(new Set(filtered.map(s => s.id))); 
  };
  
  const handleBulkGroupUpdate = async (newGroup) => {
    if (!newGroup) return;
    const updates = {};
    selectedIds.forEach(id => updates[`students/${id}/ក្រុម`] = newGroup);
    try { 
      await update(ref(db), updates); 
      setIsBulkModalOpen(false); 
      setSelectedIds(new Set()); 
      setIsSelectionMode(false); 
      showToast('success', `Moved ${selectedIds.size} students to Group ${newGroup}`);
    } catch (error) { 
      showToast('error', 'Failed to update group');
    }
  };

  const handleInlineUpdate = async (id, field, value) => {
    try {
        await update(ref(db, `students/${id}`), { [field]: value });
        showToast('success', `Updated successfully`);
    } catch (error) {
        showToast('error', `Failed to update`);
    }
  };

  const handleUpdate = async (data) => { 
    try {
      const payload = { ...data }; delete payload.id; 
      await update(ref(db, `students/${data.id}`), payload); 
      setEditingStudent(null); 
      setSelectedStudent(data); 
      showToast('success', 'Student details updated successfully');
    } catch (error) {
      showToast('error', 'Failed to update student details');
    }
  };

  const handleDelete = async (id) => { 
    try {
      await remove(ref(db, `students/${id}`)); 
      setSelectedStudent(null);
      showToast('success', 'Student deleted successfully');
    } catch (error) {
      showToast('error', 'Failed to delete student');
    }
  };

  const hasActiveFilter = filters.name || filters.classVal || filters.id;

  return (
    <div className="flex flex-col h-full bg-[#F6F8FC] relative">
      {notification && (
        <Toast 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)} 
        />
      )}

      {/* --- STICKY TOP HEADER --- */}
      <header className="sticky top-0 z-30 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.02)] transition-all duration-300">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 h-[56px] sm:h-[72px] flex items-center justify-between gap-2 sm:gap-4">
            
           {/* Left: Brand */}
           <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-indigo-600 transition-colors p-1 rounded-lg active:bg-slate-100">
                <Menu size={20} />
              </button>
              <div className="flex items-center gap-2">
                 <div className="bg-indigo-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base shadow-md shadow-indigo-500/20">D</div>
                 <span className="font-bold text-slate-800 text-sm sm:text-lg hidden sm:block tracking-tight">Directory</span>
              </div>
           </div>

           {/* Center: Desktop Filters */}
           <div className="hidden md:flex items-center gap-3 flex-1 max-w-2xl mx-auto">
              <div className="relative group flex-1 max-w-[120px]">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" />
                <input type="text" placeholder="ID..." value={filters.id} onChange={(e) => handleFilterChange('id', e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
              <div className="relative group flex-[2]">
                <Type size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" />
                <input type="text" placeholder="Search Name..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
              <div className="relative group flex-1 max-w-[140px]">
                <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" />
                <input type="text" placeholder="Class..." value={filters.classVal} onChange={(e) => handleFilterChange('classVal', e.target.value)}
                  className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl py-2.5 pl-9 pr-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all" />
              </div>
              {hasActiveFilter && <button onClick={clearFilters} className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 rounded-xl transition-colors"><X size={16} /></button>}
           </div>

           {/* Right: Actions */}
           <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className={`md:hidden p-2 rounded-lg transition-all ${isMobileSearchOpen || hasActiveFilter ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-transparent text-slate-500'}`}>
                <Search size={18} />
              </button>
              <div className="h-6 sm:h-8 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-slate-200">
                <button onClick={() => setDisplayMode('grid')} className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all duration-200 ${displayMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
                <button onClick={() => setDisplayMode('list')} className={`p-1.5 sm:p-2 rounded-md sm:rounded-lg transition-all duration-200 ${displayMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}><List size={16} /></button>
              </div>
              {hasActiveFilter && !isSelectionMode && (
                 <button onClick={() => setIsSelectionMode(true)} className="flex bg-slate-900 text-white p-2 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl text-xs font-bold items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20">
                   <Edit2 size={14} /> <span className="hidden sm:inline">Bulk</span>
                 </button>
              )}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md border-2 border-white cursor-pointer hover:scale-105 transition-transform"><User size={14} /></div>
           </div>
        </div>

        {/* Mobile Search Drawer */}
        {isMobileSearchOpen && (
          <div className="md:hidden border-b border-slate-100 bg-white/95 backdrop-blur-xl p-3 grid gap-2 animate-in slide-in-from-top-2 fade-in shadow-xl absolute w-full left-0 top-[56px] z-20">
            <div className="grid grid-cols-2 gap-2">
               <div className="relative">
                  <Hash size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input type="text" placeholder="ID" value={filters.id} onChange={(e) => handleFilterChange('id', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-8 pr-2 text-xs font-bold outline-none focus:border-indigo-500" />
               </div>
               <div className="relative">
                  <BookOpen size={14} className="absolute left-3 top-3 text-slate-400" />
                  <input type="text" placeholder="Class" value={filters.classVal} onChange={(e) => handleFilterChange('classVal', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-8 pr-2 text-xs font-bold outline-none focus:border-indigo-500" />
               </div>
            </div>
            <div className="relative">
                <Type size={14} className="absolute left-3 top-3 text-slate-400" />
                <input type="text" placeholder="Search Name..." value={filters.name} onChange={(e) => handleFilterChange('name', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 pl-8 pr-2 text-xs font-bold outline-none focus:border-indigo-500" />
            </div>
            <div className="flex gap-2 mt-1">
               {hasActiveFilter && <button onClick={clearFilters} className="flex-1 bg-red-50 text-red-500 py-2.5 rounded-lg text-xs font-bold">Clear</button>}
               {hasActiveFilter && !isSelectionMode && <button onClick={() => setIsSelectionMode(true)} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-xs font-bold shadow-md shadow-indigo-200">Select Mode</button>}
            </div>
          </div>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-6 pb-24 pt-4">
        <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
          
          {/* Stats */}
          {!loading && (
            <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide">
              <ModernStatCard label="Total" value={stats.total} icon={GraduationCap} type="total" />
              <ModernStatCard label="Male" value={stats.male} icon={User} type="male" />
              <ModernStatCard label="Female" value={stats.female} icon={User} type="female" />
            </div>
          )}

          {/* Content */}
          {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl sm:rounded-3xl h-40 sm:h-64 animate-pulse border border-slate-100" />)}
             </div>
          ) : filtered.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 sm:py-20 bg-white rounded-2xl sm:rounded-[32px] border border-dashed border-slate-200 mx-2">
               <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><Search size={20} className="text-slate-300" /></div>
               <h3 className="text-sm sm:text-lg font-bold text-slate-600">No students found</h3>
             </div>
          ) : (
             <>
               {displayMode === 'grid' ? (
                 <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6">
                    {filtered.map((student) => (
                      <StudentCard 
                        key={student.id} 
                        student={student} 
                        filterClass={filters.classVal} 
                        isSelectionMode={isSelectionMode}
                        onClick={() => {
                          if(isSelectionMode) toggleSelection(student.id);
                          else setSelectedStudent(student);
                        }}
                        isSelected={selectedIds.has(student.id)}
                        toggleSelect={() => toggleSelection(student.id)}
                      />
                    ))}
                 </div>
               ) : (
                 // --- DRAGGABLE TABLE VIEW ---
                 <div 
                   ref={scrollRef} 
                   className="bg-white rounded-xl sm:rounded-[24px] shadow-sm border border-slate-200 overflow-x-auto cursor-grab active:cursor-grabbing animate-in fade-in"
                 >
                   <table className="w-full text-left border-collapse min-w-[2800px]">
                     <thead className="bg-slate-50/80 border-b border-slate-200 backdrop-blur-sm">
                       <tr>
                         <th className="p-3 pl-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-12 sticky left-0 z-20 bg-slate-50/95 shadow-[1px_0_0_0_#f1f5f9]">
                           {isSelectionMode && <div className="w-5 h-5 border rounded bg-white"></div>}
                         </th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ID</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identity</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sex</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Major</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Class</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Group</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gen</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Year</th>
                         
                         {/* Schedule Headers */}
                         {DAYS.map(day => (
                           <th key={day} className="p-3 text-[11px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-50/20 text-center">{day}</th>
                         ))}

                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Telegram</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">DOB</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Birth Place</th>
                         <th className="p-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Photo URL</th>
                       </tr>
                     </thead>
                     <tbody>
                       {filtered.map((student) => (
                         <StudentRow 
                           key={student.id} 
                           student={student}
                           filterClass={filters.classVal}
                           isSelectionMode={isSelectionMode}
                           onDoubleClick={() => setSelectedStudent(student)}
                           onInlineUpdate={handleInlineUpdate}
                           onClick={() => {
                             if(isSelectionMode) toggleSelection(student.id);
                           }}
                           isSelected={selectedIds.has(student.id)}
                           toggleSelect={() => toggleSelection(student.id)}
                           settings={settings} // Pass settings
                         />
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </>
          )}
        </div>
      </main>

      {/* --- FLOATING BAR --- */}
      {selectedIds.size > 0 && isSelectionMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-slate-900/90 backdrop-blur-lg text-white rounded-2xl shadow-xl p-2 flex items-center justify-between z-40 animate-in slide-in-from-bottom-6 fade-in border border-white/10">
          <div className="flex items-center gap-2 pl-2">
            <span className="bg-indigo-500 flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs shadow-lg">{selectedIds.size}</span>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-300 leading-none">Selected</span>
              <button onClick={selectAllFiltered} className="text-[9px] font-bold text-indigo-400 hover:text-white mt-0.5 text-left">{selectedIds.size === filtered.length ? 'None' : 'All'}</button>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
              <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg"><X size={16} /></button>
              <button onClick={() => setIsBulkModalOpen(true)} className="flex items-center gap-1.5 bg-white text-slate-900 px-3 py-2 rounded-lg text-xs font-bold shadow-md"><Edit2 size={14} /> <span>Move Group</span></button>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      <BulkGroupModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onConfirm={handleBulkGroupUpdate} count={selectedIds.size} />
      {selectedStudent && <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onEditClick={() => { setEditingStudent(selectedStudent); setSelectedStudent(null); }} onDeleteClick={() => handleDelete(selectedStudent.id)} />}
      {editingStudent && <EditStudentModal student={editingStudent} isOpen={!!editingStudent} onClose={() => setEditingStudent(null)} onSave={handleUpdate} />}
    </div>
  );
}

const BulkGroupModal = ({ isOpen, onClose, onConfirm, count }) => {
  const [newGroup, setNewGroup] = useState('');
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
       {/* ... Modal Content ... */}
       <div className="bg-white rounded-3xl w-full max-w-sm p-5 sm:p-6 shadow-2xl scale-100 animate-in zoom-in-95">
        <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1">Move Students</h3>
        <p className="text-slate-500 text-xs sm:text-sm mb-5">Moving <span className="font-bold text-indigo-600">{count} students</span> to a new group.</p>
        <div className="space-y-3">
          <input autoFocus type="text" placeholder="New Group (e.g. A, B)" className="w-full p-3 sm:p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 text-sm sm:text-base" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
          <div className="flex gap-2 sm:gap-3">
            <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 text-xs sm:text-sm">Cancel</button>
            <button onClick={() => onConfirm(newGroup)} disabled={!newGroup} className="flex-1 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 text-xs sm:text-sm">Update</button>
          </div>
        </div>
      </div>
    </div>
  );
};