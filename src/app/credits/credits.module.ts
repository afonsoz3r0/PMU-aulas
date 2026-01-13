import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { CreditsPageRoutingModule } from './credits-routing.module';

import { CreditsPage } from './credits.page';
import { PageHeaderComponent } from '../components/page-header/page-header.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CreditsPageRoutingModule,
    PageHeaderComponent
  ],
  declarations: [CreditsPage]
})
export class CreditsPageModule {}
