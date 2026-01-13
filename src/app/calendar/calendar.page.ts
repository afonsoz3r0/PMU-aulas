import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { TarefaService } from '../services/tarefa.service';
import { Tarefa } from '../models/tarefa.model';
import { CalendarTarefaModalComponent } from '../components/calendar-tarefa-modal/calendar-tarefa-modal.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.page.html',
  styleUrls: ['./calendar.page.scss'],
  standalone: false,
})
export class CalendarPage implements OnInit, OnDestroy {
  tarefas: Tarefa[] = [];
  selectedDate: string = this.getTodayDateString();
  loading = false;
  private subscriptions = new Subscription();

  constructor(
    private tarefaService: TarefaService,
    private modalController: ModalController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.loadTarefas();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  /**
   * Obtém a data de hoje no formato YYYY-MM-DD (local, sem timezone)
   */
  private getTodayDateString(): string {
    const hoje = new Date();
    const year = hoje.getFullYear();
    const month = String(hoje.getMonth() + 1).padStart(2, '0');
    const day = String(hoje.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Normaliza uma data para startOfDay (local, sem timezone)
   */
  private normalizeDateToStartOfDay(date: Date | string): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Converte uma data para string YYYY-MM-DD (local)
   */
  private dateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadTarefas() {
    this.loading = true;
    const sub = this.tarefaService.getAll().subscribe({
      next: (tarefas) => {
        // Filtrar apenas tarefas com dataVencimento
        this.tarefas = tarefas.filter(t => t.dataVencimento !== undefined && t.dataVencimento !== null);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar tarefas:', error);
        this.loading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  async doRefresh(event: any) {
    await this.loadTarefas();
    event.target.complete();
  }

  /**
   * Obtém tarefas para uma data específica (comparação por startOfDay local)
   */
  getTarefasForDate(date: string): Tarefa[] {
    if (!date) return [];

    // Normalizar a data selecionada para startOfDay
    const selectedDate = this.normalizeDateToStartOfDay(date);

    return this.tarefas.filter(t => {
      if (!t.dataVencimento) return false;

      // Normalizar dataVencimento da tarefa para startOfDay
      const tarefaDate = this.normalizeDateToStartOfDay(t.dataVencimento);

      // Comparar apenas as datas (sem hora)
      return tarefaDate.getTime() === selectedDate.getTime();
    });
  }

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
  }

  async onTarefaClick(tarefa: Tarefa) {
    const modal = await this.modalController.create({
      component: CalendarTarefaModalComponent,
      componentProps: {
        tarefa: tarefa
      },
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data?.updated) {
      // Recarregar tarefas para refletir atualizações
      this.loadTarefas();
      this.showToast('Tarefa atualizada com sucesso!', 'success');
    }
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-PT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getPrioridadeColor(prioridade: string): string {
    switch (prioridade) {
      case 'alta': return 'danger';
      case 'media': return 'warning';
      case 'baixa': return 'success';
      default: return 'medium';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'todo': return 'primary';
      case 'in_progress': return 'warning';
      case 'done': return 'success';
      default: return 'medium';
    }
  }

  isAtrasada(tarefa: Tarefa): boolean {
    return this.tarefaService.isAtrasada(tarefa);
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
