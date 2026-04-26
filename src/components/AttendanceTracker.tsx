import React, { useState, useMemo } from 'react';
import { Clock, Fingerprint, Calendar as CalendarIcon, CheckCircle2, AlertCircle, Navigation, ChevronRight, ArrowUpRight, ArrowDownLeft, Users, UserMinus, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { format, isSameDay } from 'date-fns';
import { cn, formatDate } from '../lib/utils';
import { AttendanceRecord, Role, Employee } from '../types';

interface AttendanceTrackerProps {
  records: AttendanceRecord[];
  employees: Employee[];
  currentUserRole: Role;
  onLog: (type: 'in' | 'out') => void;
}

export default function AttendanceTracker({ records, employees, currentUserRole, onLog }: AttendanceTrackerProps) {
  const [currentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  const stats = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayRecords = records.filter(r => r.date === today);
    return {
      today: todayRecords,
      onTime: todayRecords.length ? Math.round((todayRecords.filter((r) => r.status === 'present').length / todayRecords.length) * 100) : 0,
      late: todayRecords.filter((r) => r.status === 'late').length,
      absent: todayRecords.filter((r) => r.status === 'absent').length,
      undertime: todayRecords.filter((r) => r.status === 'undertime').length
    };
  }, [records]);

  // Calculate live status for all employees for today
  const liveWorkforce = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return employees.map(emp => {
      const record = records.find(r => r.employeeId === emp.id && r.date === today);
      return {
        ...emp,
        record,
        statusLabel: record ? record.status : 'disconnected',
        isAnomalous: !record || (record && !record.timeOut) || record.status === 'undertime' || record.status === 'late'
      };
    }).filter(emp => 
      emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, records, searchQuery]);

  const isAdminOrDeptHead = currentUserRole === 'admin' || currentUserRole === 'dept_head';

  return (
    <div className="space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-4xl font-black text-slate-800 tracking-tight">Time & Attendance</h2>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Precision Logging & Workforce Tracking</p>
        </div>
        <div className="flex items-center gap-4 border border-white/60 bg-white/40 px-6 py-3 rounded-2xl backdrop-blur-md">
           <CalendarIcon size={16} className="text-talibon-red" />
           <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{format(currentDate, 'MMMM dd, yyyy')}</span>
        </div>
      </header>

      {/* Hero Clock-In Action (Employee View) */}
      {currentUserRole === 'employee' && (
        <div className="glass-panel p-10 rounded-[3rem] relative overflow-hidden group">
           <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-talibon-red/5 rounded-full blur-3xl transition-all group-hover:bg-talibon-red/10"></div>
           <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="flex gap-8 items-center">
                 <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl relative">
                    <Clock size={40} />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white animate-pulse"></div>
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">Employee Attendance</h3>
                    <p className="text-sm font-bold text-slate-500 max-w-sm">Secure biometric-ready logging for the Municipality of Talibon. Verify your session and record your attendance.</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                 <button 
                   onClick={() => onLog('in')}
                   className="group relative px-10 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-600/30 overflow-hidden transition-all hover:scale-105 active:scale-95"
                 >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
                    <span className="relative flex items-center gap-3">
                       <ArrowUpRight size={18} /> Time-In
                    </span>
                 </button>
                 <button 
                   onClick={() => onLog('out')}
                   className="px-10 py-5 bg-white/60 text-slate-700 border border-white/80 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl backdrop-blur-md transition-all hover:bg-white hover:text-talibon-red active:scale-95"
                 >
                    <span className="flex items-center gap-3">
                       <ArrowDownLeft size={18} /> Time-Out
                    </span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Admin/Dept Head Stats Grid */}
      {isAdminOrDeptHead && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="glass-card p-6 rounded-3xl group transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <CheckCircle2 size={24} />
                 </div>
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+4.2%</span>
              </div>
              <h4 className="text-3xl font-black text-slate-800 mb-1">{stats.onTime}%</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Punctuality Rate</p>
           </div>
           <div className="glass-card p-6 rounded-3xl group transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-talibon-orange/10 rounded-2xl flex items-center justify-center text-talibon-orange group-hover:bg-talibon-orange group-hover:text-white transition-all">
                    <Clock size={24} />
                 </div>
                 <span className="text-[10px] font-black text-talibon-orange uppercase tracking-widest">Today</span>
              </div>
              <h4 className="text-3xl font-black text-slate-800 mb-1">{stats.late}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Late Arrivals Today</p>
           </div>
           <div className="glass-card p-6 rounded-3xl group transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-talibon-red/10 rounded-2xl flex items-center justify-center text-talibon-red group-hover:bg-talibon-red group-hover:text-white transition-all">
                    <AlertCircle size={24} />
                 </div>
                 <span className="text-[10px] font-black text-talibon-red uppercase tracking-widest">Today</span>
              </div>
              <h4 className="text-3xl font-black text-slate-800 mb-1">{stats.undertime}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Undertime Alerts</p>
           </div>
           <div className="glass-card p-6 rounded-3xl group transition-all hover:translate-y-[-4px]">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-slate-900/10 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all">
                    <Fingerprint size={24} />
                 </div>
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Feed</span>
              </div>
              <h4 className="text-3xl font-black text-slate-800 mb-1">{records.length}</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Logs Processed</p>
           </div>
        </div>
      )}

      {/* Live Workforce Status (Admin/Dept Head View) */}
      {isAdminOrDeptHead && (
        <div className="glass-panel rounded-[3rem] p-8 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Users className="text-talibon-red" size={20} />
                Live Workforce Status
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time daily monitoring & anomaly detection</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text"
                placeholder="Search personnel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 border border-white/80 rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-talibon-red/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {liveWorkforce.map((emp) => (
              <motion.div 
                layout
                key={emp.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all",
                  emp.isAnomalous 
                    ? "bg-talibon-red/5 border-talibon-red/10 border-l-4 border-l-talibon-red shadow-sm" 
                    : "bg-white/40 border-white/60 shadow-sm"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-[10px] font-black uppercase">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest",
                    emp.record ? (
                      emp.record.status === 'present' ? "bg-emerald-500/10 text-emerald-600" :
                      emp.record.status === 'late' ? "bg-talibon-orange/10 text-talibon-orange" :
                      "bg-talibon-red/10 text-talibon-red"
                    ) : "bg-slate-200 text-slate-400"
                  )}>
                    {emp.statusLabel}
                  </span>
                </div>
                <h5 className="text-xs font-black text-slate-800 tracking-tight truncate">{emp.firstName} {emp.lastName}</h5>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">{emp.position}</p>
                
                <div className="flex items-center gap-3 mt-auto">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">In</span>
                    <span className="text-[10px] font-black text-slate-700">{emp.record ? format(new Date(emp.record.timeIn), 'h:mm a') : '--:--'}</span>
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Out</span>
                    <span className="text-[10px] font-black text-slate-700">{emp.record?.timeOut ? format(new Date(emp.record.timeOut), 'h:mm a') : '--:--'}</span>
                  </div>
                </div>

                {emp.isAnomalous && !emp.record && (
                  <div className="mt-3 pt-3 border-t border-talibon-red/10 flex items-center gap-2 text-talibon-red">
                    <UserMinus size={12} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">No logs detected today</span>
                  </div>
                )}
                {emp.record && !emp.record.timeOut && (
                  <div className="mt-3 pt-3 border-t border-talibon-red/10 flex items-center gap-2 text-talibon-orange">
                    <Clock size={12} />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Pending Time-out Log</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Logs Table */}
      <div className="glass-panel rounded-[3rem] overflow-hidden">
         <div className="p-8 border-b border-white/20 flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-800 tracking-tight">Personnel Engagement Stream</h3>
            <button className="text-[10px] font-black text-talibon-red uppercase tracking-widest hover:underline px-4 py-2 bg-talibon-red/5 rounded-xl transition-all">
               View Full Matrix
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-white/40">
                     <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Identity / ID</th>
                     <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Event Date</th>
                     <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Checkpoint In</th>
                     <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Checkpoint Out</th>
                     <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Duration</th>
                     <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Metric Status</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-white/10">
                  {records.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="px-8 py-16 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">No attendance packets detected in this cycle</td>
                     </tr>
                  ) : (
                     records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-white/30 transition-colors group">
                           <td className="px-8 py-5">
                              <p className="text-xs font-black text-slate-800 tracking-tight">EMP-{rec.employeeId.slice(0,6)}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Biometric Verified</p>
                           </td>
                           <td className="px-6 py-5 text-[10px] font-bold text-slate-600">{formatDate(rec.date)}</td>
                           <td className="px-6 py-5">
                              <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                 {format(new Date(rec.timeIn), 'h:mm a')}
                              </span>
                           </td>
                           <td className="px-6 py-5">
                              {rec.timeOut ? (
                                 <span className="px-3 py-1.5 bg-talibon-orange/10 text-talibon-orange rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {format(new Date(rec.timeOut), 'h:mm a')}
                                 </span>
                              ) : (
                                 <span className="px-3 py-1.5 bg-slate-900/5 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">Active</span>
                              )}
                           </td>
                           <td className="px-6 py-5 text-xs font-black text-slate-800 font-mono">{rec.totalHours.toFixed(1)} hrs</td>
                           <td className="px-8 py-5 text-right">
                              <span className={cn(
                                 "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                 rec.status === 'present' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                 rec.status === 'late' ? "bg-talibon-orange/10 text-talibon-orange border-talibon-orange/20" :
                                 rec.status === 'undertime' ? "bg-talibon-red/10 text-talibon-red border-talibon-red/20" :
                                 "bg-slate-200 text-slate-400 border-slate-300"
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

