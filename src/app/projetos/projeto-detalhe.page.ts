import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { ItemReorderEventDetail } from '@ionic/angular';
import { ProjetoService } from '../services/projeto.service';
import { CategoriaProjetoService } from '../services/categoria-projeto.service';
import { TarefaService } from '../services/tarefa.service';
import { Projeto } from '../models/projeto.model';
import { CategoriaProjeto } from '../models/categoria-projeto.model';
import { Tarefa, TarefaStatus } from '../models/tarefa.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-projeto-detalhe',
  templateUrl: './projeto-detalhe.page.html',
  styleUrls: ['./projeto-detalhe.page.scss'],
  standalone: false,
})
export class ProjetoDetalhePage implements OnInit, OnDestroy {
  projeto: Projeto | null = null;
  categoria: CategoriaProjeto | undefined;
  tarefas: Tarefa[] = [];
  toDo: Tarefa[] = [];
  inProgress: Tarefa[] = [];
  done: Tarefa[] = [];
  loading = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projetoService: ProjetoService,
    private categoriaProjetoService: CategoriaProjetoService,
    private tarefaService: TarefaService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadProjeto();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadProjeto() {
    this.loading = true;
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.showToast('ID do projeto não fornecido', 'danger');
      this.router.navigateByUrl('/projetos');
      return;
    }

    const sub = this.projetoService.getById(+id).subscribe({
      next: async (projeto) => {
        if (!projeto) {
          this.showToast('Projeto não encontrado', 'danger');
          this.router.navigateByUrl('/projetos');
          return;
        }
        this.projeto = projeto;
        await this.loadCategoria(projeto.categoriaId);
        this.loadTarefas(+id);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar projeto:', error);
        this.showToast('Erro ao carregar projeto', 'danger');
        this.loading = false;
        this.router.navigateByUrl('/projetos');
      }
    });
    this.subscriptions.add(sub);
  }

  async loadCategoria(categoriaId: number) {
    const sub = this.categoriaProjetoService.getById(categoriaId).subscribe({
      next: (categoria) => {
        this.categoria = categoria;
      },
      error: (error) => {
        console.error('Erro ao carregar categoria:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  loadTarefas(projetoId: number) {
    const sub = this.tarefaService.getByProjeto(projetoId).subscribe({
      next: (tarefas) => {
        this.tarefas = tarefas;
        this.toDo = tarefas.filter(t => t.status === TarefaStatus.TODO);
        this.inProgress = tarefas.filter(t => t.status === TarefaStatus.IN_PROGRESS);
        this.done = tarefas.filter(t => t.status === TarefaStatus.DONE);
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  navegarParaEditar() {
    if (this.projeto) {
      this.router.navigateByUrl(`/projetos/${this.projeto.id}/editar`);
    }
  }

  navegarParaTarefa(id: number) {
    this.router.navigateByUrl(`/tarefa/${id}`);
  }

  navegarParaProjetos() {
    this.router.navigateByUrl('/projetos');
  }

  navegarParaCriarTarefa() {
    if (this.projeto) {
      this.router.navigateByUrl(`/tarefa/novo?projetoId=${this.projeto.id}`);
    } else {
      this.router.navigateByUrl('/tarefa/novo');
    }
  }

  onReordenarTarefas(event: CustomEvent<ItemReorderEventDetail>, tipo: string) {
    if (!this.projeto) {
      event.detail.complete();
      return;
    }

    let lista: Tarefa[] = [];

    if (tipo === 'To Do') {
      lista = [...this.toDo];
    } else if (tipo === 'In Progress') {
      lista = [...this.inProgress];
    } else if (tipo === 'Done') {
      lista = [...this.done];
    } else {
      event.detail.complete();
      return;
    }

    // Mover item na lista
    const itemMove = lista.splice(event.detail.from, 1)[0];
    lista.splice(event.detail.to, 0, itemMove);

    // Recalcular ordem 0..n-1 para as tarefas deste projeto
    const tarefasComOrdemAtualizada = lista.map((tarefa, index) => ({
      ...tarefa,
      ordem: index
    }));

    // Atualizar ordens no service (passar projetoId para atualizar apenas tarefas deste projeto)
    this.tarefaService.updateOrdem(tarefasComOrdemAtualizada, this.projeto.id);

    event.detail.complete();
    this.loadTarefas(this.projeto.id); // Recarregar para refletir nova ordem
  }

  formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-PT');
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}

