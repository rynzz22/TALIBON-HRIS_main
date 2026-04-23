import React, { useState, useMemo } from 'react';
import { FileText, Download, Printer, Calendar, Users, TrendingUp, ShieldCheck, ChevronRight, Calculator } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isWithinInterval, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
import { Employee, AttendanceRecord, PayrollRecord, LeaveRequest } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface ReportGeneratorProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  payroll: PayrollRecord[];
}

type ReportPeriod = 'quincena1' | 'quincena2' | 'monthly' | 'custom';

export default function ReportGenerator({ employees, attendance, leaves, payroll }: ReportGeneratorProps) {
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [periodType, setPeriodType] = useState<ReportPeriod>('monthly');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // Define date range based on selection
  const range = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = endOfMonth(firstDay);

    if (periodType === 'quincena1') {
      return { start: firstDay, end: new Date(year, month - 1, 15) };
    } else if (periodType === 'quincena2') {
      return { start: new Date(year, month - 1, 16), end: lastDay };
    }
    return { start: firstDay, end: lastDay };
  }, [selectedMonth, periodType]);

  const departments = ['All', ...new Set(employees.map(e => e.department))];

  const reportData = useMemo(() => {
    return employees
      .filter(emp => selectedDept === 'All' || emp.department === selectedDept)
      .map(emp => {
        // Filter attendance for this employee in range
        const empAttendance = attendance.filter(rec => {
          const isMine = rec.employeeId === emp.id;
          const date = parseISO(rec.date);
          return isMine && isWithinInterval(date, { start: range.start, end: range.end });
        });

        // Filter leaves
        const empLeaves = leaves.filter(req => {
          const isMine = req.employeeId === emp.id;
          const isApproved = req.status === 'approved';
          const start = parseISO(req.startDate);
          const end = parseISO(req.endDate);
          // Check if leave overlaps with range
          return isMine && isApproved && (
            isWithinInterval(start, { start: range.start, end: range.end }) ||
            isWithinInterval(end, { start: range.start, end: range.end })
          );
        });

        const totalDaysPresent = empAttendance.length;
        const totalLate = empAttendance.filter(r => r.status === 'late').length;
        const totalLeaveDays = empLeaves.reduce((acc, l) => {
          const start = parseISO(l.startDate);
          const end = parseISO(l.endDate);
          // Very simple calculation for now
          return acc + 1; 
        }, 0);

        // Deductions calculation (Sample logic)
        const baseSalary = emp.salary || 0;
        const perDayRate = baseSalary / 22; // Average working days
        const lateDeduction = totalLate * (perDayRate / 8) * 0.5; // Half hour deduction for each late
        
        // Static Statutory Deductions (Sample)
        const sss = baseSalary * 0.045;
        const philhealth = baseSalary * 0.04;
        const pagibig = 200;
        const totalDeductions = sss + philhealth + pagibig + lateDeduction;
        
        const netPay = (baseSalary / (periodType === 'monthly' ? 1 : 2)) - (totalDeductions / (periodType === 'monthly' ? 1 : 2));

        return {
          ...emp,
          attendanceCount: totalDaysPresent,
          lateCount: totalLate,
          leaveCount: totalLeaveDays,
          computedDeductions: totalDeductions,
          computedNet: netPay
        };
      });
  }, [employees, attendance, leaves, range, selectedDept, periodType]);

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-8 pb-32 print:p-0 print:m-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8 print:hidden">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-talibon-red" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Security Standard Compliance</span>
           </div>
           <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">Generative Fiscal Matrix</h2>
           <p className="font-serif italic text-slate-400 text-sm mt-3">Consolidated Personnel Disbursement & Compliance Report</p>
        </div>
        <button 
          onClick={handleExport}
          className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-talibon-red transition-all flex items-center gap-3 shadow-xl active:scale-95"
        >
          <Printer size={16} /> Print Official Ledger
        </button>
      </header>

      {/* Control Panel */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-8 grid grid-cols-1 md:grid-cols-4 gap-8 print:hidden">
         <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <Calendar size={14} className="text-talibon-red" /> Disbursement Month
            </label>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 py-3 px-4 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-bold text-slate-900"
            />
         </div>

         <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <TrendingUp size={14} className="text-emerald-500" /> Cycle Type
            </label>
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-100">
               {[
                 { id: 'quincena1', label: '1st Kensena' },
                 { id: 'quincena2', label: '2nd Kensena' },
                 { id: 'monthly', label: 'Monthly' }
               ].map(p => (
                 <button
                   key={p.id}
                   onClick={() => setPeriodType(p.id as ReportPeriod)}
                   className={cn(
                     "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                     periodType === p.id ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   {p.label}
                 </button>
               ))}
            </div>
         </div>

         <div className="space-y-4">
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <Users size={14} className="text-sky-500" /> Organizational Unit
            </label>
            <select 
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 py-3 px-4 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-bold text-slate-900"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
         </div>

         <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col justify-between group overflow-hidden relative">
            <Calculator size={48} className="absolute -right-2 -bottom-2 text-white/5 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-talibon-red mb-1">Matrix Stats</p>
            <h4 className="text-2xl font-black tracking-tight leading-none">{reportData.length} Personnel</h4>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">{periodType} cycle processed</p>
         </div>
      </div>

      {/* The Generative Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden print:border-none print:shadow-none">
         <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                     <img 
                        src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6JGnJT_02yLTv70U9qTCxC8SZY15G44MHUw&s" 
                        className="w-6 h-6 object-contain"
                        alt="Municipal Seal" 
                     />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">Talibon Master Disbursement Ledger</h3>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Official Human Resource Data Export</p>
                  </div>
               </div>
            </div>
            <div className="text-right hidden md:block">
               <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{format(range.start, 'MMM dd')} — {format(range.end, 'MMM dd, yyyy')}</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Cycle Lock</p>
            </div>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="bg-slate-900 text-white">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/5">Personnel Profile</th>
                     <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/5">Attendance Summary</th>
                     <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/5">Mobility (Leaves)</th>
                     <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] border-r border-white/5">Statutory & Late</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-right">Net Allocation</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {reportData.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-all group">
                       <td className="px-8 py-6 flex items-center gap-4 border-r border-slate-50">
                          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-bold text-slate-600 group-hover:bg-talibon-red group-hover:text-white transition-all text-xs">
                             {row.firstName[0]}{row.lastName[0]}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">{row.firstName} {row.lastName}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{row.position} • ID-{row.id.slice(-6)}</p>
                          </div>
                       </td>
                       <td className="px-6 py-6 border-r border-slate-50">
                          <div className="flex gap-4 items-center">
                             <div className="text-center">
                                <p className="text-xl font-black text-slate-800 font-mono leading-none">{row.attendanceCount}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Days</p>
                             </div>
                             <div className="h-8 w-px bg-slate-100"></div>
                             <div className="text-center">
                                <p className={cn("text-xl font-black font-mono leading-none", row.lateCount > 0 ? "text-talibon-red" : "text-emerald-500")}>
                                   {row.lateCount}
                                </p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Late</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-6 border-r border-slate-50">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            row.leaveCount > 0 ? "bg-sky-50 text-sky-600 border-sky-100" : "bg-slate-50 text-slate-400 border-slate-100"
                          )}>
                             {row.leaveCount > 0 ? `${row.leaveCount} Days Approved` : 'No Mobility'}
                          </div>
                       </td>
                       <td className="px-6 py-6 border-r border-slate-50">
                          <div className="space-y-1">
                             <p className="text-xs font-black text-rose-600 font-mono">-{formatCurrency(row.computedDeductions)}</p>
                             <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full opacity-30"></div>
                                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full opacity-60"></div>
                                <div className="w-3 h-1.5 bg-rose-500 rounded-full"></div>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <p className="text-xl font-black text-emerald-600 tracking-tight font-mono leading-none">
                             {formatCurrency(row.computedNet)}
                          </p>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">{periodType} period</p>
                       </td>
                    </tr>
                  ))}
               </tbody>
                <tfoot className="bg-slate-50 border-t-2 border-slate-900">
                  <tr>
                     <td colSpan={4} className="px-8 py-10 text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregate Disbursement Capital</p>
                     </td>
                     <td className="px-8 py-10 text-right">
                        <p className="text-3xl font-black text-slate-900 tracking-tighter font-mono leading-none">
                           {formatCurrency(reportData.reduce((acc, r) => acc + r.computedNet, 0))}
                        </p>
                     </td>
                  </tr>
                </tfoot>
            </table>
         </div>
      </div>

      {/* Official Footnote for Printed Reports */}
      <div className="hidden print:block mt-20 pt-10 border-t-4 border-slate-900">
         <div className="grid grid-cols-3 gap-20">
            <div className="text-center">
               <div className="h-px bg-slate-900 mb-4 mx-auto w-48"></div>
               <p className="text-[10px] font-black uppercase">Prepared By</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">HR Intelligence System Administrator</p>
            </div>
            <div className="text-center">
               <div className="h-px bg-slate-900 mb-4 mx-auto w-48"></div>
               <p className="text-[10px] font-black uppercase">Verified By</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Municipal Treasurer Office</p>
            </div>
            <div className="text-center">
               <div className="h-px bg-slate-900 mb-4 mx-auto w-48"></div>
               <p className="text-[10px] font-black uppercase">Approved For Release</p>
               <p className="text-[8px] font-bold text-slate-500 uppercase mt-1">Honorable Municipal Mayor</p>
            </div>
         </div>
         <p className="text-[8px] text-center text-slate-400 mt-20 italic">
            This is a system-generated document from the Talibon HRIS. Tampering with this record is punishable under the Municipal Code of Conduct.
         </p>
      </div>
    </div>
  );
}
