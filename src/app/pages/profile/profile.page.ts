import { abrirDenuncia } from '../../components/content-form-modal/report-modal.component';
import { confirmarAcao } from '../../services/feedback.service';
import { ModalController as StandaloneModalController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular';
import { alvoInteracao } from '../../services/repost-context';
import { PostContentComponent } from '../../components/post-content/post-content.component';
import { AlertController } from '@ionic/angular';
import { inject } from '@angular/core';
import { FeedbackService } from '../../services/feedback.service';
import { FeedbackNoticeComponent } from '../../components/feedback-notice/feedback-notice.component';
import { HostListener, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonicModule } from '@ionic/angular';
import { EstudanteService } from '../../services/estudante.service';
import { MentoraService } from '../../services/mentora.service';
import { PerfilService } from '../../services/perfil.service';
import { EditProfileModalComponent } from '../../components/edit-profile-modal/edit-profile-modal.component';
import { abrirModalPublicacao } from '../../components/create-post-modal/create-post-modal.component';
import { CommentModalComponent } from '../../components/comment-modal/comment-modal.component';
import { AvatarComponent } from '../../components/avatar/avatar.component';
import { PostAuthorHeaderComponent } from '../../components/post-author-header/post-author-header.component';
import { PostActionsComponent } from '../../components/post-actions/post-actions.component';
import { PostsService, mensagemErro } from '../../services/posts.service';
import { AuthService, Sessao } from '../../services/auth.service';
import { Conta, contaDoPerfil, mesmaConta, perfilDaSessao, rotaDoAutor } from '../../services/perfil-identidade';
import { close, pencil, trash, repeatOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  providers: [{ provide: ModalController, useClass: StandaloneModalController }],
  imports: [PostContentComponent, FeedbackNoticeComponent,
    IonicModule,
    CommonModule, 
    FormsModule,
    EditProfileModalComponent,
    AvatarComponent,
    PostAuthorHeaderComponent,
    PostActionsComponent
  ]
})
export class ProfilePage {
  private alertas = inject(AlertController);

  aviso = '';
  erroSalvarPerfil = '';
  private feedback = inject(FeedbackService);
  showEditModal = false;
  selectedPfpFile?: File;
  selectedBackgroundFile?: File;
  isSaving = false;

  constructor(
    private estudanteService: EstudanteService, 
    private mentoraService: MentoraService, 
    private perfilService: PerfilService,
    private postsService: PostsService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private modalController: ModalController,
    private router: Router
  ) {
    addIcons({ close, pencil, trash, repeatOutline });
  }
  isPublicProfile = false;
  /** Conta (papel + ID de conta) do perfil exibido: usada em GET/PUT /perfil/{role}/{id}. */
  userRole: string | null = null;
  userId = 0;
  /** Identidade autenticada de quem está vendo a página e o ID de perfil correspondente. */
  private sessao: Sessao | null = null;
  private perfilSessaoId: number | null = null;
  private perfisDisponiveis: any[] = [];
  perfil: any;
  posts: any[] = [];
  reposts: any[] = [];
  carregandoPosts = false;
  erroPosts: string | null = null;
  seguindoPerfil: boolean | null = null;
  erroSeguimento = '';
  alterandoSeguimento = false;
  profileTab: 'posts' | 'reposts' = 'posts';

  ionViewWillEnter() {
    this.perfil = undefined;
    this.posts = [];
    this.reposts = [];
    this.erroPosts = null;
    this.seguindoPerfil = null;
    this.alterandoSeguimento = false;
    this.profileTab = 'posts';
    this.showEditModal = false;
    this.sessao = null;
    this.perfilSessaoId = null;
    // Parâmetro :id da rota é ID de CONTA do papel informado (contrato de GET /perfil/{role}/{id}).
    const role = this.route.snapshot.paramMap.get('role') as Conta['role'] | null;
    const contaId = Number(this.route.snapshot.paramMap.get('id'));
    const rotaPublica = Boolean(role && contaId);
    // Até a sessão confirmar a identidade, uma rota com parâmetros é tratada como perfil de terceiros.
    this.isPublicProfile = rotaPublica;

    this.authService.sessao().pipe(catchError(() => of(null))).subscribe(sessao => {
      this.sessao = sessao;
      const alvo: Conta | null = rotaPublica ? { role: role!, id: contaId } : sessao;
      if (!alvo) {
        this.userRole = null;
        this.userId = 0;
        return;
      }
      this.isPublicProfile = !mesmaConta(alvo, sessao);
      this.userRole = alvo.role;
      this.userId = alvo.id;
      this.perfilService.getPerfil(alvo.role, alvo.id).subscribe(perfil => {
        this.perfil = perfil;
        const perfilId = Number(perfil.id);
        if (this.isPublicProfile) {
          this.perfilService.statusSeguimento(perfilId).subscribe({
            next: status => this.seguindoPerfil = status.seguindo,
            error: () => { this.seguindoPerfil = null; this.erroSeguimento = 'Não foi possível consultar o seguimento. Atualize para tentar novamente.'; }
          });
        } else {
          localStorage.setItem('perfil', String(perfilId));
        }
        this.loadPosts(perfilId);
      });
    });
  }

