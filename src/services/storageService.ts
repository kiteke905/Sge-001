import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const storageService = {
  async uploadStudentPhoto(studentId: string, file: File): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      return URL.createObjectURL(file);
    }
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `students/${studentId}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('aluno-fotos')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.warn('Erro no upload da foto do estudante:', error.message);
        return null;
      }

      const { data } = supabase.storage.from('aluno-fotos').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.warn('Exceção ao fazer upload da fotografia:', err);
      return null;
    }
  },

  async uploadUserDocument(userId: string, docType: string, file: File): Promise<{ name: string; url: string; size: string; uploadDate: string } | null> {
    if (!isSupabaseConfigured()) {
      return {
        name: file.name,
        url: URL.createObjectURL(file),
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadDate: new Date().toISOString(),
      };
    }
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `users/${userId}/${docType}-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('utilizador-documentos')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.warn('Erro ao fazer upload do documento:', error.message);
        return null;
      }

      const { data } = supabase.storage.from('utilizador-documentos').getPublicUrl(filePath);
      return {
        name: file.name,
        url: data.publicUrl,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploadDate: new Date().toISOString(),
      };
    } catch (err) {
      console.warn('Exceção no upload de documento:', err);
      return null;
    }
  },

  async uploadInstitutionLogo(file: File): Promise<string | null> {
    if (!isSupabaseConfigured()) {
      return URL.createObjectURL(file);
    }
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `logo/instituicao-logo-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('instituicao-assets')
        .upload(filePath, file, { upsert: true });

      if (error) {
        console.warn('Erro no upload do logotipo institucional:', error.message);
        return null;
      }

      const { data } = supabase.storage.from('instituicao-assets').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (err) {
      console.warn('Exceção ao carregar logotipo:', err);
      return null;
    }
  }
};
