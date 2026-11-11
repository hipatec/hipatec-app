import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { heartOutline, chatbubbleOutline, heart, add, ellipsisHorizontal, flagOutline, close, pencil, trash, repeatOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { CreatePostModalComponent } from '../../components/create-post-modal/create-post-modal.component';
import { CommentModalComponent } from '../../components/comment-modal/comment-modal.component';
import { PostsService } from '../../services/posts.service';
import { PerfilService, Perfil } from '../../services/perfil.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})

export class HomePage implements OnInit {

  public iconeCurtir = heartOutline;
  public iconeComentar = chatbubbleOutline;
  public iconeCurtido = heart;

  posts: any[] = [];
  carregando = false;
  erroFeed: string | null = null;
  postMenuId: string | number | null = null;
  userRole: string | null = null;
  userId: number | null = null;
  postEmDenuncia: any = null;
  motivoDenuncia = '';

  sugestoes: Array<{ id: number; role: string; nome: string; arroba: string; pfp?: string }> = [];
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
    addIcons({ heartOutline, heart, chatbubbleOutline, add, ellipsisHorizontal, flagOutline, close, pencil, trash, repeatOutline });
  }

  ngOnInit() {
    this.authService.sessao().subscribe({
      next: sessao => {
        this.userRole = sessao.role;
        this.userId = sessao.id;
      },
      error: () => this.userRole = null
    });
    this.buscarPosts();
  }

  buscarPosts() {
    this.carregando = true;
    this.erroFeed = null;
    forkJoin({
      posts: this.postsService.getPosts(),
      perfis: this.perfilService.getPerfis()
    }).subscribe({
      next: ({ posts, perfis }) => {
        this.sugestoes = perfis
          .filter(perfil => Number(perfil.id) !== Number(this.userId))
          .map(perfil => ({
            id: perfil.id,
            role: perfil.id_mentora ? 'mentoras' : 'estudantes',
            nome: perfil.nome,
            arroba: `@${perfil.usuario}`,
            pfp: perfil.pfp
          }));
        this.posts = posts.map(post => this.mapPost(post, perfis));
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

  private mapPost(post: any, perfis: Perfil[]) {
    const perfil = perfis.find(p => p.id === post.autorId);
    const autor = perfil?.nome || perfil?.usuario || `Usuário ${post.autorId}`;
    const avatar = perfil?.pfp || post.autorFoto || '';

    const localReposts = this.getLocalReposts();
    const repostado = localReposts.some((repost: any) => String(repost.repostOriginalId) === String(post.id));

    return {
      ...post,
      autor,
      autorRole: perfil?.id_estudante ? 'estudantes' : perfil?.id_mentora ? 'mentoras' : post.autorRole,
      avatar,
      tempo: this.formatPostTime(post.dataCriacao),
      curtidas: post.likesCount ?? 0,
      comentarios: post.commentsCount ?? 0,
      reposts: (post.repostsCount ?? 0) + (repostado ? 1 : 0),
      repostadoUsuario: repostado,
      curtidoUsuario: false
    };
  }

  private formatPostTime(timestamp: number) {
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
    try {
      const value = JSON.parse(localStorage.getItem('hipatec-reposts') || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      localStorage.removeItem('hipatec-reposts');
      return [];
    }
  }

  mostrarMaisSugestoes() {
    this.quantidadeSugestoes = this.sugestoes.length;
  }
  iniciais(nome: string | null | undefined): string {
    return (nome || 'Usuário')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(parte => parte[0]?.toUpperCase() || '')
      .join('');
  }

  abrirSugestao(sugestao: { role: string; id: number }) {
    this.router.navigate(['/profile', sugestao.role, sugestao.id]);
  }

  abrirPerfil(post: any) {
    const role = post.autorRole || 'estudantes';
    this.router.navigate(['/profile', role, post.autorId]);
  }
  togglePostMenu(post: any) {
    this.postMenuId = this.postMenuId === post.id ? null : post.id;
  }

  canEditPost(post: any): boolean {
    return post.autorRole === this.userRole;
  }

  canDeletePost(post: any): boolean {
    if (this.userRole === 'administradores' || this.userRole === 'administrador') return true;
    return this.userRole === 'mentoras' && post.autorRole === 'estudantes';
  }

  editarPost(post: any) {
    this.postMenuId = null;
    alert('A edição do post será conectada à API de publicações.');
  }

  excluirPost(post: any) {
    this.postMenuId = null;
    alert('A exclusão do post será conectada à API de moderação.');
  }
  abrirDenuncia(post: any) {
    this.postMenuId = null;
    this.postEmDenuncia = post;
    this.motivoDenuncia = '';
  }

  fecharDenuncia() {
    this.postEmDenuncia = null;
    this.motivoDenuncia = '';
  }

  enviarDenuncia() {
    if (!this.motivoDenuncia) {
      alert('Selecione um motivo para denunciar a publicação.');
      return;
    }

    alert('Denúncia preparada para envio à moderação.');
    this.fecharDenuncia();
  }

  toggleCurtida(post: any) {
    if (post.curtidoUsuario) {
      post.curtidas--;
      post.curtidoUsuario = false;
    } else {
      post.curtidas++;
      post.curtidoUsuario = true;
    }
  }

  repostar(post: any, comComentario = false) {
    const originalId = post.repostOriginal?.id || post.id;
    const reposts = this.getLocalReposts();
    const existente = reposts.find((repost: any) => String(repost.repostOriginalId) === String(originalId));

    if (existente) {
      localStorage.setItem('hipatec-reposts', JSON.stringify(reposts.filter((repost: any) => repost !== existente)));
      post.repostadoUsuario = false;
      post.reposts = Math.max(0, (post.reposts ?? 0) - 1);
      if (existente.repostComComentario) {
        this.posts = this.posts.filter(item => item.id !== existente.id);
      }
      return;
    }

    const comentario = comComentario ? window.prompt('Adicione um comentário ao repost:', '') : '';
    if (comComentario && comentario === null) return;

    const repost = {
      ...post,
      id: `repost-${Date.now()}`,
      repostOriginalId: originalId,
      repostOwnerId: localStorage.getItem('perfil'),
      conteudo: comentario || post.conteudo,
      repostOriginal: post,
      repostComComentario: Boolean(comentario),
      repostPuro: !comentario,
      tempo: 'agora'
    };
    localStorage.setItem('hipatec-reposts', JSON.stringify([repost, ...reposts]));
    post.repostadoUsuario = true;
    post.reposts = (post.reposts ?? 0) + 1;
    if (comentario) {
      this.posts = [repost, ...this.posts];
    } else {
      this.posts = [post, ...this.posts.filter(item => item.id !== post.id)];
    }
  }


  simularComentario(post: any) {
    // Por enquanto, apenas soma +1 ao contador para simular a ação
    post.comentarios++;
  }

  async abrirModalPost() {
    const modal = await this.modalController.create({
      component: CreatePostModalComponent,
      cssClass: 'custom-modal-post' // Classe opcional para estilizar o fundo do modal futuramente
    });
    return await modal.present();
  }

  async abrirModalComentario(post: any) {
    const modal = await this.modalController.create({
      component: CommentModalComponent,
      cssClass: 'custom-modal-post', // Reaproveitando o CSS do outro modal!
      componentProps: {
        postSelecionado: post // Passando o post inteiro para dentro do modal
      }
    });
    return await modal.present();
  }
}