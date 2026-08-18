import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { cloudSyncService } from './cloudSyncService';
import { Student } from '../types';

export const mapDatabaseStudent = (s: any): Student => ({
  id: s.id,
  fullName: s.full_name,
  biNumber: s.bi_number,
  birthDate: s.birth_date,
  gender: s.gender,
  naturality: s.naturality,
  province: s.province,
  address: s.address,
  phone: s.phone,
  email: s.email,
  photoUrl: s.photo_url || '',
  guardianName: s.guardian_name,
  guardianPhone: s.guardian_phone,
  guardianKinship: s.guardian_kinship,
  guardianProfession: s.guardian_profession,
  academicYearId: s.ano_letivo_id,
  courseId: s.curso_id,
  classId: s.classe_id,
  turmaId: s.turma_id,
  turmaName: s.turma_name,
  courseName: s.course_name,
  shift: s.shift,
  studentNumber: s.student_number,
  enrollmentDate: s.enrollment_date,
  status: s.status,
  documentsSubmitted: s.documents_submitted || {
    biCopy: false,
    passPhoto: false,
    previousCertificate: false,
    medicalAttestation: false,
    militaryDeclaration: false,
  },
});

export const studentsService = {
  async getStudents(): Promise<Student[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('estudantes')
          .select('*')
          .order('student_number', { ascending: true });

        if (error) {
          console.warn('Erro ao obter estudantes do Supabase:', error.message);
          return null;
        }

        if (data) {
          return data.map(mapDatabaseStudent);
        }
      } catch (err) {
        console.warn('Erro ao obter estudantes do Supabase:', err);
      }
    }
    return null;
  },

  async upsertStudent(student: Student): Promise<boolean> {
    // 1. Persist to Firebase Cloud
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.saveDocument('estudantes', student).catch(err => {
        console.warn('Erro ao sincronizar estudante com o Firebase:', err);
      });
    }

    // 2. Persist to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const payload = {
          id: student.id,
          full_name: student.fullName,
          bi_number: student.biNumber,
          birth_date: student.birthDate,
          gender: student.gender,
          naturality: student.naturality,
          province: student.province,
          address: student.address,
          phone: student.phone,
          email: student.email,
          photo_url: student.photoUrl,
          guardian_name: student.guardianName,
          guardian_phone: student.guardianPhone,
          guardian_kinship: student.guardianKinship,
          guardian_profession: student.guardianProfession,
          ano_letivo_id: student.academicYearId,
          curso_id: student.courseId,
          classe_id: student.classId,
          turma_id: student.turmaId,
          turma_name: student.turmaName,
          course_name: student.courseName,
          shift: student.shift,
          student_number: student.studentNumber,
          enrollment_date: student.enrollmentDate,
          status: student.status,
          documents_submitted: student.documentsSubmitted,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('estudantes')
          .upsert(payload);

        if (error) {
          console.warn('Erro ao persistir estudante no Supabase:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Exceção ao persistir estudante no Supabase:', err);
        return false;
      }
    }
    return true;
  },

  async deleteStudent(id: string): Promise<boolean> {
    // 1. Delete from Firebase Cloud
    if (cloudSyncService.isConfigured()) {
      cloudSyncService.deleteDocument('estudantes', id).catch(err => {
        console.warn('Erro ao remover estudante do Firebase:', err);
      });
    }

    // 2. Delete from Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase
          .from('estudantes')
          .delete()
          .eq('id', id);

        if (error) {
          console.warn('Erro ao excluir estudante no Supabase:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('Exceção ao excluir estudante no Supabase:', err);
        return false;
      }
    }
    return true;
  },

  async recordStudentHistory(history: {
    studentId: string;
    academicYearId: string;
    turmaOrigemId?: string;
    turmaDestinoId?: string;
    eventType: string;
    description: string;
    registeredBy: string;
  }): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('historico_estudantes').insert({
          estudante_id: history.studentId,
          ano_letivo_id: history.academicYearId,
          turma_origem_id: history.turmaOrigemId,
          turma_destino_id: history.turmaDestinoId,
          tipo_evento: history.eventType,
          descricao: history.description,
          registado_por: history.registeredBy,
        });
      } catch (err) {
        console.warn('Erro ao registar histórico escolar:', err);
      }
    }
  }
};