  private loadPosts(perfilId: number) {
    this.carregandoPosts = true;
    this.erroPosts = null;
    forkJoin({
      posts: this.postsService.getPostsPerfil(perfilId),
      perfis: this.perfilService.getPerfis(),
      republicados: this.postsService.getRepublicados(perfilId)
    }).subscribe({
      next: ({ posts, perfis, republicados }) => {
        this.perfisDisponiveis = perfis;
        this.perfilSessaoId = perfilDaSessao(perfis, this.sessao)?.id ?? null;
        this.aplicarAvatarDoFeed(posts);
        this.posts = posts.map(post => this.mapPost(post, perfis));
        this.reposts = republicados.map(post => this.mapPost(post, perfis));
        this.carregandoPosts = false;
      },
      error: error => {
        console.error('Erro ao carregar posts do perfil:', error);
        this.posts = [];
        this.reposts = [];
        this.carregandoPosts = false;
        this.erroPosts = 'Não foi possível carregar as publicações deste perfil.';
      }
    });
  }

  recarregarPosts() {
    const perfilId = Number(this.perfil?.id);
    if (perfilId) this.loadPosts(perfilId);
  }

  private aplicarAvatarDoFeed(posts: any[]) {
    if (this.perfil?.pfp) return;
    const avatar = posts.find(post => typeof post.autorFoto === 'string' && post.autorFoto.trim())?.autorFoto;
    if (avatar) this.perfil = { ...this.perfil, pfp: avatar };
  }


  private mapPost(post: any, perfis: any[] = []): any {
    const perfilAutor = perfis.find(perfil => Number(perfil.id) === Number(post.autorId));
    const autor = post.autor || perfilAutor?.nome || perfilAutor?.usuario || `Usuário ${post.autorId}`;
    const avatar = post.avatar || post.autorFoto || perfilAutor?.pfp || '';
    const repostado = post.repostadoUsuario;
    return {
      ...post,
      repostOriginal: post.repostOriginal ? this.mapPost(post.repostOriginal, perfis) : undefined,
      autor,
      autorRole: contaDoPerfil(perfilAutor)?.role ?? post.autorRole,
      autorFoto: avatar,
      avatar,
      conteudo: post.conteudo || post.texto || '',
      tempo: this.formatPostTime(post.dataCriacao),
      curtidas: post.likesCount,
      comentarios: post.commentsCount,
      reposts: post.repostsCount,
      repostadoUsuario: repostado
    };
  }

