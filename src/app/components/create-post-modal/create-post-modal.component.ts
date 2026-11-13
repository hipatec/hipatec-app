import { FeedbackService, confirmarAcao } from '../../services/feedback.service';
import { Component, Input, OnInit, inject } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { imageOutline } from 'ionicons/icons';
import { PostsService, mensagemErro } from '../../services/posts.service';
import { AvatarComponent } from '../avatar/avatar.component';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';

@Component({
  selector: 'app-create-post-modal',
  templateUrl: './create-post-modal.component.html',
  styleUrls: ['./create-post-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, AvatarComponent, ModalShellComponent]
})

export class CreatePostModalComponent implements OnInit {
  @Input() post?: { id: string | number; conteudo: string; versao?: number };
  imagem?: File;
  readonly requisicaoId = crypto.randomUUID();
  private textoInicial = '';
  ngOnInit() {
    this.textoInicial = this.post?.conteudo ?? '';
    if (this.post) this.conteudo = this.textoInicial;
    this.atualizarAlterado();
  }
  atualizarAlterado() { this.estado.alterado = this.conteudo !== this.textoInicial || !!this.imagem; }
  selecionarImagem(event: Event) {
    this.imagem = (event.target as HTMLInputElement).files?.[0];
    this.atualizarAlterado();
  }
  @Input() estado = { alterado: false, salvando: false };
  erro = '';
  erroConteudo = '';
  private feedback = inject(FeedbackService);
  public iconeImagem = imageOutline;
  // Foto real em cache ou iniciais; nunca uma foto de demonstração.
  public pfp = localStorage.getItem('pfpPerfil') || '';
  public nome = localStorage.getItem('perfilNome') || '';
  public conteudo: string = '';
  public isSubmitting: boolean = false;

  constructor(private modalController: ModalController, private postsService: PostsService) {}

  fechar() {
    if (!this.isSubmitting) this.modalController.dismiss(undefined, 'cancel');
  }

  postar() {
    if (this.isSubmitting) return;
    this.erro = ''; this.erroConteudo = '';
    if (!this.conteudo.trim()) {
      this.erroConteudo = 'Digite algo para publicar.';
      document.getElementById('publicacao-conteudo')?.focus();
      return;
    }

    this.isSubmitting = this.estado.salvando = true;

    const payload = {
      conteudo: this.conteudo.trim(), requisicaoId: this.requisicaoId
    };

    const multipart = new FormData();
    multipart.append('conteudo', payload.conteudo); multipart.append('requisicaoId', this.requisicaoId);
    if (this.imagem) multipart.append('imagem', this.imagem);
    const pedido = this.post ? this.postsService.editar(this.post.id, payload.conteudo, this.post.versao ?? 0)
      : this.postsService.createPost(this.imagem ? multipart : payload);
    pedido.subscribe({
      next: async () => {
        this.estado.salvando = false;
        this.estado.alterado = false;
        await this.modalController.dismiss({ posted: true }, 'saved');
        this.feedback.sucesso(this.post ? 'Publicação atualizada.' : 'Publicação criada.');
      },
      error: (err) => {
        this.erro = mensagemErro(err);
        this.isSubmitting = this.estado.salvando = false;
      }
    });
  }
}

export async function abrirModalPublicacao(modais: ModalController, alertas: AlertController, post?: { id: string | number; conteudo: string; versao?: number }) {
  const estado = { alterado: false, salvando: false };
  const modal = await modais.create({ component: CreatePostModalComponent, componentProps: { estado, post },
    cssClass: 'custom-modal-post',
    canDismiss: async () => !estado.salvando && (!estado.alterado || await confirmarAcao(alertas,
      'Descartar publicação?', 'As alterações desta publicação serão perdidas.', 'Descartar'))
  });
  await modal.present();
  return modal;
}
