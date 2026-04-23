import React, { useState } from 'react';
import { Shield, Fingerprint, ArrowRight, Loader2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { SupabaseService } from '../lib/supabaseService';
import { Employee } from '../types';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (user: Employee) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [identityId, setIdentityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identityId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const { data } = await SupabaseService.employees.getById(identityId.trim());
      if (data) {
        onLogin(data);
        // Track login in audit logs
        await SupabaseService.audit.log({
            userId: data.id,
            userName: `${data.firstName} ${data.lastName}`,
            action: 'LOGIN_SUCCESS',
            target: 'Authentication Terminal'
        });
      } else {
        setError('The provided identifier does not match any municipal records.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'System verification failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] flex items-center justify-center p-6 bg-dotted-grid bg-[length:30px_30px]">
      <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/80 to-white/0 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden">
          {/* Header */}
          <div className="p-10 text-center border-b border-slate-100 bg-slate-50/50">
            <div className="w-16 h-16 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Shield className="text-talibon-red" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2 uppercase">Personnel Identity</h1>
            <p className="font-serif italic text-slate-400 text-sm">Human Resource Intelligence System Verification</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Municipal Personnel ID</label>
                <div className={cn(
                    "relative transition-all",
                    error ? "text-rose-500" : "text-slate-400"
                )}>
                    <User className="absolute left-4 top-1/2 -translate-y-1/2" size={18} />
                    <input 
                        type="text" 
                        value={identityId}
                        onChange={(e) => setIdentityId(e.target.value)}
                        placeholder="ID Number or Official Email"
                        className={cn(
                            "w-full bg-slate-50 border py-4 pl-12 pr-4 rounded-xl focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all font-medium text-slate-900",
                            error ? "border-rose-200 placeholder:text-rose-200" : "border-slate-100 focus:border-slate-300 placeholder:text-slate-300"
                        )}
                        disabled={loading}
                    />
                </div>
                {error && (
                    <motion.p 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-2 pl-1"
                    >
                        {error}
                    </motion.p>
                )}
            </div>

            <button 
                type="submit"
                disabled={loading || !identityId.trim()}
                className="w-full bg-slate-900 hover:bg-talibon-red disabled:bg-slate-200 text-white py-4 rounded-xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-talibon-red/20 group"
            >
                {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                ) : (
                    <>
                        Access Terminal <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
          </form>

          {/* Footer */}
          <div className="p-6 bg-slate-50/50 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                <Fingerprint size={12} className="text-slate-300" /> Secure Encryption Verified
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                Municipality of Talibon &copy; 2026 Official HR System
            </p>
        </div>
      </motion.div>
    </div>
  );
}
