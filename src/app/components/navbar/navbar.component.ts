import { Component, OnInit } from '@angular/core';
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
  imports: [
    CommonModule,
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
export class NavbarComponent  implements OnInit {

  public userROLE: string = '';
  public profileImage: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';
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
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.authService.sessao().pipe(switchMap(sessao => {
      this.userROLE = sessao.role;
      return this.perfilService.getPerfil(sessao.role, sessao.id);
    })).subscribe({
      next: profile => {
        this.profileImage = profile.pfp || 'https://ionicframework.com/docs/img/demos/avatar.svg';
        localStorage.setItem('perfil', String(profile.id));
        localStorage.setItem('pfpPerfil', this.profileImage);
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
      this.router.navigate(['/mentorias']);
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
    popover.dismiss().then(() => { 
      // Lógica futura para configurações
    });
  }
  logout(popover: any) {
    popover.dismiss().then(() => {
      this.authService.logout().subscribe({
        next: () => { window.location.assign('/login'); },
        error: () => { alert('Não foi possível encerrar a sessão. Tente novamente.'); }
      });
    });
  }
}
