import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { CategoriaProjetoService } from '../services/categoria-projeto.service';
import { CategoriaProjeto } from '../models/categoria-projeto.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-categorias-projeto',
  templateUrl: './categorias-projeto.page.html',
  styleUrls: ['./categorias-projeto.page.scss'],
  standalone: false,
})
export class CategoriasProjetoPage implements OnInit, OnDestroy {
  categorias: CategoriaProjeto[] = [];
  loading = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private categoriaProjetoService: CategoriaProjetoService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadCategorias();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadCategorias() {
    this.loading = true;
    const sub = this.categoriaProjetoService.getAll().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
        this.showToast('Erro ao carregar categorias', 'danger');
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  async doRefresh(event: any) {
    await this.loadCategorias();
    event.target.complete();
  }

  navegarParaCriar() {
    this.router.navigateByUrl('/categorias-projeto/novo');
  }

  navegarParaEditar(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigateByUrl(`/categorias-projeto/${id}/editar`);
  }

  async onEliminar(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir esta categoria?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Excluindo categoria...'
            });
            await loading.present();

            this.categoriaProjetoService.remove(id).subscribe({
              next: () => {
                loading.dismiss();
                this.showToast('Categoria excluída com sucesso!', 'success');
                this.loadCategorias();
              },
              error: (error) => {
                loading.dismiss();
                console.error('Erro ao excluir categoria:', error);
                
                // Verificar se o erro é por ter projetos associados
                if (error.message && error.message.includes('projetos associados')) {
                  this.showAlert(
                    'Não é possível excluir',
                    'Esta categoria não pode ser excluída pois existem projetos associados. Remova ou altere os projetos antes de excluir a categoria.'
                  );
                } else {
                  this.showToast('Erro ao excluir categoria', 'danger');
                }
              }
            });
          }
        }
      ]
    });

    await alert.present();
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

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }
}

