import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { InstitutionInfo } from '../types';

export const INSTITUTION_STORAGE_KEY = 'SIGE_ANGOLA_INSTITUTION';

export const institutionService = {
  async getInstitution(): Promise<InstitutionInfo | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('instituicoes')
          .select('*')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Erro ao carregar instituição do Supabase:', error.message);
        } else if (data) {
          return {
            name: data.nome,
            subTitle: data.sub_titulo,
            logoUrl: data.logo_url || '',
            republicHeader: data.republic_header,
            ministryHeader: data.ministry_header,
            provincialHeader: data.provincial_header,
            nif: data.nif,
            decreeNumber: data.decree_number,
            address: data.endereco,
            city: data.municipio,
            province: data.provincia,
            phone: data.telefone,
            email: data.email,
            directorGeneral: data.director_geral,
            directorName: data.director_geral,
            directorPedagogico: data.director_pedagogico,
            pedagogicalDirectorName: data.director_pedagogico,
            chiefSecretaria: data.chefe_secretaria,
            secretariatHeadName: data.chefe_secretaria,
            currency: data.moeda || 'Kwanza (Kz)',
          };
        }
      } catch (err) {
        console.warn('Exceção ao obter instituição do Supabase:', err);
      }
    }

    // Fallback local persistence
    const local = localStorage.getItem(INSTITUTION_STORAGE_KEY);
    return local ? JSON.parse(local) : null;
  },

  async updateInstitution(info: Partial<InstitutionInfo>): Promise<boolean> {
    // Save to local persistence immediately
    const existing = await this.getInstitution() || {} as InstitutionInfo;
    const updated = { ...existing, ...info };
    localStorage.setItem(INSTITUTION_STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      try {
        const payload = {
          nome: updated.name,
          sub_titulo: updated.subTitle,
          logo_url: updated.logoUrl,
          republic_header: updated.republicHeader,
          ministry_header: updated.ministryHeader,
          provincial_header: updated.provincialHeader,
          nif: updated.nif,
          decree_number: updated.decreeNumber,
          endereco: updated.address,
          municipio: updated.city,
          provincia: updated.province,
          telefone: updated.phone,
          email: updated.email,
          director_geral: updated.directorGeneral || updated.directorName,
          director_pedagogico: updated.directorPedagogico || updated.pedagogicalDirectorName,
          chefe_secretaria: updated.chiefSecretaria || updated.secretariatHeadName,
          moeda: updated.currency,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('instituicoes')
          .upsert(payload);

        if (error) {
          console.warn('Erro ao atualizar instituição no Supabase:', error.message);
          return false;
        }
      } catch (err) {
        console.warn('Exceção ao atualizar instituição no Supabase:', err);
        return false;
      }
    }

    return true;
  }
};
