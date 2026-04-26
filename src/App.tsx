import { useMemo, useState } from 'react';
import { 
  LayoutDashboard, Users, CreditCard, Plus, Trash2, Edit2, Search, Building2, 
  Calendar, Mail, DollarSign, ChevronRight, LogIn, Shield, UserCircle, 
  Briefcase, Bell, LogOut, Copy, Sparkles, PlayCircle, Clock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Employee, Role } from './types';
import { AuthAPI, AuthStorage, EmployeeAPI } from './lib/api';
import { cn, formatDate } from './lib/utils';

// Components
import EmployeeList from './components/EmployeeList';
import PayrollManagement from './components/PayrollManagement';
import Dashboard from './components/Dashboard';
import LeaveManagement from './components/LeaveManagement';
import AttendanceTracker from './components/AttendanceTracker';
import AuditLogs from './components/AuditLogs';
import { AttendanceAPI, AuditAPI } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'payroll' | 'leave' | 'attendance' | 'audit'>('dashboard');
  const [authUser, setAuthUser] = useState<{ userId: string; email: string; role: Role } | null>(null);
  const [authError, setAuthError] = useState('');
  const [credentials, setCredentials] = useState({ email: 'admin@talibon.gov.ph', password: 'admin123' });
  const queryClient = useQueryClient();

  const currentUserRole = authUser?.role ?? 'employee';
  const isAuthenticated = !!authUser;

  // Enterprise Data Orchestration
  const { data: employeeResponse, isLoading: employeeLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => EmployeeAPI.list(),
    enabled: isAuthenticated,
  });

  const { data: attendanceResponse } = useQuery({
    queryKey: ['attendance'],
    queryFn: () => AttendanceAPI.list(),
    enabled: isAuthenticated,
  });

  const { data: auditResponse } = useQuery({
    queryKey: ['audit'],
    queryFn: () => AuditAPI.list(),
    enabled: isAuthenticated && currentUserRole === 'admin',
  });

  const employees = Array.isArray(employeeResponse?.data) ? employeeResponse.data : [];
  const attendanceRecords = Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : [];
  const auditLogs = Array.isArray(auditResponse?.data) ? auditResponse.data : [];

  const addMutation = useMutation({
    mutationFn: (newEmp: any) => EmployeeAPI.create(newEmp),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => EmployeeAPI.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['employees'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => EmployeeAPI.update(id, data),
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

  const loginMutation = useMutation({
    mutationFn: () => AuthAPI.login(credentials.email, credentials.password),
    onSuccess: (res: any) => {
      AuthStorage.setToken(res.data.token);
      setAuthUser(res.data.user);
      setAuthError('');
    },
    onError: (err: Error) => setAuthError(err.message),
  });

  const handleLogout = () => {
    AuthStorage.clear();
    setAuthUser(null);
    queryClient.clear();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            loginMutation.mutate();
          }}
          className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl space-y-5"
        >
          <h1 className="text-2xl font-black tracking-tight text-slate-900">HRIS Secure Login</h1>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Use seeded accounts to continue.</p>
          <input
            className="w-full border rounded-xl px-4 py-3"
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            required
          />
          <input
            className="w-full border rounded-xl px-4 py-3"
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Password"
            required
          />
          {authError ? <p className="text-xs font-bold text-red-600">{authError}</p> : null}
          <button className="w-full rounded-xl bg-slate-900 text-white py-3 font-black uppercase tracking-wider text-xs">
            {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-900 overflow-hidden relative">
      {/* Floating Global Navigation */}
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-2 bg-slate-900/95 backdrop-blur-3xl rounded-full shadow-2xl border border-white/10 shadow-black/40">
        <div className="flex items-center gap-3 pr-4 border-r border-white/10 group cursor-pointer" onClick={() => setActiveTab('dashboard')}>
           <div className="w-8 h-8 bg-talibon-red rounded-lg flex items-center justify-center text-white relative overflow-hidden transition-transform group-hover:scale-110">
              <Building2 size={16} className="relative z-10" />
           </div>
           <div className="hidden sm:block">
              <h1 className="text-[10px] font-black text-white leading-none tracking-tight">TALIBON</h1>
              <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mt-1">HRIS</p>
           </div>
        </div>

        <nav className="flex items-center gap-1">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'employees', label: 'Personnel', icon: Users, restricted: currentUserRole !== 'admin' && currentUserRole !== 'dept_head' },
            { id: 'attendance', label: 'Attendance', icon: Clock },
            { id: 'payroll', label: 'Financial', icon: CreditCard, restricted: currentUserRole !== 'admin' && currentUserRole !== 'payroll_officer' },
            { id: 'leave', label: 'Mobility', icon: Briefcase },
            { id: 'audit', label: 'Audit', icon: Shield, restricted: currentUserRole !== 'admin' },
          ].map((item) => (
            !item.restricted && (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-[9.5px] font-bold uppercase tracking-wider whitespace-nowrap",
                  activeTab === item.id 
                    ? "bg-white text-slate-900 shadow-xl" 
                    : "text-white/50 hover:text-white hover:bg-white/10"
                )}
              >
                <item.icon size={14} className={activeTab === item.id ? "text-talibon-red" : ""} />
                {item.label}
              </button>
            )
          ))}
        </nav>

        <div className="flex items-center gap-1.5 pl-4 border-l border-white/10">
           <button className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-all rounded-full hover:bg-white/10">
              <Copy size={14} />
           </button>
           <button className="w-8 h-8 flex items-center justify-center text-white bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/30 hover:scale-110 transition-all">
              <Sparkles size={14} />
           </button>
           <div className="w-8 h-8 flex items-center justify-center text-white/20">
              <div className="h-4 w-[1px] bg-white/10"></div>
           </div>
           <div
             className="w-8 h-8 bg-talibon-orange rounded-full flex items-center justify-center text-white text-[8px] font-black border-2 border-white/10 uppercase"
           >
              {currentUserRole.slice(0,2)}
           </div>
           <button onClick={handleLogout} className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white">
              <LogOut size={14} />
           </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto custom-scrollbar relative px-10 py-32 dotted-grid">
        {/* Secondary Header / Breadcrumb */}
        <div className="max-w-7xl mx-auto mb-10 flex items-center justify-between">
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
              {activeTab === 'dashboard' && <Dashboard employees={employees} userRole={currentUserRole} />}
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
                  employees={employees}
                  currentUserRole={currentUserRole}
                  onLog={(type) =>
                    AttendanceAPI.log(authUser!.userId, type).then(() => queryClient.invalidateQueries({ queryKey: ['attendance'] }))
                  }
                />
              )}
              {activeTab === 'payroll' && (currentUserRole === 'admin' || currentUserRole === 'payroll_officer') && (
                <PayrollManagement employees={employees} />
              )}
              {activeTab === 'leave' && (
                <LeaveManagement 
                  employees={employees}
                  isAdmin={currentUserRole === 'admin' || currentUserRole === 'dept_head'}
                />
              )}
              {activeTab === 'audit' && currentUserRole === 'admin' && (
                <AuditLogs logs={auditLogs} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="absolute bottom-10 left-10 right-10 flex justify-between items-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] pointer-events-none opacity-50">
           <div>Municipal Office of Talibon • HRIS Division</div>
           <div className="flex items-center gap-2">
              <Shield size={12} className="text-talibon-orange" />
              End-to-End Encryption Enabled
           </div>
        </footer>
      </main>
    </div>
  );
}
