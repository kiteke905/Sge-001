import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('=== TESTE DE CONEXÃO SUPABASE ===');
console.log('URL configurada:', url ? `${url.substring(0, 25)}...` : 'NÃO CONFIGURADA');
console.log('Chave configurada:', key ? 'SIM (presente)' : 'NÃO CONFIGURADA');

if (!url || !key) {
  console.log('\n[STATUS] Supabase NÃO conectado no ambiente de desenvolvimento local.');
  console.log('Motivo: Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram preenchidas no painel de Secrets/Ambiente.');
  process.exit(0);
}

const supabase = createClient(url, key);

async function checkTables() {
  const tables = [
    'instituicoes',
    'anos_letivos',
    'cursos',
    'classes',
    'disciplinas',
    'turmas',
    'perfis_utilizadores',
    'estudantes',
    'professores',
    'atribuicoes_curriculares',
    'horarios_aulas',
    'registo_notas',
    'servicos_financeiros',
    'recibos_pagamentos',
    'despesas_caixa',
    'requerimentos_documentos',
    'logs_auditoria'
  ];

  console.log('\nVerificando tabelas no schema public...');
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ Tabela [${table}]: NÃO ENCONTRADA / ERRO (${error.message})`);
    } else {
      console.log(`✅ Tabela [${table}]: EXISTE (Acessível)`);
    }
  }
}

checkTables();
