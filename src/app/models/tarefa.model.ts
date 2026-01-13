export enum TarefaStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}

export enum TarefaPrioridade {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta'
}

/**
 * Modelo para Tarefa
 * Representa uma tarefa que pode estar associada a um projeto
 */
export interface Tarefa {
  id: number;
  titulo: string;
  descricao: string;
  status: TarefaStatus;
  prioridade: TarefaPrioridade;
  dataCriacao: Date;
  dataVencimento?: Date;
  categoria?: string;        // Categoria antiga (string) - manter para compatibilidade
  tags?: string[];
  projetoId?: number;        // FK para Projeto (opcional para compatibilidade)
  ordem?: number;            // Ordem de exibição (para persistir ordenação)
}

/**
 * Dados do formulário para criar/editar tarefa
 */
export interface TarefaFormData {
  titulo: string;
  descricao: string;
  status: TarefaStatus;
  prioridade: TarefaPrioridade;
  dataVencimento?: Date;
  categoria?: string;
  tags?: string[];
  projetoId?: number;
}

/**
 * Helper para converter Tarefa para formato de storage (datas como string ISO)
 */
export interface TarefaStorage {
  id: number;
  titulo: string;
  descricao: string;
  status: TarefaStatus;
  prioridade: TarefaPrioridade;
  dataCriacao: string;      // ISO string
  dataVencimento?: string;  // ISO string ou undefined
  categoria?: string;
  tags?: string[];
  projetoId?: number;
  ordem?: number;
}

/**
 * Converte Tarefa para formato de storage (datas como string)
 */
export function tarefaToStorage(tarefa: Tarefa): TarefaStorage {
  return {
    ...tarefa,
    dataCriacao: tarefa.dataCriacao.toISOString(),
    dataVencimento: tarefa.dataVencimento ? tarefa.dataVencimento.toISOString() : undefined
  };
}

/**
 * Converte dados do storage para Tarefa (datas como Date)
 * Faz parsing seguro das datas e garante compatibilidade com tarefas antigas
 */
export function tarefaFromStorage(storage: TarefaStorage, index?: number): Tarefa {
  const tarefa: Tarefa = {
    ...storage,
    dataCriacao: parseDateSafely(storage.dataCriacao),
    dataVencimento: storage.dataVencimento ? parseDateSafely(storage.dataVencimento) : undefined,
    // Garantir compatibilidade: se não tiver projetoId, deixa undefined
    projetoId: storage.projetoId !== undefined && storage.projetoId !== null ? storage.projetoId : undefined,
    // Garantir compatibilidade: se não tiver ordem, atribuir baseado no índice
    ordem: storage.ordem !== undefined && storage.ordem !== null ? storage.ordem : (index !== undefined ? index : 0)
  };
  
  return tarefa;
}

/**
 * Helper para parsing seguro de datas
 * Aceita string ISO ou Date e retorna Date válido
 */
function parseDateSafely(dateValue: string | Date | undefined): Date {
  if (!dateValue) {
    return new Date();
  }
  
  if (dateValue instanceof Date) {
    return dateValue;
  }
  
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    // Verifica se a data é válida
    if (isNaN(parsed.getTime())) {
      console.warn('Data inválida encontrada, usando data atual:', dateValue);
      return new Date();
    }
    return parsed;
  }
  
  return new Date();
}

/**
 * Helper para normalizar tarefas ao carregar do storage
 * Garante que todas as tarefas tenham ordem definida
 */
export function normalizarTarefas(tarefas: Tarefa[]): Tarefa[] {
  return tarefas.map((tarefa, index) => ({
    ...tarefa,
    // Se não tiver ordem, atribuir baseado no índice atual
    ordem: tarefa.ordem !== undefined && tarefa.ordem !== null ? tarefa.ordem : index
  }));
}


