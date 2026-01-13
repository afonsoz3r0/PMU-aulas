import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  Projeto,
  ProjetoFormData,
  ProjetoStorage,
  projetoToStorage,
  projetoFromStorage
} from '../models/projeto.model';
import { CategoriaProjetoService } from './categoria-projeto.service';
import { TarefaService } from './tarefa.service';

@Injectable({
  providedIn: 'root'
})
export class ProjetoService {
  private readonly STORAGE_KEY = 'projetos_app';
  private projetosSubject = new BehaviorSubject<Projeto[]>([]);
  public projetos$ = this.projetosSubject.asObservable();

  constructor(
    private categoriaProjetoService: CategoriaProjetoService,
    private tarefaService: TarefaService
  ) {
    this.loadFromStorage();
  }

  /**
   * Carrega projetos do localStorage ao inicializar
   */
  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const storageData: ProjetoStorage[] = JSON.parse(stored);
        const projetos = storageData.map(proj => projetoFromStorage(proj));
        this.projetosSubject.next(projetos);
      } catch (error) {
        console.error('Erro ao carregar projetos do storage:', error);
        this.projetosSubject.next([]);
      }
    } else {
      this.projetosSubject.next([]);
    }
  }

  /**
   * Salva projetos no localStorage
   */
  private saveToStorage(): void {
    try {
      const storageData = this.projetosSubject.value.map(proj => projetoToStorage(proj));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Erro ao salvar projetos no storage:', error);
    }
  }

  /**
   * Gera o próximo ID disponível
   */
  private getNextId(): number {
    const projetos = this.projetosSubject.value;
    return projetos.length > 0 ? Math.max(...projetos.map(p => p.id)) + 1 : 1;
  }

  /**
   * Verifica se uma categoria existe
   * @param categoriaId ID da categoria a verificar
   */
  private categoriaExiste(categoriaId: number): boolean {
    // Acessa diretamente o valor atual do BehaviorSubject para verificação síncrona
    // Nota: Em produção, considere expor um método público no CategoriaProjetoService
    const categorias = (this.categoriaProjetoService as any).categoriasSubject?.value || [];
    return categorias.some((c: any) => c.id === categoriaId);
  }

  /**
   * Obtém todos os projetos
   * @returns Observable com array de projetos
   */
  getAll(): Observable<Projeto[]> {
    return this.projetos$.pipe(delay(200));
  }

  /**
   * Obtém um projeto por ID
   * @param id ID do projeto
   * @returns Observable com o projeto ou undefined
   */
  getById(id: number): Observable<Projeto | undefined> {
    return this.projetos$.pipe(
      map(projetos => projetos.find(p => p.id === id)),
      delay(200)
    );
  }

  /**
   * Obtém projetos por categoria
   * @param categoriaId ID da categoria
   * @returns Observable com array de projetos
   */
  getByCategoria(categoriaId: number): Observable<Projeto[]> {
    return this.projetos$.pipe(
      map(projetos => projetos.filter(p => p.categoriaId === categoriaId)),
      delay(200)
    );
  }

  /**
   * Cria um novo projeto
   * @param data Dados do projeto
   * @returns Observable com o projeto criado
   * @throws Error se nome for vazio ou categoriaId inválido
   */
  create(data: ProjetoFormData): Observable<Projeto> {
    // Validação: nome obrigatório
    if (!data.nome || !data.nome.trim()) {
      throw new Error('Nome do projeto é obrigatório');
    }

    // Validação: categoriaId válido
    if (!this.categoriaExiste(data.categoriaId)) {
      throw new Error('Categoria inválida');
    }

    const novoProjeto: Projeto = {
      id: this.getNextId(),
      nome: data.nome.trim(),
      descricao: data.descricao?.trim() || undefined,
      categoriaId: data.categoriaId,
      dataCriacao: new Date()
    };

    const projetos = [...this.projetosSubject.value, novoProjeto];
    this.projetosSubject.next(projetos);
    this.saveToStorage();

    return of(novoProjeto).pipe(delay(300));
  }

  /**
   * Atualiza um projeto existente
   * @param id ID do projeto
   * @param patch Dados parciais para atualizar
   * @returns Observable com o projeto atualizado
   * @throws Error se projeto não encontrado, nome vazio ou categoriaId inválido
   */
  update(id: number, patch: Partial<ProjetoFormData>): Observable<Projeto> {
    const projetos = this.projetosSubject.value;
    const projetoIndex = projetos.findIndex(p => p.id === id);

    if (projetoIndex === -1) {
      throw new Error('Projeto não encontrado');
    }

    const projetoAtual = projetos[projetoIndex];

    // Validação: se estiver a atualizar o nome, verificar se não é vazio
    if (patch.nome !== undefined) {
      if (!patch.nome || !patch.nome.trim()) {
        throw new Error('Nome do projeto é obrigatório');
      }
    }

    // Validação: se estiver a atualizar categoriaId, verificar se é válido
    if (patch.categoriaId !== undefined) {
      if (!this.categoriaExiste(patch.categoriaId)) {
        throw new Error('Categoria inválida');
      }
    }

    const projetoAtualizado: Projeto = {
      ...projetoAtual,
      ...(patch.nome !== undefined && { nome: patch.nome.trim() }),
      ...(patch.descricao !== undefined && { descricao: patch.descricao?.trim() || undefined }),
      ...(patch.categoriaId !== undefined && { categoriaId: patch.categoriaId })
    };

    const novosProjetos = [...projetos];
    novosProjetos[projetoIndex] = projetoAtualizado;
    this.projetosSubject.next(novosProjetos);
    this.saveToStorage();

    return of(projetoAtualizado).pipe(delay(300));
  }

  /**
   * Remove um projeto e todas as tarefas associadas
   * @param id ID do projeto a remover
   * @returns Observable com boolean indicando sucesso
   * @throws Error se projeto não encontrado
   */
  remove(id: number): Observable<boolean> {
    const projetos = this.projetosSubject.value;
    const projeto = projetos.find(p => p.id === id);

    if (!projeto) {
      throw new Error('Projeto não encontrado');
    }

    // Remove todas as tarefas associadas ao projeto
    this.tarefaService.removeByProjetoId(id);

    // Remove o projeto
    const novosProjetos = projetos.filter(p => p.id !== id);
    this.projetosSubject.next(novosProjetos);
    this.saveToStorage();

    return of(true).pipe(delay(300));
  }
}

