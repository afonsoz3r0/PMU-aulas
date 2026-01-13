import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { TarefaService } from '../services/tarefa.service';
import { Tarefa, TarefaFormData } from '../models/tarefa.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tarefa-form',
  templateUrl: './tarefa-form.page.html',
  styleUrls: ['./tarefa-form.page.scss'],
  standalone: false,
})
export class TarefaFormPage implements OnInit, OnDestroy {
  tarefa: Tarefa | null = null;
  isEditMode = false;
  loading = false;
  projetoIdInicial?: number;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tarefaService: TarefaService,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // Verificar se há projetoId na query string (ao criar tarefa de um projeto)
    const projetoIdParam = this.route.snapshot.queryParamMap.get('projetoId');
    if (projetoIdParam) {
      this.projetoIdInicial = +projetoIdParam;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'novo') {
      this.isEditMode = this.route.snapshot.url.some(segment => segment.path === 'editar');
      this.loadTarefa(+id);
    } else {
      // Modo de criação - não precisa carregar tarefa
      this.loading = false;
      this.isEditMode = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadTarefa(id: number) {
    this.loading = true;
    const sub = this.tarefaService.getById(id).subscribe({
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

  async onSubmit(formData: TarefaFormData) {
    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Atualizando tarefa...' : 'Criando tarefa...'
    });
    await loading.present();

    const operation = this.isEditMode && this.tarefa
      ? this.tarefaService.update(this.tarefa.id, formData)
      : this.tarefaService.create(formData);

    operation.subscribe({
      next: () => {
        loading.dismiss();
        this.showToast(
          this.isEditMode ? 'Tarefa atualizada com sucesso!' : 'Tarefa criada com sucesso!',
          'success'
        );
        this.router.navigateByUrl('/lista');
      },
      error: (error) => {
        loading.dismiss();
        console.error('Erro ao salvar tarefa:', error);
        this.showToast('Erro ao salvar tarefa', 'danger');
      }
    });
  }

  onCancel() {
    this.router.navigateByUrl('/lista');
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

