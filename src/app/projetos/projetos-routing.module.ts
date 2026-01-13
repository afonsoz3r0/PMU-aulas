import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProjetosPage } from './projetos.page';
import { ProjetoFormPage } from './projeto-form.page';
import { ProjetoDetalhePage } from './projeto-detalhe.page';

const routes: Routes = [
  {
    path: '',
    component: ProjetosPage
  },
  {
    path: 'novo',
    component: ProjetoFormPage
  },
  {
    path: ':id',
    component: ProjetoDetalhePage
  },
  {
    path: ':id/editar',
    component: ProjetoFormPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjetosPageRoutingModule {}

