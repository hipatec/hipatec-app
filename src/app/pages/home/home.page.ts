import { abrirDenuncia } from '../../components/content-form-modal/report-modal.component';
import { confirmarAcao } from '../../services/feedback.service';
import { ModalController as StandaloneModalController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { alvoInteracao, lerRepostsLegados } from '../../services/repost-context';
import { PostContentComponent } from '../../components/post-content/post-content.component';
import { AlertController } from '@ionic/angular';
import { inject } from '@angular/core';
import { FeedbackNoticeComponent } from '../../components/feedback-notice/feedback-notice.component';
import { HostListener, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { add, flagOutline, close, pencil, trash } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { abrirModalPublicacao } from '../../components/create-post-modal/create-post-modal.component';
import { CommentModalComponent } from '../../components/comment-modal/comment-modal.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { PostAuthorHeaderComponent } from '../../components/post-author-header/post-author-header.component';
import { PostActionsComponent } from '../../components/post-actions/post-actions.component';
import { PostsService, mensagemErro } from '../../services/posts.service';
import { PerfilService, Perfil } from '../../services/perfil.service';
import { AuthService, Sessao } from '../../services/auth.service';
import { contaDoPerfil, mesmaConta, perfilDaSessao, rotaDoAutor } from '../../services/perfil-identidade';
import { catchError, forkJoin, of } from 'rxjs';

/** Pessoa sugerida: navega pela CONTA (`role` + `id`) e segue pelo PERFIL (`perfilId`). */
export interface SugestaoPerfil {
  id: number;
  role: string;
  perfilId: number;
  nome: string;
  arroba: string;
  pfp?: string;
  /** null = status ainda não confirmado pelo servidor. */
  seguindo: boolean | null;
  pendente: boolean;
  erro: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  providers: [{ provide: ModalController, useClass: StandaloneModalController }],
  imports: [PostContentComponent, FeedbackNoticeComponent, IonicModule, CommonModule, FormsModule, AvatarComponent, PostAuthorHeaderComponent, PostActionsComponent]
})

export class HomePage implements OnInit {
  private alertas = inject(AlertController);

  aviso = '';
  erroDenuncia = '';

  posts: any[] = [];
  carregando = false;
  erroFeed: string | null = null;
  userRole: string | null = null;
  userId: number | null = null;
  private sessao: Sessao | null = null;

  sugestoes: SugestaoPerfil[] = [];
  /** Aviso para leitores de tela após seguir/deixar de seguir (confirmado pelo servidor). */
  anuncioSeguimento = '';
  perfisDisponiveis: any[] = [];
  quantidadeSugestoes = 3;

  get sugestoesExibidas() {
    return this.sugestoes.slice(0, this.quantidadeSugestoes);
  }

  constructor(
    private modalController: ModalController,
    private postsService: PostsService,
    private perfilService: PerfilService,
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ add, flagOutline, close, pencil, trash });
  }

  ngOnInit() { this.buscarPosts(); }

  private primeiraEntrada = true;
  ionViewWillEnter() {
    if (this.primeiraEntrada) { this.primeiraEntrada = false; return; }
    this.buscarPosts();
  }

  buscarPosts() {
    this.carregando = true;
    this.erroFeed = null;
    // A sessão chega junto com perfis e posts: a identidade nunca é comparada antes de existir.
    forkJoin({
      sessao: this.authService.sessao().pipe(catchError(() => of(null))),
      posts: this.postsService.getPosts(),
      perfis: this.perfilService.getPerfis()
    }).subscribe({
      next: ({ sessao, posts, perfis }) => {
        this.sessao = sessao;
        this.userRole = sessao?.role ?? null;
        this.userId = sessao?.id ?? null;
        this.perfisDisponiveis = perfis;
        this.sugestoes = [];
        for (const perfil of perfis) {
          const conta = contaDoPerfil(perfil);
          if (!conta || mesmaConta(conta, sessao)) continue;
          // GET /perfil não traz `nome` (só a entidade Perfil); o usuário é o nome disponível.
          this.sugestoes.push({
            id: conta.id,
            role: conta.role,
            perfilId: Number(perfil.id),
            nome: perfil.nome || perfil.usuario || 'Usuário',
            arroba: perfil.usuario ? `@${perfil.usuario}` : '',
            pfp: perfil.pfp || undefined,
            seguindo: null,
            pendente: false,
            erro: ''
          });
        }
        this.carregarStatusSeguimento();
        this.aviso = this.getLocalReposts().length ? 'Há republicações no histórico deste navegador. Elas não foram publicadas no servidor.' : '';
        const originais = posts.map(post => this.mapPost(post, perfis));
        this.posts = [...originais.filter(post => post.repostadoUsuario), ...originais.filter(post => !post.repostadoUsuario)];
        this.carregando = false;
      },
      error: (err) => {
        console.error('Erro ao buscar posts:', err);
        this.posts = [];
        this.carregando = false;
        this.erroFeed = 'Não foi possível carregar o feed.';
      }
    });
  }

  private mapPost(post: any, perfis: Perfil[]): any {
    const perfil = perfis.find(p => p.id === post.autorId);
    const autor = perfil?.nome || perfil?.usuario || `Usuário ${post.autorId}`;
    const avatar = perfil?.pfp || post.autorFoto || '';

    const repostado = post.repostadoUsuario;

    return {
      ...post,
      repostOriginal: post.repostOriginal ? this.mapPost(post.repostOriginal, perfis) : undefined,
      autor,
      autorRole: contaDoPerfil(perfil)?.role ?? post.autorRole,
      avatar,
      tempo: this.formatPostTime(post.dataCriacao),
      curtidas: post.likesCount,
      comentarios: post.commentsCount,
      reposts: post.repostsCount,
      repostadoUsuario: repostado,
      curtidoUsuario: post.curtidoUsuario
    };
  }

  private formatPostTime(timestamp: number) {
    if (!timestamp || isNaN(timestamp)) return '';
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'agora';
    }
    if (diffMinutes < 60) {
      return `há ${diffMinutes} min`;
    }
    if (diffHours < 24) {
      return `há ${diffHours} h`;
    }
    return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
  }

  private getLocalReposts(): any[] {
    return lerRepostsLegados(perfilDaSessao(this.perfisDisponiveis, this.sessao)?.id ?? null);
  }

  mostrarMaisSugestoes() {
    this.quantidadeSugestoes = this.sugestoes.length;
    this.carregarStatusSeguimento();
  }

  get sessaoAutenticada(): boolean {
    return this.sessao !== null;
  }

  /** Status real (GET /perfil/{perfilId}/seguindo) das sugestões visíveis ainda não confirmadas. */
  private carregarStatusSeguimento() {
    if (!this.sessao) return;
    for (const sugestao of this.sugestoesExibidas) {
      if (sugestao.seguindo === null && !sugestao.pendente) this.consultarStatus(sugestao);
    }
  }

  private consultarStatus(sugestao: SugestaoPerfil) {
    sugestao.pendente = true;
    sugestao.erro = '';
    this.perfilService.statusSeguimento(sugestao.perfilId).subscribe({
      next: status => { sugestao.seguindo = status.seguindo; sugestao.pendente = false; },
      error: () => {
        sugestao.pendente = false;
        sugestao.erro = 'Não foi possível verificar se você segue este perfil. Use Verificar para tentar de novo.';
      }
    });
  }

  /**
   * Segue/deixa de seguir a partir de um estado CONFIRMADO e só mostra o novo estado após reler o status.
   * Estado desconhecido (null) nunca muta: apenas consulta o servidor de novo.
   */
  alternarSeguimento(sugestao: SugestaoPerfil) {
    if (!this.sessao || sugestao.pendente) return;
    if (sugestao.seguindo === null) {
      this.consultarStatus(sugestao);
      return;
    }
    const seguir = !sugestao.seguindo;
    sugestao.pendente = true;
    sugestao.erro = '';
    this.anuncioSeguimento = '';
    const mutacao = seguir
      ? this.perfilService.seguir(sugestao.perfilId)
      : this.perfilService.deixarDeSeguir(sugestao.perfilId);
    mutacao.subscribe({
      next: () => this.perfilService.statusSeguimento(sugestao.perfilId).subscribe({
        next: status => {
          sugestao.seguindo = status.seguindo;
          sugestao.pendente = false;
          this.anuncioSeguimento = status.seguindo
            ? `Você está seguindo ${sugestao.nome}.`
            : `Você deixou de seguir ${sugestao.nome}.`;
        },
        error: () => {
          sugestao.seguindo = null;
          sugestao.pendente = false;
          sugestao.erro = 'A alteração foi enviada, mas não foi possível confirmar. Use Verificar para consultar o status.';
        }
      }),
      error: () => {
        sugestao.pendente = false;
        sugestao.erro = seguir
          ? `Não foi possível seguir ${sugestao.nome}. Tente novamente.`
          : `Não foi possível deixar de seguir ${sugestao.nome}. Tente novamente.`;
      }
    });
  }

  abrirSugestao(sugestao: { role: string; id: number }) {
    this.router.navigate(['/profile', sugestao.role, sugestao.id]);
  }

  abrirPerfil(post: any) {
    // autorId é ID de perfil; a rota precisa da conta (papel + ID) do autor.
    const rota = rotaDoAutor(post.autorId, this.perfisDisponiveis, this.sessao);
    if (rota) this.router.navigate(rota);
  }
  canEditPost(post: any): boolean {
    return mesmaConta(contaDoPerfil(this.perfisDisponiveis.find(p => Number(p.id) === Number(post.autorId))), this.sessao);
  }

  canDeletePost(post: any): boolean { return this.canEditPost(post); }

  async editarPost(post: any) {
    const modal = await abrirModalPublicacao(this.modalController, this.alertas, post);
    const resultado = await modal.onDidDismiss();
    if (resultado.role === 'saved') this.buscarPosts();
  }

  async excluirPost(post: any) {
    if (post.excluindo || !await confirmarAcao(this.alertas, 'Excluir publicação?',
      'A publicação e suas interações serão removidas. Esta ação não pode ser desfeita.', 'Excluir')) return;
    post.excluindo = true;
    this.postsService.excluir(post.id).subscribe({
      next: () => { this.buscarPosts(); },
      error: erro => { post.excluindo = false; this.aviso = mensagemErro(erro); }
    });
  }
  async abrirDenuncia(post: any) {
    const resultado = await abrirDenuncia(this.modalController, post.id);
    if (resultado.role === 'saved') this.aviso = `Denúncia ${resultado.data?.protocolo} registrada para análise manual.`;
  }

  @HostListener('window:hipatec-post-updated', ['$event'])
  atualizarInteracoes(event: CustomEvent) {
    for (const post of this.posts) this.postsService.aplicarInteracoes(post, event.detail);
  }

  toggleCurtida(post: any) { this.postsService.alternarCurtida(post); }

  recuperarInteracoes(post: any) { this.postsService.recuperarInteracoes(post); }

  async repostar(post: any, comComentario = false) {
    if (post.repostPendente) return;
    let comentario = '';
    if (comComentario) {
      const modal = await this.modalController.create({ component: CommentModalComponent,
        cssClass: 'custom-modal-comment custom-modal-repost', componentProps: { postSelecionado: post, modoRepost: true } });
      await modal.present();
      const result = await modal.onDidDismiss();
      if (result.role === 'saved') this.buscarPosts();
      return;
    }
    post.repostPendente = true; this.aviso = '';
    this.postsService.repostar(post, comentario).subscribe({
      next: () => { post.repostPendente = false; this.buscarPosts(); },
      error: erro => { post.repostPendente = false; this.aviso = mensagemErro(erro); }
    });
  }


  abrirPublicacao(post: any, event?: Event) {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button, a')) return;
    if (!post?.id) return;
    this.router.navigate(['/post', post.id], { state: { post } });
  }

  async abrirModalPost() {
    const modal = await abrirModalPublicacao(this.modalController, this.alertas);
    const result = await modal.onDidDismiss();
    if (result.data?.posted) this.buscarPosts();
  }

  async abrirModalComentario(post: any) {
    const modal = await this.modalController.create({
      component: CommentModalComponent,
      cssClass: 'custom-modal-comment', // Modal de publicação com comentários
      componentProps: {
        postSelecionado: post // Passando o post inteiro para dentro do modal
      }
    });
    return await modal.present();
  }
}