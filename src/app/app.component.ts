import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, IonApp, IonRouterOutlet, NavbarComponent],
})
export class AppComponent implements OnInit {
  showNavbar = false;

  private readonly appRoutes = ['/home', '/mentorias', '/aprendizado', '/gestao-mentorias', '/vagas', '/profile', '/admin/perfis'];

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateNavbarVisibility(this.router.url);
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => this.updateNavbarVisibility(event.urlAfterRedirects));
  }

  private updateNavbarVisibility(url: string) {
    const path = url.split('?')[0].split('#')[0];
    this.showNavbar = this.appRoutes.some(route => path === route || path.startsWith(`${route}/`));
  }
}
