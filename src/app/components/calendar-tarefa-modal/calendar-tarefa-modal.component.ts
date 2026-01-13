import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController, ToastController, LoadingController } from '@ionic/angular';
import { Tarefa, TarefaStatus, TarefaPrioridade, TarefaFormData } from '../../models/tarefa.model';
import { Projeto } from '../../models/projeto.model';
import { ProjetoService } from '../../services/projeto.service';
import { TarefaService } from '../../services/tarefa.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-calendar-tarefa-modal',
  templateUrl: './calendar-tarefa-modal.component.html',
  styleUrls: ['./calendar-tarefa-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonicModule]
})
export class CalendarTarefaModalComponent implements OnInit, OnDestroy {
  @Input() tarefa!: Tarefa;
  
  form!: FormGroup;
  projetos: Projeto[] = [];
  loading = false;
  private subscriptions = new Subscription();

  statusOptions = [
    { value: TarefaStatus.TODO, label: 'Pendente' },
    { value: TarefaStatus.IN_PROGRESS, label: 'Em Progresso' },
    { value: TarefaStatus.DONE, label: 'Concluída' }
  ];

  prioridadeOptions = [
    { value: TarefaPrioridade.BAIXA, label: 'Baixa' },
    { value: TarefaPrioridade.MEDIA, label: 'Média' },
    { value: TarefaPrioridade.ALTA, label: 'Alta' }
  ];

  constructor(
    private modalController: ModalController,
    private tarefaService: TarefaService,
    private projetoService: ProjetoService,
    private fb: FormBuilder,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadProjetos();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initForm() {
    const dataVencimento = this.tarefa.dataVencimento 
      ? this.formatDateForInput(this.tarefa.dataVencimento) 
      : '';

    this.form = this.fb.group({
      titulo: [this.tarefa.titulo, [Validators.required, Validators.minLength(3)]],
      projetoId: [this.tarefa.projetoId || null],
      dataVencimento: [dataVencimento],
      prioridade: [this.tarefa.prioridade || TarefaPrioridade.MEDIA, Validators.required],
      status: [this.tarefa.status || TarefaStatus.TODO, Validators.required]
    });
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

  private formatDateForInput(date: Date): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async onGuardar() {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Atualizando tarefa...'
    });
    await loading.present();

    const formValue = this.form.value;
    const tarefaData: Partial<TarefaFormData> = {
      titulo: formValue.titulo.trim(),
      projetoId: formValue.projetoId === null ? undefined : formValue.projetoId,
      dataVencimento: formValue.dataVencimento ? new Date(formValue.dataVencimento) : undefined,
      prioridade: formValue.prioridade,
      status: formValue.status
    };

    this.tarefaService.update(this.tarefa.id, tarefaData).subscribe({
      next: () => {
        loading.dismiss();
        this.showToast('Tarefa atualizada com sucesso!', 'success');
        this.modalController.dismiss({ updated: true });
      },
      error: (error) => {
        loading.dismiss();
        console.error('Erro ao atualizar tarefa:', error);
        this.showToast(error.message || 'Erro ao atualizar tarefa', 'danger');
      }
    });
  }

  onCancelar() {
    this.modalController.dismiss();
  }

  private markFormGroupTouched() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
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

  getStatusLabel(status: TarefaStatus): string {
    const option = this.statusOptions.find(o => o.value === status);
    return option ? option.label : '';
  }
}

