import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IonicModule, ItemReorderEventDetail } from '@ionic/angular';
import { Tarefa } from '../../models/tarefa.model';
import { Projeto } from '../../models/projeto.model';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ProjetoService } from '../../services/projeto.service';
import { TarefaService } from '../../services/tarefa.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tarefa-card',
  templateUrl: './tarefa-card.component.html',
  styleUrls: ['./tarefa-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, EmptyStateComponent]
})
export class TarefaCardComponent implements OnInit, OnDestroy {
  @Input() titulo: string = '';
  @Input() tarefas: Tarefa[] = [];
  @Output() editarTarefa = new EventEmitter<number>();
  @Output() eliminarTarefa = new EventEmitter<number>();
  @Output() reordenarTarefas = new EventEmitter<{event: CustomEvent<ItemReorderEventDetail>, tipo: string}>();

  projetos: Projeto[] = [];
  private subscriptions = new Subscription();

  constructor(
    private projetoService: ProjetoService,
    private tarefaService: TarefaService
  ) {}

  ngOnInit() {
    this.loadProjetos();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadProjetos() {
    const sub = this.projetoService.getAll().subscribe({
      next: (projetos) => {
        this.projetos = projetos;
      },
      error: (error) => {
        console.error('Erro ao carregar projetos:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  getProjetoNome(projetoId?: number): string {
    if (!projetoId) return 'Sem projeto';
    const projeto = this.projetos.find(p => p.id === projetoId);
    return projeto ? projeto.nome : 'Sem projeto';
  }

  onEditar(id: number, event: Event) {
    event.stopPropagation();
    this.editarTarefa.emit(id);
  }

  onEliminar(id: number, event: Event) {
    event.stopPropagation();
    this.eliminarTarefa.emit(id);
  }

  onReorder(event: CustomEvent<ItemReorderEventDetail>, tipo: string) {
    this.reordenarTarefas.emit({ event, tipo });
  }

  getPrioridadeColor(prioridade: string): string {
    switch (prioridade) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baixa': return 'success';
      default: return 'medium';
    }
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-PT');
  }

  isAtrasada(tarefa: Tarefa): boolean {
    return this.tarefaService.isAtrasada(tarefa);
  }
}
