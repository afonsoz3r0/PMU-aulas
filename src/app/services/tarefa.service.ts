import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Tarefa, TarefaFormData, TarefaStatus, normalizarTarefas, tarefaFromStorage, tarefaToStorage } from '../models/tarefa.model';
import { NotificacaoService } from './notificacao.service';

@Injectable({
  providedIn: 'root'
})
export class TarefaService {
  private readonly STORAGE_KEY = 'tarefas_app';
  private tarefasSubject = new BehaviorSubject<Tarefa[]>([]);
  public tarefas$ = this.tarefasSubject.asObservable();

  constructor(private notificacaoService: NotificacaoService) {
    this.loadFromStorage();
    // Reagendar notificações ao carregar
    this.reagendarNotificacoes();
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const storageData: any[] = JSON.parse(stored);
        // Converter do formato storage para Tarefa e normalizar ordens
        const tarefas = storageData.map((t: any, index) => tarefaFromStorage(t, index));
        // Normalizar ordens (garantir que todas tenham ordem)
        const tarefasNormalizadas = normalizarTarefas(tarefas);
        // Ordenar por ordem (fallback para id/dataCriacao)
        const tarefasOrdenadas = this.sortTarefasByOrdem(tarefasNormalizadas);
        this.tarefasSubject.next(tarefasOrdenadas);
      } catch (error) {
        console.error('Erro ao carregar tarefas do storage:', error);
        const defaultTarefas = this.getDefaultTarefas();
        const normalizadas = normalizarTarefas(defaultTarefas);
        this.tarefasSubject.next(normalizadas);
      }
    } else {
      const defaultTarefas = this.getDefaultTarefas();
      const normalizadas = normalizarTarefas(defaultTarefas);
      this.tarefasSubject.next(normalizadas);
      this.saveToStorage();
    }
  }

  /**
   * Ordena tarefas por ordem (fallback para id/dataCriacao)
   */
  private sortTarefasByOrdem(tarefas: Tarefa[]): Tarefa[] {
    return [...tarefas].sort((a, b) => {
      // Primeiro por ordem
      const ordemA = a.ordem !== undefined && a.ordem !== null ? a.ordem : Number.MAX_SAFE_INTEGER;
      const ordemB = b.ordem !== undefined && b.ordem !== null ? b.ordem : Number.MAX_SAFE_INTEGER;
      
      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }
      
      // Fallback: por id
      if (a.id !== b.id) {
        return a.id - b.id;
      }
      
      // Fallback final: por dataCriacao
      return new Date(a.dataCriacao).getTime() - new Date(b.dataCriacao).getTime();
    });
  }

  private getDefaultTarefas(): Tarefa[] {
    return [
      {
        id: 1,
        titulo: 'Estudar Angular',
        descricao: 'Revisar documentação e fazer exercícios práticos',
        status: TarefaStatus.TODO,
        prioridade: 'alta' as any,
        dataCriacao: new Date(),
        categoria: 'Estudos',
        tags: ['angular', 'estudo']
      },
      {
        id: 2,
        titulo: 'Trabalho de Programação Móvel',
        descricao: 'Desenvolver aplicação Ionic completa',
        status: TarefaStatus.IN_PROGRESS,
        prioridade: 'alta' as any,
        dataCriacao: new Date(),
        categoria: 'Projetos',
        tags: ['ionic', 'projeto']
      },
      {
        id: 3,
        titulo: 'Lanche de curso',
        descricao: 'Organizar lanche para o curso',
        status: TarefaStatus.TODO,
        prioridade: 'baixa' as any,
        dataCriacao: new Date(),
        categoria: 'Pessoais',
        tags: ['pessoal']
      }
    ];
  }

  private saveToStorage(): void {
    try {
      // Usar tarefaToStorage para converter datas para ISO strings e manter ordem
      const storageData = this.tarefasSubject.value.map(t => tarefaToStorage(t));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Erro ao salvar tarefas no storage:', error);
    }
  }

  private getNextId(): number {
    const tarefas = this.tarefasSubject.value;
    return tarefas.length > 0 ? Math.max(...tarefas.map(t => t.id)) + 1 : 1;
  }

  getAll(): Observable<Tarefa[]> {
    return this.tarefas$.pipe(
      map(tarefas => this.sortTarefasByOrdem(tarefas)),
      delay(300)
    );
  }

  getById(id: number): Observable<Tarefa | undefined> {
    return this.tarefas$.pipe(
      map(tarefas => tarefas.find(t => t.id === id)),
      delay(200)
    );
  }

  getByStatus(status: TarefaStatus): Observable<Tarefa[]> {
    return this.tarefas$.pipe(
      map(tarefas => tarefas.filter(t => t.status === status)),
      delay(200)
    );
  }

  create(tarefaData: TarefaFormData): Observable<Tarefa> {
    const tarefasAtuais = this.tarefasSubject.value;
    const novaTarefa: Tarefa = {
      id: this.getNextId(),
      ...tarefaData,
      dataCriacao: new Date(),
      ordem: tarefasAtuais.length // Atribuir ordem como último item
    };

    const tarefas = [...this.tarefasSubject.value, novaTarefa];
    this.tarefasSubject.next(tarefas);
    this.saveToStorage();

    // Agendar notificação para a nova tarefa
    this.notificacaoService.agendarNotificacaoTarefa(novaTarefa).catch(err => {
      console.error('Erro ao agendar notificação:', err);
    });

    return of(novaTarefa).pipe(delay(300));
  }

  update(id: number, tarefaData: Partial<TarefaFormData>): Observable<Tarefa> {
    const tarefas = this.tarefasSubject.value.map(t =>
      t.id === id ? { ...t, ...tarefaData } : t
    );

    const updated = tarefas.find(t => t.id === id);
    if (!updated) {
      throw new Error('Tarefa não encontrada');
    }

    this.tarefasSubject.next(tarefas);
    this.saveToStorage();

    // Reagendar notificação para a tarefa atualizada
    this.notificacaoService.agendarNotificacaoTarefa(updated).catch(err => {
      console.error('Erro ao reagendar notificação:', err);
    });

    return of(updated).pipe(delay(300));
  }

  delete(id: number): Observable<boolean> {
    const tarefas = this.tarefasSubject.value.filter(t => t.id !== id);
    this.tarefasSubject.next(tarefas);
    this.saveToStorage();

    // Cancelar notificação da tarefa deletada
    this.notificacaoService.cancelarNotificacaoTarefa(id).catch(err => {
      console.error('Erro ao cancelar notificação:', err);
    });

    return of(true).pipe(delay(300));
  }

  search(query: string): Observable<Tarefa[]> {
    const lowerQuery = query.toLowerCase();
    return this.tarefas$.pipe(
      map(tarefas =>
        tarefas.filter(
          t =>
            t.titulo.toLowerCase().includes(lowerQuery) ||
            t.descricao.toLowerCase().includes(lowerQuery) ||
            t.categoria?.toLowerCase().includes(lowerQuery) ||
            t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
        )
      ),
      delay(200)
    );
  }

  getCategorias(): Observable<string[]> {
    return this.tarefas$.pipe(
      map(tarefas => {
        const categorias = tarefas
          .map(t => t.categoria)
          .filter((c): c is string => !!c);
        return [...new Set(categorias)];
      })
    );
  }

  /**
   * Remove todas as tarefas associadas a um projeto
   * @param projetoId ID do projeto
   */
  removeByProjetoId(projetoId: number): void {
    const tarefas = this.tarefasSubject.value.filter(t => t.projetoId !== projetoId);
    this.tarefasSubject.next(tarefas);
    this.saveToStorage();
  }

  /**
   * Obtém tarefas por projeto
   * @param projetoId ID do projeto
   * @returns Observable com array de tarefas do projeto
   */
  getByProjeto(projetoId: number): Observable<Tarefa[]> {
    return this.tarefas$.pipe(
      map(tarefas => tarefas.filter(t => t.projetoId === projetoId)),
      delay(200)
    );
  }

  /**
   * Move uma tarefa para outro projeto (ou remove do projeto)
   * @param tarefaId ID da tarefa
   * @param projetoId ID do projeto destino (null para remover do projeto)
   */
  moveToProjeto(tarefaId: number, projetoId: number | null): void {
    const tarefas = this.tarefasSubject.value.map(t =>
      t.id === tarefaId ? { ...t, projetoId: projetoId || undefined } : t
    );
    this.tarefasSubject.next(tarefas);
    this.saveToStorage();

    // Reagendar notificação (caso a tarefa tenha data de vencimento)
    const tarefaAtualizada = tarefas.find(t => t.id === tarefaId);
    if (tarefaAtualizada) {
      this.notificacaoService.agendarNotificacaoTarefa(tarefaAtualizada).catch(err => {
        console.error('Erro ao reagendar notificação:', err);
      });
    }
  }

  /**
   * Verifica se uma tarefa está atrasada
   * @param tarefa Tarefa a verificar
   * @returns true se a tarefa está atrasada (dataVencimento < hoje e status != done)
   */
  isAtrasada(tarefa: Tarefa): boolean {
    if (!tarefa.dataVencimento) {
      return false;
    }

    // Se a tarefa já está concluída, não está atrasada
    if (tarefa.status === TarefaStatus.DONE) {
      return false;
    }

    // Comparar apenas a data (sem hora), usando startOfDay
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dataVencimento = new Date(tarefa.dataVencimento);
    dataVencimento.setHours(0, 0, 0, 0);

    return dataVencimento < hoje;
  }

  /**
   * Obtém todas as tarefas em atraso
   * @returns Observable com array de tarefas atrasadas
   */
  getAtrasadas(): Observable<Tarefa[]> {
    return this.tarefas$.pipe(
      map(tarefas => {
        const atrasadas = tarefas.filter(t => this.isAtrasada(t));
        return this.sortTarefasByOrdem(atrasadas);
      }),
      delay(200)
    );
  }

  /**
   * Obtém tarefas com data de vencimento para hoje
   * @returns Observable com array de tarefas para hoje
   */
  getParaHoje(): Observable<Tarefa[]> {
    return this.tarefas$.pipe(
      map(tarefas => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const amanha = new Date(hoje);
        amanha.setDate(amanha.getDate() + 1);

        const paraHoje = tarefas.filter(t => {
          if (!t.dataVencimento) return false;
          const dataVenc = new Date(t.dataVencimento);
          dataVenc.setHours(0, 0, 0, 0);
          return dataVenc.getTime() >= hoje.getTime() && dataVenc.getTime() < amanha.getTime();
        });

        return this.sortTarefasByOrdem(paraHoje);
      }),
      delay(200)
    );
  }

  /**
   * Obtém tarefas com data de vencimento nos próximos 7 dias (incluindo hoje)
   * @returns Observable com array de tarefas para próximos 7 dias
   */
  getProximos7Dias(): Observable<Tarefa[]> {
    return this.tarefas$.pipe(
      map(tarefas => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const em7Dias = new Date(hoje);
        em7Dias.setDate(em7Dias.getDate() + 7);

        const proximas = tarefas.filter(t => {
          if (!t.dataVencimento) return false;
          const dataVenc = new Date(t.dataVencimento);
          dataVenc.setHours(0, 0, 0, 0);
          return dataVenc.getTime() >= hoje.getTime() && dataVenc.getTime() <= em7Dias.getTime();
        });

        return this.sortTarefasByOrdem(proximas);
      }),
      delay(200)
    );
  }

  /**
   * Atualiza a ordem de um conjunto de tarefas
   * @param tarefas Array de tarefas na nova ordem
   * @param filtroProjetoId Opcional: se fornecido, atualiza apenas tarefas deste projeto
   */
  updateOrdem(tarefas: Tarefa[], filtroProjetoId?: number): void {
    const todasTarefas = this.tarefasSubject.value;
    
    // Criar mapa de novas ordens
    const novasOrdens = new Map<number, number>();
    tarefas.forEach((tarefa, index) => {
      novasOrdens.set(tarefa.id, index);
    });

    // Atualizar ordens apenas das tarefas no contexto
    const tarefasAtualizadas = todasTarefas.map(t => {
      if (filtroProjetoId !== undefined) {
        // Se há filtro de projeto, atualizar apenas tarefas desse projeto
        if (t.projetoId === filtroProjetoId && novasOrdens.has(t.id)) {
          return { ...t, ordem: novasOrdens.get(t.id)! };
        }
      } else {
        // Sem filtro: atualizar todas as tarefas que estão na lista
        if (novasOrdens.has(t.id)) {
          return { ...t, ordem: novasOrdens.get(t.id)! };
        }
      }
      return t;
    });

    this.tarefasSubject.next(tarefasAtualizadas);
    this.saveToStorage();
  }

  /**
   * Reagenda todas as notificações para todas as tarefas
   */
  private reagendarNotificacoes(): void {
    // Aguardar um pouco para garantir que o serviço de notificações está inicializado
    setTimeout(() => {
      const todasTarefas = this.tarefasSubject.value;
      this.notificacaoService.agendarNotificacoesTarefas(todasTarefas).catch(err => {
        console.error('Erro ao reagendar notificações:', err);
      });
    }, 1000);
  }
}


