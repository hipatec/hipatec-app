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

  ngOnInit() {
    const id = this.postSelecionado?.id;
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
    const id = this.postSelecionado?.id;
    if (!texto || !id || this.enviando) return;
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
