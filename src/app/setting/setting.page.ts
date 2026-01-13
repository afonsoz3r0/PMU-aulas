import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { NotificacaoService } from '../services/notificacao.service';
import { Capacitor } from '@capacitor/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-setting',
  templateUrl: './setting.page.html',
  styleUrls: ['./setting.page.scss'],
  standalone: false,
})
export class SettingPage implements OnInit, OnDestroy {
  notificacoesHabilitadas = false;
  diasAntecedencia = 1;
  horaNotificacao = '09:00';
  isNative = false;
  permissoesConcedidas = false;
  private subscriptions = new Subscription();

  constructor(
    private notificacaoService: NotificacaoService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  async ngOnInit() {
    this.isNative = Capacitor.isNativePlatform();
    await this.loadSettings();
    await this.verificarPermissoes();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadSettings() {
    const config = this.notificacaoService.getConfig();
    this.notificacoesHabilitadas = config.habilitado;
    this.diasAntecedencia = config.diasAntecedencia;
    this.horaNotificacao = config.horaNotificacao;
  }

  async verificarPermissoes() {
    if (!this.isNative) {
      this.permissoesConcedidas = false;
      return;
    }

    const permissoes = await this.notificacaoService.verificarPermissoes();
    this.permissoesConcedidas = permissoes.granted;

    if (!permissoes.granted && permissoes.status === 'prompt') {
      // Solicitar permissões automaticamente
      const concedido = await this.notificacaoService.solicitarPermissoes();
      this.permissoesConcedidas = concedido;
    }
  }

  async onNotificacoesToggle(event: any) {
    const habilitado = event.detail.checked;

    if (habilitado && !this.permissoesConcedidas) {
      // Solicitar permissões se necessário
      const concedido = await this.notificacaoService.solicitarPermissoes();
      if (!concedido) {
        // Reverter toggle se permissão negada
        event.detail.checked = false;
        await this.showAlert(
          'Permissão Necessária',
          'É necessário conceder permissão de notificações para usar esta funcionalidade.'
        );
        return;
      }
      this.permissoesConcedidas = true;
    }

    await this.notificacaoService.setHabilitado(habilitado);
    this.notificacoesHabilitadas = habilitado;

    if (habilitado) {
      await this.showToast('Notificações habilitadas', 'success');
    } else {
      await this.showToast('Notificações desabilitadas', 'medium');
    }
  }

  async onDiasAntecedenciaChange(event: any) {
    const dias = parseInt(event.detail.value, 10);
    if (isNaN(dias) || dias < 0 || dias > 30) {
      await this.showToast('Dias de antecedência deve ser entre 0 e 30', 'warning');
      return;
    }

    this.diasAntecedencia = dias;
    await this.notificacaoService.updateConfig({ diasAntecedencia: dias });
    await this.showToast('Configuração atualizada', 'success');
  }

  async onHoraNotificacaoChange(event: any) {
    const hora = event.detail.value;
    // Validar formato HH:MM
    if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(hora)) {
      await this.showToast('Formato de hora inválido (use HH:MM)', 'warning');
      return;
    }

    this.horaNotificacao = hora;
    await this.notificacaoService.updateConfig({ horaNotificacao: hora });
    await this.showToast('Configuração atualizada', 'success');
  }

  async solicitarPermissoes() {
    const concedido = await this.notificacaoService.solicitarPermissoes();
    this.permissoesConcedidas = concedido;

    if (concedido) {
      await this.showToast('Permissão concedida', 'success');
      if (!this.notificacoesHabilitadas) {
        // Habilitar notificações automaticamente
        this.notificacoesHabilitadas = true;
        await this.notificacaoService.setHabilitado(true);
      }
    } else {
      await this.showAlert(
        'Permissão Negada',
        'As notificações não funcionarão sem permissão. Você pode alterar isso nas configurações do dispositivo.'
      );
    }
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
