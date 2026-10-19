import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PerfilService } from '../../services/perfil.service';
import { addIcons } from 'ionicons';
import { personOutline, settingsOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

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
  
  constructor(
    public router: Router,
    private perfilService: PerfilService,
    private authService: AuthService
  ) {
    addIcons({ personOutline, settingsOutline, logOutOutline });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    if (userRole && userId) {
      this.userROLE = userRole;
      this.perfilService.getPerfil(userRole, parseInt(userId)).subscribe({
        next: (profile: any) => {
          if (profile.pfp) {
            this.profileImage = profile.pfp;
            localStorage.setItem('pfpPerfil', profile.pfp);
            localStorage.setItem('perfil', profile.id || '');
          }
        },
        error: (err) => {
          console.error('Error loading profile:', err);
        }
      });
    }
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
      console.log('Saindo da conta...');
      this.authService.logout();
      this.router.navigate(['/login']); // Ajuste a rota se necessário
    });
  }

}
