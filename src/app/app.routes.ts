import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: '',
    loadComponent: () => import('./pages/apresentacao/apresentacao.page').then((m) => m.ApresentacaoPage),
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'mentorias',
    loadComponent: () => import('./pages/mentorias/mentorias.page').then( m => m.MentoriasPage)
  },

  {
    path: 'cadastro',
    loadComponent: () => import('./pages/cadastro/cadastro.page').then( m => m.CadastroPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },

  {
    path: 'mentorias/cadastro',
    loadComponent: () => import('./pages/mentorias/cadastro/cadastro.page').then( m => m.CadastroPage)
  },
  {
    path: 'comunidade',
    loadComponent: () => import('./pages/comunidade/comunidade.page').then( m => m.ComunidadePage)
  },




];
