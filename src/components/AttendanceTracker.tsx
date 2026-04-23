import React, { useState } from 'react';
import { Clock, Fingerprint, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Navigation, ChevronRight, ArrowUpRight, ArrowDownLeft, Terminal, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { cn, formatDate } from '../lib/utils';
import { AttendanceRecord, Employee, Role } from '../types';

interface AttendanceTrackerProps {
  records: AttendanceRecord[];
  currentUser: Employee;
  onLog: (type: 'in' | 'out') => void;
}

export default function AttendanceTracker({ records, currentUser, onLog }: AttendanceTrackerProps) {
  const [currentDate] = useState(new Date());
  const userRole = currentUser.role;

  // Filter records for employees to see only their own, or all for admin
  const filteredRecords = userRole === 'admin' || userRole === 'dept_head' 
    ? records 
    : records.filter(r => r.employeeId === currentUser.id);

  const stats = {
    today: filteredRecords.filter(r => r.date === format(new Date(), 'yyyy-MM-dd')),
    onTime: 92, 
    late: 5,
    absent: 3
  };

  const isClockedIn = stats.today.some(r => !r.timeOut);

  return (
    <div className="space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-8">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Time & Attendance</h2>
           <p className="font-serif italic text-slate-400 text-sm mt-2">Official Municipal Duty Records</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200">
           <CalendarIcon size={14} className="text-talibon-red" />
           <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{format(currentDate, 'MMMM dd, yyyy')}</span>
        </div>
      </header>

      {/* Hero Clock-In Action (Employee View) */}
      {userRole === 'employee' && (
        <div className="bg-white border border-slate-200 p-10 rounded-xl relative overflow-hidden group shadow-sm">
           <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex gap-6 items-center">
                 <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl relative">
                    <Clock size={28} />
                    {isClockedIn && <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>}
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2">Duty Terminal</h3>
                    <p className="text-xs font-medium text-slate-500 max-w-sm">Secure biometric verification required for session logging.</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                 {!isClockedIn ? (
                    <button 
                      onClick={() => onLog('in')}
                      className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all hover:bg-talibon-red flex items-center gap-2 shadow-lg"
                    >
                       <ArrowUpRight size={14} /> Record Arrival
                    </button>
                 ) : (
                    <button 
                      onClick={() => onLog('out')}
                      className="px-8 py-4 bg-white text-slate-900 border border-slate-200 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all hover:border-talibon-red hover:text-talibon-red flex items-center gap-2 shadow-sm"
                    >
                       <ArrowDownLeft size={14} /> Record Departure
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Admin/Dept Head Stats Grid */}
      {userRole !== 'employee' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: 'Punctuality', value: `${stats.onTime}%`, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
             { label: 'Late Arrival', value: `${stats.late}%`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
             { label: 'Absence Rate', value: `${stats.absent}%`, icon: AlertCircle, color: 'text-talibon-red', bg: 'bg-red-50' },
             { label: 'Active Logs', value: '2.4k', icon: Fingerprint, color: 'text-slate-900', bg: 'bg-slate-100' },
           ].map((s, i) => (
             <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 group transition-all">
                <div className="flex justify-between items-start mb-6">
                   <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", s.color, s.bg)}>
                      <s.icon size={18} />
                   </div>
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-1">{s.value}</h4>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
             </div>
           ))}
        </div>
      )}

      {/* Recent Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
         <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
                <Terminal size={16} className="text-slate-400" />
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Duty Identity Stream</h3>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secure Sync Active</span>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                     <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Personnel</th>
                     <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                     <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Checkpoint In</th>
                     <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">Checkpoint Out</th>
                     <th className="px-6 py-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                  {filteredRecords.length === 0 ? (
                     <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic text-xs">No records found in this cycle</td>
                     </tr>
                  ) : (
                     filteredRecords.slice(0, 15).map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50 transition-colors group">
                           <td className="px-6 py-4">
                              <p className="text-[10px] font-bold text-slate-800 tracking-tight uppercase">ID-{rec.employeeId.slice(-6)}</p>
                           </td>
                           <td className="px-6 py-4 text-[10px] font-medium text-slate-600">{rec.date}</td>
                           <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-emerald-600">
                                 {format(parseISO(rec.timeIn), 'hh:mm a')}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              {rec.timeOut ? (
                                 <span className="text-[10px] font-bold text-slate-500">
                                    {format(parseISO(rec.timeOut), 'hh:mm a')}
                                 </span>
                              ) : (
                                 <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded text-[8px] font-bold uppercase tracking-widest">Active</span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <span className={cn(
                                 "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border",
                                 rec.status === 'present' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                                 rec.status === 'late' ? "bg-orange-50 text-orange-600 border-orange-100" :
                                 "bg-red-50 text-red-600 border-red-100"
                              )}>
                                 {rec.status}
                              </span>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
