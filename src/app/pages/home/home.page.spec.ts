import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';

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
      avatar: 'avatar.png',
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

  it('abre o menu da publicação e prepara o diálogo de denúncia', () => {
    const fixture = TestBed.createComponent(HomePage);
    const page = fixture.componentInstance;
    spyOn(page, 'buscarPosts');
    fixture.detectChanges();
    page.posts = [{
      id: 'post-1',
      autor: 'Estudante de teste',
      avatar: 'avatar.png',
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
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeTruthy();
    expect(page.postEmDenuncia.id).toBe('post-1');
    expect(page.motivoDenuncia).toBe('');
  });

  it('expande as sugestões sem navegar para fora do feed', () => {
    const fixture = TestBed.createComponent(HomePage);
    const page = fixture.componentInstance;

    expect(page.sugestoesExibidas.length).toBe(3);
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
});
