import { Component, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { close, imageOutline } from 'ionicons/icons';
import { PostsService, Comentario } from '../../services/posts.service';

@Component({
  selector: 'app-comment-modal',
  templateUrl: './comment-modal.component.html',
  styleUrls: ['./comment-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class CommentModalComponent implements OnInit {
  @Input() postSelecionado: any;
  @Input() modoRepost = false;

  public iconeFechar = close;
  public iconeImagem = imageOutline;
  public texto = '';
  public comentarios: Comentario[] = [];
  public carregando = true;
  public enviando = false;

  constructor(
    private modalController: ModalController,
    private postsService: PostsService
  ) {}

  get postId(): string | number | undefined {
    return this.postSelecionado?.repostOriginal?.id || this.postSelecionado?.id;
  }

  get autorNome(): string {
    return this.postSelecionado?.autor || this.postSelecionado?.repostOriginal?.autor || 'Usuário';
  }

  get autorFoto(): string {
    return this.postSelecionado?.avatar || this.postSelecionado?.autorFoto || this.postSelecionado?.repostOriginal?.autorFoto || '';
  }

  get textoPost(): string {
    return this.postSelecionado?.repostOriginal?.conteudo || this.postSelecionado?.conteudo || '';
  }

  iniciais(nome: string): string {
    return (nome || 'Usuário').trim().split(/\s+/).slice(0, 2)
      .map(parte => parte[0]?.toUpperCase() || '').join('');
  }

  ngOnInit() {
    if (this.modoRepost) {
      this.carregando = false;
      return;
    }
    const id = this.postId;
    if (!id) {
      this.carregando = false;
      return;
    }
    this.postsService.getComentarios(id).subscribe({
      next: comentarios => { this.comentarios = comentarios; this.carregando = false; },
      error: () => { this.comentarios = []; this.carregando = false; }
    });
  }

  fechar() {
    this.modalController.dismiss();
  }

  enviar() {
    const texto = this.texto.trim();
    if (!texto || this.enviando) return;

    if (this.modoRepost) {
      this.modalController.dismiss({ comment: texto });
      return;
    }

    const id = this.postId;
    if (!id) return;
    this.enviando = true;
    this.postsService.addComentario(id, texto).subscribe({
      next: () => {
        this.texto = '';
        this.enviando = false;
        this.postSelecionado.comentarios = (this.postSelecionado.comentarios ?? 0) + 1;
        this.postsService.getComentarios(id).subscribe({
          next: comentarios => this.comentarios = comentarios,
          error: () => undefined
        });
      },
      error: () => this.enviando = false
    });
  }

  getArroba() {
    if (!this.postSelecionado || !this.postSelecionado.autor) return '';
    return '@' + this.postSelecionado.autor.replace(/\s+/g, '').toLowerCase();
  }
}
