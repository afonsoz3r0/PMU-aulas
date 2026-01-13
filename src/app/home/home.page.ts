import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TarefaService } from '../services/tarefa.service';
import { Tarefa, TarefaStatus } from '../models/tarefa.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  tarefasAtrasadas: Tarefa[] = [];
  tarefasHoje: Tarefa[] = [];
  tarefasProximos7Dias: Tarefa[] = [];
  loading = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private tarefaService: TarefaService
  ) {}

  ngOnInit() {
    this.loadDashboard();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadDashboard() {
    this.loading = true;

    // Carregar tarefas atrasadas
    const sub1 = this.tarefaService.getAtrasadas().subscribe({
      next: (tarefas) => {
        this.tarefasAtrasadas = tarefas;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas atrasadas:', error);
        this.loading = false;
      }
    });

    // Carregar tarefas para hoje
    const sub2 = this.tarefaService.getParaHoje().subscribe({
      next: (tarefas) => {
        this.tarefasHoje = tarefas;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas para hoje:', error);
      }
    });

    // Carregar tarefas para próximos 7 dias
    const sub3 = this.tarefaService.getProximos7Dias().subscribe({
      next: (tarefas) => {
        this.tarefasProximos7Dias = tarefas;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas para próximos 7 dias:', error);
      }
    });

    this.subscriptions.add(sub1);
    this.subscriptions.add(sub2);
    this.subscriptions.add(sub3);
  }

  async doRefresh(event: any) {
    await this.loadDashboard();
    event.target.complete();
  }

  navegarParaTarefa(id: number) {
    this.router.navigateByUrl(`/tarefa/${id}`);
  }

  navegarParaEditarTarefa(id: number) {
    this.router.navigateByUrl(`/tarefa/${id}/editar`);
  }

  navegarParaCriarTarefa() {
    this.router.navigateByUrl('/tarefa/novo');
  }

  navegarParaCalendario() {
    this.router.navigateByUrl('/tabs/calendar');
  }

  navegarParaProjetos() {
    this.router.navigateByUrl('/projetos');
  }

  navegarParaCategorias() {
    this.router.navigateByUrl('/categorias-projeto');
  }

  navegarParaLista() {
    this.router.navigateByUrl('/lista');
  }

  getPrioridadeColor(prioridade: string): string {
    switch (prioridade) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baixa': return 'success';
      default: return 'medium';
    }
  }

  getStatusColor(status: TarefaStatus): string {
    switch (status) {
      case TarefaStatus.TODO: return 'primary';
      case TarefaStatus.IN_PROGRESS: return 'warning';
      case TarefaStatus.DONE: return 'success';
      default: return 'medium';
    }
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  isAtrasada(tarefa: Tarefa): boolean {
    return this.tarefaService.isAtrasada(tarefa);
  }
}
