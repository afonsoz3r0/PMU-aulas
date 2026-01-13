import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Tarefa } from '../models/tarefa.model';
import { TarefaStatus } from '../models/tarefa.model';

export interface NotificacaoConfig {
  habilitado: boolean;
  diasAntecedencia: number; // Quantos dias antes do vencimento notificar
  horaNotificacao: string; // Hora do dia para enviar notificações (ex: "09:00")
}

@Injectable({
  providedIn: 'root'
})
export class NotificacaoService {
  private readonly STORAGE_KEY = 'notificacao_config';
  private config: NotificacaoConfig = {
    habilitado: true,
    diasAntecedencia: 1,
    horaNotificacao: '09:00'
  };

  constructor() {
    this.loadConfig();
    this.initializeNotifications();
  }

  /**
   * Carrega configuração de notificações do localStorage
   */
  private loadConfig(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this.config = { ...this.config, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Erro ao carregar configuração de notificações:', error);
      }
    }
  }

  /**
   * Salva configuração de notificações no localStorage
   */
  private saveConfig(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
  }

  /**
   * Inicializa o sistema de notificações
   */
  async initializeNotifications(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notificações locais só funcionam em dispositivos nativos');
      return;
    }

    try {
      // Solicitar permissão
      const permissionStatus = await LocalNotifications.checkPermissions();
      
      if (permissionStatus.display === 'prompt') {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== 'granted') {
          console.warn('Permissão de notificações negada');
          return;
        }
      }

      // Cancelar todas as notificações antigas
      await this.cancelarTodasNotificacoes();
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    }
  }

  /**
   * Verifica se as notificações estão habilitadas
   */
  isHabilitado(): boolean {
    return this.config.habilitado;
  }

  /**
   * Habilita ou desabilita notificações
   */
  async setHabilitado(habilitado: boolean): Promise<void> {
    this.config.habilitado = habilitado;
    this.saveConfig();

    if (!habilitado) {
      await this.cancelarTodasNotificacoes();
    }
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): NotificacaoConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  async updateConfig(config: Partial<NotificacaoConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    this.saveConfig();
    
    // Reagendar todas as notificações com nova configuração
    if (this.config.habilitado) {
      // Isso será chamado pelo TarefaService quando necessário
    }
  }

  /**
   * Agenda notificação para uma tarefa
   */
  async agendarNotificacaoTarefa(tarefa: Tarefa): Promise<void> {
    if (!this.config.habilitado || !Capacitor.isNativePlatform()) {
      return;
    }

    // Não notificar tarefas concluídas
    if (tarefa.status === TarefaStatus.DONE) {
      await this.cancelarNotificacaoTarefa(tarefa.id);
      return;
    }

    // Não notificar tarefas sem data de vencimento
    if (!tarefa.dataVencimento) {
      await this.cancelarNotificacaoTarefa(tarefa.id);
      return;
    }

    const dataVencimento = new Date(tarefa.dataVencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    dataVencimento.setHours(0, 0, 0, 0);

    // Se já passou a data, não agendar
    if (dataVencimento < hoje) {
      await this.cancelarNotificacaoTarefa(tarefa.id);
      return;
    }

    // Calcular data da notificação (diasAntecedencia dias antes)
    const dataNotificacao = new Date(dataVencimento);
    dataNotificacao.setDate(dataNotificacao.getDate() - this.config.diasAntecedencia);
    
    // Se a data de notificação já passou, agendar para hoje na hora configurada
    if (dataNotificacao < hoje) {
      dataNotificacao.setTime(hoje.getTime());
    }

    // Configurar hora da notificação
    const [hora, minuto] = this.config.horaNotificacao.split(':').map(Number);
    dataNotificacao.setHours(hora, minuto, 0, 0);

    // Se a hora já passou hoje, agendar para amanhã
    if (dataNotificacao < new Date()) {
      dataNotificacao.setDate(dataNotificacao.getDate() + 1);
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Tarefa próxima do vencimento',
            body: `"${tarefa.titulo}" vence em ${this.config.diasAntecedencia} dia(s)`,
            id: this.getNotificationId(tarefa.id),
            schedule: { at: dataNotificacao },
            sound: 'default',
            extra: {
              tarefaId: tarefa.id,
              tipo: 'vencimento_proximo'
            }
          }
        ]
      });

      // Também agendar notificação para o dia do vencimento
      const dataVencimentoNotif = new Date(dataVencimento);
      dataVencimentoNotif.setHours(hora, minuto, 0, 0);
      
      if (dataVencimentoNotif >= new Date()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title: 'Tarefa vence hoje!',
              body: `"${tarefa.titulo}" vence hoje`,
              id: this.getNotificationId(tarefa.id) + 10000, // ID diferente para notificação do dia
              schedule: { at: dataVencimentoNotif },
              sound: 'default',
              actionTypeId: 'TAREFA_VENCIMENTO',
              extra: {
                tarefaId: tarefa.id,
                tipo: 'vencimento_hoje'
              }
            }
          ]
        });
      }
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
    }
  }

  /**
   * Cancela notificação de uma tarefa específica
   */
  async cancelarNotificacaoTarefa(tarefaId: number): Promise<void> {
    try {
      await LocalNotifications.cancel({
        notifications: [
          { id: this.getNotificationId(tarefaId) },
          { id: this.getNotificationId(tarefaId) + 10000 } // Cancelar também a do dia
        ]
      });
    } catch (error) {
      console.error('Erro ao cancelar notificação:', error);
    }
  }

  /**
   * Cancela todas as notificações
   */
  async cancelarTodasNotificacoes(): Promise<void> {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending && pending.notifications && pending.notifications.length > 0) {
        const ids = pending.notifications.map(n => ({ id: n.id }));
        await LocalNotifications.cancel({ notifications: ids });
      }
    } catch (error) {
      console.error('Erro ao cancelar todas as notificações:', error);
    }
  }

  /**
   * Agenda notificações para todas as tarefas fornecidas
   */
  async agendarNotificacoesTarefas(tarefas: Tarefa[]): Promise<void> {
    if (!this.config.habilitado || !Capacitor.isNativePlatform()) {
      return;
    }

    // Cancelar todas as notificações antigas primeiro
    await this.cancelarTodasNotificacoes();

    // Agendar notificações para cada tarefa
    for (const tarefa of tarefas) {
      await this.agendarNotificacaoTarefa(tarefa);
    }
  }

  /**
   * Gera ID único para notificação baseado no ID da tarefa
   */
  private getNotificationId(tarefaId: number): number {
    // Usar ID da tarefa + offset para evitar conflitos
    return tarefaId + 1000;
  }

  /**
   * Verifica permissões de notificações
   */
  async verificarPermissoes(): Promise<{ granted: boolean; status: string }> {
    if (!Capacitor.isNativePlatform()) {
      return { granted: false, status: 'web' };
    }

    try {
      const status = await LocalNotifications.checkPermissions();
      return {
        granted: status.display === 'granted',
        status: status.display
      };
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return { granted: false, status: 'error' };
    }
  }

  /**
   * Solicita permissões de notificações
   */
  async solicitarPermissoes(): Promise<boolean> {
    if (!Capacitor.isNativePlatform()) {
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return false;
    }
  }
}

