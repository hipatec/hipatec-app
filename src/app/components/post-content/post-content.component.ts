import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../avatar/avatar.component';

/** Corpo compartilhado: comentário externo e contexto original nunca trocam de autoria. */
@Component({
  selector: 'app-post-content',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './post-content.component.html',
  styleUrls: ['./post-content.component.scss']
})
export class PostContentComponent {
  @Input({ required: true }) post: any;
  imagemFalhou = '';
  get original() { return this.post?.repostOriginal; }
}
