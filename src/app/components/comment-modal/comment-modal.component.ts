import { confirmarAcao } from '../../services/feedback.service';
import { alvoInteracao } from '../../services/repost-context';
import { PostContentComponent } from '../post-content/post-content.component';
import { Component, Input, OnDestroy, OnInit, AfterViewInit, ElementRef, inject } from '@angular/core';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { close, imageOutline } from 'ionicons/icons';
import { PostsService, Comentario, mensagemErro } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';
import { PerfilService } from '../../services/perfil.service';
import { catchError, finalize, of, Subscription, switchMap } from 'rxjs';
import { AvatarComponent } from '../avatar/avatar.component';

@Component({
  selector: 'app-comment-modal',
  templateUrl: './comment-modal.component.html',
  styleUrls: ['./comment-modal.component.scss'],
  standalone: true,
  imports: [PostContentComponent, IonicModule, CommonModule, FormsModule, AvatarComponent]
})
export class CommentModalComponent implements OnInit, OnDestroy, AfterViewInit {
  private host = inject(ElementRef<HTMLElement>);
  private alertas = inject(AlertController);
  ngAfterViewInit() {
    const modal = this.host.nativeElement.closest('ion-modal');
    if (modal) modal.canDismiss = async (_data: unknown, role?: string) => !this.enviando && (role === 'saved' || !this.texto.trim()
      || await confirmarAcao(this.alertas, 'Descartar comentário?', 'O texto preenchido será perdido.', 'Descartar'));
  }
  private cargaInicial?: Subscription;
  private envio?: Subscription;
  @Input() postSelecionado: any;
  @Input() modoRepost = false;

  public iconeFechar = close;
  public iconeImagem = imageOutline;
  public texto = '';
  private requisicaoId = crypto.randomUUID();
  public erro = '';
  public erroCarregamento = '';
  public comentarios: Comentario[] = [];
  public carregando = true;
  public enviando = false;
  public usuarioAtualNome = 'Usuário';
  public usuarioAtualFoto = '';

  constructor(
    private modalController: ModalController,
    private postsService: PostsService,
    private authService: AuthService,
    private perfilService: PerfilService
  ) { addIcons({ close, imageOutline }); }

  get postId(): string | number | undefined {
    return alvoInteracao(this.postSelecionado);
  }

  get autorNome(): string {
    return this.postSelecionado?.autor || this.postSelecionado?.repostOriginal?.autor || 'Usuário';
  }

  get autorFoto(): string {
    if (this.postSelecionado?.repostComComentario) {
      return this.postSelecionado.avatar || this.postSelecionado.autorFoto || '';
    }
    return this.postSelecionado?.avatar || this.postSelecionado?.autorFoto || this.postSelecionado?.repostOriginal?.autorFoto || '';
  }

  get textoPost(): string {
    return this.postSelecionado?.conteudo || '';
  }

  ngOnInit() {
    this.authService.sessao().subscribe({
      next: sessao => this.perfilService.getPerfil(sessao.role, sessao.id).subscribe({
        next: perfil => {
          this.usuarioAtualNome = perfil.nome || perfil.usuario || 'Usuário';
          this.usuarioAtualFoto = perfil.pfp || '';
        }
      }),
      error: () => undefined
    });
    if (this.modoRepost) {
      this.carregando = false;
      return;
    }
    const id = this.postId;
    if (!id) {
      this.carregando = false;
      return;
    }
    this.cargaInicial = this.postsService.getComentarios(id).subscribe({
      next: comentarios => this.reconciliarComentarios(comentarios),
      error: erro => { this.erroCarregamento = mensagemErro(erro); this.carregando = false; }
    });
  }

  ngOnDestroy() {
    this.cargaInicial?.unsubscribe();
    this.envio?.unsubscribe();
  }

  private reconciliarComentarios(comentarios: Comentario[]) {
    this.comentarios = comentarios;
    this.postSelecionado.comentarios = this.postSelecionado.commentsCount = comentarios.length;
    if (this.postSelecionado.repostOriginal) {
      this.postSelecionado.repostOriginal.comentarios = this.postSelecionado.repostOriginal.commentsCount = comentarios.length;
    }
    this.carregando = false;
    this.erroCarregamento = '';
  }

  fechar() {
    this.modalController.dismiss();
  }

  enviar() {
    const texto = this.texto.trim();
    if (!texto || this.enviando) return;

    if (this.modoRepost) {
      this.enviando = true; this.erro = '';
      this.envio = this.postsService.repostar(this.postSelecionado, texto, this.requisicaoId).subscribe({
        next: () => { this.enviando = false; this.texto = ''; void this.modalController.dismiss({ posted: true }, 'saved'); },
        error: erro => { this.enviando = false; this.erro = mensagemErro(erro); }
      });
      return;
    }

    const id = this.postId;
    if (!id) return;
    this.erro = '';
    this.enviando = true;
    this.envio = this.postsService.addComentario(id, texto, this.requisicaoId).pipe(
      switchMap(() => {
        this.texto = ''; this.requisicaoId = crypto.randomUUID();
        this.cargaInicial?.unsubscribe();
        // A lista é relida depois do pubsub de interações, sem somar ao count recebido.
        return this.postsService.confirmarInteracoes(this.postSelecionado).pipe(
          catchError(() => {
            this.erro = 'Comentário enviado. Não foi possível confirmar as interações. Atualize para conferir.';
            return of(null);
          }),
          switchMap(() => this.postsService.getComentarios(id).pipe(
            catchError(erro => { this.erroCarregamento = mensagemErro(erro); return of(null); })
          ))
        );
      }),
      finalize(() => { this.enviando = false; })
    ).subscribe({
      next: comentarios => {
        this.carregando = false;
        if (comentarios) this.reconciliarComentarios(comentarios);
      },
      error: erro => { this.erro = mensagemErro(erro); }
    });
  }

  getArroba() {
    if (!this.postSelecionado || !this.postSelecionado.autor) return '';
    return '@' + this.postSelecionado.autor.replace(/\s+/g, '').toLowerCase();
  }
}
