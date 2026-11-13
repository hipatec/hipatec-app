import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'configuracoes',
    canActivate: [authGuard],
    data: { mode: 'settings' },
    loadComponent: () => import('./pages/workspace-form/workspace-form.page').then(m => m.WorkspaceFormPage)
  },
  {
    path: 'aprendizado/cursos/novo',
    canActivate: [authGuard],
    canDeactivate: [(page: { canLeave(): Promise<boolean> }) => page.canLeave()],
    data: { mode: 'course', roles: ['mentoras', 'administradores', 'administrador'] },
    loadComponent: () => import('./pages/content-create/content-create.page').then(m => m.ContentCreatePage)
  },
  {
    path: 'aprendizado/cursos/:id/editar',
    canActivate: [authGuard],
    data: { mode: 'course', roles: ['mentoras', 'administradores', 'administrador'] },
    loadComponent: () => import('./pages/workspace-form/workspace-form.page').then(m => m.WorkspaceFormPage)
  },
  {
    path: 'mentorias/novo',
    canActivate: [authGuard],
    canDeactivate: [(page: { canLeave(): Promise<boolean> }) => page.canLeave()],
    data: { mode: 'mentoring', roles: ['mentoras', 'administradores', 'administrador'] },
    loadComponent: () => import('./pages/content-create/content-create.page').then(m => m.ContentCreatePage)
  },
  {
    path: 'mentorias/:id/editar',
    canActivate: [authGuard],
    data: { mode: 'mentoring', roles: ['mentoras', 'administradores', 'administrador'] },
    loadComponent: () => import('./pages/workspace-form/workspace-form.page').then(m => m.WorkspaceFormPage)
  },
  {
    path: 'vagas/nova',
    canActivate: [authGuard],
    data: { mode: 'job', roles: ['mentoras', 'administradores', 'administrador'] },
    loadComponent: () => import('./pages/workspace-form/workspace-form.page').then(m => m.WorkspaceFormPage)
  },
  {
    path: 'vagas/:id/editar',
    canActivate: [authGuard],
    data: { mode: 'job', roles: ['mentoras', 'administradores', 'administrador'] },
    loadComponent: () => import('./pages/workspace-form/workspace-form.page').then(m => m.WorkspaceFormPage)
  },
  {
    // Evento novo abre sobre o painel, preservando os demais parâmetros e o fragmento.
    path: 'calendario/eventos/novo',
    redirectTo: ({ queryParams, fragment }) => inject(Router).createUrlTree(['/painel'], {
      queryParams: { ...queryParams, evento: 'novo' }, fragment: fragment ?? undefined
    }),
    pathMatch: 'full'
  },
  {
    path: 'calendario/eventos/:id/editar',
    canActivate: [authGuard],
    data: { mode: 'event' },
    loadComponent: () => import('./pages/workspace-form/workspace-form.page').then(m => m.WorkspaceFormPage)
  },
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
    path: 'vagas',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/vagas/vagas.page').then(m => m.VagasPage)
  },
  {
    path: 'aprendizado',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/aprendizado/aprendizado.page').then(m => m.AprendizadoPage)
  },
  {
    path: 'gestao-mentorias',
    canActivate: [authGuard],
    canDeactivate: [(page: { canLeave(): Promise<boolean> }) => page.canLeave()],
    data: { roles: ['mentoras', 'administradores', 'administrador'] },
    loadComponent: () => import('./pages/gestao-mentorias/gestao-mentorias.page').then(m => m.GestaoMentoriasPage)
  },
  {
    path: 'admin/perfis',
    canActivate: [authGuard],
    data: { roles: ['administradores', 'administrador'] },
    loadComponent: () => import('./pages/admin-perfis/admin-perfis.page').then(m => m.AdminPerfisPage)
  },
  {
    path: 'mentorias',
    pathMatch: 'full',
    redirectTo: ({ queryParams, fragment }) => inject(Router).createUrlTree(['/painel'], { queryParams, fragment: fragment ?? undefined })
  },
  {
    path: 'painel',
    title: 'Painel',
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
    path: 'post/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/post-detail/post-detail.page').then(m => m.PostDetailPage)
  },
  {
    path: 'profile/:role/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.page').then( m => m.ProfilePage)
  },
  {
    path: 'mentorias/cadastro',
    redirectTo: '/mentorias/novo', pathMatch: 'full'
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./pages/forgot-password/forgot-password.page').then( m => m.ForgotPasswordPage)
  }
];
