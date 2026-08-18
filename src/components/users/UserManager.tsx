import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  User, UserRole, ROLE_QUOTAS, ROLE_LABELS, UserDocumentAttachment 
} from '../../types';
import { 
  Users, UserPlus, Shield, Lock, Eye, EyeOff, 
  Trash2, AlertCircle, CheckCircle2, FileText, 
  Upload, Camera, Search, Filter, KeyRound, 
  UserCheck, GraduationCap, DollarSign, X, Building2, 
  Sparkles, Check, AlertTriangle
} from 'lucide-react';
import { formatNameInput } from '../../utils/formatters';

export const UserManager: React.FC = () => {
  const { 
    users, 
    currentUser, 
    addUser, 
    updateUser, 
    deleteUser, 
    getRoleUserCount, 
    isRoleQuotaReached 
  } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});

  // Registration Form State
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: 'chave123',
    role: 'PROFESSOR' as UserRole,
    biNumber: '',
    academicDegree: 'LICENCIATURA' as any,
    passPhoto: '',
    biDocName: '',
    certDocName: '',
    diplomaDocName: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const isAdmin = currentUser.role === 'ADMIN';
  const isGestor = currentUser.role === 'GESTOR';

  // Rule 1: The ADMIN user is completely hidden from the list when viewed by non-admin users (e.g. Gestor)
  const visibleUsers = users.filter((u) => {
    if (!isAdmin && u.role === 'ADMIN') {
      return false; // Hide admin from everyone else
    }
    const term = (searchTerm || '').toLowerCase().trim();
    const matchSearch = 
      !term ||
      (u.name || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.biNumber || '').toLowerCase().includes(term);
    
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const togglePasswordVisibility = (userId: string) => {
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, passPhoto: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocMockUpload = (field: 'biDocName' | 'certDocName' | 'diplomaDocName', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [field]: file.name }));
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    // Validation
    if (!formData.name.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setFormError('Preencha todos os campos obrigatórios (Nome, Utilizador, E-mail e Palavra-passe).');
      return;
    }

    if (!formData.passPhoto) {
      setFormError('É obrigatório anexar a Foto Tipo Passe do utilizador.');
      return;
    }

    if (!formData.biDocName) {
      setFormError('É obrigatório anexar a cópia do Bilhete de Identidade (BI).');
      return;
    }

    if (!formData.certDocName) {
      setFormError('É obrigatório anexar o Certificado de Habilitações.');
      return;
    }

    const now = new Date().toISOString().split('T')[0];

    const result = addUser({
      name: formData.name,
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: formData.phone,
      password: formData.password,
      role: formData.role,
      biNumber: formData.biNumber,
      academicDegree: formData.academicDegree,
      avatar: formData.passPhoto,
      status: 'ATIVO',
      documents: {
        passPhoto: formData.passPhoto,
        biDocument: { name: formData.biDocName, url: '#', uploadDate: now, size: '1.2 MB' },
        certificateDoc: { name: formData.certDocName, url: '#', uploadDate: now, size: '2.0 MB' },
        diplomaDoc: formData.diplomaDocName ? { name: formData.diplomaDocName, url: '#', uploadDate: now, size: '2.5 MB' } : undefined,
      },
    });

    if (!result.success) {
      setFormError(result.message || 'Erro ao registar utilizador.');
      return;
    }

    setFormSuccess(`Utilizador ${formData.name} (${ROLE_LABELS[formData.role]}) registado com sucesso no sistema!`);
    setTimeout(() => {
      setIsRegisterOpen(false);
      setFormSuccess(null);
      setFormData({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: 'chave123',
        role: 'PROFESSOR',
        biNumber: '',
        academicDegree: 'LICENCIATURA',
        passPhoto: '',
        biDocName: '',
        certDocName: '',
        diplomaDocName: '',
      });
    }, 1500);
  };

  const rolesList: UserRole[] = ['ADMIN', 'GESTOR', 'DIRECAO_PEDAGOGICA', 'FINANCAS', 'SECRETARIA', 'PROFESSOR'];

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Gestão de Utilizadores & Credenciais</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Acesso Exclusivo: Gestor & Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Controlo de perfis, auditoria de credenciais de login e cumprimento de quotas por cargo
            </p>
          </div>
        </div>

        {(isAdmin || isGestor) && (
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold shadow-md transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registar Novo Utilizador</span>
          </button>
        )}
      </div>

      {/* Role Quotas Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {rolesList.map((role) => {
          const count = getRoleUserCount(role);
          const max = ROLE_QUOTAS[role];
          const isFull = count >= max;

          return (
            <div
              key={role}
              className={`p-3.5 rounded-xl border transition-all ${
                isFull 
                  ? 'bg-slate-900 text-white border-slate-800 shadow-xs' 
                  : 'bg-white text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  {role === 'DIRECAO_PEDAGOGICA' ? 'Dir. Pedagógica' : role}
                </span>
                {isFull ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500 text-white">
                    Limite
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    Disponível
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black">
                  {count} <span className="text-xs font-normal opacity-70">/ {max}</span>
                </span>
              </div>
              <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isFull ? 'bg-amber-400' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, (count / max) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Privacy Notice Banner (Exclusive to Administrator) */}
      {isAdmin && (
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-start gap-3">
          <Shield className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              <strong>Regras de Segurança & Visibilidade RBAC (Apenas Administrador):</strong>
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
              <li>O utilizador <strong>Administrador</strong> está oculto para todos os outros utilizadores.</li>
              <li>A visualização das palavras-passe e credenciais de acesso é <strong>exclusiva ao Administrador</strong>.</li>
              <li>Cada utilizador pode editar os seus próprios dados de conta acedendo ao botão <strong>Meu Perfil</strong> no topo.</li>
              <li>Limites estritos de utilizadores: Admin (1), Gestor (1), Pedagógico (1), Finanças (1), Secretaria (2), Professores (50).</li>
            </ul>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, utilizador, email ou BI..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            <option value="ALL">Todos os Cargos</option>
            {rolesList.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Foto & Utilizador</th>
                <th className="py-3 px-4">Cargo / Perfil</th>
                <th className="py-3 px-4">Nome de Acesso</th>
                <th className="py-3 px-4">
                  {isAdmin ? 'Palavra-passe (Exclusivo Admin)' : 'Segurança'}
                </th>
                <th className="py-3 px-4">BI / Grau</th>
                <th className="py-3 px-4">Documentos</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum utilizador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                visibleUsers.map((u) => {
                  const isPasswordRevealed = revealedPasswords[u.id];

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Photo & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">{u.name}</span>
                            <span className="text-[11px] text-slate-500">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          u.role === 'ADMIN' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          u.role === 'GESTOR' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          u.role === 'DIRECAO_PEDAGOGICA' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          u.role === 'FINANCAS' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                          u.role === 'SECRETARIA' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {ROLE_LABELS[u.role]}
                        </span>
                      </td>

                      {/* Username */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        @{u.username || u.email.split('@')[0]}
                      </td>

                      {/* Password Field (Admin Exclusive view, otherwise masked) */}
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {isPasswordRevealed ? u.password : '••••••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id)}
                              title={isPasswordRevealed ? 'Ocultar' : 'Visualizar credencial'}
                              className="text-slate-400 hover:text-slate-700 p-1"
                            >
                              {isPasswordRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">•••••••• (Protegido)</span>
                        )}
                      </td>

                      {/* BI / Degree */}
                      <td className="py-3 px-4 text-[11px] text-slate-600">
                        <div>BI: <strong className="text-slate-800">{u.biNumber || 'N/D'}</strong></div>
                        <div className="text-[10px] text-slate-400">{u.academicDegree || 'Licenciatura'}</div>
                      </td>

                      {/* Attached Documents Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span title="Foto tipo passe anexada" className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span title="Cópia do BI anexada" className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span title="Certificado anexado" className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[10px] text-slate-500 ml-1">3 docs</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          ATIVO
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        {u.id !== currentUser.id && u.role !== 'ADMIN' && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar utilizador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New User Registration Modal (Gestor & Admin only) */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                  <UserPlus className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Registo Oficial de Novo Utilizador</h3>
                  <p className="text-xs text-slate-400">
                    Formulário exclusivo para Gestor & Administrador com anexos obrigatórios
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Role Selection with real-time Quota checking */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                  1. Perfil / Cargo no Sistema (Verificação de Quotas)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {rolesList.map((r) => {
                    const count = getRoleUserCount(r);
                    const max = ROLE_QUOTAS[r];
                    const isFull = count >= max;
                    const isSelected = formData.role === r;

                    return (
                      <button
                        type="button"
                        key={r}
                        disabled={isFull && !isSelected}
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 text-amber-950'
                            : isFull
                            ? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{ROLE_LABELS[r]}</span>
                          {isFull && <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-bold">Cheio</span>}
                        </div>
                        <p className="text-[11px] mt-1 opacity-80">
                          Ocupação: <strong>{count}</strong> / {max}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal & Login Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: formatNameInput(e.target.value) })}
                    placeholder="Ex: João Baptista da Silva"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nº do Bilhete de Identidade (BI) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.biNumber}
                    onChange={(e) => setFormData({ ...formData, biNumber: e.target.value })}
                    placeholder="Ex: 004567890LA051"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome de Utilizador para Login (@) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Ex: joao.silva"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Palavra-passe Inicial de Acesso (Padrão: chave123) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="chave123"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Ex: joao.silva@sige.edu.ao"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone de Contacto
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+244 923 000 000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grau Académico / Habilitações
                  </label>
                  <select
                    value={formData.academicDegree}
                    onChange={(e) => setFormData({ ...formData, academicDegree: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="LICENCIATURA">Licenciatura</option>
                    <option value="MESTRADO">Mestrado</option>
                    <option value="DOUTORAMENTO">Doutoramento</option>
                    <option value="BACHAREL">Bacharelato</option>
                    <option value="ENSINO_MEDIO">Ensino Médio Técnico / Pedagógico</option>
                  </select>
                </div>
              </div>

              {/* Mandatory Document Attachments Section */}
              <div className="border-t border-slate-200 pt-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-amber-500" />
                  2. Upload Obrigatório de Documentos & Foto Tipo Passe
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto Tipo Passe */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300 shrink-0">
                      {formData.passPhoto ? (
                        <img src={formData.passPhoto} alt="Passe" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-800 block">Foto Tipo Passe *</span>
                      <p className="text-[10px] text-slate-500 mb-1">Formato JPG, PNG ou WEBP</p>
                      <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-amber-400 text-[11px] font-semibold hover:bg-slate-800 cursor-pointer transition-colors">
                        <Upload className="w-3 h-3" />
                        Carregar Foto
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Cópia do BI */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-800 block">Cópia do Bilhete de Identidade (BI) *</span>
                    <p className="text-[10px] text-slate-500 mb-2 truncate">
                      {formData.biDocName ? `✓ ${formData.biDocName}` : 'PDF ou imagem digitalizada'}
                    </p>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-semibold hover:bg-slate-700 cursor-pointer transition-colors">
                      <FileText className="w-3 h-3" />
                      Selecionar BI
                      <input type="file" onChange={(e) => handleDocMockUpload('biDocName', e)} className="hidden" />
                    </label>
                  </div>

                  {/* Certificado de Habilitações */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-800 block">Certificado de Habilitações *</span>
                    <p className="text-[10px] text-slate-500 mb-2 truncate">
                      {formData.certDocName ? `✓ ${formData.certDocName}` : 'Documento autenticado'}
                    </p>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-semibold hover:bg-slate-700 cursor-pointer transition-colors">
                      <FileText className="w-3 h-3" />
                      Selecionar Certificado
                      <input type="file" onChange={(e) => handleDocMockUpload('certDocName', e)} className="hidden" />
                    </label>
                  </div>

                  {/* Diplomas / Certificações */}
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-xs font-bold text-slate-800 block">Diplomas e Certificações Adicionais</span>
                    <p className="text-[10px] text-slate-500 mb-2 truncate">
                      {formData.diplomaDocName ? `✓ ${formData.diplomaDocName}` : 'Opcional (Diploma universitário)'}
                    </p>
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-200 text-slate-800 text-[11px] font-semibold hover:bg-slate-300 cursor-pointer transition-colors">
                      <FileText className="w-3 h-3" />
                      Selecionar Diploma
                      <input type="file" onChange={(e) => handleDocMockUpload('diplomaDocName', e)} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold shadow-md transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Concluir Registo de Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">
                  Remover Utilizador
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Esta ação revoga o acesso ao SIGE Angola
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tem a certeza de que deseja remover a conta do utilizador <strong>{userToDelete.name}</strong> ({userToDelete.email || userToDelete.username})?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Remover Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