  private formatPostTime(timestamp: number) {
    if (!timestamp || isNaN(timestamp)) {
      return '';
    }

    const now = Date.now();
    const diffMs = now - timestamp;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return 'agora';
    }
    if (minutes < 60) {
      return `há ${minutes} min`;
    }
    if (hours < 24) {
      return `há ${hours} h`;
    }
    return `há ${days} dia${days > 1 ? 's' : ''}`;
  }


  @HostListener('window:hipatec-post-updated', ['$event'])
  atualizarInteracoes(event: CustomEvent) {
    for (const post of [...this.posts, ...this.reposts]) this.postsService.aplicarInteracoes(post, event.detail);
  }

  toggleCurtida(post: any) { this.postsService.alternarCurtida(post); }

  async abrirModalPost() {
    const modal = await abrirModalPublicacao(this.modalController, this.alertas);
    const result = await modal.onDidDismiss();
    if (result.data?.posted) this.recarregarPosts();
  }

  isOwnPost(post: any): boolean {
    return this.isPostOwner(post);
  }

  abrirPerfilAutor(post: any, event: Event) {
    event.stopPropagation();
    // autorId é ID de perfil; a rota precisa da conta (papel + ID) do autor.
    const rota = rotaDoAutor(post?.autorId, this.perfisDisponiveis, this.sessao);
    if (rota) this.router.navigate(rota);
  }

  abrirPublicacao(post: any, event?: Event) {
    const target = event?.target as HTMLElement | null;
    if (target?.closest('button, a, [role="button"]')) return;
    if (!post?.id) return;
    this.router.navigate(['/post', post.id], { state: { post } });
  }

  async abrirComentario(post: any) {
    const modal = await this.modalController.create({
      component: CommentModalComponent,
      cssClass: 'custom-modal-comment',
      componentProps: { postSelecionado: post }
    });
    await modal.present();
  }

  recuperarInteracoes(post: any) { this.postsService.recuperarInteracoes(post); }

  async repostar(post: any, comComentario = false) {
    if (post.repostPendente) return;
    let comentario = '';
    if (comComentario) {
      const modal = await this.modalController.create({ component: CommentModalComponent,
        cssClass: 'custom-modal-comment custom-modal-repost', componentProps: { postSelecionado: post, modoRepost: true } });
      await modal.present();
      const result = await modal.onDidDismiss();
      if (result.role === 'saved') this.recarregarPosts();
      return;
    }
    post.repostPendente = true; this.aviso = '';
    this.postsService.repostar(post, comentario).subscribe({
      next: () => { post.repostPendente = false; this.recarregarPosts(); },
      error: erro => { post.repostPendente = false; this.aviso = mensagemErro(erro); }
    });
  }
  /** Dono = perfil da sessão autenticada, não o perfil exibido. */
  isPostOwner(post: any): boolean {
    return this.perfilSessaoId !== null && Number(post?.autorId) === this.perfilSessaoId;
  }

  canEditPost(post: any): boolean {
    return this.isPostOwner(post);
  }

  canDeletePost(post: any): boolean { return this.canEditPost(post); }

  async denunciarPost(post: any) {
    const resultado = await abrirDenuncia(this.modalController, post.id);
    if (resultado.role === 'saved') this.aviso = `Denúncia ${resultado.data?.protocolo} registrada para análise manual.`;
  }

  async editarPost(post: any) {
    const modal = await abrirModalPublicacao(this.modalController, this.alertas, post);
    const resultado = await modal.onDidDismiss();
    if (resultado.role === 'saved') this.recarregarPosts();
  }

  async excluirPost(post: any) {
    if (post.excluindo || !await confirmarAcao(this.alertas, 'Excluir publicação?',
      'A publicação e suas interações serão removidas. Esta ação não pode ser desfeita.', 'Excluir')) return;
    post.excluindo = true;
    this.postsService.excluir(post.id).subscribe({
      next: () => { this.recarregarPosts(); },
      error: erro => { post.excluindo = false; this.aviso = mensagemErro(erro); }
    });
  }

  alternarSeguimento() {
    if (!this.isPublicProfile || !this.sessao || !this.perfil?.id || this.seguindoPerfil === null || this.alterandoSeguimento) return;
    this.alterandoSeguimento = true;
    const perfilId = Number(this.perfil.id);
    const request = this.seguindoPerfil
      ? this.perfilService.deixarDeSeguir(perfilId)
      : this.perfilService.seguir(perfilId);
    request.subscribe({
      next: status => {
        this.seguindoPerfil = status.seguindo;
        this.perfilService.getPerfil(this.userRole!, this.userId).subscribe({
          next: perfil => { this.perfil = perfil; this.alterandoSeguimento = false; this.erroSeguimento = ''; },
          error: () => { this.alterandoSeguimento = false; this.erroSeguimento = 'Seguimento enviado; não foi possível atualizar os totais. Recarregue o perfil.'; }
        });
      },
      error: () => { this.alterandoSeguimento = false; this.erroSeguimento = 'Não foi possível alterar o seguimento. Tente novamente.'; }
    });
  }

  editProfile() {
    this.erroSalvarPerfil = '';
    this.showEditModal = true;
  }

  onProfileSaved(updated: any) {
    this.perfil = updated || this.perfil;
    this.showEditModal = false;
  }

  salvarFromModal(payload: { perfil: any; pfpFile?: File | null; backgroundFile?: File | null }) {
    if (this.isSaving) return;
    
    this.selectedPfpFile = payload.pfpFile || undefined;
    this.selectedBackgroundFile = payload.backgroundFile || undefined;

    const formData = new FormData();

    // Adicionar campos obrigatórios
    formData.append('nome', payload.perfil.nome || '');
    formData.append('usuario', payload.perfil.usuario || '');
    formData.append('biografia', payload.perfil.biografia || '');

    // Adicionar foto de perfil se selecionada
    if (this.selectedPfpFile) {
      formData.append('pfp', this.selectedPfpFile, this.selectedPfpFile.name);
    }

    // Adicionar imagem de fundo se selecionada
    if (this.selectedBackgroundFile) {
      formData.append('background', this.selectedBackgroundFile, this.selectedBackgroundFile.name);
    }

    if (this.isSaving) return;
    this.erroSalvarPerfil = '';
    this.isSaving = true;

    console.log(formData);

    this.perfilService
      .updatePerfil(
        this.userRole || '',
        this.userId,
        formData
      )
      .subscribe({
        next: (perfil: any) => {
          console.log('Perfil atualizado:', perfil);
          this.feedback.sucesso('Perfil atualizado.');
          this.erroSalvarPerfil = '';
          
          // Atualizar o perfil local com os dados retornados
          this.perfil = { 
            ...this.perfil, 
            ...perfil,
            pfp: perfil.pfp || this.perfil?.pfp,
            background: perfil.background || this.perfil?.background
          };
          
          localStorage.setItem('pfpPerfil', this.perfil.pfp || '');
          localStorage.setItem('perfilNome', this.perfil.nome || this.perfil.usuario || '');
          window.dispatchEvent(new CustomEvent('hipatec-profile-updated', {
            detail: { pfp: this.perfil.pfp }
          }));
          this.showEditModal = false;
          this.isSaving = false;
        },
        error: (err) => {
          console.error('Erro ao atualizar perfil:', err);
          this.erroSalvarPerfil = 'Não foi possível atualizar o perfil. Seus dados foram mantidos; tente novamente.';
          this.isSaving = false;
        }
      });
  }
}