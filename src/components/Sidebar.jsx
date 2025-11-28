import React from 'react';
import { NavLink } from 'react-router-dom';
import { School, Users, Plus, X, Settings } from 'lucide-react'; // Added Settings icon

export default function Sidebar({ isOpen, setIsOpen }) {
  const menuItems = [
    { path: '/dashboard', label: 'Overview', icon: Users },
    { path: '/add', label: 'Registration', icon: Plus },
    { path: '/settings', label: 'Settings', icon: Settings }, // New Link
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:block shadow-2xl`}>
        <div className="h-full flex flex-col p-6">
          
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <School size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">DI Manager</h1>
              <p className="text-xs text-slate-400 font-medium tracking-wide">ADMIN PORTAL</p>
            </div>
            <button className="ml-auto lg:hidden text-slate-400 hover:text-white" onClick={() => setIsOpen(false)}><X size={20} /></button>
          </div>

          <nav className="space-y-2 flex-1">
            {menuItems.map((item) => (
              <NavLink 
                key={item.path} 
                to={item.path}
                onClick={() => setIsOpen(false)} 
                className={({ isActive }) => `
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 translate-x-2' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white hover:translate-x-1'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={20} className={isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'} /> 
                    <span className="font-semibold text-sm">{item.label}</span>
                    {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-glow"></div>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10">
            <div className="flex items-center gap-3 px-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 p-0.5">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-xs font-bold text-white">AD</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Admin User</p>
                <p className="text-xs text-emerald-400">● Online</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}