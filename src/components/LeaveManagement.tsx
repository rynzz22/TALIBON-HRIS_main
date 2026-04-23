import React, { useState, useEffect } from 'react';
import { LeaveRequest, Employee } from '../types';
import { Plus, X, Check, Loader2, Calendar, FileText, User, Bell, ShieldCheck, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SupabaseService } from '../lib/supabaseService';
import { cn } from '../lib/utils';

interface LeaveManagementProps {
  employees: Employee[];
  isAdmin: boolean;
  currentUser: Employee;
}

export default function LeaveManagement({ employees, isAdmin, currentUser }: LeaveManagementProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRequest, setNewRequest] = useState<Omit<LeaveRequest, 'id' | 'status' | 'requestedAt'>>({
    employeeId: currentUser.id,
    type: 'Vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data } = await SupabaseService.leaves.list();
      const allRequests = (data || []) as LeaveRequest[];
      
      // Filter for non-admins to see only their own requests
      if (!isAdmin) {
        setRequests(allRequests.filter((r: LeaveRequest) => r.employeeId === currentUser.id));
      } else {
        setRequests(allRequests);
      }
    } catch (error) {
      console.error('Failed to fetch leave requests', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await SupabaseService.leaves.create({
        ...newRequest,
        employeeId: isAdmin ? (newRequest.employeeId || currentUser.id) : currentUser.id
      });
      
      await SupabaseService.audit.log({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        action: 'LEAVE_REQUEST_FILED',
        target: `Type: ${newRequest.type}`
      });

      setIsAdding(false);
      setNewRequest({
        employeeId: currentUser.id,
        type: 'Vacation',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchRequests();
    } catch (error) {
      console.error('Failed to submit leave request', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await SupabaseService.leaves.updateStatus(id, status);
      await SupabaseService.audit.log({
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.lastName}`,
        action: `LEAVE_${status.toUpperCase()}`,
        target: `Request ID: ${id.slice(-6)}`
      });
      fetchRequests();
    } catch (error) {
      console.error(`Failed to ${status} leave record`, error);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      <header className="flex justify-between items-end border-b border-slate-100 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Leave Management</h2>
           <p className="font-serif italic text-slate-400 text-sm mt-2">Personnel Mobility & Absence Records</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-slate-900 text-white px-8 py-3 rounded-xl flex items-center gap-2 hover:bg-talibon-red transition-all font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95"
        >
          <Plus size={16} />
          File New Request
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden">
               <form onSubmit={handleSubmit} className="flex flex-col">
                  <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-talibon-red shadow-sm">
                           <Briefcase size={20} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight">Leave Application Form</h3>
                     </div>
                     <button type="button" onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                     </button>
                  </div>
                  
                  <div className="p-10 space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {isAdmin && (
                           <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Personnel Record</label>
                             <select 
                               required
                               className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:border-slate-300 transition-all font-bold text-slate-700"
                               value={newRequest.employeeId}
                               onChange={e => setNewRequest({...newRequest, employeeId: e.target.value})}
                             >
                               <option value="">Select Personnel...</option>
                               {employees.map(emp => (
                                 <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                               ))}
                             </select>
                           </div>
                        )}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Leave Category</label>
                          <select 
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:border-slate-300 transition-all font-bold text-slate-700"
                            value={newRequest.type}
                            onChange={e => setNewRequest({...newRequest, type: e.target.value as any})}
                          >
                            <option value="Vacation">Vacation Leave</option>
                            <option value="Sick">Sick Leave</option>
                            <option value="Emergency">Emergency Leave</option>
                            <option value="Maternity">Maternity Leave</option>
                            <option value="Paternity">Paternity Leave</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Effective Date</label>
                           <input 
                             type="date" 
                             required 
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:border-slate-300 transition-all font-bold text-xs" 
                             value={newRequest.startDate}
                             onChange={e => setNewRequest({...newRequest, startDate: e.target.value})}
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Conclusion Date</label>
                           <input 
                             type="date" 
                             required 
                             className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:border-slate-300 transition-all font-bold text-xs" 
                             value={newRequest.endDate}
                             onChange={e => setNewRequest({...newRequest, endDate: e.target.value})}
                           />
                        </div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Justification Brief</label>
                       <textarea 
                         required 
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:outline-none focus:border-slate-300 transition-all font-bold min-h-[120px] text-slate-700" 
                         value={newRequest.reason}
                         onChange={e => setNewRequest({...newRequest, reason: e.target.value})}
                         placeholder="Explain the necessity for this absence..."
                       />
                     </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                     <button 
                        type="button" 
                        onClick={() => setIsAdding(false)}
                        className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-slate-600 hover:border-slate-300 transition-all"
                     >
                        Discard
                     </button>
                     <button 
                        type="submit" 
                        disabled={submitting}
                        className="px-10 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:bg-talibon-red disabled:bg-slate-200 shadow-xl transition-all flex items-center gap-2"
                     >
                        {submitting ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                        Transmit Request
                     </button>
                  </div>
               </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="animate-spin text-slate-300" size={32} />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accessing Encrypted Records...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 p-20 rounded-xl text-center">
             <div className="flex flex-col items-center justify-center space-y-4">
                <FileText size={48} className="text-slate-100" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-300">No identity matching records found</p>
             </div>
          </div>
        ) : (
          requests.map(req => {
            const emp = employees.find(e => e.id === req.employeeId);
            return (
              <motion.div 
                layout
                key={req.id} 
                className="bg-white border border-slate-200 p-8 rounded-xl hover:shadow-xl transition-all group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                      {emp?.firstName[0]}{emp?.lastName[0]}
                    </div>
                    <div>
                       <p className="font-bold text-slate-900 tracking-tight leading-none text-sm">{emp?.firstName} {emp?.lastName}</p>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{emp?.position}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest border",
                    req.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                    req.status === 'rejected' ? "bg-red-50 text-red-600 border-red-100" : 
                    "bg-orange-50 text-orange-600 border-orange-100"
                  )}>
                    {req.status}
                  </span>
                </div>

                <div className="flex-1 space-y-4">
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Effective Range</p>
                      <p className="text-xs font-bold text-slate-700 tracking-tight">{req.startDate} — {req.endDate}</p>
                   </div>
                   
                   <div className="px-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Justification</p>
                      <p className="text-xs font-medium text-slate-600 leading-relaxed italic line-clamp-3">"{req.reason}"</p>
                   </div>
                </div>

                {req.status === 'pending' && isAdmin && (
                  <div className="flex gap-2 mt-8 pt-6 border-t border-slate-100">
                     <button 
                      onClick={() => handleAction(req.id, 'approved')}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold uppercase tracking-widest text-[9px] hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                     >
                       Accept
                     </button>
                     <button 
                      onClick={() => handleAction(req.id, 'rejected')}
                      className="flex-1 py-2 bg-white text-slate-400 border border-slate-200 rounded-lg font-bold uppercase tracking-widest text-[9px] hover:bg-talibon-red hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                       Reject
                     </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
