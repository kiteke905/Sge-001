import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Teacher } from '../types';

export const teachersService = {
  async getTeachers(): Promise<Teacher[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.from('professores').select('*');
        if (!error && data && data.length > 0) {
          return data.map(t => ({
            id: t.id,
            name: t.name,
            biNumber: t.bi_number,
            academicDegree: t.academic_degree,
            specialty: t.specialty,
            phone: t.phone,
            email: t.email,
            category: t.category,
            status: t.status,
            joinDate: t.join_date,
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar professores do Supabase:', err);
      }
    }
    return null;
  },

  async upsertTeacher(teacher: Teacher): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('professores').upsert({
          id: teacher.id,
          name: teacher.name,
          bi_number: teacher.biNumber,
          academic_degree: teacher.academicDegree,
          specialty: teacher.specialty,
          phone: teacher.phone,
          email: teacher.email,
          category: teacher.category,
          status: teacher.status,
          join_date: teacher.joinDate,
          updated_at: new Date().toISOString(),
        });
        return !error;
      } catch (err) {
        console.warn('Exceção ao persistir professor:', err);
        return false;
      }
    }
    return true;
  }
};
