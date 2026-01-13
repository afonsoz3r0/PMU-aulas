import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CategoriasProjetoPage } from './categorias-projeto.page';
import { CategoriaProjetoFormPage } from './categoria-projeto-form.page';

const routes: Routes = [
  {
    path: '',
    component: CategoriasProjetoPage
  },
  {
    path: 'novo',
    component: CategoriaProjetoFormPage
  },
  {
    path: ':id/editar',
    component: CategoriaProjetoFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CategoriasProjetoPageRoutingModule {}

