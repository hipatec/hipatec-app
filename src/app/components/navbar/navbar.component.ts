import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PerfilService } from '../../services/perfil.service';
import { AuthService } from '../../services/auth.service';
import { switchMap } from 'rxjs';
import { addIcons } from 'ionicons';
import { personOutline, settingsOutline, logOutOutline, notificationsOutline, close } from 'ionicons/icons';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class NavbarComponent  implements OnInit {

  public userROLE: string = '';
  public profileImage: string = 'https://ionicframework.com/docs/img/demos/avatar.svg';
  public notificacoes = [
    { tipo: 'curtida', texto: 'Alguém curtiu sua publicação.', lida: false },
    { tipo: 'comentario', texto: 'Alguém comentou em sua publicação.', lida: false },
    { tipo: 'curso', texto: 'Você concluiu um curso.', lida: true },
    { tipo: 'matricula', texto: 'Sua matrícula foi realizada com sucesso.', lida: true },
    { tipo: 'conta', texto: 'Seus dados foram atualizados.', lida: true },
    { tipo: 'moderacao', texto: 'Um comentário seu foi removido por moderação.', lida: true }
  ];
  
  constructor(
    public router: Router,
    private perfilService: PerfilService,
    private authService: AuthService
  ) {
    addIcons({ personOutline, settingsOutline, logOutOutline, notificationsOutline, close });
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
  goToVagas(popover?: any) {
    const navigate = () => this.router.navigate(['/vagas']);
    if (popover) popover.dismiss().then(navigate);
    else navigate();
  }
  goToHome() {
    this.router.navigate(['/home']); // Ajuste a rota se necessário
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
