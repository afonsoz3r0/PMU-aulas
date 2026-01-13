import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TarefaPageRoutingModule } from './tarefa-routing.module';

import { TarefaPage } from './tarefa.page';
import { TarefaFormPage } from './tarefa-form.page';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { TarefaFormComponent } from '../components/tarefa-form/tarefa-form.component';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { MoverTarefaModalComponent } from '../components/mover-tarefa-modal/mover-tarefa-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TarefaPageRoutingModule,
    PageHeaderComponent,
    TarefaFormComponent,
    EmptyStateComponent,
    MoverTarefaModalComponent
  ],
  declarations: [TarefaPage, TarefaFormPage]
})
export class TarefaPageModule {}
