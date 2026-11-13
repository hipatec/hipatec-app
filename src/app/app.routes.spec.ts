import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { AppComponent } from './app.component';

@Component({ standalone: true, template: 'Destino de teste' })
class DestinoTesteComponent { async canLeave() { return true; } }

describe('Painel — compatibilidade, sessão e navegação', () => {
  let role: string | null;
  beforeEach(() => {
    role = 'mentoras';
    TestBed.configureTestingModule({ providers: [
      provideRouter(routes.map(route => route.redirectTo ? route : {
        ...route, loadComponent: undefined, component: DestinoTesteComponent
      })),
      { provide: AuthService, useValue: {
        sessao: () => role ? of({ id: 999, role }) : throwError(() => new Error('Sem sessão'))
      } }
    ] });
  });

  for (const origem of ['/painel', '/mentorias']) {
    it(`abre ${origem} na rota canônica e conserva parâmetros repetidos e fragmento`, async () => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(`${origem}?filtro=a&filtro=b#agenda`);
      expect(TestBed.inject(Router).url).toBe('/painel?filtro=a&filtro=b#agenda');
    });

    it(`exige sessão para ${origem}`, async () => {
      role = null;
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(origem);
      expect(TestBed.inject(Router).url).toBe('/login');
    });
  }

  it('preserva contexto no atalho de evento e solicita o modal novo', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/calendario/eventos/novo?origem=agenda&evento=antigo#agenda');
    expect(TestBed.inject(Router).url).toBe('/painel?origem=agenda&evento=novo#agenda');
  });

  it('mantém criação, edição e gestão de mentoria separadas do painel', async () => {
    const harness = await RouterTestingHarness.create();
    for (const path of ['/mentorias/novo', '/mentorias/7/editar', '/mentorias/cadastro', '/gestao-mentorias']) {
      await harness.navigateByUrl(path);
      expect(TestBed.inject(Router).url).toBe(path === '/mentorias/cadastro' ? '/mentorias/novo' : path);
    }
    role = 'estudantes';
    await harness.navigateByUrl('/painel');
    expect(TestBed.inject(Router).url).toBe('/painel');
    await harness.navigateByUrl('/mentorias/novo');
    expect(TestBed.inject(Router).url).toBe('/home');
  });

  it('manda sessão existente de login para o painel', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/login');
    expect(TestBed.inject(Router).url).toBe('/painel');
  });

  it('mantém a navbar após o redirect e define o título Painel', async () => {
    const router = TestBed.inject(Router);
    const app = new AppComponent(router);
    app.ngOnInit();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/mentorias?origem=teste');
    expect(app.showNavbar).toBeTrue();
    expect(document.title).toBe('Painel');
    await harness.navigateByUrl('/mentorias/novo');
    expect(app.showNavbar).toBeTrue();
  });
});
