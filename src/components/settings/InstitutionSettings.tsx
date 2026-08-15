import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { InstitutionInfo } from '../../types';
import { 
  Building2, Save, ShieldCheck, CheckCircle2, 
  MapPin, Phone, Mail, Award, AlertTriangle, 
  Upload, Camera, Image, FileText, Sparkles, RefreshCw 
} from 'lucide-react';

export const InstitutionSettings: React.FC = () => {
  const { institution, updateInstitution, currentUser } = useSchool();
  const isAdmin = currentUser.role === 'ADMIN';

  const [formData, setFormData] = useState<InstitutionInfo>({ ...institution });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // If user is not admin, they should not even see this module
  if (!isAdmin) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Módulo Exclusivo ao Administrador</h3>
        <p className="text-xs text-slate-500 mt-1">
          Apenas o Administrador do Sistema tem permissão para configurar o timbre oficial, cabeçalhos de documentos e logotipo da instituição.
        </p>
      </div>
    );
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateInstitution(formData);
    setSuccessMsg('Dados institucionais, logotipo e timbre oficial atualizados com sucesso!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">
                Cabeçalho Institucional & Logótipo Oficial
              </h2>
              <span className="bg-rose-50 text-rose-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                Módulo Exclusivo: Administrador
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize o timbre, insígnia/logo, dados fiscais e assinaturas aplicados em recibos, pautas e declarações
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-colors"
        >
          <Save className="w-4 h-4" />
          Guardar Configurações
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid: Form Left / Live Timbre Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          {/* Logo Upload Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Image className="w-4 h-4 text-amber-500" />
              1. Logótipo / Insígnia da Escola
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-slate-200 p-2 flex items-center justify-center shadow-xs overflow-hidden">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-400" />
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1.5">
                <p className="text-xs font-bold text-slate-800">Carregar Logótipo Oficial da Instituição</p>
                <p className="text-[11px] text-slate-500">
                  O logótipo será automaticamente impresso em todos os Recibos POS, Pautas Gerais, Boletins e Declarações.
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-1">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    Carregar Ficheiro
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ministerial Headers Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              2. Cabeçalho Ministerial Oficial (Timbre Angolano)
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cabeçalho da República
                </label>
                <input
                  type="text"
                  value={formData.republicHeader || ''}
                  onChange={(e) => setFormData({ ...formData, republicHeader: e.target.value })}
                  placeholder="REPÚBLICA DE ANGOLA"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ministério da Tutela
                </label>
                <input
                  type="text"
                  value={formData.ministryHeader || ''}
                  onChange={(e) => setFormData({ ...formData, ministryHeader: e.target.value })}
                  placeholder="MINISTÉRIO DA EDUCAÇÃO"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Governo Provincial / Gabinete de Educação
                </label>
                <input
                  type="text"
                  value={formData.provincialHeader || ''}
                  onChange={(e) => setFormData({ ...formData, provincialHeader: e.target.value })}
                  placeholder="GOVERNO PROVINCIAL DE LUANDA - GABINETE PROVINCIAL DE EDUCAÇÃO"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* School Name & Legal Data */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-500" />
              3. Dados da Escola & Enquadramento Legal
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Oficial da Instituição
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Complexo Escolar Girassol do Saber"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtítulo / Ciclos de Ensino
                </label>
                <input
                  type="text"
                  value={formData.subTitle || ''}
                  onChange={(e) => setFormData({ ...formData, subTitle: e.target.value })}
                  placeholder="Ex: Ensino Primário, Iº e IIº Ciclos do Ensino Secundário Geral e Técnico"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nº de Identificação Fiscal (NIF)
                </label>
                <input
                  type="text"
                  value={formData.nif}
                  onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  placeholder="5417098231"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Decreto de Criação / Despacho MED
                </label>
                <input
                  type="text"
                  value={formData.decreeNumber}
                  onChange={(e) => setFormData({ ...formData, decreeNumber: e.target.value })}
                  placeholder="Dec. Executivo Nº 142/2018 - MED"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Endereço Físico Completo
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Rua Direita do Patriota, Luanda Sul, Luanda - Angola"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cidade / Município
                </label>
                <input
                  type="text"
                  value={formData.city || 'Luanda'}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Província
                </label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contactos Telefónicos Oficiais
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Institucional
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Signatories Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              4. Assinaturas & Responsáveis Institucionais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Director(a) Geral
                </label>
                <input
                  type="text"
                  value={formData.directorGeneral || formData.directorName || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    directorGeneral: e.target.value, 
                    directorName: e.target.value 
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Director(a) Pedagógico(a)
                </label>
                <input
                  type="text"
                  value={formData.directorPedagogico || formData.pedagogicalDirectorName || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    directorPedagogico: e.target.value, 
                    pedagogicalDirectorName: e.target.value 
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chefe de Secretaria Geral
                </label>
                <input
                  type="text"
                  value={formData.chiefSecretaria || formData.secretariatHeadName || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    chiefSecretaria: e.target.value, 
                    secretariatHeadName: e.target.value 
                  })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 5 cols - Live Document Timbre Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Pré-visualização do Timbre Oficial
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                  Documento A4
                </span>
              </div>

              {/* Simulated Official Paper Header */}
              <div className="p-6 bg-white border-2 border-slate-200 rounded-xl shadow-xs text-center space-y-2 font-serif text-slate-900 select-none">
                {/* Logo / Insignia */}
                <div className="flex justify-center mb-2">
                  {formData.logoUrl ? (
                    <img src={formData.logoUrl} alt="Logo" className="w-14 h-14 object-contain" />
                  ) : (
                    <div className="w-12 h-12 rounded-full border border-slate-400 flex items-center justify-center text-[10px] font-bold">
                      LOGO
                    </div>
                  )}
                </div>

                <div className="text-[11px] font-bold tracking-widest uppercase">
                  {formData.republicHeader || 'REPÚBLICA DE ANGOLA'}
                </div>
                <div className="text-[10px] uppercase font-semibold text-slate-700">
                  {formData.ministryHeader || 'MINISTÉRIO DA EDUCAÇÃO'}
                </div>
                <div className="text-[9px] uppercase text-slate-600">
                  {formData.provincialHeader || 'GOVERNO PROVINCIAL DE LUANDA'}
                </div>

                <div className="pt-2 border-t border-slate-300 mt-2">
                  <div className="text-xs font-bold uppercase tracking-tight text-slate-950">
                    {formData.name}
                  </div>
                  <div className="text-[9px] text-slate-600 italic">
                    {formData.subTitle}
                  </div>
                  <div className="text-[8px] text-slate-500 mt-1">
                    {formData.decreeNumber} • NIF: {formData.nif}
                  </div>
                  <div className="text-[8px] text-slate-500">
                    {formData.address} • Tel: {formData.phone}
                  </div>
                </div>

                {/* Example Body Mock */}
                <div className="pt-4 border-t border-dashed border-slate-200 text-left font-sans text-[10px] text-slate-600 space-y-1.5">
                  <div className="text-center font-bold text-slate-900 text-xs py-1">
                    DECLARAÇÃO DE MATRÍCULA / RECIBO DE PAGAMENTO
                  </div>
                  <p className="leading-relaxed">
                    Certifica-se para os devidos efeitos legais que os documentos emitidos com esta configuração contêm a validação institucional oficial do SIGE Angola.
                  </p>
                  <div className="flex justify-between pt-6 text-[8px] text-center border-t border-slate-200 mt-4 font-sans">
                    <div>
                      <div className="border-t border-slate-400 w-24 pt-1 mx-auto">A Secretaria</div>
                      <div className="font-bold">{formData.chiefSecretaria || 'Secretária'}</div>
                    </div>
                    <div>
                      <div className="border-t border-slate-400 w-24 pt-1 mx-auto">A Direcção</div>
                      <div className="font-bold">{formData.directorGeneral || 'Director Geral'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                Este timbre é automaticamente renderizado em todos os PDFs gerados pelo sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
