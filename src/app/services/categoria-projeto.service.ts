import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  CategoriaProjeto,
  CategoriaProjetoFormData,
  CategoriaProjetoStorage,
  categoriaProjetoToStorage,
  categoriaProjetoFromStorage
} from '../models/categoria-projeto.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaProjetoService {
  private readonly STORAGE_KEY = 'categorias_projeto_app';
  private readonly PROJETOS_STORAGE_KEY = 'projetos_app';
  private categoriasSubject = new BehaviorSubject<CategoriaProjeto[]>([]);
  public categorias$ = this.categoriasSubject.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Carrega categorias do localStorage ao inicializar
   */
  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const storageData: CategoriaProjetoStorage[] = JSON.parse(stored);
        const categorias = storageData.map(cat => categoriaProjetoFromStorage(cat));
        this.categoriasSubject.next(categorias);
      } catch (error) {
        console.error('Erro ao carregar categorias do storage:', error);
        this.categoriasSubject.next([]);
      }
    } else {
      this.categoriasSubject.next([]);
    }
  }

  /**
   * Salva categorias no localStorage
   */
  private saveToStorage(): void {
    try {
      const storageData = this.categoriasSubject.value.map(cat => categoriaProjetoToStorage(cat));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Erro ao salvar categorias no storage:', error);
    }
  }

  /**
   * Gera o próximo ID disponível
   */
  private getNextId(): number {
    const categorias = this.categoriasSubject.value;
    return categorias.length > 0 ? Math.max(...categorias.map(c => c.id)) + 1 : 1;
  }

  /**
   * Verifica se existe categoria com o mesmo nome (case-insensitive)
   * @param nome Nome a verificar
   * @param excludeId ID a excluir da verificação (útil para update)
   */
  private nomeExiste(nome: string, excludeId?: number): boolean {
    const nomeLower = nome.trim().toLowerCase();
    return this.categoriasSubject.value.some(
      cat => cat.id !== excludeId && cat.nome.toLowerCase() === nomeLower
    );
  }

  /**
   * Verifica se existem projetos associados a uma categoria
   * @param categoriaId ID da categoria a verificar
   */
  private hasProjetosAssociados(categoriaId: number): boolean {
    try {
      const projetosStored = localStorage.getItem(this.PROJETOS_STORAGE_KEY);
      if (!projetosStored) {
        return false;
      }
      const projetos: any[] = JSON.parse(projetosStored);
      return projetos.some((p: any) => p.categoriaId === categoriaId);
    } catch (error) {
      console.error('Erro ao verificar projetos associados:', error);
      return false;
    }
  }

  /**
   * Obtém todas as categorias
   * @returns Observable com array de categorias
   */
  getAll(): Observable<CategoriaProjeto[]> {
    return this.categorias$.pipe(delay(200));
  }

  /**
   * Obtém uma categoria por ID
   * @param id ID da categoria
   * @returns Observable com a categoria ou undefined
   */
  getById(id: number): Observable<CategoriaProjeto | undefined> {
    return this.categorias$.pipe(
      map(categorias => categorias.find(c => c.id === id)),
      delay(200)
    );
  }

  /**
   * Cria uma nova categoria
   * @param data Dados da categoria
   * @returns Observable com a categoria criada
   * @throws Error se nome for vazio ou duplicado
   */
  create(data: CategoriaProjetoFormData): Observable<CategoriaProjeto> {
    // Validação: nome obrigatório
    if (!data.nome || !data.nome.trim()) {
      throw new Error('Nome da categoria é obrigatório');
    }

    // Validação: não permitir duplicados (case-insensitive)
    if (this.nomeExiste(data.nome)) {
      throw new Error(`Já existe uma categoria com o nome "${data.nome}"`);
    }

    const novaCategoria: CategoriaProjeto = {
      id: this.getNextId(),
      nome: data.nome.trim(),
      cor: data.cor?.trim() || undefined,
      icone: data.icone?.trim() || undefined,
      dataCriacao: new Date()
    };

    const categorias = [...this.categoriasSubject.value, novaCategoria];
    this.categoriasSubject.next(categorias);
    this.saveToStorage();

    return of(novaCategoria).pipe(delay(300));
  }

  /**
   * Atualiza uma categoria existente
   * @param id ID da categoria
   * @param patch Dados parciais para atualizar
   * @returns Observable com a categoria atualizada
   * @throws Error se categoria não encontrada, nome vazio ou duplicado
   */
  update(id: number, patch: Partial<CategoriaProjetoFormData>): Observable<CategoriaProjeto> {
    const categorias = this.categoriasSubject.value;
    const categoriaIndex = categorias.findIndex(c => c.id === id);

    if (categoriaIndex === -1) {
      throw new Error('Categoria não encontrada');
    }

    const categoriaAtual = categorias[categoriaIndex];

    // Validação: se estiver a atualizar o nome, verificar se não é vazio
    if (patch.nome !== undefined) {
      if (!patch.nome || !patch.nome.trim()) {
        throw new Error('Nome da categoria é obrigatório');
      }

      // Validação: não permitir duplicados (case-insensitive), excluindo a atual
      if (this.nomeExiste(patch.nome, id)) {
        throw new Error(`Já existe uma categoria com o nome "${patch.nome}"`);
      }
    }

    const categoriaAtualizada: CategoriaProjeto = {
      ...categoriaAtual,
      ...(patch.nome !== undefined && { nome: patch.nome.trim() }),
      ...(patch.cor !== undefined && { cor: patch.cor?.trim() || undefined }),
      ...(patch.icone !== undefined && { icone: patch.icone?.trim() || undefined })
    };

    const novasCategorias = [...categorias];
    novasCategorias[categoriaIndex] = categoriaAtualizada;
    this.categoriasSubject.next(novasCategorias);
    this.saveToStorage();

    return of(categoriaAtualizada).pipe(delay(300));
  }

  /**
   * Remove uma categoria
   * @param id ID da categoria a remover
   * @returns Observable com boolean indicando sucesso
   * @throws Error se categoria não encontrada ou se houver projetos associados
   */
  remove(id: number): Observable<boolean> {
    const categorias = this.categoriasSubject.value;
    const categoria = categorias.find(c => c.id === id);

    if (!categoria) {
      throw new Error('Categoria não encontrada');
    }

    // Validação: não permitir remover se houver projetos associados
    if (this.hasProjetosAssociados(id)) {
      throw new Error('Não é possível remover a categoria pois existem projetos associados');
    }

    const novasCategorias = categorias.filter(c => c.id !== id);
    this.categoriasSubject.next(novasCategorias);
    this.saveToStorage();

    return of(true).pipe(delay(300));
  }
}

