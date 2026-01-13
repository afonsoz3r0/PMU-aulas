import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TarefaPage } from './tarefa.page';
import { TarefaFormPage } from './tarefa-form.page';

const routes: Routes = [
  {
    path: 'novo',
    component: TarefaFormPage
  },
  {
    path: ':id/editar',
    component: TarefaFormPage
  },
  {
    path: ':id',
    component: TarefaPage
  },
  {
    path: '',
    redirectTo: '/lista',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TarefaPageRoutingModule {}
