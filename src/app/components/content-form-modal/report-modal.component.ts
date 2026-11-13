import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { FeedbackNoticeComponent } from '../feedback-notice/feedback-notice.component';
import { ContentModalFocusDirective } from './content-modal-focus.directive';
import { PostsService, mensagemErro } from '../../services/posts.service';
@Component({ selector: 'app-report-modal', standalone: true,
  imports: [FormsModule, ModalShellComponent, FeedbackNoticeComponent, ContentModalFocusDirective],
  styleUrls: ['./content-form-modal.scss'],
  template: `<app-modal-shell appContentModalFocus titulo="Denunciar conteúdo" (fechar)="fechar()">
    <p>A denúncia será registrada para análise manual da moderação.</p>
    <div class="content-form field"><label for="report-reason">Motivo</label>
      <select id="report-reason" name="motivo" [(ngModel)]="motivo" [disabled]="estado.enviando" required>
        <option value="">Selecione um motivo</option><option value="assedio">Assédio ou ataque</option>
        <option value="discurso-odioso">Discurso de ódio</option><option value="spam">Spam ou fraude</option>
        <option value="conteudo-inadequado">Conteúdo inadequado</option>
      </select>
    </div>
    <app-feedback-notice [mensagem]="erro" [erro]="true" />
    <div modalFooter class="content-actions">
      <button class="hipatec-btn-secondary" type="button" [disabled]="estado.enviando" (click)="fechar()">Cancelar</button>
      <button class="hipatec-btn-primary" type="button" [disabled]="!motivo || estado.enviando" (click)="enviar()">Enviar denúncia</button>
    </div>
  </app-modal-shell>` })
export class ReportModalComponent {
  @Input() postId!: string | number;
  @Input() comentarioId?: string;
  @Input() estado = { enviando: false };
  motivo = ''; erro = '';
  constructor(private posts: PostsService, private modais: ModalController) {}
  fechar() { if (!this.estado.enviando) void this.modais.dismiss(undefined, 'cancel'); }
  enviar() {
    if (!this.motivo || this.estado.enviando) return;
    this.estado.enviando = true; this.erro = '';
    this.posts.denunciar(this.postId, this.motivo, this.comentarioId).subscribe({
      next: resultado => { this.estado.enviando = false; void this.modais.dismiss(resultado, 'saved'); },
      error: erro => { this.estado.enviando = false; this.erro = mensagemErro(erro); }
    });
  }
}
export async function abrirDenuncia(modais: ModalController, postId: string | number, comentarioId?: string) {
  const estado = { enviando: false };
  const modal = await modais.create({ component: ReportModalComponent, componentProps: { postId, comentarioId, estado },
    cssClass: 'hipatec-modal', canDismiss: async () => !estado.enviando });
  await modal.present();
  return modal.onDidDismiss<{ protocolo: number }>();
}
