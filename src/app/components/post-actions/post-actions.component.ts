import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chatbubbleOutline, heart, heartOutline, repeatOutline } from 'ionicons/icons';

/** Campos de publicação que as ações exibem; as mutações ficam na página. */
export interface PostActionsView {
  autor?: string;
  repostOriginal?: { autor?: string };
  originalIndisponivel?: boolean;
  interacaoPendente?: boolean;
  interacoesDesconhecidas?: boolean;
  repostPendente?: boolean;
  curtidas?: number;
  comentarios?: number;
  reposts?: number;
  curtidoUsuario?: boolean;
  repostadoUsuario?: boolean;
}

@Component({
  selector: 'app-post-actions',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './post-actions.component.html',
  styleUrls: ['./post-actions.component.scss']
})
export class PostActionsComponent {
  @Input({ required: true }) post!: PostActionsView;
  /** Falso onde a tela não oferece republicação: o total aparece só como informação. */
  @Input() repostavel = true;
  @Output() recuperar = new EventEmitter<void>();
  @Output() curtir = new EventEmitter<void>();
  @Output() comentar = new EventEmitter<void>();
  @Output() repostar = new EventEmitter<void>();
  @Output() repostarComComentario = new EventEmitter<void>();

  readonly iconeCurtir = heartOutline;
  readonly iconeCurtido = heart;
  readonly iconeComentar = chatbubbleOutline;
  readonly iconeRepostar = repeatOutline;

  constructor() {
    addIcons({ heart, heartOutline, chatbubbleOutline, repeatOutline });
  }

  get curtidaDesconhecida() { return this.post.interacoesDesconhecidas || typeof this.post.curtidoUsuario !== 'boolean'; }
  get repostDesconhecido() { return this.post.interacoesDesconhecidas || typeof this.post.repostadoUsuario !== 'boolean'; }

  get autor() { return this.post?.repostOriginal?.autor || this.post?.autor || 'Usuário'; }
}
