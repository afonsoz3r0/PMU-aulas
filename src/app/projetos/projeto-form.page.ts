import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController } from '@ionic/angular';
import { ProjetoService } from '../services/projeto.service';
import { CategoriaProjetoService } from '../services/categoria-projeto.service';
import { Projeto, ProjetoFormData } from '../models/projeto.model';
import { CategoriaProjeto } from '../models/categoria-projeto.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-projeto-form',
  templateUrl: './projeto-form.page.html',
  styleUrls: ['./projeto-form.page.scss'],
  standalone: false,
})
export class ProjetoFormPage implements OnInit, OnDestroy {
  form!: FormGroup;
  projeto: Projeto | null = null;
  categorias: CategoriaProjeto[] = [];
  isEditMode = false;
  loading = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private projetoService: ProjetoService,
    private categoriaProjetoService: CategoriaProjetoService,
    private fb: FormBuilder,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initForm();
    this.loadCategorias();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'novo') {
      this.isEditMode = this.route.snapshot.url.some(segment => segment.path === 'editar');
      this.loadProjeto(+id);
    } else {
      this.loading = false;
      this.isEditMode = false;
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private initForm() {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2)]],
      descricao: [''],
      categoriaId: [null, Validators.required]
    });
  }

  loadCategorias() {
    const sub = this.categoriaProjetoService.getAll().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        if (categorias.length === 0 && !this.isEditMode) {
          this.showToast('É necessário criar pelo menos uma categoria antes de criar um projeto', 'warning');
        }
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  async loadProjeto(id: number) {
    this.loading = true;
    const sub = this.projetoService.getById(id).subscribe({
      next: (projeto) => {
        if (!projeto) {
          this.showToast('Projeto não encontrado', 'danger');
          this.router.navigateByUrl('/projetos');
          return;
        }
        this.projeto = projeto;
        this.form.patchValue({
          nome: projeto.nome,
          descricao: projeto.descricao || '',
          categoriaId: projeto.categoriaId
        });
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

  async onSubmit() {
    if (this.form.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const loading = await this.loadingController.create({
      message: this.isEditMode ? 'Atualizando projeto...' : 'Criando projeto...'
    });
    await loading.present();

    const formData: ProjetoFormData = {
      nome: this.form.value.nome.trim(),
      descricao: this.form.value.descricao?.trim() || undefined,
      categoriaId: this.form.value.categoriaId
    };

    const operation = this.isEditMode && this.projeto
      ? this.projetoService.update(this.projeto.id, formData)
      : this.projetoService.create(formData);

    operation.subscribe({
      next: () => {
        loading.dismiss();
        this.showToast(
          this.isEditMode ? 'Projeto atualizado com sucesso!' : 'Projeto criado com sucesso!',
          'success'
        );
        this.router.navigateByUrl('/projetos');
      },
      error: (error) => {
        loading.dismiss();
        console.error('Erro ao salvar projeto:', error);
        
        if (error.message && error.message.includes('Categoria inválida')) {
          this.showToast('Categoria inválida. Selecione uma categoria válida.', 'warning');
        } else {
          this.showToast('Erro ao salvar projeto', 'danger');
        }
      }
    });
  }

  onCancel() {
    this.router.navigateByUrl('/projetos');
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
      nome: 'Nome',
      categoriaId: 'Categoria'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
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

