import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HomePage } from '../pages/home/home.page';
import { ProfilePage } from '../pages/profile/profile.page';
import { PostDetailPage } from '../pages/post-detail/post-detail.page';
import { CommentModalComponent } from '../components/comment-modal/comment-modal.component';
import { apresentarRepost, alvoInteracao, lerRepostsLegados, salvarRepostsLegados } from './repost-context';
import { PostsService } from './posts.service';
const perfis = [{ id: 42, id_estudante: 1, nome: 'Autora comentário' }, { id: 7, id_mentora: 1, nome: 'Autora original' }];
const original = { id: 'original', autorId: 7, conteudo: 'Texto atualizado', autor: 'Autora original', autorFoto: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' };
const registro = { id: 'repost-fixture', repostOriginalId: 'original', repostOwnerId: 42, repostComComentario: true, repostPuro: false, conteudo: 'Comentário da autora', repostOriginal: { ...original, conteudo: 'Snapshot obsoleto' } };
describe('Paridade repost — fixtures', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    localStorage.clear(); localStorage.setItem('hipatec-reposts', JSON.stringify([registro]));
    await TestBed.configureTestingModule({
      imports: [HomePage, ProfilePage, PostDetailPage, CommentModalComponent, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: registro.id }) } } }]
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });
  function responder(disponivel = true, puro = false) {
    for (let i = 0; i < 8; i++) {
      const requests = http.match(() => true);
      if (!requests.length) break;
      for (const req of requests) {
        const url = req.request.url;
        expect(req.request.method).toBe('GET');
        if (url.endsWith('/auth/session')) req.flush({ id: 1, role: 'estudantes' });
        else if (url.endsWith('/perfil')) req.flush(perfis);
        else if (url.endsWith('/perfil/estudantes/1')) req.flush(perfis[0]);
        else if (url.endsWith('/interacoes')) req.flush({ likesCount: 3, commentsCount: 1, curtidoUsuario: false, repostsCount: 8 });
        else if (url.endsWith('/comments')) { expect(url).toContain('/posts/original/'); req.flush([]); }
        else if (url.endsWith('/posts') || url.includes('/posts/autor/')) req.flush(puro ? [{ ...original, repostsCount: 8, repostadoUsuario: true }]
          : [{ ...registro, autorId: 42, repostsCount: 8, repostOriginal: disponivel ? original : null, originalIndisponivel: !disponivel }, ...(disponivel ? [{ ...original, repostsCount: 8 }] : [])]);
        else if (url.endsWith('/seguindo')) req.flush({ seguindo: false });
        else req.flush([]);
      }
    }
  }
  for (const surface of ['Home', 'Profile', 'PostDetail', 'CommentModal']) {
    it('renderiza contexto compartilhado em ' + surface, () => {
      const fixture = surface === 'Home' ? TestBed.createComponent(HomePage)
        : surface === 'Profile' ? TestBed.createComponent(ProfilePage)
        : surface === 'PostDetail' ? TestBed.createComponent(PostDetailPage)
        : TestBed.createComponent(CommentModalComponent);
      if (fixture.componentInstance instanceof CommentModalComponent) fixture.componentInstance.postSelecionado = apresentarRepost(registro, original, perfis);
      if (fixture.componentInstance instanceof ProfilePage) fixture.componentInstance.ionViewWillEnter();
      fixture.detectChanges(); responder(); fixture.detectChanges();
      const content: HTMLElement = fixture.nativeElement;
      expect(content.textContent).toContain('Comentário da autora');
      expect(content.textContent).toContain('Texto atualizado');
      expect(content.textContent).not.toContain('Snapshot obsoleto');
      expect(content.querySelector('.original-author')?.textContent).toContain('Autora original');
      expect(content.querySelectorAll('.repost-context').length).toBe(1);
      if (!(fixture.componentInstance instanceof CommentModalComponent)) {
        const page = fixture.componentInstance;
        const post = page instanceof PostDetailPage ? page.post : page.posts.find(item => item.repostComComentario);
        expect(post.reposts).toBe(8);
        expect(post.autor).toBe('Autora comentário');
      }
      expect(alvoInteracao(apresentarRepost(registro, original, perfis))).toBe('original');
    });
  }
  it('modal sem original preserva contexto sem oferecer composição', () => {
    const fixture = TestBed.createComponent(CommentModalComponent);
    fixture.componentInstance.postSelecionado = apresentarRepost(registro, undefined, perfis);
    fixture.detectChanges(); responder(false); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Publicação original indisponível');
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
    expect(fixture.nativeElement.querySelector('.btn-submit-post').disabled).toBeTrue();
  });
  it('curtida usa o ID original e reconcilia ambos os totais', () => {
    const service = TestBed.inject(PostsService);
    const post = apresentarRepost(registro, { ...original }, perfis);
    post.curtidoUsuario = false;
    service.alternarCurtida(post);
    const req = http.expectOne('http://localhost:8080/posts/original/like');
    expect(req.request.method).toBe('POST'); req.flush(null);
    http.expectOne('http://localhost:8080/posts/original/interacoes').flush({ likesCount: 4, commentsCount: 2, curtidoUsuario: true });
    expect(post.curtidas).toBe(4); expect(post.repostOriginal.curtidas).toBe(4);
  });
  it('não usa foto do original como avatar da republicadora', () => {
    const fixture = TestBed.createComponent(CommentModalComponent);
    fixture.componentInstance.postSelecionado = apresentarRepost(registro, original, perfis);
    expect(fixture.componentInstance.autorFoto).toBe('');
  });
  it('isola sessões e deduplica registros válidos', () => {
    localStorage.setItem('hipatec-reposts', JSON.stringify([null, {}, registro, registro, { ...registro, id: 'repost-outro', repostOwnerId: 99 }]));
    expect(lerRepostsLegados(42)).toEqual([registro]);
    expect(lerRepostsLegados(null)).toEqual([]);
    expect(lerRepostsLegados(7)).toEqual([]);
  });
  for (const surface of ['Home', 'Profile']) {
    it(`adiciona e remove em ${surface} pela API sem publicar histórico de outra conta`, async () => {
      const outro = { ...registro, id: 'repost-outra-conta', repostOwnerId: 7 };
      localStorage.setItem('hipatec-reposts', JSON.stringify([outro, null, {},
        { ...registro, repostOwnerId: { toString: null } }, { ...registro, repostOriginalId: { toString: null } }]));
      const fixture = surface === 'Home' ? TestBed.createComponent(HomePage) : TestBed.createComponent(ProfilePage);
      if (fixture.componentInstance instanceof ProfilePage) fixture.componentInstance.ionViewWillEnter();
      fixture.detectChanges(); responder();
      await fixture.componentInstance.repostar({ ...original, repostadoUsuario: false });
      const create = http.expectOne(req => req.method === 'POST' && req.url.endsWith('/original/repost'));
      expect(create.request.body.autorId).toBeUndefined(); create.flush(null); responder();
      expect(lerRepostsLegados(7)).toEqual([outro]);
      expect(lerRepostsLegados(42)).toEqual([]);
      await fixture.componentInstance.repostar({ ...original, repostadoUsuario: true });
      http.expectOne(req => req.method === 'DELETE' && req.url.endsWith('/original/repost')).flush(null); responder();
      expect(lerRepostsLegados(7)).toEqual([outro]);
      expect(lerRepostsLegados(42)).toEqual([]);
    });
  }

  it('alterna duas contas, deduplica o escopo e preserva o outro mesmo com entrada inválida', () => {
    const outro = { ...registro, id: 'repost-outra-conta', repostOwnerId: 7 };
    salvarRepostsLegados(42, [registro, registro, null, {}, outro]);
    expect(lerRepostsLegados(42)).toEqual([registro]);
    expect(lerRepostsLegados(7)).toEqual([]);
    salvarRepostsLegados(7, [outro, outro]);
    expect(lerRepostsLegados(42)).toEqual([registro]);
    expect(lerRepostsLegados(7)).toEqual([outro]);
    salvarRepostsLegados(42, []);
    expect(lerRepostsLegados(7)).toEqual([outro]);
    salvarRepostsLegados(42, [registro]);
    salvarRepostsLegados(7, []);
    expect(JSON.parse(localStorage.getItem('hipatec-reposts')!)).toEqual([registro]);
  });
  for (const invalido of ['{invalido', '{}', 'null']) {
    it(`recupera armazenamento malformado ${invalido} ao salvar o escopo`, () => {
      localStorage.setItem('hipatec-reposts', invalido);
      expect(lerRepostsLegados(42)).toEqual([]);
      salvarRepostsLegados(42, [registro]);
      expect(JSON.parse(localStorage.getItem('hipatec-reposts')!)).toEqual([registro]);
    });
  }
  for (const surface of ['Home', 'Profile']) {
    it(`renderiza lista pública em ${surface} apesar de uma interação 503`, () => {
      Object.assign(TestBed.inject(ActivatedRoute).snapshot, { paramMap: convertToParamMap({ role: 'mentoras', id: '1' }) });
      const fixture = surface === 'Home' ? TestBed.createComponent(HomePage) : TestBed.createComponent(ProfilePage);
      if (fixture.componentInstance instanceof ProfilePage) fixture.componentInstance.ionViewWillEnter();
      fixture.detectChanges();
      for (let i = 0; i < 8; i++) {
        const requests = http.match(() => true);
        if (!requests.length) break;
        for (const req of requests) {
          const url = req.request.url;
          if (url.endsWith('/auth/session')) req.flush(null, { status: 401, statusText: 'Unauthorized' });
          else if (url.endsWith('/perfil')) req.flush(perfis);
          else if (url.endsWith('/perfil/mentoras/1')) req.flush(perfis[1]);
          else if (url.endsWith('/original/interacoes')) req.flush(null, { status: 503, statusText: 'Unavailable' });
          else if (url.endsWith('/interacoes')) req.flush({ likesCount: 3, commentsCount: 1, curtidoUsuario: false, repostsCount: 8 });
          else if (url.endsWith('/seguindo')) req.flush({ seguindo: false });
          else req.flush([original, { ...original, id: 'segundo', conteudo: 'Outra publicação pública' }]);
        }
      }
      fixture.detectChanges();
      expect(fixture.componentInstance.posts.length).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('Texto atualizado');
      expect(fixture.nativeElement.textContent).toContain('Outra publicação pública');
      expect(fixture.nativeElement.textContent).not.toContain('Não foi possível carregar');
    });
  }

  it('repost puro não duplica o original na Home', () => {
    localStorage.setItem('hipatec-reposts', JSON.stringify([{ ...registro, repostComComentario: false, repostPuro: true }]));
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges(); responder(true, true); fixture.detectChanges();
    expect(fixture.componentInstance.posts.length).toBe(1);
    expect(fixture.nativeElement.querySelector('.repost-context')).toBeNull();
  });
  it('original ausente mantém comentário e bloqueia interações', () => {
    const fixture = TestBed.createComponent(PostDetailPage);
    fixture.detectChanges(); responder(false); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Publicação original indisponível');
    expect(fixture.nativeElement.textContent).toContain('Comentário da autora');
    expect(fixture.nativeElement.textContent).not.toContain('Snapshot obsoleto');
    expect(fixture.nativeElement.querySelector('.btn-like').disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('textarea')).toBeNull();
  });
  it('confirma pelo original e atualiza ambos os totais; sem alvo emite null', () => {
    const service = TestBed.inject(PostsService);
    service.confirmarInteracoes({ originalIndisponivel: true }).subscribe(value => expect(value).toBeNull());
    const post = apresentarRepost(registro, { ...original }, perfis);
    service.confirmarInteracoes(post).subscribe(value => expect(value?.commentsCount).toBe(4));
    http.expectOne('http://localhost:8080/posts/original/interacoes').flush({ likesCount: 2, commentsCount: 4, curtidoUsuario: true });
    expect(post.comentarios).toBe(4); expect(post.repostOriginal.comentarios).toBe(4);
  });
});
