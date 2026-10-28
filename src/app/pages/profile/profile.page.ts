import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { EstudanteService } from '../../services/estudante.service';
import { MentoraService } from '../../services/mentora.service';
import { PerfilService } from '../../services/perfil.service';
import { EditProfileModalComponent } from '../../components/edit-profile-modal/edit-profile-modal.component';
import { PostsService } from '../../services/posts.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule, 
    FormsModule, 
    NavbarComponent, 
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
    private authService: AuthService
  ) {}

  userRole: string | null = null;
  userId = 0;
  perfil: any;
  posts: any[] = [];

  ionViewWillEnter() {
    this.perfil = undefined;
    this.posts = [];
    this.showEditModal = false;
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
      error: () => {
        this.userRole = null;
        this.userId = 0;
      }
    });
  }

  private loadPosts(perfilId: number) {
    this.postsService.getPostsPerfil(perfilId).subscribe(posts => {
      this.posts = posts.map(post => this.mapPost(post));
      console.log('Posts carregados:', this.posts);
    });
  }

  private mapPost(post: any) {
    return {
      ...post,
      conteudo: post.conteudo || post.texto || '',
      tempo: this.formatPostTime(post.dataCriacao),
      curtidas: post.likesCount ?? 0,
      comentarios: post.commentsCount ?? 0
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