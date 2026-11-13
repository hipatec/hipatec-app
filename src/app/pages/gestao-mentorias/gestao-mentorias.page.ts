import { CursosService } from '../../services/cursos.service';
import { MentoriasService } from '../../services/mentorias.service';
import { AuthService } from '../../services/auth.service';
import { mensagemErro } from '../../services/posts.service';
import { FeedbackNoticeComponent } from '../../components/feedback-notice/feedback-notice.component';
import { forkJoin } from 'rxjs';
import { abrirModalConteudo, ContentKind } from '../../components/content-form-modal/open-content-modal';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, IonPopover } from '@ionic/angular';
import { AlertController, ModalController } from '@ionic/angular/standalone';

@Component({ selector: 'app-gestao-mentorias', templateUrl: './gestao-mentorias.page.html', styleUrls: ['./gestao-mentorias.page.scss'], standalone: true, imports: [FeedbackNoticeComponent, IonicModule, CommonModule] })
export class GestaoMentoriasPage implements OnDestroy {
  @ViewChild('creationPopover') creationPopover?: IonPopover;
  creationOpen = false;
  creationEvent?: Event;
  private creationTrigger?: HTMLElement;
  conteudos: Array<{ titulo: string; descricao?: string; tipo: string; formato?: string }> = [];
  erro = '';
  carregando = false;

  private contentModal?: Promise<HTMLIonModalElement>;

  constructor(private modals: ModalController, private alerts: AlertController, private cursos: CursosService,
    private mentorias: MentoriasService, private auth: AuthService) {}

  ionViewWillEnter() { this.carregar(); }
  carregar() {
    this.carregando = true; this.erro = '';
    forkJoin({ sessao: this.auth.sessao(), cursos: this.cursos.getAll(), mentorias: this.mentorias.getAll() }).subscribe({
      next: ({ sessao, cursos, mentorias }) => {
        this.conteudos = [...cursos.map(c => ({ ...c, tipo: 'Curso' })), ...mentorias.map(m => ({ ...m, tipo: 'Mentoria' }))]
          .filter(c => sessao.role === 'mentoras' && c.idMentora === sessao.id);
        this.carregando = false;
      },
      error: erro => { this.carregando = false; this.erro = mensagemErro(erro); }
    });
  }

  async openContent(event: MouseEvent, kind: ContentKind): Promise<void> {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    if (this.contentModal) return;
    // Wait for the popover to restore focus before Ionic captures the modal trigger.
    this.contentModal = (async () => {
      await this.creationPopover?.dismiss();
      this.creationTrigger?.focus();
      return abrirModalConteudo(this.modals, this.alerts, kind);
    })();
    try {
      const modal = await this.contentModal;
      const resultado = await modal.onDidDismiss();
      if (resultado.role === 'saved') this.carregar();
    } finally {
      this.contentModal = undefined;
    }
  }

  async canLeave(): Promise<boolean> {
    const modal = await this.contentModal;
    return !modal || modal.dismiss(undefined, 'navigation');
  }

  toggleCreation(event: Event): void {
    this.creationTrigger = event.currentTarget as HTMLElement;
    this.creationEvent = event;
    this.creationOpen = !this.creationOpen;
  }

  creationDismissed(): void {
    this.creationOpen = false;
    this.creationTrigger?.focus({ preventScroll: true });
  }

  focusCreationLink(event: Event): void {
    // Ionic finishes revealing the overlay after didPresent; focus on the next frame.
    requestAnimationFrame(() => {
      if (this.creationOpen) {
        (event.target as HTMLElement).querySelector<HTMLAnchorElement>('.content-create-menu a')?.focus();
      }
    });
  }

  ionViewWillLeave(): void {
    this.closeCreation();
  }

  ngOnDestroy(): void {
    this.closeCreation();
  }

  private closeCreation(): void {
    this.creationOpen = false;
    void this.creationPopover?.dismiss();
  }
}
