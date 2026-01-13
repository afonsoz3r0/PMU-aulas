import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Tarefa, TarefaFormData, TarefaStatus, TarefaPrioridade } from '../../models/tarefa.model';
import { Projeto } from '../../models/projeto.model';
import { ProjetoService } from '../../services/projeto.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tarefa-form-component',
  templateUrl: './tarefa-form.component.html',
  styleUrls: ['./tarefa-form.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class TarefaFormComponent implements OnInit, OnChanges {
  @Input() tarefa?: Tarefa;
  @Input() projetoIdInicial?: number; // Para pré-selecionar projeto ao criar tarefa de um projeto
  @Output() submitForm = new EventEmitter<TarefaFormData>();
  @Output() cancel = new EventEmitter<void>();

  form!: FormGroup;
  projetos: Projeto[] = [];
  statusOptions = [
    { value: TarefaStatus.TODO, label: 'To Do' },
    { value: TarefaStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TarefaStatus.DONE, label: 'Done' }
  ];
  prioridadeOptions = [
    { value: TarefaPrioridade.BAIXA, label: 'Baixa' },
    { value: TarefaPrioridade.MEDIA, label: 'Média' },
    { value: TarefaPrioridade.ALTA, label: 'Alta' }
  ];
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private projetoService: ProjetoService
  ) {}

  ngOnInit() {
    this.loadProjetos();
    this.initForm();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tarefa'] && this.form && changes['tarefa'].currentValue) {
      this.updateForm();
    }
    if (changes['projetoIdInicial'] && this.form && this.projetoIdInicial) {
      this.form.patchValue({ projetoId: this.projetoIdInicial });
    }
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

  private initForm() {
    const projetoIdValue = this.projetoIdInicial || this.tarefa?.projetoId || null;
    this.form = this.fb.group({
      titulo: [this.tarefa?.titulo || '', [Validators.required, Validators.minLength(3)]],
      descricao: [this.tarefa?.descricao || '', [Validators.required, Validators.minLength(5)]],
      status: [this.tarefa?.status || TarefaStatus.TODO, Validators.required],
      prioridade: [this.tarefa?.prioridade || TarefaPrioridade.MEDIA, Validators.required],
      dataVencimento: [this.tarefa?.dataVencimento ? this.formatDateForInput(this.tarefa.dataVencimento) : ''],
      categoria: [this.tarefa?.categoria || ''],
      tags: [this.tarefa?.tags?.join(', ') || ''],
      projetoId: [projetoIdValue]
    });
  }

  private updateForm() {
    if (this.tarefa && this.form) {
      this.form.patchValue({
        titulo: this.tarefa.titulo,
        descricao: this.tarefa.descricao,
        status: this.tarefa.status,
        prioridade: this.tarefa.prioridade,
        dataVencimento: this.tarefa.dataVencimento ? this.formatDateForInput(this.tarefa.dataVencimento) : '',
        categoria: this.tarefa.categoria || '',
        tags: this.tarefa.tags?.join(', ') || '',
        projetoId: this.tarefa.projetoId || null
      });
    }
  }

  private formatDateForInput(date: Date): string {
    return new Date(date).toISOString().split('T')[0];
  }

  onSubmit() {
    if (this.form.valid) {
      const formValue = this.form.value;
      const formData: TarefaFormData = {
        titulo: formValue.titulo.trim(),
        descricao: formValue.descricao.trim(),
        status: formValue.status,
        prioridade: formValue.prioridade,
        dataVencimento: formValue.dataVencimento ? new Date(formValue.dataVencimento) : undefined,
        categoria: formValue.categoria?.trim() || undefined,
        tags: formValue.tags ? formValue.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : undefined,
        projetoId: formValue.projetoId || undefined
      };
      this.submitForm.emit(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel() {
    this.cancel.emit();
  }

  private markFormGroupTouched() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} é obrigatório`;
    }
    if (control?.hasError('minlength')) {
      return `${this.getFieldLabel(fieldName)} deve ter pelo menos ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      titulo: 'Título',
      descricao: 'Descrição',
      status: 'Status',
      prioridade: 'Prioridade'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}

