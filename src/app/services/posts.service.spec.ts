import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PostsService } from './posts.service';

const API = 'http://localhost:8080/posts';
describe('Interações persistidas', () => {
  let service: PostsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PostsService); http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('recupera total e curtida autenticada ao carregar, sem cache de identidade', () => {
    localStorage.setItem('perfil', '999');
    service.getPosts().subscribe(posts => {
      expect(posts[0].likesCount).toBe(4); expect(posts[0].curtidoUsuario).toBeTrue();
    });
    http.expectOne(API).flush([{ id: 'p1', autorId: 42 }]);
    http.expectOne(API + '/p1/interacoes').flush({ likesCount: 4, commentsCount: 2, curtidoUsuario: true });
  });

  for (const perfil of [false, true]) {
    for (const status of [503, 401]) {
      it(`preserva lista ${perfil ? 'do perfil' : 'pública'} com uma interação ${status}`, () => {
        const base = [
          { id: 'p1', autorId: 42, conteudo: 'Primeiro' },
          { id: 'p2', autorId: 42, conteudo: 'Preservado', likesCount: 5, commentsCount: 2 },
          { id: 'p3', autorId: 7, conteudo: 'Terceiro' }
        ];
        let resultado: any[] | undefined;
        (perfil ? service.getPostsPerfil(42) : service.getPosts()).subscribe({
          next: posts => resultado = posts, error: () => fail('Uma interação não deve derrubar a lista')
        });
        http.expectOne(API + (perfil ? '/autor/42' : '')).flush(base);
        const requests = base.map(post => http.expectOne(API + '/' + post.id + '/interacoes'));
        requests[0].flush({ likesCount: 4, commentsCount: 1, curtidoUsuario: status !== 401 });
        requests[1].flush(null, { status, statusText: 'Unavailable' });
        expect(requests[2].cancelled).toBeFalse();
        if (!requests[2].cancelled) requests[2].flush({ likesCount: 9, commentsCount: 3, curtidoUsuario: false });
        expect(resultado?.map(post => post.conteudo)).toEqual(base.map(post => post.conteudo));
        expect(resultado?.[1]).toEqual({ ...base[1], curtidoUsuario: undefined, repostadoUsuario: undefined, interacoesDesconhecidas: true });
        expect(resultado?.[0].likesCount).toBe(4);
        expect(resultado?.[2].likesCount).toBe(9);
      });
    }
  }

  it('GET 503 em post já curtido/repostado exige retry GET antes de permitir DELETE', () => {
    let post: any;
    service.getPosts().subscribe(posts => post = posts[0]);
    http.expectOne(API).flush([{ id: 'p1', conteudo: 'Fixture já curtida e republicada', curtidoUsuario: true, repostadoUsuario: true, likesCount: 8 }]);
    http.expectOne(API + '/p1/interacoes').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(post.conteudo).toContain('Fixture');
    expect(post.interacoesDesconhecidas).toBeTrue();
    expect(post.curtidoUsuario).toBeUndefined();
    expect(post.repostadoUsuario).toBeUndefined();
    service.alternarCurtida(post);
    service.repostar(post).subscribe({ error: () => {} });
    http.expectNone(r => r.method !== 'GET');
    service.recuperarInteracoes(post);
    service.alternarCurtida(post);
    http.expectNone(r => r.method !== 'GET');
    http.expectOne(API + '/p1/interacoes').flush({ likesCount: 8, commentsCount: 2, repostsCount: 3, curtidoUsuario: true, repostadoUsuario: true });
    expect(post.interacoesDesconhecidas).toBeFalse();
    http.expectNone(r => r.method !== 'GET');
    service.alternarCurtida(post);
    const like = http.expectOne(API + '/p1/like'); expect(like.request.method).toBe('DELETE'); like.flush(null);
    http.expectOne(API + '/p1/interacoes').flush({ likesCount: 7, commentsCount: 2, repostsCount: 3, curtidoUsuario: false, repostadoUsuario: true });
    service.repostar(post).subscribe();
    const repost = http.expectOne(API + '/p1/repost'); expect(repost.request.method).toBe('DELETE'); repost.flush(null);
  });

  it('bloqueia duplo clique, não envia ID de conta e só aplica totais confirmados', () => {
    const post = { id: 'p1', curtidas: 4, curtidoUsuario: false };
    service.alternarCurtida(post); service.alternarCurtida(post);
    const request = http.expectOne(API + '/p1/like');
    expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({});
    expect(post.curtidas).toBe(4);
    request.flush(null);
    http.expectOne(API + '/p1/interacoes').flush({ likesCount: 7, commentsCount: 3, curtidoUsuario: true });
    expect(post.curtidas).toBe(7); expect(post.curtidoUsuario).toBeTrue();
    service.alternarCurtida(post);
    const undo = http.expectOne(API + '/p1/like'); expect(undo.request.method).toBe('DELETE');
    undo.flush(null);
    http.expectOne(API + '/p1/interacoes').flush({ likesCount: 6, commentsCount: 3, curtidoUsuario: false });
    expect(post.curtidas).toBe(6);
  });

  it('mantém o estado confirmado quando o servidor rejeita e informa sessão expirada', () => {
    const post: any = { id: 'p1', curtidas: 2, curtidoUsuario: false };
    service.alternarCurtida(post);
    http.expectOne(API + '/p1/like').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(post.curtidas).toBe(2); expect(post.curtidoUsuario).toBeFalse();
    expect(post.erroInteracao).toContain('sessão expirou'); expect(post.interacaoPendente).toBeFalse();
  });
});
