import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonicModule } from '@ionic/angular';
import { EstudanteService } from '../../services/estudante.service';
import { MentoraService } from '../../services/mentora.service';
import { PerfilService } from '../../services/perfil.service';
import { EditProfileModalComponent } from '../../components/edit-profile-modal/edit-profile-modal.component';
import { PostsService } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';
import { close, ellipsisHorizontal, heart, heartOutline, chatbubbleOutline, pencil, trash, repeatOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CommonModule, 
    FormsModule,
    EditProfileModalComponent
  ]
})
export class ProfilePage {
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
    private route: ActivatedRoute
  ) {
    addIcons({ close, ellipsisHorizontal, heart, heartOutline, chatbubbleOutline, pencil, trash, repeatOutline });
  }
  isPublicProfile = false;
  userRole: string | null = null;
  userId = 0;
  perfil: any;
  posts: any[] = [];
  reposts: any[] = [];
  profileTab: 'posts' | 'reposts' = 'posts';
  postMenuId: string | number | null = null;
  iconeCurtir = heartOutline;
  iconeCurtido = heart;
  iconeComentar = chatbubbleOutline;

  ionViewWillEnter() {
    this.perfil = undefined;
    this.posts = [];
    this.reposts = [];
    this.showEditModal = false;
    const role = this.route.snapshot.paramMap.get('role');
    const publicId = Number(this.route.snapshot.paramMap.get('id'));
    this.isPublicProfile = Boolean(role && publicId);

    if (this.isPublicProfile && role && publicId) {
      this.userRole = role;
      this.userId = publicId;
      this.perfilService.getPerfil(role, publicId).subscribe(perfil => {
        this.perfil = perfil;
        this.loadPosts(publicId, false);
      });
      return;
    }

    this.authService.sessao().subscribe({
      next: sessao => {
        this.userRole = sessao.role;
        this.userId = sessao.id;
        this.perfilService.getPerfil(sessao.role, sessao.id).subscribe(perfil => {
          this.perfil = perfil;
          localStorage.setItem('perfil', String(perfil.id));
          this.loadPosts(perfil.id);
        });
      },
      error: () => { this.userRole = null; this.userId = 0; }
    });
  }

  private loadPosts(perfilId: number, includeLocalReposts = true) {
    this.postsService.getPostsPerfil(perfilId).subscribe(posts => {
      this.posts = posts.map(post => this.mapPost(post));
      if (includeLocalReposts) {
        const reposts = this.getLocalReposts(perfilId);
        this.posts = [...this.posts, ...reposts.filter((post: any) => post.repostComComentario)];
        this.reposts = reposts.filter((post: any) => post.repostPuro);
      }
    });
  }

  private getLocalReposts(perfilId: number) {
    const raw = JSON.parse(localStorage.getItem('hipatec-reposts') || '[]');
    const vistos = new Set<string>();
    return raw.filter((repost: any) => {
      const originalId = String(repost?.repostOriginalId ?? '');
      const valido = Boolean(repost?.id?.toString().startsWith('repost-'))
        && Boolean(originalId)
        && Boolean(repost?.repostOriginal)
        && (repost.repostPuro === true || repost.repostComComentario === true)
        && String(repost.repostOwnerId) === String(perfilId)
        && !vistos.has(`${originalId}:${repost.repostComComentario ? 'comment' : 'pure'}`);
      if (valido) vistos.add(`${originalId}:${repost.repostComComentario ? 'comment' : 'pure'}`);
      return valido;
    });
  }
  private mapPost(post: any) {
    const localReposts = JSON.parse(localStorage.getItem('hipatec-reposts') || '[]');
    const perfilId = localStorage.getItem('perfil');
    const repostado = localReposts.some((repost: any) => String(repost.repostOriginalId) === String(post.id)
      && String(repost.repostOwnerId) === String(perfilId)
      && (repost.repostPuro === true || repost.repostComComentario === true));
    return {
      ...post,
      conteudo: post.conteudo || post.texto || '',
      tempo: this.formatPostTime(post.dataCriacao),
      curtidas: post.likesCount ?? 0,
      comentarios: post.commentsCount ?? 0,
      reposts: (post.repostsCount ?? 0) + (repostado ? 1 : 0),
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


  toggleCurtida(post: any) {
    post.curtidoUsuario = !post.curtidoUsuario;
    post.curtidas = Math.max(0, (post.curtidas ?? 0) + (post.curtidoUsuario ? 1 : -1));
  }

  abrirComentario(post: any) {
    const comentario = window.prompt('Escreva um comentário:', '');
    if (comentario?.trim()) post.comentarios = (post.comentarios ?? 0) + 1;
  }

  repostar(post: any, comComentario = false) {
    const originalId = post.repostOriginal?.id || post.id;
    const reposts = JSON.parse(localStorage.getItem('hipatec-reposts') || '[]');
    const existente = reposts.find((item: any) => String(item.repostOriginalId) === String(originalId));

    if (existente) {
      localStorage.setItem('hipatec-reposts', JSON.stringify(reposts.filter((item: any) => item !== existente)));
      post.repostadoUsuario = false;
      post.reposts = Math.max(0, (post.reposts ?? 0) - 1);
      this.posts = this.posts.filter(item => item.id !== existente.id);
      this.reposts = this.reposts.filter(item => item.id !== existente.id);
      return;
    }

    const comentario = comComentario ? window.prompt('Adicione um comentário ao repost:', '') : '';
    if (comComentario && comentario === null) return;

    const novoRepost = {
      ...post,
      id: `repost-${Date.now()}`,
      repostOriginalId: originalId,
      repostOwnerId: localStorage.getItem('perfil'),
      conteudo: comentario || post.conteudo,
      repostOriginal: post,
      repostComComentario: Boolean(comentario),
      repostPuro: !comentario,
      tempo: 'agora',
      repostadoUsuario: true,
      reposts: 1
    };
    localStorage.setItem('hipatec-reposts', JSON.stringify([novoRepost, ...reposts]));
    post.repostadoUsuario = true;
    post.reposts = (post.reposts ?? 0) + 1;
    if (comentario) this.posts = [novoRepost, ...this.posts];
    else this.reposts = [novoRepost, ...this.reposts];
  }
  togglePostMenu(post: any) {
    this.postMenuId = this.postMenuId === post.id ? null : post.id;
  }

  isPostOwner(post: any): boolean {
    return Number(post.autorId) === Number(this.perfil?.id);
  }

  canEditPost(post: any): boolean {
    return this.isPostOwner(post);
  }

  canDeletePost(post: any): boolean {
    if (this.isPostOwner(post)) return true;
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

  editProfile() {
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
          alert('Perfil atualizado com sucesso!');
          
          // Atualizar o perfil local com os dados retornados
          this.perfil = { 
            ...this.perfil, 
            ...(payload.perfil || {}),
            pfp: perfil.pfp || this.perfil?.pfp,
            background: perfil.background || this.perfil?.background
          };
          
          this.showEditModal = false;
          this.isSaving = false;
        },
        error: (err) => {
          console.error('Erro ao atualizar perfil:', err);
          alert('Erro ao atualizar perfil. Tente novamente.');
          this.isSaving = false;
        }
      });
  }
}