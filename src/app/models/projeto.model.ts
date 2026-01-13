import { CategoriaProjeto } from './categoria-projeto.model';

/**
 * Modelo para Projeto
 * Representa um projeto que agrupa tarefas
 */
export interface Projeto {
  id: number;
  nome: string;
  descricao?: string;
  categoriaId: number;  // FK para CategoriaProjeto
  dataCriacao: Date;
}

/**
 * Dados do formulário para criar/editar projeto
 */
export interface ProjetoFormData {
  nome: string;
  descricao?: string;
  categoriaId: number;
}

/**
 * Projeto com categoria carregada (para exibição)
 */
export interface ProjetoComCategoria extends Projeto {
  categoria?: CategoriaProjeto;
}

/**
 * Helper para converter Projeto para formato de storage (datas como string ISO)
 */
export interface ProjetoStorage {
  id: number;
  nome: string;
  descricao?: string;
  categoriaId: number;
  dataCriacao: string;  // ISO string
}

/**
 * Converte Projeto para formato de storage (datas como string)
 */
export function projetoToStorage(projeto: Projeto): ProjetoStorage {
  return {
    ...projeto,
    dataCriacao: projeto.dataCriacao.toISOString()
  };
}

/**
 * Converte dados do storage para Projeto (datas como Date)
 * Faz parsing seguro da data
 */
export function projetoFromStorage(storage: ProjetoStorage): Projeto {
  return {
    ...storage,
    dataCriacao: parseDateSafely(storage.dataCriacao)
  };
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

