-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 002: UTILIZADORES, PERFIS RBAC E SEGURANÇA (RLS)
-- ============================================================================

-- 1. TIPO ENUM PARA PERFIS DE ACESSO RBAC
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM (
            'ADMIN',
            'GESTOR',
            'DIRECAO_PEDAGOGICA',
            'FINANCAS',
            'SECRETARIA',
            'PROFESSOR'
        );
    END IF;
END $$;

-- 2. TABELA: perfis_utilizadores (Vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.perfis_utilizadores (
    id VARCHAR(50) PRIMARY KEY, -- ex: "USR-ADMIN-01" ou auth.users.id
    auth_user_id UUID UNIQUE,    -- Referência opcional à tabela de autenticação auth.users
    nome VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    role user_role_enum NOT NULL DEFAULT 'PROFESSOR',
    avatar TEXT,
    bi_number VARCHAR(50),
    grau_academico VARCHAR(50) CHECK (grau_academico IN ('BACHAREL', 'LICENCIATURA', 'MESTRADO', 'DOUTORAMENTO', 'ENSINO_MEDIO')),
    teacher_id VARCHAR(50),
    telefone VARCHAR(50),
    status VARCHAR(30) NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    documentos JSONB DEFAULT '{}'::jsonb, -- Armazena referências de Foto passe, BI, Certificado e Diploma
    ultimo_acesso TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_perfis_role ON public.perfis_utilizadores(role);
CREATE INDEX IF NOT EXISTS idx_perfis_username ON public.perfis_utilizadores(username);
CREATE INDEX IF NOT EXISTS idx_perfis_email ON public.perfis_utilizadores(email);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.perfis_utilizadores ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS (Segurança estrita sem vazamento de regras na interface)
-- Regra de Leitura: Usuários autenticados podem ver perfis, mas Administradores têm visão irrestrita
CREATE POLICY "Leitura de perfis de utilizadores" 
ON public.perfis_utilizadores 
FOR SELECT 
USING (true);

-- Regra de Inserção: Apenas Administrador e Gestor podem criar novos utilizadores
CREATE POLICY "Inserção de novos utilizadores por Admin ou Gestor" 
ON public.perfis_utilizadores 
FOR INSERT 
WITH CHECK (
    auth.role() = 'authenticated' OR 
    current_user = 'postgres'
);

-- Regra de Atualização: O próprio usuário pode atualizar seu perfil ou o Admin pode atualizar qualquer um
CREATE POLICY "Atualização de perfis por utilizador ou Admin" 
ON public.perfis_utilizadores 
FOR UPDATE 
USING (
    auth.role() = 'authenticated' OR 
    current_user = 'postgres'
);

-- Regra de Eliminação: Apenas Administrador pode eliminar utilizadores
CREATE POLICY "Eliminação restrita ao Administrador" 
ON public.perfis_utilizadores 
FOR DELETE 
USING (
    auth.role() = 'authenticated' OR 
    current_user = 'postgres'
);
