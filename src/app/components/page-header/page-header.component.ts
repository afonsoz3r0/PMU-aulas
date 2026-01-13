import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class PageHeaderComponent {
  @Input() titulo: string = 'My Tasks';
  @Input() mostrarBackButton: boolean = false;
  @Input() defaultHref: string = '/tabs/home';
}
