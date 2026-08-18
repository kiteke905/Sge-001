-- ============================================================================
-- SIGE ANGOLA — MIGRAÇÃO 009: DADOS DE DEMONSTRAÇÃO E INICIALIZAÇÃO (SEED DATA)
-- ============================================================================

-- 1. Instituição Padrão
INSERT INTO public.instituicoes (
    nome, sub_titulo, republic_header, ministry_header, provincial_header, 
    nif, decree_number, endereco, municipio, provincia, telefone, email, 
    director_geral, director_pedagogico, chefe_secretaria, moeda
) VALUES (
    'Complexo Escolar Girassol do Saber',
    'Ensino Primário, Iº e IIº Ciclos do Ensino Secundário Geral e Técnico',
    'REPÚBLICA DE ANGOLA',
    'MINISTÉRIO DA EDUCAÇÃO',
    'GOVERNO PROVINCIAL DE LUANDA - GABINETE PROVINCIAL DE EDUCAÇÃO',
    '5417098231',
    'Dec. Executivo Nº 142/2018 - MED',
    'Rua Direita do Patriota, Luanda Sul, Luanda - Angola',
    'Luanda',
    'Luanda',
    '+244 923 000 111 / +244 912 000 222',
    'direcao@girassoldosaber.edu.ao',
    'Dra. Maria Antónia Kiala',
    'Prof. Mestre Sebastião Vunge',
    'Sandra Varela Neto',
    'Kwanza (Kz)'
) ON CONFLICT DO NOTHING;

-- 2. Anos Letivos
INSERT INTO public.anos_letivos (id, code, nome, data_inicio, data_fim, status, trimestre_atual, matricula_status, confirmacao_status)
VALUES 
    ('AY-2025-2026', '2025/2026', 'Ano Letivo Geral 2025/2026 (Em Curso)', '2025-09-01', '2026-07-15', 'ATIVO', 1, 'ABERTO', 'ABERTO'),
    ('AY-2024-2025', '2024/2025', 'Ano Letivo 2024/2025 (Concluído)', '2024-09-01', '2025-07-20', 'ENCERRADO', 3, 'FECHADO', 'FECHADO')
ON CONFLICT (id) DO NOTHING;

-- 3. Cursos Oficiais
INSERT INTO public.cursos (id, nome, code, tipo, duracao_anos, descricao)
VALUES 
    ('CRS-PRI', 'Ensino Primário (Iniciação à 6ª Classe)', 'PRIM', 'PRIMARIO', 7, 'Subsistema do Ensino Geral Primário com classes compreendidas entre a Iniciação e a 6ª Classe.'),
    ('CRS-CFB', 'Ciências Físicas e Biológicas', 'CFB', 'PUNIV', 3, 'Curso Pré-Universitário em Ciências Físicas e Biológicas'),
    ('CRS-CEJ', 'Ciências Económicas e Jurídicas', 'CEJ', 'PUNIV', 3, 'Curso Pré-Universitário em Ciências Económicas e Jurídicas'),
    ('CRS-INF', 'Técnico de Informática e Gestão', 'INF', 'TECNICO', 4, 'Curso Médio Técnico de Informática de Gestão e Redes'),
    ('CRS-EG', 'Ensino Geral (Iº Ciclo do Secundário)', 'EG', 'ENSINO_GERAL', 3, 'Ensino Secundário do 1º Ciclo (7ª à 9ª Classe)')
ON CONFLICT (id) DO NOTHING;

-- 4. Classes (Da Iniciação à 13ª Classe)
INSERT INTO public.classes (id, nome, nivel)
VALUES 
    ('CLS-INI', 'Iniciação', 0),
    ('CLS-01', '1ª Classe', 1),
    ('CLS-02', '2ª Classe', 2),
    ('CLS-03', '3ª Classe', 3),
    ('CLS-04', '4ª Classe', 4),
    ('CLS-05', '5ª Classe', 5),
    ('CLS-06', '6ª Classe', 6),
    ('CLS-07', '7ª Classe', 7),
    ('CLS-08', '8ª Classe', 8),
    ('CLS-09', '9ª Classe', 9),
    ('CLS-10', '10ª Classe', 10),
    ('CLS-11', '11ª Classe', 11),
    ('CLS-12', '12ª Classe', 12),
    ('CLS-13', '13ª Classe (Técnico)', 13)
ON CONFLICT (id) DO NOTHING;

