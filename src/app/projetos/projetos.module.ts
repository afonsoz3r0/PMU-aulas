import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ProjetosPageRoutingModule } from './projetos-routing.module';
import { ProjetosPage } from './projetos.page';
import { ProjetoFormPage } from './projeto-form.page';
import { ProjetoDetalhePage } from './projeto-detalhe.page';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';
import { TarefaCardComponent } from '../components/tarefa-card/tarefa-card.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ProjetosPageRoutingModule,
    PageHeaderComponent,
    EmptyStateComponent,
    TarefaCardComponent
  ],
  declarations: [ProjetosPage, ProjetoFormPage, ProjetoDetalhePage]
})
export class ProjetosPageModule {}

