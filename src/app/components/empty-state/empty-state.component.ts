import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class EmptyStateComponent {
  @Input() icon: string = 'document-outline';
  @Input() titulo: string = 'Nenhum item encontrado';
  @Input() mensagem: string = 'Não há itens para exibir no momento.';
  @Input() mostrarBotao: boolean = false;
  @Input() textoBotao: string = 'Adicionar';
  @Output() onClick = new EventEmitter<void>();
}

