import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

// Apresentação recuperada de lucca-frontend (db8b150), sem os serviços simulados da branch.
@Component({
  selector: 'app-apresentacao',
  templateUrl: './apresentacao.page.html',
  styleUrls: ['./apresentacao.page.scss'],
  standalone: true,
  imports: [RouterLink, IonContent],
})
export class ApresentacaoPage {
  menuOpen = false;

  scrollToSection(section: HTMLElement, event: Event) {
    event.preventDefault();
    this.menuOpen = false;
    // O Ionic rola dentro de ion-content; aguarde o menu recolher antes de posicionar a seção.
    requestAnimationFrame(() => {
      section.scrollIntoView({ block: 'start' });
      section.focus({ preventScroll: true });
    });
  }
}
