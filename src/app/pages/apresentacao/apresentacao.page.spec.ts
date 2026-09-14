import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApresentacaoPage } from './apresentacao.page';
import { routes } from '../../app.routes';

describe('Apresentação pública', () => {
  it('abre e fecha a navegação móvel pelo botão, por Escape e por um link', async () => {
    await TestBed.configureTestingModule({
      imports: [ApresentacaoPage],
      providers: [provideRouter(routes)],
    }).compileComponents();
    const fixture = TestBed.createComponent(ApresentacaoPage);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    const button = element.querySelector<HTMLButtonElement>('.menu-toggle')!;
    const nav = element.querySelector('nav')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(nav.classList.contains('open')).toBeTrue();

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    const link = nav.querySelector<HTMLAnchorElement>('a[href="#sobre"]')!;
    link.click();
    fixture.detectChanges();
    await new Promise(requestAnimationFrame);
    expect(nav.classList.contains('open')).toBeFalse();
    expect(document.activeElement).toBe(element.querySelector('#sobre'));
  });

  it('mantém a apresentação na raiz e o feed em /home', async () => {
    expect(await routes.find((route) => route.path === '')!.loadComponent!()).toBe(ApresentacaoPage);
    const { HomePage } = await import('../home/home.page');
    expect(await routes.find((route) => route.path === 'home')!.loadComponent!()).toBe(HomePage);
  });
});
