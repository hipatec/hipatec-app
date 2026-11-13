import { abrirDenuncia } from '../../components/content-form-modal/report-modal.component';
import { CommentModalComponent } from '../../components/comment-modal/comment-modal.component';
import { abrirModalPublicacao } from '../../components/create-post-modal/create-post-modal.component';
import { confirmarAcao } from '../../services/feedback.service';
import { AlertController, ModalController } from '@ionic/angular';
import { alvoInteracao } from '../../services/repost-context';
import { PostContentComponent } from '../../components/post-content/post-content.component';
import { FeedbackNoticeComponent } from '../../components/feedback-notice/feedback-notice.component';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { Component, inject, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { catchError, forkJoin, of } from 'rxjs';
import { Comentario, PostsService, mensagemErro } from '../../services/posts.service';
import { Perfil, PerfilService } from '../../services/perfil.service';
import { AuthService, Sessao } from '../../services/auth.service';
import { contaDoPerfil, perfilDaSessao, rotaDoAutor } from '../../services/perfil-identidade';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { PostAuthorHeaderComponent } from '../../components/post-author-header/post-author-header.component';
import { PostActionsComponent } from '../../components/post-actions/post-actions.component';

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [PostContentComponent, FeedbackNoticeComponent, CommonModule, FormsModule, IonicModule, AvatarComponent, PostAuthorHeaderComponent, PostActionsComponent],
  templateUrl: './post-detail.page.html',
  styleUrls: ['./post-detail.page.scss']
})
export class PostDetailPage implements OnInit {
  aviso = '';
  private modais = inject(ModalController);
  private alertas = inject(AlertController);
  @ViewChild('composer') private composer?: ElementRef<HTMLTextAreaElement>;