-- 5. Disciplinas Oficiais
INSERT INTO public.disciplinas (id, nome, code, categoria)
VALUES 
    ('DISC-LP', 'Língua Portuguesa', 'LP', 'NUCLEAR'),
    ('DISC-MAT', 'Matemática', 'MAT', 'NUCLEAR'),
    ('DISC-FIS', 'Física', 'FIS', 'NUCLEAR'),
    ('DISC-QUI', 'Química', 'QUI', 'NUCLEAR'),
    ('DISC-BIO', 'Biologia', 'BIO', 'NUCLEAR'),
    ('DISC-HIST', 'História', 'HIST', 'COMPLEMENTAR'),
    ('DISC-GEO', 'Geografia', 'GEO', 'COMPLEMENTAR'),
    ('DISC-ING', 'Língua Inglesa', 'ING', 'COMPLEMENTAR'),
    ('DISC-FRAN', 'Língua Francesa', 'FRAN', 'COMPLEMENTAR'),
    ('DISC-INF', 'Informática e TICs', 'TIC', 'TECNICA'),
    ('DISC-PROG', 'Programação e Algoritmia', 'PROG', 'TECNICA'),
    ('DISC-ECON', 'Introdução à Economia', 'ECON', 'NUCLEAR'),
    ('DISC-DIR', 'Noções de Direito', 'DIR', 'NUCLEAR'),
    ('DISC-EDF', 'Educação Física', 'EDF', 'EXTRA')
ON CONFLICT (id) DO NOTHING;

-- 6. Professores
INSERT INTO public.professores (id, name, bi_number, academic_degree, specialty, phone, email, category, status)
VALUES
    ('TCH-001', 'Prof. Carlos Gaspar', '003847291LA039', 'LICENCIATURA', 'Matemática e Física', '+244 928 112 233', 'carlos.gaspar@sige.edu.ao', 'EFETIVO', 'ATIVO'),
    ('TCH-002', 'Prof.ª Teresa Domingos', '002938127LA045', 'MESTRADO', 'Língua Portuguesa e Literatura', '+244 931 445 566', 'teresa.domingos@sige.edu.ao', 'EFETIVO', 'ATIVO'),
    ('TCH-003', 'Prof. Ambrósio Panzo', '005612849LA018', 'LICENCIATURA', 'Química e Biologia', '+244 922 990 011', 'ambrosio.panzo@sige.edu.ao', 'EFETIVO', 'ATIVO'),
    ('TCH-004', 'Eng.ª Neusa Afonso', '004192837LA022', 'LICENCIATURA', 'Técnicas de Programação e Redes', '+244 947 334 455', 'neusa.afonso@sige.edu.ao', 'EFETIVO', 'ATIVO'),
    ('TCH-005', 'Prof. Manuel Kiala', '006782910LA031', 'LICENCIATURA', 'Ensino Primário e Metodologias', '+244 912 889 900', 'manuel.kiala@sige.edu.ao', 'EFETIVO', 'ATIVO')
ON CONFLICT (id) DO NOTHING;

-- 7. Turmas Padrão
INSERT INTO public.turmas (id, nome, ano_letivo_id, classe_id, curso_id, turno, sala, capacidade_maxima, director_turma_id)
VALUES
    ('TURMA-INI-A-PRIM', 'Iniciação - Turma A (Primário)', 'AY-2025-2026', 'CLS-INI', 'CRS-PRI', 'MANHA', 'Sala 01 - Pavilhão Infantil', 30, 'TCH-002'),
    ('TURMA-01-A-PRIM', '1ª Classe - Turma A (Primário)', 'AY-2025-2026', 'CLS-01', 'CRS-PRI', 'MANHA', 'Sala 02 - Pavilhão Infantil', 35, 'TCH-002'),
    ('TURMA-06-A-PRIM', '6ª Classe - Turma A (Primário)', 'AY-2025-2026', 'CLS-06', 'CRS-PRI', 'TARDE', 'Sala 03 - Bloco Primário', 40, 'TCH-005'),
    ('TURMA-10-A-CFB', '10ª Classe - Turma A (CFB)', 'AY-2025-2026', 'CLS-10', 'CRS-CFB', 'MANHA', 'Sala 04 - Bloco A', 45, 'TCH-001'),
    ('TURMA-10-B-INF', '10ª Classe - Turma B (Informática)', 'AY-2025-2026', 'CLS-10', 'CRS-INF', 'MANHA', 'Lab Informática 01', 35, 'TCH-004'),
    ('TURMA-11-A-CEJ', '11ª Classe - Turma A (CEJ)', 'AY-2025-2026', 'CLS-11', 'CRS-CEJ', 'TARDE', 'Sala 09 - Bloco B', 40, 'TCH-002'),
    ('TURMA-12-A-CFB', '12ª Classe - Turma A (CFB)', 'AY-2025-2026', 'CLS-12', 'CRS-CFB', 'MANHA', 'Sala 12 - Bloco C', 40, 'TCH-003')
