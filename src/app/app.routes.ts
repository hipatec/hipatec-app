import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';
import { guestGuard } from './guards/guest.guard';

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
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'redefinir-senha',
    data: { redefinir: true },
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then(m => m.ForgotPasswordPage)
  },
  {
    path: 'mentorias',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/mentorias/mentorias.page').then( m => m.MentoriasPage)
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/onboarding/onboarding.page').then(m => m.OnboardingPage)
  },

  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/cadastro/cadastro.page').then( m => m.CadastroPage)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },

  {
    path: 'mentorias/cadastro',
    canActivate: [authGuard],
    data: { mentora: true },
    loadComponent: () => import('./pages/mentorias/cadastro/cadastro.page').then( m => m.CadastroPage)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  },





];
