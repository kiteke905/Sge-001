-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 008: REGISTO DE AUDITORIA (AUDIT LOGS)
-- ============================================================================

-- 1. TABELA: logs_auditoria
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id VARCHAR(50) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL CHECK (module IN ('AUTENTICACAO', 'SECRETARIA', 'PEDAGOGICO', 'CAIXA_FINANCAS', 'FINANCEIRO', 'CONFIGURACOES', 'DOCUMENTOS', 'SISTEMA')),
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    description TEXT,
    ip_address VARCHAR(100) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON public.logs_auditoria(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.logs_auditoria(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_module ON public.logs_auditoria(module);

-- RLS
ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de logs de auditoria" ON public.logs_auditoria FOR SELECT USING (true);
CREATE POLICY "Inserção de logs de auditoria" ON public.logs_auditoria FOR INSERT WITH CHECK (true);
