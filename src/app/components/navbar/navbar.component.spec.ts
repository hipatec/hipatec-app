import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  const fixtures: ComponentFixture<NavbarComponent>[] = [];

  function createNavbarFixture() {
    const fixture = TestBed.createComponent(NavbarComponent);
    document.body.appendChild(fixture.nativeElement);
    fixtures.push(fixture);
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    localStorage.clear();
  });

  afterEach(() => {
    fixtures.splice(0).forEach(fixture => fixture.destroy());
  });

  it('não publica notificações fictícias antes da integração com a API', () => {
    const fixture = createNavbarFixture();

    expect(fixture.componentInstance.notificacoes).toEqual([]);
    expect(fixture.componentInstance.notificacoesNaoLidas).toBe(0);
  });

  it('renderiza com os provedores da aplicação', () => {
    const fixture = createNavbarFixture();
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const request of http.match(() => true)) {
      if (request.request.url.endsWith('/auth/session')) request.flush(null, { status: 401, statusText: 'Unauthorized' });
      else request.flush([]);
    }
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
    http.verify();
  });

  it('usa o logo como atalho para a home', () => {
    const fixture = createNavbarFixture();
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();

    const logo = fixture.nativeElement.querySelector('.logo-button') as HTMLButtonElement;
    logo.click();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('registra e hidrata o avatar do Ionic usado na navegação', async () => {
    const fixture = createNavbarFixture();
    fixture.detectChanges();

    await customElements.whenDefined('ion-avatar');
    const avatar = fixture.nativeElement.querySelector('.user-avatar') as HTMLElement & {
      componentOnReady?: () => Promise<unknown>;
    };
    await avatar.componentOnReady?.();

    expect(customElements.get('ion-avatar')).toBeDefined();
    expect(avatar.classList.contains('hydrated')).toBeTrue();
  });

  it('navega para os destinos compactados no menu móvel', async () => {
    const fixture = createNavbarFixture();
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();

    const popover = { dismiss: () => Promise.resolve() };
    fixture.componentInstance.goToHome(popover);
    await fixture.whenStable();
    fixture.componentInstance.goToMentoria(popover);
    await fixture.whenStable();
    fixture.componentInstance.goToMeuAprendizado(popover);
    await fixture.whenStable();
    fixture.componentInstance.goToGestao(popover);
    await fixture.whenStable();
    fixture.componentInstance.goToVagas(popover);
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith(['/home']);
    expect(router.navigate).toHaveBeenCalledWith(['/mentorias']);
    expect(router.navigate).toHaveBeenCalledWith(['/aprendizado']);
    expect(router.navigate).toHaveBeenCalledWith(['/gestao-mentorias']);
    expect(router.navigate).toHaveBeenCalledWith(['/vagas']);
  });
});
