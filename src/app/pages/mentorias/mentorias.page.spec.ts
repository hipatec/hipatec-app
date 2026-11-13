import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import { MentoriasPage } from './mentorias.page';
import { routes } from '../../app.routes';

describe('MentoriasPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentoriasPage, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    localStorage.clear();
  });

  it('renderiza com os provedores da aplicação', () => {
    const fixture = TestBed.createComponent(MentoriasPage);
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

  it('agenda usa data civil da API e falha de carga permite retry sem vazio enganoso', () => {
    const fixture = TestBed.createComponent(MentoriasPage); const page = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    page.anoAtual = 2026; page.mesAtual = 10; page.carregarEventos();
    http.expectOne(r=>r.url.endsWith('/eventos') && r.params.get('de') === '2026-11-01')
      .flush({}, {status:503,statusText:'Unavailable'});
    expect(page.erroEventos).toContain('Não foi possível');
    page.carregarEventos();
    http.expectOne(r=>r.url.endsWith('/eventos')).flush([{id:7,titulo:'Dia civil',data:'2026-11-20',horario:null,local:'',descricao:'',visibilidade:'PRIVADO',fuso:'America/Sao_Paulo'}]);
    expect(page.agenda[0].data).toBe('20/11/2026'); expect(page.agenda[0].tipo).toContain('Dia inteiro');
    expect(page.diasComEvento).toEqual([20]); expect(page.erroEventos).toBe(''); http.verify();
  });

  it('troca o mês e gera os dias correspondentes', () => {
    const fixture = TestBed.createComponent(MentoriasPage);
    const page = fixture.componentInstance;
    const tituloInicial = page.tituloDoMes;
    page.mudarMes(1);
    expect(page.tituloDoMes).not.toBe(tituloInicial);
    expect(page.diasComEvento).toEqual([]);
    page.mudarMes(-1);
    expect(page.tituloDoMes).toBe(tituloInicial);
    expect(page.diasComEvento).toEqual([]);
  });
});

describe('MentoriasPage — Adicionar evento em modal', () => {
  const API = 'http://localhost:8080/';
  let query: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  async function criar(params: Record<string, string> = {}) {
    query = new BehaviorSubject(convertToParamMap(params));
    await TestBed.configureTestingModule({
      imports: [MentoriasPage, IonicModule.forRoot({ animated: false })],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { queryParamMap: query.asObservable(), snapshot: { queryParamMap: query.value } } }
      ]
    }).compileComponents();
    const fixture = TestBed.createComponent(MentoriasPage);
    document.body.appendChild(fixture.nativeElement);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.callFake(async () => { query.next(convertToParamMap({})); return true; });
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    return { fixture, router, http, el: fixture.nativeElement as HTMLElement };
  }

  const esperar = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
  const topo = () => TestBed.inject(ModalController).getTop();
  /** O primeiro ion-modal é carregado sob demanda: espera a apresentação terminar. */
  async function aguardarModal(): Promise<HTMLIonModalElement> {
    for (let i = 0; i < 100; i++) {
      const modal = await topo();
      if (modal) return modal;
      await esperar(30);
    }
    throw new Error('modal não apresentado');
  }

  afterEach(async () => {
    await esperar(50);
    for (const modal of Array.from(document.querySelectorAll('ion-modal'))) {
      modal.canDismiss = true;
      await modal.dismiss().catch(() => undefined);
      modal.remove();
    }
    document.querySelectorAll('app-mentorias').forEach(el => el.remove());
  });

  it('abre o modal sobre o próprio painel com os campos do papel e devolve o foco ao botão', async () => {
    const { fixture, router, http, el } = await criar();
    http.expectOne(`${API}auth/session`).flush({ id: 1, role: 'estudantes' });
    http.expectOne(`${API}mentorias`).flush([]);
    http.expectOne(r => r.url.endsWith('/eventos')).flush([]);
    fixture.detectChanges();

    const botao = el.querySelector<HTMLButtonElement>('.add-event-button')!;
    expect(botao.tagName).toBe('BUTTON');
    expect(botao.getAttribute('routerLink')).toBeNull();
    botao.focus();
    botao.click();

    const modal = await aguardarModal();
    expect(modal.querySelector('.modal-title')?.textContent).toContain('Adicionar evento');
    expect(modal.querySelector('#evento-horario')).toBeTruthy();
    expect(router.navigate).not.toHaveBeenCalled();

    botao.click(); // não abre um segundo modal
    await esperar(50);
    expect(document.querySelectorAll('ion-modal').length).toBe(1);

    await modal.dismiss(undefined, 'cancel');
    await esperar(20);
    expect(document.activeElement).toBe(botao);
    http.verify();
  });

  it('entrada pela rota legada abre o modal só após a sessão e limpa a URL sem reabrir', async () => {
    const { router, http } = await criar({ evento: 'novo' });
    await esperar(300);
    expect(document.querySelector('ion-modal')).toBeNull(); // papel ainda desconhecido

    http.expectOne(`${API}auth/session`).flush({ id: 2, role: 'mentoras' });
    http.expectOne(`${API}mentorias`).flush([]);
    http.expectOne(r => r.url.endsWith('/eventos')).flush([]);
    const modal = await aguardarModal();
    expect(modal.querySelector('#evento-horario')).toBeTruthy();
    expect(modal.querySelector('#evento-privacidade')).toBeTruthy();

    await modal.dismiss(undefined, 'cancel');
    await esperar(20);
    expect(router.navigate).toHaveBeenCalledOnceWith([], jasmine.objectContaining({
      queryParams: { evento: null }, queryParamsHandling: 'merge', preserveFragment: true, replaceUrl: true
    }));
    expect(await topo()).toBeUndefined();
    http.verify();
  });
});

describe('Rota legada /calendario/eventos/novo', () => {
  @Component({ standalone: true, template: 'painel' })
  class PainelStubPage {}

  it('redireciona para o painel com o pedido de evento e mantém a edição no formulário antigo', async () => {
    const legado = routes.find(rota => rota.path === 'calendario/eventos/novo')!;
    expect(typeof legado.redirectTo).toBe('function');
    expect(legado.loadComponent).toBeUndefined();
    const edicao = routes.find(rota => rota.path === 'calendario/eventos/:id/editar')!;
    expect(edicao.loadComponent).toBeDefined();
    expect(routes.find(rota => rota.path === 'painel')?.canActivate?.length).toBe(1);

    TestBed.configureTestingModule({ providers: [provideRouter([legado, { path: 'painel', component: PainelStubPage }])] });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/calendario/eventos/novo');
    expect(TestBed.inject(Router).url).toBe('/painel?evento=novo');
  });
});
