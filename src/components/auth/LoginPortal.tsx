import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  Building2, Shield, Lock, User, 
  ArrowRight, AlertCircle, Sparkles 
} from 'lucide-react';

export const LoginPortal: React.FC = () => {
  const { login, institution, activeAcademicYear } = useSchool();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setError(res.message || 'Erro ao iniciar sessão. Verifique as suas credenciais.');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Angolan Flag accent subtle gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500 rounded-full blur-3xl" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700 p-3 shadow-xl flex items-center justify-center">
            {institution.logoUrl ? (
              <img src={institution.logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-9 h-9 text-amber-400" />
            )}
          </div>
        </div>

        <div className="text-center mt-4">
          <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {institution.name}
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
            REPÚBLICA DE ANGOLA • MINISTÉRIO DA EDUCAÇÃO
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-amber-300 mt-2">
            <Sparkles className="w-3 h-3 text-amber-400" />
            SIGE Angola • Ano Letivo {activeAcademicYear?.code || '2025/2026'}
          </div>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 shadow-2xl rounded-2xl">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 flex items-start gap-2.5 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Utilizador ou E-mail Institucional
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Insira o seu utilizador ou e-mail"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Palavra-passe / PIN de Acesso
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Insira a sua palavra-passe"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl shadow-md text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-400 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>A validar credenciais...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          SIGE Angola • Sistema Seguro de Gestão Escolar com Registo de Auditoria
        </p>
      </div>
    </div>
  );
};
