import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, ToastController, AlertController } from '@ionic/angular';
import { ProjetoService } from '../services/projeto.service';
import { CategoriaProjetoService } from '../services/categoria-projeto.service';
import { Projeto } from '../models/projeto.model';
import { CategoriaProjeto } from '../models/categoria-projeto.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-projetos',
  templateUrl: './projetos.page.html',
  styleUrls: ['./projetos.page.scss'],
  standalone: false,
})
export class ProjetosPage implements OnInit, OnDestroy {
  projetos: Projeto[] = [];
  projetosFiltrados: Projeto[] = [];
  categorias: CategoriaProjeto[] = [];
  filterCategoriaId: number | null = null;
  loading = false;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private projetoService: ProjetoService,
    private categoriaProjetoService: CategoriaProjetoService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.loadProjetos();
    this.loadCategorias();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadProjetos() {
    this.loading = true;
    const sub = this.projetoService.getAll().subscribe({
      next: (projetos) => {
        this.projetos = projetos;
        this.applyFilter();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar projetos:', error);
        this.showToast('Erro ao carregar projetos', 'danger');
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  loadCategorias() {
    const sub = this.categoriaProjetoService.getAll().subscribe({
      next: (categorias) => {
        this.categorias = categorias;
      },
      error: (error) => {
        console.error('Erro ao carregar categorias:', error);
      }
    });
    this.subscriptions.add(sub);
  }

  onFilterChange(event: any) {
    const value = event.detail.value;
    this.filterCategoriaId = value === '' ? null : +value;
    this.applyFilter();
  }

  private applyFilter() {
    if (this.filterCategoriaId === null) {
      this.projetosFiltrados = [...this.projetos];
    } else {
      this.projetosFiltrados = this.projetos.filter(
        p => p.categoriaId === this.filterCategoriaId
      );
    }
  }

  async doRefresh(event: any) {
    await this.loadProjetos();
    await this.loadCategorias();
    event.target.complete();
  }

  getCategoriaById(categoriaId: number): CategoriaProjeto | undefined {
    return this.categorias.find(c => c.id === categoriaId);
  }

  navegarParaCriar() {
    this.router.navigateByUrl('/projetos/novo');
  }

  navegarParaDetalhe(id: number) {
    this.router.navigateByUrl(`/projetos/${id}`);
  }

  navegarParaEditar(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigateByUrl(`/projetos/${id}/editar`);
  }

  async onEliminar(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este projeto? Todas as tarefas associadas também serão excluídas.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Excluir',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Excluindo projeto e tarefas associadas...'
            });
            await loading.present();

            this.projetoService.remove(id).subscribe({
              next: () => {
                loading.dismiss();
                this.showToast('Projeto e tarefas associadas excluídos com sucesso!', 'success');
                this.loadProjetos();
              },
              error: (error) => {
                loading.dismiss();
                console.error('Erro ao excluir projeto:', error);
                this.showToast('Erro ao excluir projeto', 'danger');
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
}

