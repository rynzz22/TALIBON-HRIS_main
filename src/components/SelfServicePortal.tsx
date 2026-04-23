import React, { useState } from 'react';
import { Search, FileText, Download, Calendar, User, Clock, DollarSign, ArrowRight, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { Employee, AttendanceRecord, PayrollRecord } from '../types';

interface SelfServicePortalProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  payroll: PayrollRecord[];
}

export default function SelfServicePortal({ employees, attendance, payroll }: SelfServicePortalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchResult, setSearchResult] = useState<{
    employee: Employee | null;
    attendance: AttendanceRecord[];
    payroll: PayrollRecord[];
    isSearched: boolean;
  }>({
    employee: null,
    attendance: [],
    payroll: [],
    isSearched: false
  });

  const handleSearch = () => {
    if (!employeeId) return;

    const employee = employees.find(e => e.id === employeeId || e.email.includes(employeeId));
    
    if (!employee) {
      setSearchResult({ employee: null, attendance: [], payroll: [], isSearched: true });
      return;
    }

    const filteredAttendance = attendance.filter(rec => {
      const isMine = rec.employeeId === employee.id;
      const date = parseISO(rec.date);
      const isRange = isWithinInterval(date, { 
        start: parseISO(startDate), 
        end: parseISO(endDate) 
      });
      return isMine && isRange;
    });

    const filteredPayroll = payroll.filter(rec => {
      const isMine = rec.employeeId === employee.id;
      // Payroll period is YYYY-MM usually, but we check if it overlaps with range
      // For simplicity, we just filter by ID for now, or match period if format matches
      return isMine;
    });

    setSearchResult({
      employee,
      attendance: filteredAttendance,
      payroll: filteredPayroll,
      isSearched: true
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">Inquiry Desk</h2>
           <p className="font-serif italic text-slate-400 text-sm mt-2">Access your PDS, Attendance Packets & Payroll Ledger</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200 grid grid-cols-1 md:grid-cols-4">
          <div className="p-5 space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">01. Staff Identifier</label>
            <div className="relative">
              <User className="absolute left-0 top-1/2 -translate-y-1/2 text-talibon-red" size={13} />
              <input 
                type="text" 
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="ID or Email"
                className="w-full bg-transparent py-2 pl-5 pr-4 text-sm font-bold focus:outline-none placeholder:text-slate-200"
              />
            </div>
          </div>
          <div className="p-5 space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">02. Period Start</label>
            <div className="relative">
              <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-transparent py-2 pl-5 pr-4 text-sm font-mono font-medium focus:outline-none"
              />
            </div>
          </div>
          <div className="p-5 space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1">03. Period End</label>
            <div className="relative">
              <Calendar className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-300" size={13} />
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-transparent py-2 pl-5 pr-4 text-sm font-mono font-medium focus:outline-none"
              />
            </div>
          </div>
          <button 
            onClick={handleSearch}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-talibon-red transition-all group p-5 h-full"
          >
            EXECUTE <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
      </div>

      <AnimatePresence mode="wait">
        {searchResult.isSearched && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {!searchResult.employee ? (
              <div className="bg-white border border-slate-200 p-16 text-center rounded-xl">
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Search size={20} className="text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">No Personnel Detected</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Verify the staff identifier and try again.</p>
              </div>
            ) : (
              <>
                {/* Personnel Summary */}
                <div className="bg-white border border-slate-200 p-8 rounded-xl relative overflow-hidden">
                   <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                      <div className="w-24 h-24 bg-slate-900 rounded-lg flex items-center justify-center text-white text-3xl font-bold">
                         {searchResult.employee.firstName[0]}{searchResult.employee.lastName[0]}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                         <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                               {searchResult.employee.firstName} {searchResult.employee.lastName}
                            </h3>
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-widest border border-slate-200">
                               {searchResult.employee.position}
                            </span>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
                               <p className="text-xs font-medium text-slate-700">{searchResult.employee.department}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Staff ID</p>
                               <p className="text-xs font-medium text-slate-700 font-mono">PH-TAL-{searchResult.employee.id.slice(-4).toUpperCase()}</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Duty Status</p>
                               <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 justify-center md:justify-start">
                                  <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div> Active
                                </div>
                            </div>
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Base Rate</p>
                               <p className="text-xs font-medium text-slate-700">₱{searchResult.employee.salary.toLocaleString()}</p>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Data Matrix Tabs (Attendance/Payroll) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Attendance Ledger */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div>
                        <h3 className="text-lg font-black text-slate-800 tracking-tight">Attendance Packet History</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          Range: {startDate} — {endDate}
                        </p>
                      </div>
                      <Clock size={20} className="text-talibon-red" />
                    </div>
                    <div className="flex-1 overflow-auto max-h-[400px]">
                      <table className="w-full text-left">
                         <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr>
                               <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                               <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">In/Out</th>
                               <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Hours</th>
                               <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                            {searchResult.attendance.length === 0 ? (
                               <tr>
                                  <td colSpan={4} className="px-8 py-10 text-center text-slate-400 text-xs font-bold italic">No log packets found for this range</td>
                               </tr>
                            ) : (
                              searchResult.attendance.map((rec) => (
                                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                                   <td className="px-8 py-4 text-[11px] font-bold text-slate-600">{rec.date}</td>
                                   <td className="px-6 py-4">
                                      <div className="flex flex-col gap-1">
                                         <span className="text-[10px] font-black text-emerald-600">{format(parseISO(rec.timeIn), 'hh:mm a')}</span>
                                         {rec.timeOut && <span className="text-[10px] font-black text-talibon-red">{format(parseISO(rec.timeOut), 'hh:mm a')}</span>}
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-xs font-black text-slate-800">{rec.totalHours.toFixed(2)}</td>
                                   <td className="px-8 py-4 text-right">
                                      <span className={cn(
                                         "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                                         rec.status === 'present' ? "bg-emerald-100 text-emerald-600" : "bg-talibon-orange/10 text-talibon-orange"
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

                  {/* Financial Summary */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Financial Summary</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                          Consolidated Payroll Matrix
                        </p>
                      </div>
                      <DollarSign size={16} className="text-emerald-600" />
                    </div>
                    <div className="flex-1 p-6 space-y-4">
                       {searchResult.payroll.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 rounded-lg">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No disbursements recorded</p>
                          </div>
                       ) : (
                         searchResult.payroll.map((pay) => (
                           <div key={pay.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all group">
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Period Cycle</p>
                                    <h4 className="text-xl font-black text-slate-800">Month of {pay.period}</h4>
                                 </div>
                                 <span className="px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest">
                                    {pay.status}
                                 </span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-slate-50 rounded-2xl">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Computation</p>
                                    <p className="text-lg font-black text-slate-800 font-mono">₱{pay.grossPay.toLocaleString()}</p>
                                 </div>
                                 <div className="p-4 bg-emerald-50 rounded-2xl">
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Net Allocation</p>
                                    <p className="text-lg font-black text-emerald-600 font-mono">₱{pay.netPay.toLocaleString()}</p>
                                 </div>
                              </div>
                              <button className="w-full mt-6 flex items-center justify-center gap-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all">
                                 View Detailed Breakdown <ArrowRight size={14} />
                              </button>
                           </div>
                         ))
                       )}
                    </div>
                  </div>
                </div>

                {/* Table Generation / Report Button */}
                <div className="flex justify-center pt-8">
                   <button 
                     onClick={handlePrint}
                     className="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center gap-4 hover:scale-105 transition-all group"
                   >
                     <Printer size={18} className="group-hover:animate-bounce" /> Generate Comprehensive Report Table
                   </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
