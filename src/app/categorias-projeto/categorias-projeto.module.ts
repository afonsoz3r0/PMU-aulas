import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CategoriasProjetoPageRoutingModule } from './categorias-projeto-routing.module';
import { CategoriasProjetoPage } from './categorias-projeto.page';
import { CategoriaProjetoFormPage } from './categoria-projeto-form.page';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { EmptyStateComponent } from '../components/empty-state/empty-state.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CategoriasProjetoPageRoutingModule,
    PageHeaderComponent,
    EmptyStateComponent
  ],
  declarations: [CategoriasProjetoPage, CategoriaProjetoFormPage]
})
export class CategoriasProjetoPageModule {}

