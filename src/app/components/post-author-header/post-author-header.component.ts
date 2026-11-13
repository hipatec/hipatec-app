import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { ellipsisHorizontal } from 'ionicons/icons';
import { AvatarComponent } from '../avatar/avatar.component';

const FUNCOES: Record<string, string> = {
  estudantes: 'Estudante',
  mentoras: 'Mentora',
  administradores: 'Administração',
  administrador: 'Administração'
};

/**
 * Cabeçalho de publicação: avatar + autor (abre o perfil), função, horário e menu de opções.
 * Os itens do menu são projetados pela página (`.hipatec-menu-item`, role="menuitem"),
 * que continua dona das permissões e das ações.
 */
@Component({
  selector: 'app-post-author-header',
  standalone: true,
  imports: [IonicModule, AvatarComponent],
  templateUrl: './post-author-header.component.html',
  styleUrls: ['./post-author-header.component.scss']
})
export class PostAuthorHeaderComponent {
  @Input() autor: string | null | undefined;
  @Input() avatar: string | null | undefined;
  @Input() funcao: string | null | undefined;
  @Input() tempo: string | null | undefined;
  @Input() menu = true;
  @Output() autorClick = new EventEmitter<Event>();

  @ViewChild('gatilho') private gatilho?: ElementRef<HTMLButtonElement>;
  @ViewChild('menuEl') private menuEl?: ElementRef<HTMLElement>;

  aberto = false;

  constructor(private host: ElementRef<HTMLElement>) {
    addIcons({ ellipsisHorizontal });
  }

  get nome() { return this.autor || 'Usuário'; }
  get funcaoLabel() { return this.funcao ? FUNCOES[this.funcao] ?? this.funcao : ''; }

  alternarMenu() {
    this.aberto = !this.aberto;
    if (this.aberto) setTimeout(() => this.itens()[0]?.focus());
  }

  fecharMenu(devolverFoco = false) {
    if (!this.aberto) return;
    this.aberto = false;
    if (devolverFoco) this.gatilho?.nativeElement.focus();
  }

  /** Item escolhido: fecha e devolve o foco ao gatilho, salvo se a ação já levou o foco a outro lugar. */
  aoEscolherItem() {
    this.fecharMenu();
    setTimeout(() => {
      const ativo = document.activeElement;
      const focoPerdido = !ativo || ativo === document.body || Boolean(this.menuEl?.nativeElement.contains(ativo));
      if (focoPerdido && this.host.nativeElement.isConnected) this.gatilho?.nativeElement.focus();
    });
  }

  navegarMenu(event: KeyboardEvent) {
    const itens = this.itens();
    if (!itens.length) return;
    const atual = itens.indexOf(document.activeElement as HTMLElement);
    const destino: Record<string, number> = {
      ArrowDown: (atual + 1) % itens.length,
      ArrowUp: (atual - 1 + itens.length) % itens.length,
      Home: 0,
      End: itens.length - 1
    };
    if (!(event.key in destino)) return;
    event.preventDefault();
    itens[destino[event.key]].focus();
  }

  @HostListener('keydown.escape')
  aoPressionarEscape() { this.fecharMenu(true); }

  @HostListener('document:click', ['$event'])
  aoClicarFora(event: Event) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.fecharMenu();
  }

  @HostListener('focusout', ['$event'])
  aoPerderFoco(event: FocusEvent) {
    const destino = event.relatedTarget as Node | null;
    if (destino && !this.host.nativeElement.contains(destino)) this.fecharMenu();
  }

  private itens(): HTMLElement[] {
    return Array.from(this.menuEl?.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
  }
}
