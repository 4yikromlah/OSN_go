import { useState, useEffect } from 'react';
import { LogOut, GraduationCap, Clock, ShieldCheck } from 'lucide-react';
import { UserRole } from '../types';
import smasaLogo from '../assets/images/smasa_logo_1780390180944.png';

interface HeaderProps {
  currentUser: { name: string; studentId?: string } | null;
  role: UserRole;
  onLogout: () => void;
}

export default function Header({ currentUser, role, onLogout }: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      
      // Format to Indonesian locale if possible
      try {
        setTimeStr(now.toLocaleDateString('id-ID', options) + ' WIB');
      } catch (e) {
        setTimeStr(now.toDateString() + ' ' + now.toTimeString().split(' ')[0]);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="fixed top-4 left-4 right-4 z-50 h-16 glass rounded-2xl flex items-center justify-between px-6 transition-all duration-300">
      {/* Brand Logo - Styled with Claymorphism badge background */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center transform hover:scale-105 transition-transform shrink-0 overflow-hidden bg-white shadow-md border border-slate-200/50 p-1">
          <img 
            src={smasaLogo} 
            alt="SMASA Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <div>
          <h1 className="font-sans font-bold text-lg leading-tight text-[#444] tracking-tight italic">
            SMASA-<span className="text-[#4dabf7] not-italic">Online</span>
          </h1>
          <p className="text-[9px] font-mono tracking-wider text-slate-500 uppercase leading-none">
            COMPUTER BASED TEST
          </p>
        </div>
      </div>

      {/* Live Clock - Styled with Glassmorphism */}
      <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-white/50 text-xs font-mono text-slate-700 text-center">
        <Clock className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
        <span>{timeStr || 'Loading...'}</span>
      </div>

      {/* User Status and Action */}
      <div className="flex items-center gap-4">
        {currentUser && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Active User</span>
              <span className="text-xs font-bold text-[#444] flex items-center justify-end gap-1">
                {role === 'admin' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    Administrator
                  </>
                ) : (
                  currentUser.name
                )}
              </span>
            </div>
            
            {/* Logout button - tactile/clay style */}
            <button
              onClick={onLogout}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 active:translate-y-0.5 rounded-xl flex items-center gap-1.5 transition-all duration-200 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),0_2px_6px_rgba(244,63,94,0.2)]"
              title="Keluar dari portal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Keluar</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
