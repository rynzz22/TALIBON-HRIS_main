import React, { useState } from 'react';
import { DollarSign, Download, Search, CheckCircle2, AlertCircle, Calendar, CreditCard, ArrowRight, Printer, ShieldCheck, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { Employee, PayrollRecord, Role } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface PayrollProps {
  employees: Employee[];
  currentUser: Employee;
  payrollRecords: PayrollRecord[];
}

export default function PayrollManagement({ employees, currentUser, payrollRecords }: PayrollProps) {
  const [payPeriod, setPayPeriod] = useState('2026-04-15');
  const userRole = currentUser.role;

  const recordsToShow = userRole === 'admin' || userRole === 'payroll_officer' 
    ? payrollRecords 
    : payrollRecords.filter(p => p.employeeId === currentUser.id);

  const visibleEmployees = userRole === 'admin' || userRole === 'payroll_officer' 
    ? employees 
    : employees.filter(e => e.id === currentUser.id);
  
  const totalGross = visibleEmployees.reduce((acc, emp) => acc + (emp.salary || 0), 0);
  const totalDeductions = totalGross * 0.12; 
  const totalNet = totalGross - totalDeductions;

  return (
    <div className="space-y-10 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">Fiscal Ledger</h2>
           <p className="font-serif italic text-slate-400 text-sm mt-2">Municipal Disbursement Control & Financial Allocation</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           {userRole === 'admin' && (
             <button className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-talibon-red transition-all flex items-center justify-center gap-2 shadow-sm">
                <Printer size={14} /> Batch Print
             </button>
           )}
           <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <select 
                className="pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none transition-all font-bold text-[10px] uppercase tracking-widest text-slate-600 appearance-none min-w-[180px] shadow-sm"
                value={payPeriod}
                onChange={(e) => setPayPeriod(e.target.value)}
              >
                <option value="2026-04-15">April 1-15, 2026</option>
                <option value="2026-03-31">March 16-31, 2026</option>
              </select>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Gross Rate', value: userRole === 'employee' ? (currentUser.salary || 0) : totalGross, icon: TrendingUp, color: 'text-slate-900' },
          { label: 'Deductions', value: userRole === 'employee' ? (currentUser.salary || 0) * 0.12 : totalDeductions, icon: TrendingDown, color: 'text-rose-600' },
          { label: 'Net Payable', value: userRole === 'employee' ? (currentUser.salary || 0) * 0.88 : totalNet, icon: CheckCircle2, color: 'text-emerald-600' },
        ].map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.label} 
            className="p-8 bg-white border border-slate-200 rounded-xl shadow-sm group transition-all"
          >
            <stat.icon className={cn("mb-4", stat.color)} size={24} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
            <h3 className={cn("text-2xl font-bold tracking-tight font-mono", stat.color)}>{formatCurrency(stat.value)}</h3>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white shadow-sm rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                 <ShieldCheck size={16} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Verified Financial Registry</h3>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secure Ledger Active</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Personnel</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Base Rate</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Statutory Adj.</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Net Rate</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {visibleEmployees.map((emp) => {
                  const basic = emp.salary || 0;
                  const sss = basic * 0.045;
                  const philhealth = basic * 0.04;
                  const pagibig = 200;
                  const tax = basic * 0.1;
                  const deduct = sss + philhealth + pagibig + tax;
                  const net = basic - deduct;
                  
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                            {emp.firstName ? emp.firstName[0] : ''}{emp.lastName ? emp.lastName[0] : ''}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 tracking-tight text-sm leading-none uppercase">{emp.firstName} {emp.lastName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID-{emp.id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-mono font-bold text-slate-600 text-sm">{formatCurrency(basic)}</td>
                      <td className="px-6 py-4">
                         <div className="space-y-1">
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Statutory: <span className="text-talibon-red font-mono">-{formatCurrency(deduct)}</span></p>
                            <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-talibon-red w-1/4"></div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-6 font-mono font-bold text-slate-900 text-sm">{formatCurrency(net)}</td>
                      <td className="px-6 py-6 text-right">
                        <button className="p-2 text-slate-400 hover:text-talibon-red transition-all bg-slate-50 border border-slate-100 rounded-lg hover:border-talibon-red/20 shadow-sm">
                          <Download size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
