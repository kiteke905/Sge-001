import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AuditLog } from '../types';

export const auditService = {
  async getAuditLogs(): Promise<AuditLog[] | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('logs_auditoria')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(200);

        if (!error && data && data.length > 0) {
          return data.map(l => ({
            id: l.id,
            timestamp: l.timestamp,
            userId: l.user_id,
            userName: l.user_name,
            userRole: l.user_role,
            module: l.module,
            action: l.action,
            details: l.details,
            description: l.description,
            ipAddress: l.ip_address || '127.0.0.1',
          }));
        }
      } catch (err) {
        console.warn('Erro ao carregar logs de auditoria do Supabase:', err);
      }
    }
    return null;
  },

  async insertAuditLog(log: AuditLog): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('logs_auditoria').insert({
          id: log.id,
          timestamp: log.timestamp,
          user_id: log.userId,
          user_name: log.userName,
          user_role: log.userRole,
          module: log.module,
          action: log.action,
          details: log.details,
          description: log.description || null,
          ip_address: log.ipAddress,
        });
      } catch (err) {
        console.warn('Erro ao salvar log de auditoria no Supabase:', err);
      }
    }
  }
};
