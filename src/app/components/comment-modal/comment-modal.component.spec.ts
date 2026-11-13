import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PostsService } from '../../services/posts.service';
import { CommentModalComponent } from './comment-modal.component';

describe('CommentModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommentModalComponent, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    localStorage.clear();
  });

  it('renderiza com os provedores da aplicação', () => {
    const fixture = TestBed.createComponent(CommentModalComponent);
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
  it('preserva texto no erro real e substitui a lista após confirmação, sem somar localmente', () => {
    const fixture = TestBed.createComponent(CommentModalComponent);
    const page = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController);
    page.postSelecionado = { id: 'fixture', comentarios: 0 };
    page.texto = 'Texto a preservar';
    page.enviar();
    const url = 'http://localhost:8080/posts/fixture';
    http.expectOne(url + '/comment').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(page.texto).toBe('Texto a preservar'); expect(page.erro).toContain('não confirmou');
    page.enviar(); page.enviar();
    http.expectOne(url + '/comment').flush(null);
    http.expectOne(url + '/interacoes').flush({ likesCount: 0, commentsCount: 2, curtidoUsuario: false });
    const comentarios = [{ id: 'a', texto: 'Anterior', autorId: 7, autorNome: 'Mentora' }, { id: 'b', texto: 'Texto a preservar', autorId: 42, autorNome: 'Aluna' }];
    http.expectOne(url + '/comments').flush(comentarios);
    expect(page.texto).toBe(''); expect(page.comentarios.length).toBe(2);
    expect(page.postSelecionado.comentarios).toBe(2); http.verify();
  });

  for (const cargaPendente of [false, true]) {
    it(`reconcilia após POST 200/interações 503/lista 200 com carga inicial ${cargaPendente ? 'pendente' : 'falha'}`, () => {
      const fixture = TestBed.createComponent(CommentModalComponent);
      const page = fixture.componentInstance;
      const http = TestBed.inject(HttpTestingController);
      const original = { id: 'fixture', comentarios: 0, commentsCount: 0 };
      page.postSelecionado = { id: 'repost', repostOriginal: original, comentarios: 0 };
      fixture.detectChanges();
      http.expectOne('http://localhost:8080/auth/session').flush(null, { status: 401, statusText: 'Unauthorized' });
      const url = 'http://localhost:8080/posts/fixture';
      const inicial = http.expectOne(url + '/comments');
      if (!cargaPendente) inicial.flush(null, { status: 503, statusText: 'Unavailable' });
      page.texto = 'Confirmado'; page.enviar(); page.enviar();
      http.expectOne(url + '/comment').flush(null);
      page.texto = 'Próximo'; page.enviar();
      http.expectNone(url + '/comment');
      http.expectOne(url + '/interacoes').flush(null, { status: 503, statusText: 'Unavailable' });
      const comentarios = [{ id: 'a', autorId: 7, autorNome: 'Mentora', texto: 'Confirmado' }];
      http.expectOne(url + '/comments').flush(comentarios);
      if (cargaPendente) expect(inicial.cancelled).toBeTrue();
      fixture.detectChanges();
      expect(page.comentarios).toEqual(comentarios);
      expect(page.postSelecionado.comentarios).toBe(1);
      expect(original.comentarios).toBe(1);
      expect(original.commentsCount).toBe(1);
      expect(page.erroCarregamento).toBe('');
      expect(page.erro).toContain('interações');
      expect(page.erro).toContain('Comentário enviado');
      expect(page.texto).toBe('Próximo');
      expect(page.carregando).toBeFalse(); expect(page.enviando).toBeFalse();
      expect(fixture.nativeElement.querySelectorAll('.comment-item').length).toBe(1);
      expect(fixture.nativeElement.textContent).not.toContain('Carregando comentários');
      http.verify();
    });
  }

  it('aplica o pubsub uma vez e relê a lista depois, sem duplicar o count', () => {
    const page = TestBed.createComponent(CommentModalComponent).componentInstance;
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(PostsService);
    page.postSelecionado = { id: 'fixture', comentarios: 0 };
    const listener = jasmine.createSpy('pubsub').and.callFake((event: Event) => {
      service.aplicarInteracoes(page.postSelecionado, (event as CustomEvent).detail);
    });
    window.addEventListener('hipatec-post-updated', listener);
    try {
      page.texto = 'Confirmado'; page.enviar();
      const url = 'http://localhost:8080/posts/fixture';
      http.expectOne(url + '/comment').flush(null);
      http.expectNone(url + '/comments');
      http.expectOne(url + '/interacoes').flush({ likesCount: 3, commentsCount: 1, curtidoUsuario: true });
      http.expectOne(url + '/comments').flush([{ id: 'a', autorId: 7, autorNome: 'Mentora', texto: 'Confirmado' }]);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(page.postSelecionado.comentarios).toBe(1);
      expect(page.postSelecionado.commentsCount).toBe(1);
      expect(page.postSelecionado.curtidas).toBe(3);
      expect(page.postSelecionado.curtidoUsuario).toBeTrue();
      expect(page.comentarios.length).toBe(1); expect(page.erro).toBe('');
      http.verify();
    } finally { window.removeEventListener('hipatec-post-updated', listener); }
  });

});
