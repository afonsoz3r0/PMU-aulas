import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ToastController } from '@ionic/angular';
import { CategoriaProjetoService } from '../services/categoria-projeto.service';
import { CategoriaProjeto, CategoriaProjetoFormData } from '../models/categoria-projeto.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-categoria-projeto-form',
  templateUrl: './categoria-projeto-form.page.html',
  styleUrls: ['./categoria-projeto-form.page.scss'],
  standalone: false,
})
export class CategoriaProjetoFormPage implements OnInit, OnDestroy {
  form!: FormGroup;
  categoria: CategoriaProjeto | null = null;
  isEditMode = false;
  loading = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private categoriaProjetoService: CategoriaProjetoService,
    private fb: FormBuilder,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.initForm();
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'novo') {
      this.isEditMode = this.route.snapshot.url.some(segment => segment.path === 'editar');
      this.loadCategoria(+id);
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
      cor: [''],
      icone: ['']
    });
  }

  async loadCategoria(id: number) {
    this.loading = true;
    const sub = this.categoriaProjetoService.getById(id).subscribe({
      next: (categoria) => {
        if (!categoria) {
          this.showToast('Categoria não encontrada', 'danger');
          this.router.navigateByUrl('/categorias-projeto');
          return;
        }
        this.categoria = categoria;
        this.form.patchValue({
          nome: categoria.nome,
          cor: categoria.cor || '',
          icone: categoria.icone || ''
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar categoria:', error);
        this.showToast('Erro ao carregar categoria', 'danger');
        this.loading = false;
        this.router.navigateByUrl('/categorias-projeto');
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
      message: this.isEditMode ? 'Atualizando categoria...' : 'Criando categoria...'
    });
    await loading.present();

    const formData: CategoriaProjetoFormData = {
      nome: this.form.value.nome.trim(),
      cor: this.form.value.cor?.trim() || undefined,
      icone: this.form.value.icone?.trim() || undefined
    };

    const operation = this.isEditMode && this.categoria
      ? this.categoriaProjetoService.update(this.categoria.id, formData)
      : this.categoriaProjetoService.create(formData);

    operation.subscribe({
      next: () => {
        loading.dismiss();
        this.showToast(
          this.isEditMode ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!',
          'success'
        );
        this.router.navigateByUrl('/categorias-projeto');
      },
      error: (error) => {
        loading.dismiss();
        console.error('Erro ao salvar categoria:', error);
        
        // Verificar se é erro de duplicado
        if (error.message && error.message.includes('já existe')) {
          this.showToast(error.message, 'warning');
        } else {
          this.showToast('Erro ao salvar categoria', 'danger');
        }
      }
    });
  }

  onCancel() {
    this.router.navigateByUrl('/categorias-projeto');
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
      nome: 'Nome'
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

