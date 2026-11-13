import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { GestaoMentoriasPage } from './gestao-mentorias.page';

describe('Gestão de mentorias — criação de conteúdo', () => {
  let fixture: ComponentFixture<GestaoMentoriasPage>;
  let host: HTMLElement;
  const wait = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));
  const button = () => host.querySelector<HTMLElement>('.content-create-button')!;
  const popover = () => document.querySelector<HTMLIonPopoverElement>('ion-popover')!;
  async function settled(predicate: () => boolean) {
    for (let i = 0; i < 100; i++) {
      fixture.detectChanges();
      if (predicate()) return;
      await wait();
    }
    throw new Error('Estado do menu não atingido');
  }
  async function open() {
    button().focus();
    button().click();
    await settled(() => !!document.querySelector('.content-create-menu') && document.activeElement === document.querySelector('.content-create-menu a'));
  }
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestaoMentoriasPage, IonicModule.forRoot({ animated: false })],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), provideIonicAngular({ animated: false })]
    }).compileComponents();
    fixture = TestBed.createComponent(GestaoMentoriasPage);
    host = fixture.nativeElement;
    document.body.appendChild(host);
    fixture.detectChanges();
    await wait(100);
  });
  afterEach(async () => {
    await document.querySelector<HTMLIonModalElement>('ion-modal')?.dismiss();
    await popover()?.dismiss();
    fixture.destroy();
    host.remove();
  });
  it('inicia fechado e abre/fecha pelo botão com ARIA e foco', async () => {
    expect(document.querySelector('.content-create-menu')).toBeNull();
    expect(button().getAttribute('aria-expanded')).toBe('false');
    await open();
    expect(button().getAttribute('aria-expanded')).toBe('true');
    expect(button().getAttribute('aria-controls')).toBe(popover().id);
    expect(document.activeElement).toBe(document.querySelector('.content-create-menu a'));
    button().click();
    await settled(() => button().getAttribute('aria-expanded') === 'false');
    await wait(100);
    expect(document.activeElement).toBe(button());
  });
  for (const action of ['Escape', 'fora']) {
    it(`fecha por ${action} e devolve foco`, async () => {
      await open();
      if (action === 'Escape') document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      else popover().shadowRoot!.querySelector('ion-backdrop')!.dispatchEvent(new CustomEvent('ionBackdropTap', { bubbles: true, composed: true }));
      await settled(() => button().getAttribute('aria-expanded') === 'false');
      await wait(100);
      expect(document.activeElement).toBe(button());
    });
  }
  for (const path of ['/aprendizado/cursos/novo', '/mentorias/novo']) {
    it(`preserva link ${path} e fecha ao selecionar`, async () => {

      await open();
      const link = document.querySelector<HTMLAnchorElement>(`a[href="${path}"]`)!;
      expect(link).toBeTruthy();
      expect(link.querySelector('button, a, ion-button')).toBeNull();
      link.click();
      await settled(() => button().getAttribute('aria-expanded') === 'false');
      await settled(() => !!document.querySelector('ion-modal .modal-title') && document.activeElement === document.querySelector('ion-modal .modal-title'));
      expect(document.querySelector('ion-modal .modal-title')?.textContent).toContain(path.includes('cursos') ? 'curso' : 'mentoria');
      await document.querySelector<HTMLIonModalElement>('ion-modal')?.dismiss();
      await wait(100);
      expect(document.activeElement).toBe(button());
    });
  }
  it('fecha ao sair da tela e não reabre ao retornar', async () => {
    await open();
    (fixture.componentInstance as unknown as { ionViewWillLeave(): void }).ionViewWillLeave();
    await settled(() => popover().classList.contains('overlay-hidden'));
    expect(button().getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.content-create-menu')).toBeNull();
  });
});
