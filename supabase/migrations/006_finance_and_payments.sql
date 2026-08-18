-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 006: TESOURARIA, CAIXA, SERVIÇOS E RECIBOS
-- ============================================================================

-- 1. TABELA: servicos_financeiros (Catálogo de Preços & Regras de Multas)
CREATE TABLE IF NOT EXISTS public.servicos_financeiros (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('PROPINA', 'MATRICULA', 'CONFIRMACAO', 'CARTAO', 'DOCUMENTO', 'UNIFORME', 'OUTRO')),
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_monthly BOOLEAN NOT NULL DEFAULT false,
    target_audience VARCHAR(50) NOT NULL DEFAULT 'TODOS' 
        CHECK (target_audience IN ('TODOS', 'PRIMARIO', 'I_CICLO', 'II_CICLO_GERAL', 'II_CICLO_TECNICO', 'CURSO_ESPECIFICO', 'CLASSE_ESPECIFICA')),
    target_course_id VARCHAR(50) REFERENCES public.cursos(id) ON DELETE SET NULL,
    target_class_id VARCHAR(50) REFERENCES public.classes(id) ON DELETE SET NULL,
    
    -- Configuração de Multas (Padrão Angola: Vencimento dia 10)
    fine_enabled BOOLEAN NOT NULL DEFAULT false,
    fine_percentage NUMERIC(5, 2) DEFAULT 0.00,
    fine_fixed_amount NUMERIC(10, 2) DEFAULT 0.00,
    fine_due_day SMALLINT DEFAULT 10,
    fine_description TEXT,
    
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA: recibos_pagamentos
CREATE TABLE IF NOT EXISTS public.recibos_pagamentos (
    id VARCHAR(50) PRIMARY KEY, -- ex: "REC-2025-00101"
    receipt_number VARCHAR(100) NOT NULL UNIQUE, -- ex: "RC-2025/00001"
    student_id VARCHAR(50) NOT NULL REFERENCES public.estudantes(id) ON DELETE RESTRICT,
    student_name VARCHAR(255) NOT NULL,
    student_bi VARCHAR(50) NOT NULL,
    turma_name VARCHAR(150),
    course_name VARCHAR(255),
    
    -- Valores em Kwanza (Kz)
    subtotal NUMERIC(12, 2) NOT NULL,
    total_late_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_paid NUMERIC(12, 2) NOT NULL,
    
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('TPA', 'TRANSFERENCIA', 'DEPOSITO', 'NUMERARIO')),
    bank_reference VARCHAR(150),
    cashier_user_id VARCHAR(50) NOT NULL,
    cashier_name VARCHAR(255) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hash_verification VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'EMITIDO' CHECK (status IN ('EMITIDO', 'ANULADO')),
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Itens discriminados do pagamento
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recibos_estudante ON public.recibos_pagamentos(student_id);
CREATE INDEX IF NOT EXISTS idx_recibos_numero ON public.recibos_pagamentos(receipt_number);
CREATE INDEX IF NOT EXISTS idx_recibos_data ON public.recibos_pagamentos(issued_at);

-- 3. TABELA: despesas_caixa (Saídas Financeiras)
CREATE TABLE IF NOT EXISTS public.despesas_caixa (
    id VARCHAR(50) PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('SALARIOS', 'MANUTENCAO', 'MATERIAL_ESCRITORIO', 'SERVICOS_PUBLICOS', 'SERVICOS', 'EVENTOS', 'OUTROS', 'OUTRO')),
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('TPA', 'TRANSFERENCIA', 'DEPOSITO', 'NUMERARIO')),
    recipient VARCHAR(255) NOT NULL,
    receipt_reference VARCHAR(150),
    notes TEXT,
    registered_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_despesas_data ON public.despesas_caixa(date);
CREATE INDEX IF NOT EXISTS idx_despesas_categoria ON public.despesas_caixa(category);

-- RLS
ALTER TABLE public.servicos_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recibos_pagamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despesas_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso a serviços financeiros" ON public.servicos_financeiros FOR ALL USING (true);
CREATE POLICY "Acesso a recibos de pagamentos" ON public.recibos_pagamentos FOR ALL USING (true);
CREATE POLICY "Acesso a despesas de caixa" ON public.despesas_caixa FOR ALL USING (true);
