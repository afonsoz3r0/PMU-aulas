import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { Tarefa } from '../../models/tarefa.model';
import { Projeto } from '../../models/projeto.model';
import { ProjetoService } from '../../services/projeto.service';
import { TarefaService } from '../../services/tarefa.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mover-tarefa-modal',
  templateUrl: './mover-tarefa-modal.component.html',
  styleUrls: ['./mover-tarefa-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class MoverTarefaModalComponent implements OnInit, OnDestroy {
  @Input() tarefa!: Tarefa;
  
  projetos: Projeto[] = [];
  projetoSelecionado: number | null = null;
  loading = false;
  private subscriptions = new Subscription();

  constructor(
    private modalController: ModalController,
    private projetoService: ProjetoService,
    private tarefaService: TarefaService
  ) {}

  ngOnInit() {
    this.projetoSelecionado = this.tarefa.projetoId || null;
    this.loadProjetos();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private loadProjetos() {
    this.loading = true;
    const sub = this.projetoService.getAll().subscribe({
      next: (projetos) => {
        this.projetos = projetos;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar projetos:', error);
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  getProjetoNome(projetoId: number): string {
    const projeto = this.projetos.find(p => p.id === projetoId);
    return projeto ? projeto.nome : 'Projeto não encontrado';
  }

  async onConfirmar() {
    if (this.projetoSelecionado === this.tarefa.projetoId) {
      // Não houve mudança
      await this.modalController.dismiss();
      return;
    }

    this.tarefaService.moveToProjeto(this.tarefa.id, this.projetoSelecionado);
    await this.modalController.dismiss({ moved: true });
  }

  async onCancelar() {
    await this.modalController.dismiss();
  }
}

