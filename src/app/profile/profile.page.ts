import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TarefaService } from '../services/tarefa.service';
import { Tarefa, TarefaStatus } from '../models/tarefa.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: false,
})
export class ProfilePage implements OnInit, OnDestroy {
  totalTarefas = 0;
  tarefasPendentes = 0;
  tarefasConcluidas = 0;
  tarefasEmProgresso = 0;
  tarefasRecentes: Tarefa[] = [];
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private tarefaService: TarefaService
  ) {}

  ngOnInit() {
    this.loadEstatisticas();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadEstatisticas() {
    const sub = this.tarefaService.getAll().subscribe({
      next: (tarefas) => {
        this.totalTarefas = tarefas.length;
        this.tarefasPendentes = tarefas.filter(t => t.status === TarefaStatus.TODO).length;
        this.tarefasEmProgresso = tarefas.filter(t => t.status === TarefaStatus.IN_PROGRESS).length;
        this.tarefasConcluidas = tarefas.filter(t => t.status === TarefaStatus.DONE).length;
        
        // Últimas 5 tarefas criadas
        this.tarefasRecentes = tarefas
          .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
          .slice(0, 5);
      }
    });
    this.subscriptions.add(sub);
  }

  async doRefresh(event: any) {
    await this.loadEstatisticas();
    event.target.complete();
  }

  navegarParaProjetos() {
    this.router.navigateByUrl('/projetos');
  }

  navegarParaCategorias() {
    this.router.navigateByUrl('/categorias-projeto');
  }

  navegarParaSettings() {
    this.router.navigateByUrl('/setting');
  }

  navegarParaAbout() {
    this.router.navigateByUrl('/about');
  }

  navegarParaTarefa(id: number) {
    this.router.navigateByUrl(`/tarefa/${id}`);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
}
