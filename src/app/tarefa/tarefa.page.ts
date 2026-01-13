import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController, AlertController, ModalController } from '@ionic/angular';
import { TarefaService } from '../services/tarefa.service';
import { ProjetoService } from '../services/projeto.service';
import { Tarefa } from '../models/tarefa.model';
import { Projeto } from '../models/projeto.model';
import { MoverTarefaModalComponent } from '../components/mover-tarefa-modal/mover-tarefa-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tarefa',
  templateUrl: './tarefa.page.html',
  styleUrls: ['./tarefa.page.scss'],
  standalone: false,
})
export class TarefaPage implements OnInit, OnDestroy {
  tarefa: Tarefa | null = null;
  loading = false;
  private subscriptions = new Subscription();

  projetos: Projeto[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tarefaService: TarefaService,
    private projetoService: ProjetoService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController
  ) {}

  ngOnInit() {
    this.loadTarefa();
    this.loadProjetos();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadTarefa() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || isNaN(+id)) {
      this.showToast('ID de tarefa inválido', 'danger');
      this.router.navigateByUrl('/lista');
      return;
    }

    this.loading = true;
    const sub = this.tarefaService.getById(+id).subscribe({
      next: (tarefa) => {
        if (!tarefa) {
          this.showToast('Tarefa não encontrada', 'danger');
          this.router.navigateByUrl('/lista');
          return;
        }
        this.tarefa = tarefa;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefa:', error);
        this.showToast('Erro ao carregar tarefa', 'danger');
        this.loading = false;
        this.router.navigateByUrl('/lista');
      }
    });
    this.subscriptions.add(sub);
  }

  navegarParaEditar() {
    if (this.tarefa) {
      this.router.navigateByUrl(`/tarefa/${this.tarefa.id}/editar`);
    }
  }

  async excluirTarefa() {
    if (!this.tarefa) return;

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

            this.tarefaService.delete(this.tarefa!.id).subscribe({
              next: () => {
                loading.dismiss();
                this.showToast('Tarefa excluída com sucesso', 'success');
                this.router.navigateByUrl('/lista');
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

  navegarParaLista() {
    this.router.navigateByUrl('/lista');
  }

  async abrirModalMover() {
    if (!this.tarefa) return;

    const modal = await this.modalController.create({
      component: MoverTarefaModalComponent,
      componentProps: {
        tarefa: this.tarefa
      }
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.moved) {
      this.showToast('Tarefa movida com sucesso!', 'success');
      this.loadTarefa(); // Recarregar para atualizar dados
    }
  }

  getPrioridadeColor(prioridade: string): string {
    switch (prioridade) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baixa': return 'success';
      default: return 'medium';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'todo': return 'To Do';
      case 'in_progress': return 'In Progress';
      case 'done': return 'Done';
      default: return status;
    }
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

  getProjetoNome(projetoId?: number): string {
    if (!projetoId) return 'Sem projeto';
    const projeto = this.projetos.find(p => p.id === projetoId);
    return projeto ? projeto.nome : 'Sem projeto';
  }

  isAtrasada(tarefa: Tarefa): boolean {
    return this.tarefaService.isAtrasada(tarefa);
  }

  formatDate(date?: Date): string {
    if (!date) return 'Não definida';
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
