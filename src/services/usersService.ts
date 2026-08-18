import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, UserRole } from '../types';

export const mapDatabaseUser = (u: any): User => ({
  id: u.id,
  name: u.nome,
  username: u.username,
  email: u.email,
  role: u.role as UserRole,
  avatar: u.avatar || '',
  biNumber: u.bi_number,
  academicDegree: u.grau_academico,
  teacherId: u.teacher_id,
  phone: u.telefone,
  status: u.status,
  documents: u.documentos || {},
  createdAt: u.created_at,
  lastLogin: u.ultimo_acesso,
  password: '••••••••',
});

export const usersService = {
  async getUsers(): Promise<User[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('perfis_utilizadores')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.warn('Erro ao carregar utilizadores do Supabase:', error.message);
          return null;
        }

        if (data) {
          return data.map(mapDatabaseUser);
        }
      } catch (err) {
        console.warn('Erro ao carregar utilizadores do Supabase:', err);
      }
    }
    return null;
  },

  async upsertUser(user: User): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('perfis_utilizadores').upsert({
          id: user.id,
          nome: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          avatar: user.avatar || null,
          bi_number: user.biNumber || null,
          grau_academico: user.academicDegree || null,
          teacher_id: user.teacherId || null,
          telefone: user.phone || null,
          status: user.status,
          documentos: user.documents || {},
          ultimo_acesso: user.lastLogin || null,
          updated_at: new Date().toISOString(),
        });
        return !error;
      } catch (err) {
        console.warn('Exceção ao persistir perfil de utilizador:', err);
        return false;
      }
    }
    return true;
  },

  async deleteUser(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('perfis_utilizadores').delete().eq('id', id);
        return !error;
      } catch (err) {
        console.warn('Erro ao excluir utilizador do Supabase:', err);
        return false;
      }
    }
    return true;
  },

  async signInWithSupabase(email: string, password?: string): Promise<{ success: boolean; user?: any; error?: string }> {
    if (!isSupabaseConfigured() || !password) {
      return { success: false, error: 'Supabase não configurado ou password ausente' };
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { success: false, error: error.message };
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
};
