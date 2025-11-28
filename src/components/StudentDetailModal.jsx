import React, { useState } from 'react';
import { 
  X, Edit3, Trash2, MapPin, 
  Calendar, Briefcase, Send, AlertTriangle, 
  Copy, CheckCircle2, User, Hash, Users, Layers,
  Clock, Sun, Moon, Sunset
} from 'lucide-react';

const DAYS = ['ចន្ទ', 'អង្គារ៍', 'ពុធ', 'ព្រហស្បត្តិ៍', 'សុក្រ', 'សៅរ៍', 'អាទិត្យ'];
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getAvatarUrl = (student) => {
  if (student['រូបថត'] && student['រូបថត'].startsWith('http')) return student['រូបថត'];
  const seed = student['អត្តលេខ'] || 'default';
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=c0aede,b6e3f4`;
};

// --- SUB-COMPONENT: INFO CARD ---
const InfoCard = ({ icon: Icon, label, value, showCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center relative group hover:border-indigo-100 transition-colors h-24">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100/50">
            <Icon size={14} />
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        {showCopy && value && (
          <button 
            onClick={handleCopy}
            className="text-slate-300 hover:text-indigo-600 transition-colors active:scale-90"
          >
            {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        )}
      </div>
      <div className="pl-1">
        <span className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight">{value || '-'}</span>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: SCHEDULE PILL ---
const SchedulePill = ({ day, shift, label }) => {
  // Determine style based on shift content
  let bgClass = "bg-slate-100";
  let textClass = "text-slate-300";
  let icon = null;
  let heightClass = "h-1.5"; // Default height for "Off"

  const shiftLower = shift ? shift.toLowerCase() : "";

  if (shift) {
    heightClass = "h-8"; // Active shifts are taller
    textClass = "text-white";
    
    if (shiftLower.includes("ពេញ") || shiftLower.includes("full")) { // Full Time
      bgClass = "bg-indigo-500 shadow-indigo-200";
      icon = <Clock size={12} />;
    } else if (shiftLower.includes("ព្រឹក") || shiftLower.includes("morning")) { // Morning
      bgClass = "bg-blue-400 shadow-blue-200";
      icon = <Sun size={12} />;
    } else if (shiftLower.includes("រសៀល") || shiftLower.includes("afternoon")) { // Afternoon
      bgClass = "bg-orange-400 shadow-orange-200";
      icon = <Sunset size={12} />;
    } else if (shiftLower.includes("យប់") || shiftLower.includes("night")) { // Night
      bgClass = "bg-slate-700 shadow-slate-300";
      icon = <Moon size={12} />;
    } else {
      bgClass = "bg-emerald-500 shadow-emerald-200"; // Other
      icon = <Clock size={12} />;
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 group relative flex-1">
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20">
        <div className="bg-slate-800 text-white text-[10px] font-bold py-1 px-3 rounded-lg shadow-xl whitespace-nowrap">
          {shift || "Off Day"}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
        </div>
      </div>

      {/* Visual Bar */}
      <div className={`w-full rounded-lg ${bgClass} ${heightClass} w-8 sm:w-10 md:w-12 transition-all duration-300 flex items-center justify-center shadow-sm`}>
        {icon && <span className="text-white/90 animate-in fade-in zoom-in">{icon}</span>}
      </div>

      {/* Label */}
      <span className={`text-[10px] font-bold uppercase ${shift ? 'text-slate-600' : 'text-slate-300'}`}>
        {label}
      </span>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function StudentDetailModal({ student, onClose, onEditClick, onDeleteClick }) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!student) return null;
  const schedule = student['កាលវិភាគ'] || {};

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Card */}
      <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[95vh]">
        
        {/* Delete Overlay */}
        {isDeleting && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <AlertTriangle size={32} className="text-rose-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Student?</h3>
            <p className="text-slate-500 text-sm mb-8">This action cannot be undone.</p>
            <div className="flex gap-3 w-full">
              <button onClick={() => setIsDeleting(false)} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold text-slate-600 active:scale-95 transition-transform">Cancel</button>
              <button onClick={() => { onDeleteClick(); onClose(); }} className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform">Delete</button>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-800 transition-all z-10"
        >
          <X size={20} />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
          
          {/* 1. Header Profile Section */}
          <div className="pt-10 pb-6 px-6 flex flex-col items-center relative bg-gradient-to-b from-slate-50/50 to-white">
            <div className="relative mb-4">
              <div className="p-1 bg-white rounded-full shadow-sm">
                <img 
                  src={getAvatarUrl(student)} 
                  alt="Profile" 
                  className="w-28 h-28 rounded-full bg-slate-100 object-cover border-4 border-white shadow-lg" 
                />
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 text-center leading-tight mb-1">{student['ឈ្មោះ']}</h2>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{student['ឈ្មោះឡាតាំង']}</p>

            <div className="flex items-center gap-2 mb-6">
              <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1 shadow-sm">
                <User size={12} /> ID: {student.id}
              </span>
              <span className="px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-600">
                {student['ភេទ']}
              </span>
            </div>

            {/* Telegram Button */}
            {student['តេឡេក្រាម'] ? (
              <a 
                href={`https://${student['តេឡេក្រាម']}`} 
                target="_blank" 
                rel="noreferrer" 
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                 <Send size={18} /> Message on Telegram
              </a>
            ) : (
              <button disabled className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-2xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                 No Telegram Available
              </button>
            )}
          </div>

          <div className="px-6 space-y-6">
            
            {/* 2. Enhanced Schedule Section */}
            <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 opacity-50"></div>
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-indigo-500" /> Weekly Schedule
                  </h3>
                  <div className="flex gap-2">
                     <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div><span className="text-[9px] font-bold text-slate-400">Full</span></div>
                     <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div><span className="text-[9px] font-bold text-slate-400">Half</span></div>
                  </div>
               </div>
               
               <div className="flex justify-between items-end h-16 px-1">
                  {DAYS.map((day, index) => (
                    <SchedulePill 
                      key={day} 
                      day={day} 
                      label={DAY_LABELS[index]} 
                      shift={schedule[day]} 
                    />
                  ))}
               </div>
            </div>

            {/* 3. Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard icon={Calendar} label="Year (ឆ្នាំសិក្សា)" value={student['ឆ្នាំសិក្សា']} showCopy />
              <InfoCard icon={Hash} label="Class (ថ្នាក់)" value={student['ថ្នាក់']} showCopy />
              <InfoCard icon={Users} label="Group (ក្រុម)" value={student['ក្រុម']} showCopy />
              <InfoCard icon={Layers} label="Generation (ជំនាន់)" value={student['ជំនាន់']} showCopy />
              <InfoCard icon={Calendar} label="DOB (ថ្ងៃកំណើត)" value={student['ថ្ងៃខែឆ្នាំកំណើត']} showCopy />
              <InfoCard icon={Briefcase} label="Major (ជំនាញ)" value={student['ជំនាញ']} showCopy />
              
              <div className="col-span-2">
                <InfoCard icon={MapPin} label="Place of Birth (ទីកន្លែងកំណើត)" value={student['ទីកន្លែងកំណើត']} />
              </div>
              <div className="col-span-2">
                <InfoCard icon={Briefcase} label="Role / Position (តួនាទី)" value={student['តួនាទី']} />
              </div>
            </div>

          </div>
        </div>

        {/* 4. Footer Actions */}
        <div className="p-6 pt-4 border-t border-slate-50 bg-white flex gap-4 sticky bottom-0 z-10">
           <button 
             onClick={onEditClick} 
             className="flex-1 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
           >
              <Edit3 size={18} /> Edit
           </button>
           <button 
             onClick={() => setIsDeleting(true)} 
             className="flex-1 py-3.5 bg-rose-50 text-rose-600 font-bold rounded-2xl hover:bg-rose-100 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
           >
              <Trash2 size={18} /> Delete
           </button>
        </div>

      </div>
    </div>
  );
}