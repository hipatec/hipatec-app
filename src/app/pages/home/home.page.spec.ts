import { ModalController } from '@ionic/angular';
import { ReportModalComponent } from '../../components/content-form-modal/report-modal.component';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';

// Imagem inline: evita requisição a um asset inexistente no servidor do Karma.
const AVATAR_TESTE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

describe('HomePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    localStorage.clear();
  });

  it('renderiza com os provedores da aplicação', () => {
    const fixture = TestBed.createComponent(HomePage);
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

  it('informa quando o feed não tem publicações', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const request of http.match(() => true)) {
      if (request.request.url.endsWith('/auth/session')) request.flush(null, { status: 401, statusText: 'Unauthorized' });
      else request.flush([]);
    }
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nenhuma publicação ainda.');
    expect(fixture.componentInstance.carregando).toBeFalse();
    expect(fixture.componentInstance.erroFeed).toBeNull();
    http.verify();
  });

  it('mantém as ações do post como controles acessíveis e consistentes', () => {
    const fixture = TestBed.createComponent(HomePage);
    const page = fixture.componentInstance;
    spyOn(page, 'buscarPosts');
    fixture.detectChanges();
    page.posts = [{
      autor: 'Estudante de teste',
      avatar: AVATAR_TESTE,
      tempo: 'agora',
      conteudo: 'Publicação de teste',
      curtidas: 0,
      comentarios: 0,
      curtidoUsuario: false
    }];
    fixture.detectChanges();

    const like = fixture.nativeElement.querySelector('.btn-like');
    const comment = fixture.nativeElement.querySelector('.btn-comment');
    const options = fixture.nativeElement.querySelector('.btn-options');

    for (const control of [like, comment, options]) {
      expect(control.getAttribute('type')).toBe('button');
      expect(control.getAttribute('aria-label')).toBeTruthy();
    }
    expect(like.getAttribute('aria-label')).toBe('Curtir publicação de Estudante de teste');
    expect(comment.getAttribute('aria-label')).toBe('Comentar publicação de Estudante de teste');
    expect(options.getAttribute('aria-label')).toBe('Mais opções da publicação de Estudante de teste');
  });

  it('abre o menu da publicação e prepara o diálogo de denúncia', async () => {
    const fixture = TestBed.createComponent(HomePage);
    const create = spyOn(fixture.debugElement.injector.get(ModalController), 'create').and.resolveTo({ present: async () => {}, onDidDismiss: async () => ({ role: 'cancel' }) } as any);
    const page = fixture.componentInstance;
    spyOn(page, 'buscarPosts');
    fixture.detectChanges();
    page.posts = [{
      id: 'post-1',
      autor: 'Estudante de teste',
      avatar: AVATAR_TESTE,
      tempo: 'agora',
      conteudo: 'Publicação de teste',
      curtidas: 0,
      comentarios: 0,
      curtidoUsuario: false
    }];
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.btn-options') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="menu"]')).toBeTruthy();

    (fixture.nativeElement.querySelector('[role="menuitem"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(create).toHaveBeenCalled();
    expect(create.calls.mostRecent().args[0]?.component).toBe(ReportModalComponent);
    expect(create.calls.mostRecent().args[0]?.componentProps?.['postId']).toBe('post-1');
  });

  it('expande as sugestões sem navegar para fora do feed', () => {
    const fixture = TestBed.createComponent(HomePage);
    const page = fixture.componentInstance;

    expect(page.sugestoesExibidas.length).toBe(0);
    page.mostrarMaisSugestoes();
    expect(page.sugestoesExibidas.length).toBe(page.sugestoes.length);
  });

  it('informa quando não consegue carregar o feed', () => {
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const sessions = http.match('http://localhost:8080/auth/session');
    sessions.forEach(session => session.flush(null, { status: 401, statusText: 'Unauthorized' }));
    const posts = http.expectOne('http://localhost:8080/posts');
    const perfis = http.expectOne('http://localhost:8080/perfil');
    perfis.flush([]);
    posts.flush('falha', { status: 503, statusText: 'Service Unavailable' });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar o feed.');
    expect(fixture.componentInstance.carregando).toBeFalse();
    expect(fixture.componentInstance.erroFeed).toBe('Não foi possível carregar o feed.');
    http.verify();
  });

  // Sessão estudante conta 1 (perfil 42) e mentora conta 1 (perfil 7): mesmo número de conta, pessoas diferentes.
  for (const ordem of ['mentora listada primeiro', 'perfil próprio listado primeiro']) {
    it(`distingue contas de papéis diferentes ao abrir perfis e sugerir pessoas (${ordem})`, () => {
      const mentora = { id: 7, id_mentora: 1, nome: 'Mentora Um', usuario: 'mentora1' };
      const propria = { id: 42, id_estudante: 1, nome: 'Estudante Um', usuario: 'estudante1' };
      const perfis = ordem === 'mentora listada primeiro' ? [mentora, propria] : [propria, mentora];
      localStorage.setItem('perfil', '7'); // cache obsoleto não pode decidir a identidade
      const fixture = TestBed.createComponent(HomePage);
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.resolveTo(true);
      fixture.detectChanges();
      const http = TestBed.inject(HttpTestingController);
      http.expectOne('http://localhost:8080/auth/session').flush({ id: 1, role: 'estudantes' });
      http.expectOne('http://localhost:8080/posts').flush([
        { id: 'p-mentora', autorId: 7, conteudo: 'Da mentora', dataCriacao: Date.now() },
        { id: 'p-propria', autorId: 42, conteudo: 'Meu post', dataCriacao: Date.now() }
      ]);
    http.match(req => req.url.endsWith('/interacoes')).forEach(req => req.flush({ likesCount: 0, commentsCount: 0, curtidoUsuario: false }));
      http.expectOne('http://localhost:8080/perfil').flush(perfis);
      fixture.detectChanges();
      const page = fixture.componentInstance;

      expect(page.sugestoes).toEqual([jasmine.objectContaining({ id: 1, role: 'mentoras', nome: 'Mentora Um' })]);
      expect(page.posts.map(post => post.autorRole)).toEqual(['mentoras', 'estudantes']);

      page.abrirPerfil(page.posts[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/profile', 'mentoras', '1']);
      page.abrirPerfil(page.posts[1]);
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
      page.abrirSugestao(page.sugestoes[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/profile', 'mentoras', 1]);
      expect(router.navigate).not.toHaveBeenCalledWith(['/profile', 'mentoras', 7]);
      // Seguimento consulta o ID de PERFIL (7), nunca a conta (1) nem o próprio perfil (42).
      http.expectOne('http://localhost:8080/perfil/7/seguindo').flush({ seguindo: false });
      http.expectNone('http://localhost:8080/perfil/1/seguindo');
      http.expectNone('http://localhost:8080/perfil/42/seguindo');
      http.verify();
    });
  }

  it('não navega para um autor cuja conta não pode ser resolvida', () => {
    const fixture = TestBed.createComponent(HomePage);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.componentInstance.perfisDisponiveis = [{ id: 7 }];
    fixture.componentInstance.abrirPerfil({ autorId: 7, autorRole: 'mentoras' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('ignora reposts locais inválidos sem interromper o carregamento do feed', () => {
    localStorage.setItem('hipatec-reposts', '{invalido');
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    for (const request of http.match(() => true)) {
      if (request.request.url.endsWith('/auth/session')) {
        request.flush(null, { status: 401, statusText: 'Unauthorized' });
      } else if (request.request.url.endsWith('/posts')) {
        request.flush([{ id: 1, autorId: 1, conteudo: 'Teste', dataCriacao: Date.now() }]);
      } else {
        request.flush([]);
      }
    }
    http.match(req => req.url.endsWith('/interacoes')).forEach(req => req.flush({ likesCount: 0, commentsCount: 0, curtidoUsuario: false }));
    fixture.detectChanges();

    expect(fixture.componentInstance.posts.length).toBe(1);
    expect(fixture.componentInstance.carregando).toBeFalse();
    expect(localStorage.getItem('hipatec-reposts')).toBeNull();
    http.verify();
  });

  describe('Quem seguir', () => {
    const API = 'http://localhost:8080/';
    // GET /perfil real não traz `nome`; perfil 7 = mentora conta 1, perfil 42 = estudante conta 1 (sessão).
    const MENTORA = { id: 7, id_mentora: 1, usuario: 'mentora1', pfp: 'https://cdn.exemplo/m.png' };
    const OUTRA = { id: 9, id_estudante: 3, usuario: 'outra', pfp: null };
    const PROPRIA = { id: 42, id_estudante: 1, usuario: 'eu' };

    function iniciar(sessao: object | null, perfis: object[] = [MENTORA, OUTRA, PROPRIA]) {
      const fixture = TestBed.createComponent(HomePage);
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.resolveTo(true);
      fixture.detectChanges();
      const http = TestBed.inject(HttpTestingController);
      const sessaoReq = http.expectOne(`${API}auth/session`);
      if (sessao) sessaoReq.flush(sessao);
      else sessaoReq.flush(null, { status: 401, statusText: 'Unauthorized' });
      http.expectOne(`${API}posts`).flush([]);
      http.expectOne(`${API}perfil`).flush(perfis);
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      const item = (indice: number) => el.querySelectorAll<HTMLElement>('.sidebar-item')[indice];
      const seguir = (indice: number) => item(indice).querySelector<HTMLButtonElement>('.btn-follow')!;
      return { fixture, page: fixture.componentInstance, router, http, el, item, seguir };
    }

    const SESSAO = { id: 1, role: 'estudantes' };

    it('carrega o status real de cada pessoa pelo ID de perfil e mostra nome, foto ou iniciais', () => {
      const { fixture, http, item, seguir } = iniciar(SESSAO);
      expect(seguir(0).getAttribute('aria-busy')).toBe('true');
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: true });
      http.expectOne(`${API}perfil/9/seguindo`).flush({ seguindo: false });
      fixture.detectChanges();

      expect(item(0).querySelector('.item-name')?.textContent).toContain('mentora1');
      expect(item(0).querySelector('img')?.getAttribute('src')).toBe('https://cdn.exemplo/m.png');
      expect(item(1).querySelector('img')).toBeNull();
      expect(item(1).querySelector('.avatar-initials')?.textContent?.trim()).toBe('O');
      expect(seguir(0).textContent).toContain('Seguindo');
      expect(seguir(1).textContent).toContain('Seguir');
      expect(seguir(1).textContent).toContain('outra');
      expect(seguir(1).getAttribute('aria-busy')).toBeNull();
      http.verify();
    });

    it('troca foto quebrada por iniciais', () => {
      const { fixture, http, item } = iniciar(SESSAO, [MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: false });
      fixture.detectChanges();
      item(0).querySelector('img')!.dispatchEvent(new Event('error'));
      fixture.detectChanges();
      expect(item(0).querySelector('img')).toBeNull();
      expect(item(0).querySelector('.avatar-initials')?.textContent?.trim()).toBe('M');
      http.verify();
    });

    it('segue com pendência por pessoa e só confirma após reler o status', () => {
      const { fixture, page, http, router, seguir } = iniciar(SESSAO);
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: false });
      http.expectOne(`${API}perfil/9/seguindo`).flush({ seguindo: false });
      fixture.detectChanges();

      seguir(0).click();
      seguir(0).click(); // clique repetido durante a pendência é ignorado
      fixture.detectChanges();
      expect(seguir(0).getAttribute('aria-busy')).toBe('true');
      expect(seguir(0).getAttribute('aria-disabled')).toBe('true');
      expect(seguir(1).getAttribute('aria-busy')).toBeNull();

      const post = http.expectOne(`${API}perfil/7/seguir`);
      expect(post.request.method).toBe('POST');
      post.flush({ seguindo: true });
      fixture.detectChanges();
      expect(seguir(0).textContent).not.toContain('Seguindo'); // ainda sem read-back
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: true });
      fixture.detectChanges();

      expect(seguir(0).textContent).toContain('Seguindo');
      expect(seguir(0).getAttribute('aria-busy')).toBeNull();
      expect(page.anuncioSeguimento).toBe('Você está seguindo mentora1.');
      expect(router.navigate).not.toHaveBeenCalled(); // botão independente do card
      expect(localStorage.length).toBe(0);
      http.verify();
    });

    it('deixa de seguir com DELETE e respeita o status relido do servidor', () => {
      const { fixture, http, seguir } = iniciar(SESSAO, [MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: true });
      fixture.detectChanges();

      seguir(0).click();
      const del = http.expectOne(`${API}perfil/7/seguir`);
      expect(del.request.method).toBe('DELETE');
      del.flush({ seguindo: false });
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: false });
      fixture.detectChanges();
      expect(seguir(0).textContent).toContain('Seguir');
      expect(seguir(0).textContent).not.toContain('Seguindo');
      http.verify();
    });

    it('mostra erro acessível sem sucesso falso quando a mutação falha', () => {
      const { fixture, page, http, item, seguir } = iniciar(SESSAO, [MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: false });
      fixture.detectChanges();

      seguir(0).click();
      http.expectOne(`${API}perfil/7/seguir`).flush('erro', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      const erro = item(0).querySelector('[role="alert"]');
      expect(erro?.textContent).toContain('Não foi possível seguir mentora1');
      expect(seguir(0).getAttribute('aria-describedby')).toBe(erro?.id ?? '');
      expect(seguir(0).textContent).not.toContain('Seguindo');
      expect(page.anuncioSeguimento).toBe('');
      http.verify();
    });

    it('não confirma quando o read-back falha e informa que o estado não foi confirmado', () => {
      const { fixture, page, http, item, seguir } = iniciar(SESSAO, [MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: false });
      fixture.detectChanges();

      seguir(0).click();
      http.expectOne(`${API}perfil/7/seguir`).flush({ seguindo: true });
      http.expectOne(`${API}perfil/7/seguindo`).flush('erro', { status: 503, statusText: 'Unavailable' });
      fixture.detectChanges();

      expect(item(0).querySelector('[role="alert"]')?.textContent).toContain('não foi possível confirmar');
      expect(page.sugestoes[0].seguindo).toBeNull();
      expect(page.anuncioSeguimento).toBe('');
      http.verify();
    });

    it('informa falha ao carregar o status inicial sem presumir que segue', () => {
      const { fixture, http, item, seguir } = iniciar(SESSAO, [MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush('erro', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();
      expect(item(0).querySelector('[role="alert"]')?.textContent).toContain('Não foi possível verificar');
      expect(seguir(0).textContent).not.toContain('Seguindo');
      http.verify();
    });

    it('DELETE confirmado + read-back 503: novo clique só consulta GET, nunca volta a seguir', () => {
      const { fixture, page, http, item, seguir } = iniciar(SESSAO, [MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: true });
      fixture.detectChanges();

      seguir(0).click();
      const del = http.expectOne(`${API}perfil/7/seguir`);
      expect(del.request.method).toBe('DELETE');
      del.flush({ seguindo: false });
      http.expectOne(`${API}perfil/7/seguindo`).flush('erro', { status: 503, statusText: 'Unavailable' });
      fixture.detectChanges();
      expect(page.sugestoes[0].seguindo).toBeNull();
      expect(seguir(0).textContent).toContain('Verificar');
      expect(item(0).querySelector('[role="alert"]')?.textContent).toContain('não foi possível confirmar');

      seguir(0).click(); // estado desconhecido: só consulta
      const reconsulta = http.expectOne(`${API}perfil/7/seguindo`);
      expect(reconsulta.request.method).toBe('GET');
      http.expectNone(req => req.url.endsWith('/seguir'));
      fixture.detectChanges();
      expect(seguir(0).getAttribute('aria-busy')).toBe('true');
      expect(item(0).querySelector('[role="alert"]')).toBeNull();
      reconsulta.flush({ seguindo: false });
      fixture.detectChanges();

      expect(seguir(0).textContent).toContain('Seguir');
      expect(seguir(0).textContent).not.toContain('Seguindo');
      http.verify();

      seguir(0).click(); // agora com estado confirmado, o toggle volta a mutar
      const post = http.expectOne(`${API}perfil/7/seguir`);
      expect(post.request.method).toBe('POST');
      post.flush({ seguindo: true });
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: true });
      http.verify();
    });

    it('GET inicial falho e repetidos: Verificar só consulta, sem mutação, até o servidor responder', () => {
      const { fixture, http, item, seguir } = iniciar(SESSAO, [MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush('erro', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();
      expect(seguir(0).textContent).toContain('Verificar');
      expect(seguir(0).textContent).toContain('status de mentora1');

      seguir(0).click();
      seguir(0).click(); // ignorado durante a consulta pendente
      http.expectOne(`${API}perfil/7/seguindo`).flush('erro', { status: 500, statusText: 'Server Error' });
      http.expectNone(req => req.url.endsWith('/seguir'));
      fixture.detectChanges();
      expect(item(0).querySelector('[role="alert"]')?.textContent).toContain('Use Verificar');
      expect(seguir(0).getAttribute('aria-describedby')).toBe('seguir-erro-7');

      seguir(0).click();
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: true });
      fixture.detectChanges();
      expect(seguir(0).textContent).toContain('Seguindo');
      expect(item(0).querySelector('[role="alert"]')).toBeNull();
      http.expectNone(req => req.url.endsWith('/seguir'));
      http.verify();
    });

    it('recarrega o status do servidor ao recarregar o feed', () => {
      const { fixture, page, http, seguir } = iniciar(SESSAO, [MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: false });
      fixture.detectChanges();

      page.buscarPosts();
      http.expectOne(`${API}auth/session`).flush(SESSAO);
      http.expectOne(`${API}posts`).flush([]);
      http.expectOne(`${API}perfil`).flush([MENTORA]);
      http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: true });
      fixture.detectChanges();
      expect(seguir(0).textContent).toContain('Seguindo');
      http.verify();
    });

    it('card abre o perfil pela conta; Mostrar mais carrega o status dos novos itens', () => {
      const muitos = [MENTORA, OUTRA, { id: 11, id_estudante: 5, usuario: 'c' }, { id: 12, id_mentora: 6, usuario: 'd' }, PROPRIA];
      const { fixture, page, http, router, item } = iniciar(SESSAO, muitos);
      for (const id of [7, 9, 11]) http.expectOne(`${API}perfil/${id}/seguindo`).flush({ seguindo: false });
      http.expectNone(`${API}perfil/12/seguindo`);
      fixture.detectChanges();

      item(0).querySelector<HTMLButtonElement>('.item-link')!.click();
      expect(router.navigate).toHaveBeenCalledWith(['/profile', 'mentoras', 1]);

      page.mostrarMaisSugestoes();
      http.expectOne(`${API}perfil/12/seguindo`).flush({ seguindo: false });
      http.verify();
    });

    it('sem sessão não mostra Seguir nem consulta status', () => {
      const { el, http } = iniciar(null);
      expect(el.querySelectorAll('.sidebar-item').length).toBe(3);
      expect(el.querySelector('.btn-follow')).toBeNull();
      http.expectNone(req => req.url.endsWith('/seguindo'));
      http.verify();
    });
  });
});
