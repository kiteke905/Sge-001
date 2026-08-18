import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AcademicYear, Course, SchoolClass, Turma, Subject, CurricularAssignment, TimetableSlot, ExamSchedule } from '../types';

export const mapDatabaseAcademicYear = (y: any): AcademicYear => ({
  id: y.id,
  code: y.code,
  name: y.nome,
  startDate: y.data_inicio,
  endDate: y.data_fim,
  status: y.status,
  currentTrimester: y.trimestre_atual,
  enrollmentStartDate: y.matricula_data_inicio,
  enrollmentEndDate: y.matricula_data_fim,
  enrollmentStatus: y.matricula_status,
  confirmationStartDate: y.confirmacao_data_inicio,
  confirmationEndDate: y.confirmacao_data_fim,
  confirmationStatus: y.confirmacao_status,
  startMonth: y.mes_inicio,
  tuitionMonths: y.meses_propinas,
});

export const mapDatabaseTurma = (t: any): Turma => ({
  id: t.id,
  name: t.nome,
  academicYearId: t.ano_letivo_id,
  classId: t.classe_id,
  courseId: t.curso_id,
  shift: t.turno,
  roomNumber: t.sala,
  maxCapacity: t.capacidade_maxima,
  directorTeacherId: t.director_turma_id,
});

export const academicService = {
  // Academic Years
  async getAcademicYears(): Promise<AcademicYear[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('anos_letivos').select('*').order('created_at', { ascending: false });
        if (error) {
          console.warn('Erro ao carregar anos letivos do Supabase:', error.message);
          return null;
        }
        if (data) {
          return data.map(mapDatabaseAcademicYear);
        }
      } catch (err) {
        console.warn('Erro ao carregar anos letivos do Supabase:', err);
      }
    }
    return null;
  },

  async upsertAcademicYear(year: AcademicYear): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('anos_letivos').upsert({
          id: year.id,
          code: year.code,
          nome: year.name,
          data_inicio: year.startDate,
          data_fim: year.endDate,
          status: year.status,
          trimestre_atual: year.currentTrimester,
          matricula_data_inicio: year.enrollmentStartDate,
          matricula_data_fim: year.enrollmentEndDate,
          matricula_status: year.enrollmentStatus,
          confirmacao_data_inicio: year.confirmationStartDate,
          confirmacao_data_fim: year.confirmationEndDate,
          confirmacao_status: year.confirmationStatus,
          mes_inicio: year.startMonth,
          meses_propinas: year.tuitionMonths,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Erro ao salvar ano letivo no Supabase:', err);
      }
    }
  },

  // Courses
  async getCourses(): Promise<Course[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('cursos').select('*');
        if (error) {
          console.warn('Erro ao buscar cursos do Supabase:', error.message);
          return null;
        }
        if (data) {
          return data.map(c => ({
            id: c.id,
            name: c.nome,
            code: c.code,
            type: c.tipo,
            durationYears: c.duracao_anos,
            description: c.descricao,
          }));
        }
      } catch (err) {
        console.warn('Erro ao buscar cursos do Supabase:', err);
      }
    }
    return null;
  },

  // Turmas
  async getTurmas(): Promise<Turma[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('turmas').select('*');
        if (error) {
          console.warn('Erro ao buscar turmas do Supabase:', error.message);
          return null;
        }
        if (data) {
          return data.map(mapDatabaseTurma);
        }
      } catch (err) {
        console.warn('Erro ao buscar turmas do Supabase:', err);
      }
    }
    return null;
  },

  async upsertTurma(turma: Turma): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('turmas').upsert({
          id: turma.id,
          nome: turma.name,
          ano_letivo_id: turma.academicYearId,
          classe_id: turma.classId,
          curso_id: turma.courseId,
          turno: turma.shift,
          sala: turma.roomNumber,
          capacidade_maxima: turma.maxCapacity,
          director_turma_id: turma.directorTeacherId,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Erro ao persistir turma no Supabase:', err);
      }
    }
  },

  // Curricular Assignments
  async getAssignments(): Promise<CurricularAssignment[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('atribuicoes_curriculares').select('*');
        if (error) {
          console.warn('Erro ao carregar atribuições do Supabase:', error.message);
          return null;
        }
        if (data) {
          return data.map(a => ({
            id: a.id,
            academicYearId: a.ano_letivo_id,
            turmaId: a.turma_id,
            subjectId: a.disciplina_id,
            teacherId: a.professor_id,
            weeklyHours: a.horas_semanais,
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar atribuições do Supabase:', err);
      }
    }
    return null;
  },

  async upsertAssignment(assignment: CurricularAssignment): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('atribuicoes_curriculares').upsert({
          id: assignment.id,
          ano_letivo_id: assignment.academicYearId,
          turma_id: assignment.turmaId,
          disciplina_id: assignment.subjectId,
          professor_id: assignment.teacherId,
          horas_semanais: assignment.weeklyHours,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Erro ao persistir atribuição no Supabase:', err);
      }
    }
  },

  async deleteAssignment(id: string): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('atribuicoes_curriculares').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao remover atribuição do Supabase:', err);
      }
    }
  }
};

