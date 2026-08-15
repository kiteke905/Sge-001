import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { 
  User as UserIcon, Lock, Mail, Phone, Shield, 
  FileText, CheckCircle2, AlertCircle, Camera, 
  Upload, X, Eye, EyeOff, Save, KeyRound, Award, Building2 
} from 'lucide-react';
import { ROLE_LABELS } from '../../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useSchool();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [biNumber, setBiNumber] = useState(currentUser?.biNumber || '');
  const [password, setPassword] = useState(currentUser?.password || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [showPassword, setShowPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('O nome completo é obrigatório.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('A palavra-passe deve conter pelo menos 6 caracteres.');
      return;
    }

    updateUserProfile(currentUser.id, {
      name,
      email,
      phone,
      biNumber,
      password,
      avatar,
    });

    setSuccessMsg('Os seus dados e credenciais de acesso foram atualizados com sucesso!');
    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              <UserIcon className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base">Meu Perfil & Segurança da Conta</h3>
              <p className="text-xs text-slate-400">
                Edite os seus dados pessoais e credenciais de acesso ({ROLE_LABELS[currentUser.role]})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-800 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Photo & Role Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="relative group">
              <img
                src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md"
              />
              <label className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-950 transition-colors cursor-pointer shadow-sm">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>

            <div className="text-center sm:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h4 className="font-bold text-slate-900 text-base">{currentUser.name}</h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {ROLE_LABELS[currentUser.role]}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Nome de Utilizador: <strong className="text-slate-800 font-mono">@{currentUser.username}</strong> • ID: <span className="font-mono">{currentUser.id}</span>
              </p>
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-3 justify-center sm:justify-start">
                <span>Grau: <strong>{currentUser.academicDegree || 'Licenciatura'}</strong></span>
                <span>Estado: <strong className="text-emerald-600">ATIVO</strong></span>
              </div>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº do Bilhete de Identidade (BI)
              </label>
              <input
                type="text"
                value={biNumber}
                onChange={(e) => setBiNumber(e.target.value)}
                placeholder="Ex: 003456789LA042"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail Institucional
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Telefone de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244 923..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Palavra-passe / PIN de Acesso</span>
                <span className="text-[11px] text-slate-500 font-normal">Apenas você pode alterar a sua palavra-passe</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 rounded-xl border border-slate-300 text-sm text-slate-800 font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Attached Documents Consultation */}
          <div>
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Documentos Anexados no Registo
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-700 truncate">Cópia do BI</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">Anexado</span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-700 truncate">Certificado Habilitações</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">Anexado</span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <span className="font-medium text-slate-700 truncate">Diploma / Formação</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">Anexado</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
