/**
 * Modelo para Categoria de Projeto
 * Representa uma categoria que agrupa projetos
 */
export interface CategoriaProjeto {
  id: number;
  nome: string;
  cor?: string;        // Cor em hex para UI (ex: "#3880ff")
  icone?: string;      // Nome do ícone Ionic (ex: "briefcase-outline")
  dataCriacao: Date;
}

/**
 * Dados do formulário para criar/editar categoria
 */
export interface CategoriaProjetoFormData {
  nome: string;
  cor?: string;
  icone?: string;
}

/**
 * Helper para converter CategoriaProjeto para formato de storage (datas como string ISO)
 */
export interface CategoriaProjetoStorage {
  id: number;
  nome: string;
  cor?: string;
  icone?: string;
  dataCriacao: string;  // ISO string
}

/**
 * Converte CategoriaProjeto para formato de storage (datas como string)
 */
export function categoriaProjetoToStorage(categoria: CategoriaProjeto): CategoriaProjetoStorage {
  return {
    ...categoria,
    dataCriacao: categoria.dataCriacao.toISOString()
  };
}

/**
 * Converte dados do storage para CategoriaProjeto (datas como Date)
 * Faz parsing seguro da data
 */
export function categoriaProjetoFromStorage(storage: CategoriaProjetoStorage): CategoriaProjeto {
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

