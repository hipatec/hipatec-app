import { Component, OnInit } from '@angular/core';
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

  // matriz simulando os dados vindos do banco **** substituir
  posts: any[] = [];
  carregando = false;
  erroFeed: string | null = null;
  postMenuId: string | number | null = null;
  userRole: string | null = null;
  postEmDenuncia: any = null;
  motivoDenuncia = '';

  // matriz para os itens da barra lateral ****esse n sei como podemos fazer, ja que seria um certo algoritmo para sugerir as pessoas, mas vou deixar aqui como exemplo
  sugestoes = [
    { nome: 'Nathalia Ventura', arroba: '@kawkdev' },
    { nome: 'Thiago Barbosa', arroba: '@thiwink' },
    { nome: 'Lucca Rosa', arroba: '@rosalucca' },
    { nome: 'Ana Clara', arroba: '@anaclara' },
    { nome: 'Marina Souza', arroba: '@marinasouza' },
    { nome: 'Paula Mendes', arroba: '@paulamendes' }
  ];
  quantidadeSugestoes = 3;

  get sugestoesExibidas() {
    return this.sugestoes.slice(0, this.quantidadeSugestoes);
  }

  constructor(
    private modalController: ModalController,
    private postsService: PostsService,
    private perfilService: PerfilService,
    private authService: AuthService
  ) {
    addIcons({ heartOutline, heart, chatbubbleOutline, add, ellipsisHorizontal, flagOutline, close, pencil, trash, repeatOutline });
  }

  ngOnInit() {
    this.authService.sessao().subscribe({
      next: sessao => this.userRole = sessao.role,
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
    const autor = perfil?.usuario || `Usuário ${post.autorId}`;
    const avatar = perfil?.pfp || post.autorFoto || 'https://ionicframework.com/docs/img/demos/avatar.svg';

    const localReposts = JSON.parse(localStorage.getItem('hipatec-reposts') || '[]');
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

  mostrarMaisSugestoes() {
    this.quantidadeSugestoes = this.sugestoes.length;
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
    const reposts = JSON.parse(localStorage.getItem('hipatec-reposts') || '[]');
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