import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ListaPageRoutingModule } from './lista-routing.module';

import { ListaPage } from './lista.page';
import { TarefaCardComponent } from '../components/tarefa-card/tarefa-card.component';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../components/page-header/page-header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListaPageRoutingModule,
    TarefaCardComponent,
    EmptyStateComponent,
    PageHeaderComponent
  ],
  declarations: [ListaPage]
})
export class ListaPageModule {}
