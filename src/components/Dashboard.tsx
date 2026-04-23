import { Employee, DEPARTMENTS, Role, AuditLog } from '../types';
import { Users, Building2, TrendingUp, CalendarDays, ArrowUpRight, ArrowDownRight, ShieldCheck, Activity, Terminal, Clock, Briefcase, FileText } from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  employees: Employee[];
  auditLogs?: AuditLog[];
  userRole: Role;
  currentUser: Employee;
}

export default function Dashboard({ employees = [], auditLogs = [], userRole, currentUser }: DashboardProps) {
  const safeEmployees = Array.isArray(employees) ? employees : [];
  
  const adminStats = [
    { 
      label: 'Total Personnel', 
      value: safeEmployees.length, 
      sub: '+2 this month', 
      trend: 'up',
      icon: Users, 
      color: 'text-talibon-red',
      bg: 'bg-talibon-red/5'
    },
    { 
      label: 'Monthly Payroll', 
      value: formatCurrency(safeEmployees.reduce((acc, emp) => acc + (emp.salary || 0), 0)), 
      sub: 'Next run in 4 days', 
      trend: 'neutral',
      icon: TrendingUp, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/5'
    },
    { 
      label: 'Pending Approvals', 
      value: '14', 
      sub: 'Leaves & Corrections', 
      trend: 'up',
      icon: ShieldCheck, 
      color: 'text-talibon-orange',
      bg: 'bg-talibon-orange/5'
    },
    { 
      label: 'Active Workforce', 
      value: '98.5%', 
      sub: 'Attendance Score', 
      trend: 'up',
      icon: Activity, 
      color: 'text-sky-600',
      bg: 'bg-sky-500/5'
    },
  ];

  const employeeStats = [
    { 
      label: 'Vacation Balance', 
      value: `${currentUser.leaveBalances?.vacation || 12} Days`, 
      sub: 'Annual Entitlement', 
      trend: 'neutral',
      icon: Briefcase, 
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/5'
    },
    { 
      label: 'Duty Punctuality', 
      value: '98%', 
      sub: 'Standard Compliance', 
      trend: 'up',
      icon: Clock, 
      color: 'text-talibon-red',
      bg: 'bg-talibon-red/5'
    },
    { 
      label: 'Monthly Net Rate', 
      value: formatCurrency(currentUser.salary || 0), 
      sub: 'Active Tier Rate', 
      trend: 'neutral',
      icon: TrendingUp, 
      color: 'text-slate-900',
      bg: 'bg-slate-100'
    },
    { 
      label: 'Personnel Status', 
      value: 'Verified', 
      sub: 'Official Record', 
      trend: 'neutral',
      icon: ShieldCheck, 
      color: 'text-sky-600',
      bg: 'bg-sky-500/5'
    },
  ];

  const stats = userRole === 'admin' || userRole === 'dept_head' || userRole === 'payroll_officer' ? adminStats : employeeStats;
  const recentEmployees = [...safeEmployees].sort((a, b) => (b.id || '').localeCompare(a.id || '')).slice(0, 5);

  return (
    <div className="space-y-10 pb-32">
      <header className="flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-none">
             {userRole === 'admin' ? 'Administrative Terminal' : `Personnel Hub: ${currentUser.firstName}`}
           </h2>
           <p className="font-serif italic text-slate-400 text-sm mt-2">
             Official Human Resource Intelligence System
           </p>
        </div>
        <div className="flex gap-2">
           <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Real-time Data Stream</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.label} 
            className="bg-white p-6 rounded-xl border border-slate-200 group transition-all cursor-default relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold", stat.color, stat.bg)}>
                <stat.icon size={18} />
              </div>
              <div className="text-[9px] font-mono text-slate-300">ID:0{idx + 1}</div>
            </div>
            <div className="relative z-10">
               <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
               <h3 className="text-2xl font-bold mt-1 text-slate-900 tracking-tight font-mono">{stat.value}</h3>
               <div className="flex items-center gap-2 mt-2">
                  {stat.trend === 'up' && <ArrowUpRight size={10} className="text-emerald-500" />}
                  {stat.trend === 'down' && <ArrowDownRight size={10} className="text-rose-500" />}
                  <p className="text-[10px] font-medium text-slate-400">{stat.sub}</p>
               </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white border border-slate-200 p-8 rounded-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-talibon-red">
                  <Activity size={20} />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {userRole === 'admin' ? 'Personnel Audit Logs' : 'My Recent Activity'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Events</p>
               </div>
            </div>
          </div>
          <div className="space-y-3">
            {(userRole === 'admin' ? auditLogs : auditLogs.filter(l => l.userId === currentUser.id)).length > 0 ? (
              (userRole === 'admin' ? auditLogs : auditLogs.filter(l => l.userId === currentUser.id)).slice(0, 8).map(log => (
                <div key={log.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-talibon-red transition-colors font-bold">
                      <Terminal size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 tracking-tight text-sm leading-tight">
                        {log.action}
                      </p>
                      <p className="text-[10px] text-slate-400 font-serif italic">{log.target}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-mono text-slate-300">{new Date(log.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs font-serif italic text-slate-300">No recent entries detected.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-slate-900 p-8 rounded-xl shadow-xl text-white relative overflow-hidden group">
              <ShieldCheck size={32} className="text-talibon-red mb-6" />
              <h3 className="text-xl font-bold tracking-tight leading-tight">Secure Terminal</h3>
              <p className="text-slate-400 text-xs mt-3 leading-relaxed font-medium">
                Your personnel record is protected under Municipal Privacy Law Sec-401. All access events are non-repudiable and stored in the secure vault.
              </p>
           </div>

           <div className="bg-white border border-slate-200 p-6 rounded-xl">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Registry Status</h4>
              <div className="space-y-4">
                 {[
                   { name: 'Personnel ID', status: currentUser.id.slice(-6).toUpperCase() },
                   { name: 'Duty Status', status: 'Verified' },
                   { name: 'Data Relay', status: 'Optimal' },
                 ].map(svc => (
                   <div key={svc.name} className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700">{svc.name}</span>
                      <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-bold rounded uppercase border border-slate-100">{svc.status}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
