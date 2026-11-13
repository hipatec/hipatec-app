import { MentoriasService } from '../../services/mentorias.service';
import { mensagemErro } from '../../services/posts.service';
import { FeedbackNoticeComponent } from '../feedback-notice/feedback-notice.component';
import { ContentModalFocusDirective } from './content-modal-focus.directive';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular/standalone';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-mentoring-form-modal',
  standalone: true,
  imports: [FeedbackNoticeComponent, FormsModule, ModalShellComponent, ContentModalFocusDirective],
  templateUrl: './mentoring-form-modal.component.html',
  styleUrls: ['./content-form-modal.scss']
})
export class MentoringFormModalComponent {
  @Input() estado = { alterado: false, enviando: false };
  readonly form = { titulo: '', area: '', formato: '', descricao: '' };
  private readonly inicial = JSON.stringify(this.form);

  tituloTocado = false;
  erro = '';
  readonly requisicaoId = crypto.randomUUID();
  get valido() { return this.form.titulo.trim().length > 0 && this.form.titulo.length <= 160
    && ['Online', 'Presencial', 'Híbrido'].includes(this.form.formato) && this.form.descricao.length <= 4000
    && this.form.area.length <= 160; }
  constructor(private modalController: ModalController, private service: MentoriasService) {}
  salvar() {
    if (!this.valido || this.estado.enviando) return;
    this.erro = ''; this.estado.enviando = true;
    this.service.create({ ...this.form, requisicaoId: this.requisicaoId }).subscribe({
      next: item => { this.estado.enviando = false; this.estado.alterado = false; void this.modalController.dismiss(item, 'saved'); },
      error: erro => { this.estado.enviando = false; this.erro = mensagemErro(erro); }
    });
  }

  atualizarAlterado() { this.estado.alterado = JSON.stringify(this.form) !== this.inicial; }
  cancelar() { if (this.estado.enviando) return; void this.modalController.dismiss(undefined, 'cancel'); }
}
