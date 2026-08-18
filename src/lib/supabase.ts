import { createClient } from '@supabase/supabase-js';

// Supabase Environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    !supabaseUrl.includes('your-project-id')
  );
};

// Create Supabase Client instance (with fallback placeholder if not configured yet)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export interface TableCheckStatus {
  tableName: string;
  exists: boolean;
  count?: number;
  error?: string;
}

export interface SupabaseTestResult {
  success: boolean;
  configured: boolean;
  url: string;
  hasAnonKey: boolean;
  latencyMs: number;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'TABLES_MISSING' | 'NETWORK_ERROR' | 'AUTH_ERROR';
  message: string;
  tables: TableCheckStatus[];
  timestamp: string;
}

/**
 * Utilitário de diagnóstico e teste de conexão com o Supabase
 * Executa checagens de conectividade, mede latência e inspeciona a disponibilidade das tabelas.
 */
export const testSupabaseConnection = async (): Promise<SupabaseTestResult> => {
  const startTime = performance.now();
  const timestamp = new Date().toLocaleString('pt-AO');

  const configured = isSupabaseConfigured();
  const maskedUrl = supabaseUrl ? `${supabaseUrl.substring(0, 26)}...` : '(não definida)';
  const hasAnonKey = Boolean(supabaseAnonKey && supabaseAnonKey.length > 20);

  if (!configured) {
    const res: SupabaseTestResult = {
      success: false,
      configured: false,
      url: maskedUrl,
      hasAnonKey,
      latencyMs: 0,
      status: 'NOT_CONFIGURED',
      message: 'Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas ou contêm placeholders.',
      tables: [],
      timestamp,
    };
    console.warn('[Supabase Test] Conexão não configurada no ambiente:', res);
    return res;
  }

  const expectedTables = [
    'instituicoes',
    'anos_letivos',
    'cursos',
    'classes',
    'disciplinas',
    'turmas',
    'perfis_utilizadores',
    'estudantes',
    'professores',
    'registo_notas',
    'servicos_financeiros',
    'recibos_pagamentos',
    'despesas_caixa',
    'requerimentos_documentos',
    'logs_auditoria'
  ];

  const tableResults: TableCheckStatus[] = [];
  let reachableTablesCount = 0;
  let generalError: string | null = null;

  try {
    for (const tableName of expectedTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          tableResults.push({
            tableName,
            exists: false,
            error: error.message || error.code || 'Erro de consulta'
          });
        } else {
          reachableTablesCount++;
          tableResults.push({
            tableName,
            exists: true,
            count: count ?? 0
          });
        }
      } catch (err: any) {
        tableResults.push({
          tableName,
          exists: false,
          error: err.message || 'Falha de requisição'
        });
      }
    }
  } catch (err: any) {
    generalError = err.message || 'Erro inesperado de rede';
  }

  const latencyMs = Math.round(performance.now() - startTime);

  let status: SupabaseTestResult['status'] = 'CONNECTED';
  let success = true;
  let message = `Conexão bem-sucedida com PostgreSQL / Supabase (${latencyMs}ms). ${reachableTablesCount}/${expectedTables.length} tabelas acessíveis.`;

  if (generalError) {
    status = 'NETWORK_ERROR';
    success = false;
    message = `Erro ao comunicar com o servidor Supabase: ${generalError}`;
  } else if (reachableTablesCount === 0) {
    status = 'TABLES_MISSING';
    success = false;
    message = 'Conexão estabelecida, mas as tabelas ainda não foram criadas no schema public (execute a migração SQL no Supabase).';
  } else if (reachableTablesCount < expectedTables.length) {
    status = 'TABLES_MISSING';
    success = false;
    message = `Apenas ${reachableTablesCount} de ${expectedTables.length} tabelas foram encontradas no schema public.`;
  }

  const result: SupabaseTestResult = {
    success,
    configured: true,
    url: maskedUrl,
    hasAnonKey,
    latencyMs,
    status,
    message,
    tables: tableResults,
    timestamp,
  };

  // Log formatado no console para desenvolvedores e administradores
  console.group(`[Supabase Connection Test] ${success ? '✅ OK' : '⚠️ ATENÇÃO'} (${latencyMs}ms)`);
  console.info('Status:', status);
  console.info('URL:', maskedUrl);
  console.info('Chave Anon:', hasAnonKey ? 'Válida' : 'Ausente/Inválida');
  console.info('Mensagem:', message);
  console.table(tableResults);
  console.groupEnd();

  return result;
};

// Disponibilizar no objeto global window para testes rápidos pelo console do navegador:
// Exemplo no console do DevTools: await window.__testSupabaseConnection()
if (typeof window !== 'undefined') {
  (window as any).__testSupabaseConnection = testSupabaseConnection;
}