  post: any;
  comentarios: Comentario[] = [];
  texto = '';
  private comentarioRequisicaoId = crypto.randomUUID();
  carregando = true;
  carregandoComentarios = true;
  enviando = false;
  erro = '';
  erroCarregamento = '';
  erroComentario = '';
  respondendoA: string | number | null = null;
  menuComentarioAberto: string | number | null = null;
  /** Identidade autenticada e lista de perfis: resolvem dono do post (ID de perfil) e conta do autor. */
  private sessao: Sessao | null = null;
  private perfis: Perfil[] = [];
  private perfilSessaoId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postsService: PostsService,
    private perfilService: PerfilService,
    private authService: AuthService,
    private location: Location
  ) {}

  private primeiraEntrada = true;
  ionViewWillEnter() {
    if (this.primeiraEntrada) { this.primeiraEntrada = false; return; }
    this.ngOnInit();
  }

  ngOnInit() {
    this.carregando = true;
    this.erro = '';
    const id = this.route.snapshot.paramMap.get('id');
    this.post = undefined;
    this.comentarios = [];
    if (!id) {
      this.erro = 'Publicação não encontrada.';
      this.carregando = false;
      return;
    }

    forkJoin({ posts: this.postsService.getPosts(), identidade: this.identidade() }).subscribe({
      next: ({ posts, identidade }) => {
        this.aplicarIdentidade(identidade);
        const perfis = identidade.perfis;
        const encontrada: any = posts.find(item => String(item.id) === id);
        if (!encontrada) {
          this.erro = 'Publicação não encontrada.';
          this.carregandoComentarios = false;
        } else {
          const perfil = perfis.find(item => Number(item.id) === Number(encontrada.autorId));
          this.post = {
            ...encontrada,
            autor: perfil?.nome || perfil?.usuario || `Usuário ${encontrada.autorId}`,
            autorRole: contaDoPerfil(perfil)?.role ?? 'estudantes',
            avatar: perfil?.pfp || encontrada.autorFoto || '',
            autorFoto: perfil?.pfp || encontrada.autorFoto || '',
            conteudo: encontrada.conteudo || '',
            curtidoUsuario: encontrada.curtidoUsuario,
            curtidas: encontrada.likesCount,
            comentarios: encontrada.commentsCount,
            reposts: encontrada.repostsCount,
            tempo: this.formatarTempo(encontrada.dataCriacao)
          };
          if (encontrada.repostOriginal) {
            const original = encontrada.repostOriginal;
            const autora = perfis.find(item => Number(item.id) === Number(original.autorId));
            this.post.repostOriginal = { ...original, autor: autora?.nome || autora?.usuario || 'Usuário', avatar: autora?.pfp || original.autorFoto };
          }
          const alvo = alvoInteracao(this.post);
          if (alvo) this.carregarComentarios(String(alvo));
          else this.carregandoComentarios = false;
        }
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar esta publicação.';
        this.carregando = false;
      }
    });
  }

  private identidade() {
    return forkJoin({
      sessao: this.authService.sessao().pipe(catchError(() => of(null))),
      perfis: this.perfilService.getPerfis()
    });
  }

  private aplicarIdentidade({ sessao, perfis }: { sessao: Sessao | null; perfis: Perfil[] }) {
    this.sessao = sessao;
    this.perfis = perfis;
    this.perfilSessaoId = perfilDaSessao(perfis, sessao)?.id ?? null;
  }

  carregarComentarios(id: string | number) {
    this.carregandoComentarios = true;
    this.postsService.getComentarios(id).subscribe({
      next: comentarios => {
        this.comentarios = comentarios;
        this.post.comentarios = this.post.commentsCount = comentarios.length;
        if (this.post.repostOriginal) {
          this.post.repostOriginal.comentarios = this.post.repostOriginal.commentsCount = comentarios.length;
        }
        this.carregandoComentarios = false;
        this.erroCarregamento = '';
      },
      error: erro => { this.erroCarregamento = mensagemErro(erro); this.carregandoComentarios = false; }
    });
  }

  enviarComentario() {
    const texto = this.texto.trim();
    const id = alvoInteracao(this.post);
    if (!texto || !id || this.enviando) return;
    this.erroComentario = '';
    this.enviando = true;
    this.postsService.addComentario(id, texto, this.comentarioRequisicaoId).subscribe({
      next: () => {
        this.texto = ''; this.comentarioRequisicaoId = crypto.randomUUID();
        this.enviando = false;
        this.postsService.confirmarInteracoes(this.post).subscribe({ error: erro => this.erroComentario = mensagemErro(erro) });
        this.carregarComentarios(id);
      },
      error: erro => { this.enviando = false; this.erroComentario = mensagemErro(erro); }
    });
  }

  @HostListener('document:click', ['$event'])
  fecharMenusAoClicarFora(event: Event) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.comment-menu-button, .comment-menu')) return;
    this.menuComentarioAberto = null;
  }

  @HostListener('document:keydown.escape')
  fecharMenuComentario() {
    this.menuComentarioAberto = null;
  }

  @HostListener('window:hipatec-post-updated', ['$event'])
  atualizarInteracoes(event: CustomEvent) {
    if (this.post) this.postsService.aplicarInteracoes(this.post, event.detail);
  }

  toggleCurtida() { this.postsService.alternarCurtida(this.post); }

  focarComposer() {
    this.composer?.nativeElement.focus();
  }

  voltar() {
    if (history.length > 1) this.location.back();
    else this.router.navigateByUrl('/home');
  }

  abrirPerfilAutor(event: Event) {
    event.stopPropagation();
    // autorId é ID de perfil; a rota precisa da conta (papel + ID) do autor.
    const rota = rotaDoAutor(this.post?.autorId || this.post?.repostOriginal?.autorId, this.perfis, this.sessao);
    if (rota) this.router.navigate(rota);
  }

  ehDonoPost(): boolean {
    return this.perfilSessaoId !== null
      && Number(this.post?.autorId || this.post?.repostOriginal?.autorId) === this.perfilSessaoId;
  }

  async editarPublicacao() {
    const modal = await abrirModalPublicacao(this.modais, this.alertas, this.post);
    if ((await modal.onDidDismiss()).role === 'saved') this.ngOnInit();
  }
  async excluirPublicacao() {
    if (!await confirmarAcao(this.alertas, 'Excluir publicação?', 'A publicação e suas interações serão removidas.', 'Excluir')) return;
    this.postsService.excluir(this.post.id).subscribe({
      next: () => { void this.router.navigate(['/home']); },
      error: erro => { this.aviso = mensagemErro(erro); }
    });
  }

  alternarMenuComentario(id: string | number | undefined, event: Event) {
    event.stopPropagation();
    if (id === undefined) return;
    this.menuComentarioAberto = this.menuComentarioAberto === id ? null : id;
  }

  recuperarInteracoes(post: any) { this.postsService.recuperarInteracoes(post); }

  async repostar(comComentario = false) {
    if (this.post.repostPendente) return;
    if (comComentario) {
      const modal = await this.modais.create({ component: CommentModalComponent,
        cssClass: 'custom-modal-comment custom-modal-repost', componentProps: { postSelecionado: this.post, modoRepost: true } });
      await modal.present();
      if ((await modal.onDidDismiss()).role === 'saved') this.ngOnInit();
      return;
    }
    this.post.repostPendente = true;
    this.postsService.repostar(this.post).subscribe({
      next: () => this.ngOnInit(),
      error: erro => { this.post.repostPendente = false; this.aviso = mensagemErro(erro); }
    });
  }

  async denunciarComentario(comentario?: Comentario) {
    this.menuComentarioAberto = null;
    const id = comentario ? alvoInteracao(this.post) : this.post.id;
    if (!id) return;
    const resultado = await abrirDenuncia(this.modais, id, comentario?.id);
    if (resultado.role === 'saved') this.aviso = `Denúncia ${resultado.data?.protocolo} registrada para análise manual.`;
  }

  alternarResposta(id: string | number) {
    this.respondendoA = this.respondendoA === id ? null : id;
  }

  formatarTempo(timestamp?: number) {
    if (!timestamp) return '';
    const minutos = Math.floor((Date.now() - timestamp) / 60000);
    if (minutos < 1) return 'agora';
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    return `há ${Math.floor(horas / 24)} dia(s)`;
  }
}
