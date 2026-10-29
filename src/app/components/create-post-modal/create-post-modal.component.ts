import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { close, imageOutline } from 'ionicons/icons';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-create-post-modal',
  templateUrl: './create-post-modal.component.html',
  styleUrls: ['./create-post-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule]
})

export class CreatePostModalComponent {
  public iconeFechar = close;
  public iconeImagem = imageOutline;
  public pfp = localStorage.getItem('pfpPerfil') || 'https://ionicframework.com/docs/img/demos/avatar.svg';
  public conteudo: string = '';
  public isSubmitting: boolean = false;

  constructor(private modalController: ModalController, private postsService: PostsService) {}

  fechar() {
    this.modalController.dismiss();
  }

  postar() {
    if (!this.conteudo.trim()) {
      alert('Digite algo para postar');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      conteudo: this.conteudo.trim()
    };

    this.postsService.createPost(payload).subscribe({
      next: () => {
        alert('Post criado com sucesso!');
        this.isSubmitting = false;
        this.modalController.dismiss({ posted: true });
      },
      error: (err) => {
        console.error('Erro ao criar post:', err);
        alert('Erro ao criar post. Tente novamente.');
        this.isSubmitting = false;
      }
    });
  }
}