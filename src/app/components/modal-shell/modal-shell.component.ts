import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';

let proximoId = 0;

/**
 * Estrutura comum dos modais pequenos (post, evento): título, fechar, corpo rolável e rodapé.
 * Conteúdo: projeção padrão; ações: elemento com o atributo `modalFooter`.
 * Ao apresentar, nomeia o diálogo pelo título e põe o foco nele (sem abrir teclado virtual).
 */
@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [IonicModule],
  template: `
    <header class="modal-header">
      <h2 #tituloEl class="modal-title" [id]="tituloId" tabindex="-1">{{ titulo }}</h2>
      <button type="button" class="modal-close" [attr.aria-label]="rotuloFechar" (click)="fechar.emit()">
        <ion-icon name="close" aria-hidden="true"></ion-icon>
      </button>
    </header>
    <div class="modal-body">
      <ng-content />
    </div>
    <footer class="modal-footer">
      <ng-content select="[modalFooter]" />
    </footer>
  `,
  styleUrls: ['./modal-shell.component.scss']
})
export class ModalShellComponent {
  @Input({ required: true }) titulo!: string;
  @Input() rotuloFechar = 'Fechar';
  @Output() fechar = new EventEmitter<void>();
  @ViewChild('tituloEl') private tituloEl?: ElementRef<HTMLElement>;

  readonly tituloId = `hipatec-modal-titulo-${++proximoId}`;

  constructor(private host: ElementRef<HTMLElement>) {
    addIcons({ close });
  }

  @HostListener('document:ionModalWillPresent', ['$event'])
  aoApresentar(event: Event) {
    if (this.ehMeuModal(event)) (event.target as HTMLElement).setAttribute('aria-labelledby', this.tituloId);
  }

  @HostListener('document:ionModalDidPresent', ['$event'])
  aoTerminarApresentacao(event: Event) {
    if (this.ehMeuModal(event)) this.tituloEl?.nativeElement.focus();
  }

  private ehMeuModal(event: Event) {
    const modal = event.target as HTMLElement | null;
    return Boolean(modal?.contains(this.host.nativeElement));
  }
}
