import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApresentacaoPage } from './apresentacao.page';
import { routes } from '../../app.routes';

describe('Apresentação pública', () => {
  it('mantém o menu no desktop e o botão Entrar no cabeçalho', async () => {
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
    const nav = header.querySelector('nav');
    expect(nav).not.toBeNull();
    expect(nav?.textContent).toContain('Sobre');
    expect(nav?.textContent).toContain('Mentorias');
    expect(nav?.textContent).toContain('Comunidade');
    expect(nav?.textContent).toContain('Criar conta');
  });

  it('mantém a apresentação na raiz e o feed em /home', async () => {
    expect(await routes.find((route) => route.path === '')!.loadComponent!()).toBe(ApresentacaoPage);
    const { HomePage } = await import('../home/home.page');
    expect(await routes.find((route) => route.path === 'home')!.loadComponent!()).toBe(HomePage);
  });
});
