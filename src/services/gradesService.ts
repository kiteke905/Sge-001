import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { GradeRecord, ExamGradeRecord, AssessmentSchedule } from '../types';
import { calculateMT } from '../utils/formatters';

export const gradesService = {
  async getGrades(): Promise<GradeRecord[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('registo_notas').select('*');
        if (!error && data && data.length > 0) {
          return data.map(g => ({
            id: g.id,
            studentId: g.estudante_id,
            assignmentId: g.atribuicao_id,
            trimester: g.trimestre,
            mac: Number(g.mac),
            npt: Number(g.npt),
            mt: Number(g.mt) || calculateMT(Number(g.mac), Number(g.npt)),
            observations: g.observacoes,
            updatedAt: g.updated_at,
            updatedBy: g.updated_by,
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar notas do Supabase:', err);
      }
    }
    return null;
  },

  async saveBatchGrades(grades: GradeRecord[]): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const payloads = grades.map(g => ({
          id: g.id,
          estudante_id: g.studentId,
          atribuicao_id: g.assignmentId,
          trimestre: g.trimester,
          mac: g.mac,
          npt: g.npt,
          observacoes: g.observations || '',
          updated_by: g.updatedBy,
          updated_at: new Date().toISOString(),
        }));

        const { error } = await supabase.from('registo_notas').upsert(payloads);
        if (error) {
          console.warn('Erro ao salvar notas no Supabase:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Exceção ao persistir notas:', err);
        return false;
      }
    }
    return true;
  },

  async getAssessmentSchedules(): Promise<AssessmentSchedule[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('agendamento_avaliacoes').select('*');
        if (!error && data && data.length > 0) {
          return data.map(a => ({
            id: a.id,
            assignmentId: a.atribuicao_id,
            trimester: a.trimestre,
            macDate: a.mac_data,
            nptDate: a.npt_data,
          }));
        }
      } catch (err) {
        console.warn('Erro ao buscar agendamentos de avaliação:', err);
      }
    }
    return null;
  },

  async upsertAssessmentSchedule(schedule: AssessmentSchedule): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('agendamento_avaliacoes').upsert({
          id: schedule.id,
          atribuicao_id: schedule.assignmentId,
          trimestre: schedule.trimester,
          mac_data: schedule.macDate,
          npt_data: schedule.nptDate,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Erro ao persistir agendamento no Supabase:', err);
      }
    }
  }
};