ON CONFLICT (id) DO NOTHING;

-- 8. Perfis de Utilizadores
INSERT INTO public.perfis_utilizadores (id, nome, username, email, role, avatar, bi_number, grau_academico, teacher_id, telefone, status)
VALUES
    ('USR-ADMIN-01', 'Dr. Carvalho dos Santos', 'carvalhorq', 'carvalhorq@sige.edu.ao', 'ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '003456789LA042', 'MESTRADO', NULL, '+244 923 456 789', 'ATIVO'),
    ('USR-GESTOR-02', 'Dra. Maria Antónia Kiala', 'gestor', 'gestao@sige.edu.ao', 'GESTOR', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150', '007891234LA038', 'DOUTORAMENTO', NULL, '+244 912 345 678', 'ATIVO'),
    ('USR-PEDAG-03', 'Prof. Mestre Sebastião Vunge', 'pedagogico', 'pedagogico@sige.edu.ao', 'DIRECAO_PEDAGOGICA', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', '001234567LA045', 'MESTRADO', NULL, '+244 934 567 890', 'ATIVO'),
    ('USR-PROF-04', 'Prof. Carlos Gaspar', 'professor', 'carlos.gaspar@sige.edu.ao', 'PROFESSOR', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', '005678123LA029', 'LICENCIATURA', 'TCH-001', '+244 928 112 233', 'ATIVO'),
    ('USR-SEC-05', 'Sandra Varela Neto', 'secretaria', 'secretaria@sige.edu.ao', 'SECRETARIA', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150', '008912345LA033', 'LICENCIATURA', NULL, '+244 945 667 788', 'ATIVO'),
    ('USR-FIN-06', 'Dr. Victorino Chimuco', 'financas', 'tesouraria@sige.edu.ao', 'FINANCAS', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', '004567890LA051', 'LICENCIATURA', NULL, '+244 919 887 766', 'ATIVO')
ON CONFLICT (id) DO NOTHING;

-- 9. Serviços Financeiros & Multas
INSERT INTO public.servicos_financeiros (id, code, name, service_type, category, base_price, is_monthly, target_audience, fine_enabled, fine_percentage, fine_due_day, fine_description, status)
VALUES
    ('SRV-PROP-01', 'PROP-REG', 'Propina Mensal Regular (Ensino Geral e PUNIV)', 'PROPINA_MENSAL', 'PROPINA', 35000.00, true, 'TODOS', true, 10.00, 10, 'Multa de 10% por atraso após o dia 10 de cada mês (Regulamento Art. 14º)', 'ATIVO'),
    ('SRV-PROP-TEC', 'PROP-TEC', 'Propina Mensal - Técnico Profissional (Informática)', 'PROPINA_MENSAL', 'PROPINA', 42000.00, true, 'II_CICLO_TECNICO', true, 10.00, 10, 'Multa de 10% por atraso após o dia 10 de cada mês', 'ATIVO'),
    ('SRV-MATR-01', 'TAXA-MATR', 'Taxa de Nova Matrícula Escolar', 'MATRICULA', 'MATRICULA', 20000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-CONF-01', 'TAXA-CONF', 'Taxa de Confirmação de Matrícula (Alunos Antigos)', 'CONFIRMACAO', 'CONFIRMACAO', 15000.00, false, 'TODOS', true, 15.00, 20, 'Multa de 15% após encerramento do prazo de confirmações', 'ATIVO'),
    ('SRV-CARD-01', 'CARTAO-EST', 'Emissão de Cartão Magnético com QR Code', 'CARTAO_ESTUDANTE', 'CARTAO', 3500.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-UNIF-01', 'UNIF-COMP', 'Uniforme Escolar Completo (2 Batas + 1 Polo)', 'UNIFORME', 'UNIFORME', 18000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-DECL-01', 'DECL-NOTAS', 'Emissão de Declaração Escolar com/sem Notas', 'DECLARACAO', 'DOCUMENTO', 4000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-CERT-01', 'CERT-HAB', 'Emissão de Certificado Oficial de Habilitações', 'CERTIFICADO', 'DOCUMENTO', 8500.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-EXAM-01', 'EMOL-REC', 'Emolumento de Prova de Exame / Recurso', 'RECURSO_EXAME', 'OUTRO', 5000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO'),
    ('SRV-FOLH-01', 'FOLH-PROV', 'Caderno / Folha de Prova Trimestral', 'FOLHA_PROVA', 'OUTRO', 1000.00, false, 'TODOS', false, 0.00, 10, NULL, 'ATIVO')
ON CONFLICT (id) DO NOTHING;
