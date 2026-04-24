import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, CreditCard, Plus, Trash2, Edit2, Search, Building2, 
  Calendar, Mail, DollarSign, ChevronRight, LogIn, Shield, UserCircle, 
  Briefcase, Bell, LogOut, Copy, Sparkles, PlayCircle, Clock, ChevronDown, 
  Globe, Accessibility, Moon, Sun, Menu, X, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, PayrollRecord, DEPARTMENTS, Role, AttendanceRecord, AuditLog, LeaveRequest } from './types';
import { cn, formatDate } from './lib/utils';

// Components
import EmployeeList from './components/EmployeeList';
import PayrollManagement from './components/PayrollManagement';
import Dashboard from './components/Dashboard';
import LeaveManagement from './components/LeaveManagement';
import AttendanceTracker from './components/AttendanceTracker';
import AuditLogs from './components/AuditLogs';
import SelfServicePortal from './components/SelfServicePortal';
import ReportGenerator from './components/ReportGenerator';
import Login from './components/Login';
import { SupabaseService, supabase } from './lib/supabaseService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'leave' | 'attendance' | 'audit' | 'inquiry' | 'reports'>('dashboard');
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [isHrisActive, setIsHrisActive] = useState(true);
  const queryClient = useQueryClient();

  const currentUserRole = currentUser?.role || 'employee';

  const handleLogout = () => {
    if (currentUser) {
       SupabaseService.audit.log({
          userId: currentUser.id,
          userName: `${currentUser.firstName} ${currentUser.lastName}`,
          action: 'LOGOUT_SUCCESS',
          target: 'Authentication Terminal'
       });
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  // Real-time Data Sync (Live Feed)
  useEffect(() => {
    const channel = supabase
      .channel('hris-live-all')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        // Invalidate appropriate queries based on the table changed
        if (payload.table === 'employees') queryClient.invalidateQueries({ queryKey: ['employees'] });
        if (payload.table === 'attendance_records') queryClient.invalidateQueries({ queryKey: ['attendance'] });
        if (payload.table === 'audit_logs') queryClient.invalidateQueries({ queryKey: ['audit'] });
        if (payload.table === 'payroll_records') queryClient.invalidateQueries({ queryKey: ['payroll'] });
        if (payload.table === 'leave_requests') queryClient.invalidateQueries({ queryKey: ['leaves'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Enterprise Data Orchestration (Supabase Direct)
  const { data: employeeResponse, isLoading: employeeLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => SupabaseService.employees.list(),
  });

  const { data: attendanceResponse } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => SupabaseService.attendance.list(),
  });

  const { data: auditResponse } = useQuery({
    queryKey: ['audit'],
    queryFn: () => SupabaseService.audit.list(),
  });

  const { data: payrollResponse } = useQuery({
    queryKey: ['payroll'],
    queryFn: () => SupabaseService.payroll.list(),
  });

  const { data: leaveResponse } = useQuery({
    queryKey: ['leaves'],
    queryFn: () => SupabaseService.leaves.list(),
  });

  const employees = (employeeResponse?.data || []) as Employee[];
  const attendanceRecords = (attendanceResponse?.data || []) as AttendanceRecord[];
  const auditLogs = (auditResponse?.data || []) as AuditLog[];
  const payrollRecords = (payrollResponse?.data || []) as PayrollRecord[];

  const addMutation = useMutation({
    mutationFn: (newEmp: any) => SupabaseService.employees.create(newEmp),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SupabaseService.employees.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => SupabaseService.employees.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
    addMutation.mutate({ ...employee, role: 'employee' });
  };

  const handleDeleteEmployee = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleUpdateEmployee = async (id: string, data: Partial<Employee>) => {
    updateMutation.mutate({ id, data });
  };

  const handleAttendanceLog = async (type: 'in' | 'out') => {
    if (!currentUser) return;
    try {
      await SupabaseService.attendance.log(currentUser.id, type);
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      // Add audit log for attendance
      await SupabaseService.audit.log({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        action: `Attendance ${type === 'in' ? 'Clock In' : 'Clock Out'}`,
        target: 'attendance_records'
      });
    } catch (err) {
      console.error("Attendance Log Error:", err);
    }
  };

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-900 bg-slate-50">
      
      {/* 1. COMPACT TALIBON IDENTITY BANNER */}
      <div className="relative h-20 md:h-24 overflow-hidden border-b border-slate-200 flex items-center px-4 md:px-10 bg-slate-900 print:hidden">
        <img 
          src="https://o.quizlet.com/SNIDgtNdT.vIbVLCAYqOGA.jpg"
          alt="Talibon Municipal Hall"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&q=80&w=2000';
          }}
        />
        <div className="absolute inset-0 bg-slate-900/60" />

        <div className="max-w-7xl mx-auto w-full flex items-center justify-between relative z-10">
           {/* Left: Branding */}
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                 <img 
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6JGnJT_02yLTv70U9qTCxC8SZY15G44MHUw&s"
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/D92E2E/white?text=Talibon+Seal'; }}
                    className="w-full h-full object-contain p-1" 
                    alt="Talibon Seal"
                 />
              </div>
              <div>
                 <h1 className="text-lg md:text-xl font-bold text-white tracking-tight uppercase leading-none">
                    Municipality of Talibon
                 </h1>
                 <p className="text-slate-400 text-[8px] font-bold tracking-[0.4em] mt-1.5 flex items-center gap-2">
                    <span className="w-1 h-1 bg-talibon-red rounded-full"></span> HUMAN RESOURCE INTELLIGENCE SYSTEM
                 </p>
              </div>
           </div>

           {/* Right: Security Badge & Logout */}
           <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end gap-1 px-3">
                 <span className="text-[9px] font-bold text-white uppercase tracking-widest">{currentUser.firstName} {currentUser.lastName}</span>
                 <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">{currentUser.position}</span>
              </div>
              <div onClick={handleLogout} className="h-8 px-3 rounded bg-white/10 flex items-center justify-center text-white text-[9px] font-bold cursor-pointer hover:bg-talibon-red transition-all border border-white/10 uppercase shrink-0 gap-2 group">
                 <LogOut size={12} className="group-hover:-translate-x-0.5 transition-transform" /> Logout
              </div>
           </div>
        </div>
      </div>

      {/* 2. MINIMALIST NAV BAR */}
      {isHrisActive && (
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden">
           <nav className="max-w-7xl mx-auto px-10 flex items-center gap-2 overflow-x-auto no-scrollbar">
             {[
               { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
               { id: 'employees', label: 'Personnel', icon: Users, restricted: currentUserRole !== 'admin' && currentUserRole !== 'dept_head' },
               { id: 'attendance', label: 'Attendance', icon: Clock },
               { id: 'reports', label: 'Reports', icon: FileText, restricted: currentUserRole !== 'admin' && currentUserRole !== 'payroll_officer' },
               { id: 'inquiry', label: 'Inquiry', icon: Search },
               { id: 'payroll', label: 'Payroll', icon: CreditCard, restricted: currentUserRole !== 'admin' && currentUserRole !== 'payroll_officer' },
               { id: 'leave', label: 'Leave', icon: Briefcase },
               { id: 'audit', label: 'Logs', icon: Shield, restricted: currentUserRole !== 'admin' },
             ].map((item) => (
               !item.restricted && (
                 <button
                   key={item.id}
                   onClick={() => setActiveTab(item.id as any)}
                   className={cn(
                     "flex items-center gap-2 px-4 py-4 transition-all text-[10px] font-bold uppercase tracking-[0.2em] whitespace-nowrap group relative",
                     activeTab === item.id 
                       ? "text-slate-900" 
                       : "text-slate-400 hover:text-slate-600"
                   )}
                 >
                   <item.icon size={14} className={cn("transition-transform group-hover:scale-110", activeTab === item.id ? "text-talibon-red" : "text-slate-300")} />
                   {item.label}
                   {activeTab === item.id && (
                     <motion.div 
                       layoutId="nav-active"
                       className="absolute bottom-0 left-0 right-0 h-0.5 bg-talibon-red"
                     />
                   )}
                 </button>
               )
             ))}
           </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar relative px-10 py-16 dotted-grid sm:dotted-grid print:p-0 print:bg-white">
        {/* Secondary Header / Breadcrumb */}
        <div className="max-w-7xl mx-auto mb-10 flex items-center justify-between print:hidden">
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">PH-TAL-01 SECURE</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                 {activeTab === 'dashboard' && 'Executive Summary'}
                 {activeTab === 'employees' && 'Personnel Registry'}
                 {activeTab === 'payroll' && 'Financial Ledger'}
                 {activeTab === 'leave' && 'Workforce Mobility'}
                 <span className="text-xs px-3 py-1 bg-slate-900 text-white rounded-full font-black uppercase tracking-widest">{currentUserRole}</span>
              </h2>
           </div>

           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{formatDate(new Date())}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Secure Session</p>
              </div>
              <div className="w-10 h-10 glass-card rounded-2xl flex items-center justify-center text-slate-400 hover:text-talibon-red transition-all cursor-pointer">
                 <Bell size={20} />
              </div>
           </div>
        </div>

        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'dashboard' && <Dashboard employees={employees} auditLogs={auditLogs} userRole={currentUserRole} currentUser={currentUser} />}
              {activeTab === 'employees' && (currentUserRole === 'admin' || currentUserRole === 'dept_head') && (
                <EmployeeList 
                  employees={employees} 
                  loading={employeeLoading}
                  onAdd={handleAddEmployee}
                  onDelete={handleDeleteEmployee}
                  onUpdate={handleUpdateEmployee}
                />
              )}
              {activeTab === 'attendance' && (
                <AttendanceTracker 
                  records={attendanceRecords} 
                  currentUser={currentUser}
                  onLog={handleAttendanceLog}
                />
              )}
              {activeTab === 'payroll' && (
                <PayrollManagement 
                  employees={employees} 
                  currentUser={currentUser}
                  payrollRecords={payrollRecords}
                />
              )}
              {activeTab === 'leave' && (
                <LeaveManagement 
                  employees={employees}
                  currentUser={currentUser}
                  isAdmin={currentUserRole === 'admin' || currentUserRole === 'dept_head'}
                />
              )}
              {activeTab === 'audit' && currentUserRole === 'admin' && (
                <AuditLogs logs={auditLogs} />
              )}
              {activeTab === 'reports' && (currentUserRole === 'admin' || currentUserRole === 'payroll_officer') && (
                <ReportGenerator 
                  employees={employees}
                  attendance={attendanceRecords}
                  leaves={(Array.isArray(leaveResponse?.data) ? leaveResponse.data : []) as LeaveRequest[]}
                  payroll={payrollRecords}
                />
              )}
              {activeTab === 'inquiry' && (
                <SelfServicePortal 
                  employees={employees}
                  attendance={attendanceRecords}
                  payroll={payrollRecords}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-10 pb-20 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex flex-col gap-2 text-center md:text-left">
              <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">Official HR Portal of the Municipality of Talibon</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Privacy Policy • Terms of Service • Accessibility Statement</p>
           </div>
           <div className="flex items-center gap-4 group">
              <div className="text-right">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Secured & Encrypted</p>
                 <p className="text-[10px] font-black text-talibon-red uppercase tracking-[0.1em]">Verified Government Asset</p>
              </div>
              <Shield size={32} className="text-talibon-red group-hover:scale-110 transition-transform" />
           </div>
        </footer>
      </main>
    </div>
  );
}
