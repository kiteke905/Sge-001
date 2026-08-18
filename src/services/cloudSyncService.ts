import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  Unsubscribe 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { 
  Student, 
  Teacher, 
  Turma, 
  GradeRecord, 
  PaymentReceipt, 
  ExpenseRecord, 
  FinancialService, 
  DocumentRequest, 
  AuditLog,
  InstitutionInfo,
  AcademicYear,
  Course,
  SchoolClass,
  Subject,
  CurricularAssignment,
  User
} from '../types';

export interface FullSchoolData {
  institution?: InstitutionInfo;
  academicYears?: AcademicYear[];
  courses?: Course[];
  classes?: SchoolClass[];
  disciplinas?: Subject[];
  turmas?: Turma[];
  professores?: Teacher[];
  assignments?: CurricularAssignment[];
  estudantes?: Student[];
  registo_notas?: GradeRecord[];
  servicos_financeiros?: FinancialService[];
  recibos_pagamentos?: PaymentReceipt[];
  despesas_caixa?: ExpenseRecord[];
  requerimentos_documentos?: DocumentRequest[];
  logs_auditoria?: AuditLog[];
  perfis_utilizadores?: User[];
}

export const cloudSyncService = {
  isConfigured(): boolean {
    return isFirebaseConfigured();
  },

  /**
   * Salva um único documento numa coleção do Firestore
   */
  async saveDocument<T extends { id: string }>(collectionName: string, data: T): Promise<boolean> {
    if (!this.isConfigured() || !data.id) return false;
    try {
      const docRef = doc(db, collectionName, String(data.id));
      await setDoc(docRef, { ...data, _updatedAt: new Date().toISOString() }, { merge: true });
      return true;
    } catch (err) {
      console.warn(`[CloudSync] Erro ao salvar em ${collectionName}:`, err);
      return false;
    }
  },

  /**
   * Remove um documento de uma coleção do Firestore
   */
  async deleteDocument(collectionName: string, id: string): Promise<boolean> {
    if (!this.isConfigured() || !id) return false;
    try {
      const docRef = doc(db, collectionName, String(id));
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn(`[CloudSync] Erro ao excluir de ${collectionName}:`, err);
      return false;
    }
  },

  /**
   * Carrega todos os documentos de uma coleção
   */
  async fetchCollection<T>(collectionName: string): Promise<T[] | null> {
    if (!this.isConfigured()) return null;
    try {
      const colRef = collection(db, collectionName);
      const snapshot = await getDocs(colRef);
      if (snapshot.empty) return [];
      return snapshot.docs.map(d => d.data() as T);
    } catch (err) {
      console.warn(`[CloudSync] Erro ao carregar coleção ${collectionName}:`, err);
      return null;
    }
  },

  /**
   * Sincronização inicial em lote para a nuvem
   */
  async pushInitialSeedToCloud(data: FullSchoolData): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return { success: false, message: 'Nuvem Firebase não configurada.' };
    }

    try {
      const batch = writeBatch(db);
      let count = 0;

      // Instituição
      if (data.institution) {
        const instRef = doc(db, 'instituicoes', 'current');
        batch.set(instRef, { ...data.institution, _updatedAt: new Date().toISOString() }, { merge: true });
        count++;
      }

      // Estudantes
      if (data.estudantes) {
        for (const s of data.estudantes) {
          const sRef = doc(db, 'estudantes', s.id);
          batch.set(sRef, { ...s, _updatedAt: new Date().toISOString() }, { merge: true });
          count++;
        }
      }

      // Turmas
      if (data.turmas) {
        for (const t of data.turmas) {
          const tRef = doc(db, 'turmas', t.id);
          batch.set(tRef, { ...t, _updatedAt: new Date().toISOString() }, { merge: true });
          count++;
        }
      }

      // Professores
      if (data.professores) {
        for (const p of data.professores) {
          const pRef = doc(db, 'professores', p.id);
          batch.set(pRef, { ...p, _updatedAt: new Date().toISOString() }, { merge: true });
          count++;
        }
      }

      // Serviços Financeiros
      if (data.servicos_financeiros) {
        for (const srv of data.servicos_financeiros) {
          const srvRef = doc(db, 'servicos_financeiros', srv.id);
          batch.set(srvRef, { ...srv, _updatedAt: new Date().toISOString() }, { merge: true });
          count++;
        }
      }

      // Recibos
      if (data.recibos_pagamentos) {
        for (const r of data.recibos_pagamentos) {
          const rRef = doc(db, 'recibos_pagamentos', r.id);
          batch.set(rRef, { ...r, _updatedAt: new Date().toISOString() }, { merge: true });
          count++;
        }
      }

      // Notas
      if (data.registo_notas) {
        for (const n of data.registo_notas) {
          const nRef = doc(db, 'registo_notas', n.id);
          batch.set(nRef, { ...n, _updatedAt: new Date().toISOString() }, { merge: true });
          count++;
        }
      }

      await batch.commit();
      return { success: true, message: `Sincronização com a nuvem concluída (${count} registos atualizados).` };
    } catch (err: any) {
      console.warn('[CloudSync] Erro no envio em lote:', err);
      return { success: false, message: err?.message || 'Falha ao sincronizar em lote.' };
    }
  },

  /**
   * Escuta alterações em tempo real de uma coleção do Firestore
   */
  subscribeToCollection<T>(collectionName: string, onData: (items: T[]) => void): Unsubscribe | null {
    if (!this.isConfigured()) return null;
    try {
      const colRef = collection(db, collectionName);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const items = snapshot.docs.map(docSnap => docSnap.data() as T);
          onData(items);
        },
        (err) => {
          console.warn(`[CloudSync Realtime] Listener falhou para ${collectionName}:`, err);
        }
      );
    } catch (err) {
      console.warn(`[CloudSync Realtime] Erro ao subscrever em ${collectionName}:`, err);
      return null;
    }
  }
};
