import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { TarefaService } from '../services/tarefa.service';
import { ProjetoService } from '../services/projeto.service';
import { Tarefa, TarefaStatus } from '../models/tarefa.model';
import { Projeto } from '../models/projeto.model';
import { ItemReorderEventDetail } from '@ionic/angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lista',
  templateUrl: './lista.page.html',
  styleUrls: ['./lista.page.scss'],
  standalone: false,
})
export class ListaPage implements OnInit, OnDestroy {
  toDo: Tarefa[] = [];
  inProgress: Tarefa[] = [];
  done: Tarefa[] = [];
  atrasadas: Tarefa[] = [];
  loading = false;
  searchQuery = '';
  filterCategoria = '';
  filterProjetoId: number | null = null;
  mostrarAtrasadas = false;
  categorias: string[] = [];
  projetos: Projeto[] = [];
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private tarefaService: TarefaService,
    private projetoService: ProjetoService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadTarefas();
    this.loadCategorias();
    this.loadProjetos();
    this.loadAtrasadas();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadTarefas() {
    this.loading = true;
    const sub = this.tarefaService.getAll().subscribe({
      next: (tarefas) => {
        let filteredTarefas = tarefas;

        // Aplicar filtro de projeto
        if (this.filterProjetoId !== null) {
          filteredTarefas = filteredTarefas.filter(t => t.projetoId === this.filterProjetoId);
        }

        // Aplicar filtro de categoria (string antiga)
        if (this.filterCategoria) {
          filteredTarefas = filteredTarefas.filter(t => t.categoria === this.filterCategoria);
        }

        // Se mostrar apenas atrasadas, filtrar
        if (this.mostrarAtrasadas) {
          filteredTarefas = filteredTarefas.filter(t => this.tarefaService.isAtrasada(t));
        }

        this.toDo = filteredTarefas.filter(t => t.status === TarefaStatus.TODO);
        this.inProgress = filteredTarefas.filter(t => t.status === TarefaStatus.IN_PROGRESS);
        this.done = filteredTarefas.filter(t => t.status === TarefaStatus.DONE);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas:', error);
        this.showToast('Erro ao carregar tarefas', 'danger');
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  loadAtrasadas() {
    const sub = this.tarefaService.getAtrasadas().subscribe({
      next: (tarefas) => {
        this.atrasadas = tarefas;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas atrasadas:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  loadCategorias() {
    const sub = this.tarefaService.getCategorias().subscribe({
      next: (cats) => {
        this.categorias = cats;
      }
    });
    this.subscriptions.add(sub);
  }

  loadProjetos() {
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

  async doRefresh(event: any) {
    await this.loadTarefas();
    event.target.complete();
  }

  navegarParaHome() {
    this.router.navigateByUrl('/tabs/home');
  }

  navegarParaTarefa(id: number) {
    this.router.navigateByUrl(`/tarefa/${id}`);
  }

  navegarParaCriarTarefa() {
    this.router.navigateByUrl('/tarefa/novo');
  }

  onEditarTarefa(id: number) {
    this.router.navigateByUrl(`/tarefa/${id}/editar`);
  }

  async onEliminarTarefa(id: number, tipo: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir esta tarefa?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Excluindo tarefa...'
            });
            await loading.present();

            this.tarefaService.delete(id).subscribe({
              next: () => {
                loading.dismiss();
                this.showToast('Tarefa excluída com sucesso', 'success');
                this.loadTarefas();
              },
              error: (error) => {
                loading.dismiss();
                console.error('Erro ao excluir tarefa:', error);
                this.showToast('Erro ao excluir tarefa', 'danger');
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  onReordenarTarefas(event: CustomEvent<ItemReorderEventDetail>, tipo: string) {
    let lista: Tarefa[] = [];
    let status: TarefaStatus;

    if (tipo === 'To Do') {
      lista = [...this.toDo];
      status = TarefaStatus.TODO;
    } else if (tipo === 'In Progress') {
      lista = [...this.inProgress];
      status = TarefaStatus.IN_PROGRESS;
    } else if (tipo === 'Done') {
      lista = [...this.done];
      status = TarefaStatus.DONE;
    } else {
      event.detail.complete();
      return;
    }

    // Mover item na lista
    const itemMove = lista.splice(event.detail.from, 1)[0];
    lista.splice(event.detail.to, 0, itemMove);

    // Recalcular ordem 0..n-1 para as tarefas neste contexto
    // Considerar filtro de projeto se estiver ativo
    const tarefasComOrdemAtualizada = lista.map((tarefa, index) => ({
      ...tarefa,
      ordem: index
    }));

    // Atualizar ordens no service
    // Se há filtro de projeto, passar o projetoId para atualizar apenas tarefas desse projeto
    this.tarefaService.updateOrdem(tarefasComOrdemAtualizada, this.filterProjetoId ?? undefined);

    event.detail.complete();
    this.loadTarefas(); // Recarregar para refletir nova ordem
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value;
    if (this.searchQuery) {
      this.tarefaService.search(this.searchQuery).subscribe({
        next: (tarefas) => {
          // Aplicar filtros adicionais
          let filteredTarefas = tarefas;
          if (this.filterProjetoId !== null) {
            filteredTarefas = filteredTarefas.filter(t => t.projetoId === this.filterProjetoId);
          }
          if (this.filterCategoria) {
            filteredTarefas = filteredTarefas.filter(t => t.categoria === this.filterCategoria);
          }
          // Aplicar filtro de atrasadas
          if (this.mostrarAtrasadas) {
            filteredTarefas = filteredTarefas.filter(t => this.tarefaService.isAtrasada(t));
          }
          this.toDo = filteredTarefas.filter(t => t.status === TarefaStatus.TODO);
          this.inProgress = filteredTarefas.filter(t => t.status === TarefaStatus.IN_PROGRESS);
          this.done = filteredTarefas.filter(t => t.status === TarefaStatus.DONE);
        }
      });
    } else {
      this.loadTarefas();
    }
  }

  onFilterCategoriaChange(event: any) {
    this.filterCategoria = event.detail.value;
    this.loadTarefas();
  }

  onFilterProjetoChange(event: any) {
    const value = event.detail.value;
    this.filterProjetoId = value === '' || value === null ? null : +value;
    this.loadTarefas();
  }

  toggleAtrasadas() {
    this.mostrarAtrasadas = !this.mostrarAtrasadas;
    this.loadTarefas();
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
