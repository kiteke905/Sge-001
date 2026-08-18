import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function runValidationSuite() {
  console.log('========================================================');
  console.log('SIGE ANGOLA — VALIDAÇÃO DE CRUD E PERSISTÊNCIA REAL NO SUPABASE');
  console.log('========================================================\n');

  try {
    // 1. SELECT inicial
    console.log('--- TESTE 1: LEITURA DE ESTRUTURA BASE (SELECT) ---');
    const { data: anos, error: errAno } = await supabase.from('anos_letivos').select('*').limit(1);
    const { data: cursos, error: errCurso } = await supabase.from('cursos').select('*').limit(1);
    const { data: classes, error: errClass } = await supabase.from('classes').select('*').limit(1);
    const { data: turmas, error: errTurma } = await supabase.from('turmas').select('*').limit(1);

    if (errAno || errCurso || errClass || errTurma) {
      throw new Error(`Falha ao ler dados mestres: ${JSON.stringify({ errAno, errCurso, errClass, errTurma })}`);
    }
    console.log(`✅ Dados mestres lidos com sucesso. Ano Letivo: ${anos[0]?.id || 'Nenhum'}, Turma: ${turmas[0]?.id || 'Nenhuma'}`);

    const anoId = anos[0]?.id || 'AY-2025-2026';
    const cursoId = cursos[0]?.id || 'CRS-PRI';
    const classeId = classes[0]?.id || 'CLS-01';
    const turmaId = turmas[0]?.id || 'TURMA-01-A-PRIM';

    // 2. INSERT Estudante
    console.log('\n--- TESTE 2: INSERÇÃO DE ESTUDANTE (INSERT) ---');
    const testBi = '999999999LA999';
    // Remove if previously exists
    await supabase.from('estudantes').delete().eq('bi_number', testBi);

    const testStudent = {
      id: 'EST-TEST-' + Date.now(),
      full_name: 'Estudante Teste Automatizado SIGE',
      bi_number: testBi,
      birth_date: '2010-05-15',
      gender: 'M',
      naturality: 'Luanda',
      province: 'Luanda',
      address: 'Rua de Teste, 123',
      phone: '+244 923 000 999',
      email: 'teste.aluno@sige.edu.ao',
      guardian_name: 'Encarregado Teste',
      guardian_phone: '+244 923 000 888',
      guardian_kinship: 'Pai',
      ano_letivo_id: anoId,
      curso_id: cursoId,
      classe_id: classeId,
      turma_id: turmaId,
      turma_name: '1ª Classe - Turma A',
      course_name: 'Ensino Primário',
      shift: 'MANHA',
      student_number: 99,
      enrollment_date: '2025-09-01',
      status: 'MATRICULADO',
      documents_submitted: { biCopy: true, passPhoto: true }
    };

    const { data: insertedStudent, error: errInsert } = await supabase.from('estudantes').insert([testStudent]).select().single();
    if (errInsert) {
      throw new Error(`Erro ao inserir estudante: ${errInsert.message}`);
    }
    console.log(`✅ INSERT Estudante aprovado! ID: ${insertedStudent.id}, Nome: ${insertedStudent.full_name}`);

    // 3. SELECT Estudante
    console.log('\n--- TESTE 3: PERSISTÊNCIA & LEITURA (SELECT) ---');
    const { data: fetchedStudent, error: errFetch } = await supabase.from('estudantes').select('*').eq('id', insertedStudent.id).single();
    if (errFetch || !fetchedStudent) {
      throw new Error(`Erro ao buscar estudante recém-criado: ${errFetch?.message}`);
    }
    console.log(`✅ SELECT Estudante aprovado! Nome verificado: ${fetchedStudent.full_name}, BI: ${fetchedStudent.bi_number}`);

    // 4. UPDATE Estudante
    console.log('\n--- TESTE 4: ATUALIZAÇÃO CADASTRAL (UPDATE) ---');
    const updatedName = 'Estudante Teste Automatizado SIGE (Atualizado com Sucesso)';
    const { data: updatedStudent, error: errUpdate } = await supabase
      .from('estudantes')
      .update({ full_name: updatedName, phone: '+244 999 888 777' })
      .eq('id', insertedStudent.id)
      .select()
      .single();

    if (errUpdate || updatedStudent.full_name !== updatedName) {
      throw new Error(`Erro ao atualizar estudante: ${errUpdate?.message}`);
    }
    console.log(`✅ UPDATE Estudante aprovado! Novo nome gravado no PostgreSQL: ${updatedStudent.full_name}`);

    // 5. TESTE DE RECIBO / PAGAMENTO
    console.log('\n--- TESTE 5: LANÇAMENTO DE RECIBO / PAGAMENTO ---');
    const testReceipt = {
      id: 'REC-TEST-' + Date.now(),
      receipt_number: 'REC-2025/TEST-' + Date.now().toString().slice(-4),
      student_id: insertedStudent.id,
      student_name: updatedStudent.full_name,
      student_bi: updatedStudent.bi_number,
      turma_name: updatedStudent.turma_name,
      course_name: updatedStudent.course_name,
      subtotal: 35000,
      total_late_fee: 0,
      total_paid: 35000,
      payment_method: 'TPA',
      bank_reference: 'REF-TPA-998877',
      cashier_user_id: 'USR-ADMIN-01',
      cashier_name: 'Dr. Carvalho dos Santos',
      issued_at: new Date().toISOString(),
      hash_verification: 'VALID-HASH-TEST-99',
      status: 'EMITIDO',
      items: [{
        service_id: 'SRV-PROP-01',
        service_name: 'Propina Mensal - Teste',
        base_price: 35000,
        late_fee: 0,
        total: 35000,
        month: 'Setembro'
      }]
    };

    const { data: insertedReceipt, error: errReceipt } = await supabase.from('recibos_pagamentos').insert([testReceipt]).select().single();
    if (errReceipt) {
      throw new Error(`Erro ao inserir recibo: ${errReceipt.message}`);
    }
    console.log(`✅ INSERT Pagamento / Recibo aprovado! Nº: ${insertedReceipt.receipt_number}, Valor: ${insertedReceipt.total_paid} Kz`);

    // 6. Limpeza do registro de teste
    await supabase.from('recibos_pagamentos').delete().eq('id', testReceipt.id);
    await supabase.from('estudantes').delete().eq('id', insertedStudent.id);
    console.log('\n✅ Limpeza dos registros temporários de validação concluída.');

    console.log('\n========================================================');
    console.log('🎉 TODOS OS TESTES FORAM APROVADOS COM SUCESSO NO SUPABASE!');
    console.log('========================================================');
  } catch (err: any) {
    console.error('❌ ERRO DURANTE A VALIDAÇÃO:', err.message);
  }
}

runValidationSuite();
