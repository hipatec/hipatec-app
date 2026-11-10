import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApresentacaoPage } from './apresentacao.page';
import { routes } from '../../app.routes';

describe('Apresentação pública', () => {
  it('exibe somente a ação Entrar na navegação pública', async () => {
    await TestBed.configureTestingModule({
      imports: [ApresentacaoPage],
      providers: [provideRouter(routes)],
    }).compileComponents();
    const fixture = TestBed.createComponent(ApresentacaoPage);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const header = element.querySelector('.public-header')!;
    const login = header.querySelector<HTMLAnchorElement>('.header-login')!;

    expect(login.textContent?.trim()).toBe('Entrar');
    expect(login.getAttribute('href')).toBe('/login');
    expect(header.querySelector('.menu-toggle')).toBeNull();
    expect(header.querySelector('nav')).toBeNull();
  });

  it('mantém a apresentação na raiz e o feed em /home', async () => {
    expect(await routes.find((route) => route.path === '')!.loadComponent!()).toBe(ApresentacaoPage);
    const { HomePage } = await import('../home/home.page');
    expect(await routes.find((route) => route.path === 'home')!.loadComponent!()).toBe(HomePage);
  });
});
