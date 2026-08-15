import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ShieldCheck, Search, Filter, Clock, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { formatDateTimeAO } from '../../utils/formatters';

export const AuditLogViewer: React.FC = () => {
  const { auditLogs, currentUser } = useSchool();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');

  const filteredLogs = auditLogs.filter(log => {
    const matchSearch = 
      !searchQuery ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase());

    const matchModule = selectedModule === 'ALL' || log.module === selectedModule;
    return matchSearch && matchModule;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Trilha de Auditoria & Segurança do Sistema (Logs)
            </h2>
            <span className="bg-slate-900 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {auditLogs.length} Registos Imutáveis
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registo em tempo real de todas as operações secretarias, pedagógicas e financeiras com carimbo de tempo e IP
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Imprimir Livro de Auditoria
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar log por utilizador, ação ou detalhes da operação..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-hidden bg-slate-50"
          />
        </div>

        <div>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white font-medium"
          >
            <option value="ALL">Todos os Módulos</option>
            <option value="SECRETARIA">Secretaria Geral</option>
            <option value="PEDAGOGICO">Módulo Pedagógico</option>
            <option value="FINANCEIRO">Financeiro & Caixa</option>
            <option value="SISTEMA">Configuração & Sistema</option>
            <option value="AUTENTICACAO">Autenticação & RBAC</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Data / Hora</th>
                <th className="p-3">Utilizador & Perfil</th>
                <th className="p-3">Módulo</th>
                <th className="p-3">Ação</th>
                <th className="p-3">Descrição da Operação</th>
                <th className="p-3 text-right">Endereço IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-500 whitespace-nowrap">
                    {formatDateTimeAO(log.timestamp)}
                  </td>

                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{log.userName}</div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {log.userRole}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {log.module}
                    </span>
                  </td>

                  <td className="p-3 font-mono font-bold text-slate-800">
                    {log.action}
                  </td>

                  <td className="p-3 text-slate-700">
                    {log.description}
                  </td>

                  <td className="p-3 text-right font-mono text-slate-400">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
