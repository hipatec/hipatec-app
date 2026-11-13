import { FeedbackNoticeComponent } from '../feedback-notice/feedback-notice.component';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonAvatar,
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonPopover,
  IonSearchbar,
  IonToolbar
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { PerfilService } from '../../services/perfil.service';
import { AuthService } from '../../services/auth.service';
import { switchMap } from 'rxjs';
import { AvatarComponent } from '../avatar/avatar.component';
import { addIcons } from 'ionicons';
import {
  bookOutline,
  briefcaseOutline,
  close,
  homeOutline,
  logOutOutline,
  notificationsOutline,
  personOutline,
  settingsOutline,
  starOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [FeedbackNoticeComponent,
    CommonModule,
    AvatarComponent,
    IonAvatar,
    IonBadge,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonPopover,
    IonSearchbar,
    IonToolbar
  ]
})
export class NavbarComponent  implements OnInit, OnDestroy {
  erroLogout = '';


  private readonly profileUpdated = (event: Event) => {
    const perfil = (event as CustomEvent).detail;
    if (perfil?.nome || perfil?.usuario) this.profileName = perfil.nome || perfil.usuario;
    const image = (event as CustomEvent<{ pfp?: string }>).detail?.pfp;
    if (image) {
      this.profileImage = image;
      localStorage.setItem('pfpPerfil', image);
    }
  };
  public userROLE: string = '';
  public profileName = '';
  public profileImage = '';
  public notificacoes: Array<{ tipo: string; texto: string; lida: boolean }> = [];
  
  constructor(
    public router: Router,
    private perfilService: PerfilService,
    private authService: AuthService
  ) {
    addIcons({
      bookOutline,
      briefcaseOutline,
      close,
      homeOutline,
      logOutOutline,
      notificationsOutline,
      personOutline,
      settingsOutline,
      starOutline
    });
  }

  ngOnInit() {
    window.addEventListener('hipatec-profile-updated', this.profileUpdated);
    const cachedAvatar = localStorage.getItem('pfpPerfil');
    if (cachedAvatar && !cachedAvatar.includes('ionicframework.com')) this.profileImage = cachedAvatar;
    this.profileName = localStorage.getItem('perfilNome') || '';
    this.loadUserProfile();
  }

  ngOnDestroy() {
    window.removeEventListener('hipatec-profile-updated', this.profileUpdated);
  }

  private loadUserProfile() {
    this.authService.sessao().pipe(switchMap(sessao => {
      this.userROLE = sessao.role;
      return this.perfilService.getPerfil(sessao.role, sessao.id);
    })).subscribe({
      next: profile => {
        this.profileName = profile.nome || profile.usuario || '';
        this.profileImage = profile.pfp || this.profileImage || '';
        localStorage.setItem('perfil', String(profile.id));
        localStorage.setItem('perfilNome', this.profileName);
        if (this.profileImage) localStorage.setItem('pfpPerfil', this.profileImage);
      },
      error: () => { this.userROLE = ''; }
    });
  }

  get notificacoesNaoLidas() {
    return this.notificacoes.filter(notificacao => !notificacao.lida).length;
  }

  marcarNotificacoesComoLidas() {
    this.notificacoes = this.notificacoes.map(notificacao => ({ ...notificacao, lida: true }));
  }

  removerNotificacao(indice: number) {
    this.notificacoes = this.notificacoes.filter((_, index) => index !== indice);
  }

  limparNotificacoes() {
    this.notificacoes = [];
  }

  goToMeuAprendizado(popover: any) {
    popover.dismiss().then(() => this.router.navigate(['/aprendizado']));
  }
  goToGestao(popover: any) {
    popover.dismiss().then(() => this.router.navigate(['/gestao-mentorias']));
  }

  goToAdmin(popover: any) {
    popover.dismiss().then(() => this.router.navigate(['/admin/perfis']));
  }
  goToProfile(popover: any) {
    popover.dismiss().then(() => {
      this.router.navigate(['/profile']); // Coloque a rota correta do seu perfil
    });
  }
  goToMentoria(popover: any) {
    popover.dismiss().then(() => {
      this.router.navigate(['/painel']);
    });
  }
  goToHome(popover?: any) {
    if (popover) {
      popover.dismiss().then(() => this.router.navigate(['/home']));
    } else {
      this.router.navigate(['/home']);
    }
  }

  goToVagas(popover?: any) {
    const navigate = () => this.router.navigate(['/vagas']);
    if (popover) popover.dismiss().then(navigate);
    else navigate();
  }

  goToSettings(popover: any) {
    popover.dismiss().then(() => this.router.navigate(['/configuracoes']));
  }
  logout(popover: any) {
    popover.dismiss().then(() => {
      this.authService.logout().subscribe({
        next: () => { window.location.assign('/login'); },
        error: () => { this.erroLogout = 'Não foi possível encerrar a sessão. Abra o menu e tente novamente.'; }
      });
    });
  }
}
