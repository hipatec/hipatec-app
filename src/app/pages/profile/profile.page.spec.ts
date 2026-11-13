import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePage, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    localStorage.clear();
  });

  it('renderiza com os provedores da aplicação', () => {
    const fixture = TestBed.createComponent(ProfilePage);
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
  it('usa o ID retornado do perfil sem foto, nunca o ID da conta ou cache anterior', () => {
    localStorage.setItem('perfil', '999');
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.componentInstance.ionViewWillEnter();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:8080/auth/session').flush({ id: 1, role: 'estudantes' });
    http.expectOne('http://localhost:8080/perfil/estudantes/1').flush({ id: 42, nome: 'Aluna', usuario: 'aluna', pfp: null });
    http.expectOne('http://localhost:8080/posts/autor/42').flush([]);
    http.expectOne('http://localhost:8080/perfil').flush([]);
    http.match(req => req.url.includes('/posts/republicados/')).forEach(req => req.flush([]));
    expect(localStorage.getItem('perfil')).toBe('42');
    http.verify();
  });

  it('usa a foto disponível no feed quando o perfil ainda não tem pfp persistida', () => {
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.componentInstance.ionViewWillEnter();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:8080/auth/session').flush({ id: 1, role: 'estudantes' });
    http.expectOne('http://localhost:8080/perfil/estudantes/1').flush({ id: 42, nome: 'Aluna', usuario: 'aluna', pfp: null });
    http.expectOne('http://localhost:8080/posts/autor/42').flush([{ id: 'post-1', autorFoto: 'https://cdn.example/avatar.png', dataCriacao: Date.now() }]);
    http.match(req => req.url.endsWith('/interacoes')).forEach(req => req.flush({ likesCount: 0, commentsCount: 0, curtidoUsuario: false }));
    http.expectOne('http://localhost:8080/perfil').flush([]);
    http.match(req => req.url.includes('/posts/republicados/')).forEach(req => req.flush([]));
    expect(fixture.componentInstance.perfil.pfp).toBe('https://cdn.example/avatar.png');
    http.verify();
  });
});

describe('ProfilePage — conta da rota e identidade da sessão', () => {
  const API = 'http://localhost:8080/';

  async function criar(role: string, id: string) {
    await TestBed.configureTestingModule({
      imports: [ProfilePage, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ role, id }) } } }
      ]
    }).compileComponents();
    localStorage.clear();
    const fixture = TestBed.createComponent(ProfilePage);
    return { page: fixture.componentInstance, http: TestBed.inject(HttpTestingController), router: TestBed.inject(Router) };
  }

  it('usa o :id da rota como conta e o ID de perfil retornado para posts e seguimento, ignorando o cache', async () => {
    const { page, http } = await criar('estudantes', '42');
    localStorage.setItem('perfil', '42'); // cache coincide com o número da rota, mas é de outro tipo de ID
    page.ionViewWillEnter();

    expect(page.isPublicProfile).toBeTrue();
    http.expectOne(`${API}auth/session`).flush({ id: 1, role: 'estudantes' });
    http.expectOne(`${API}perfil/estudantes/42`).flush({ id: 99, nome: 'Outra', usuario: 'outra' });
    http.expectOne(`${API}perfil/99/seguindo`).flush({ seguindo: false });
    http.expectOne(`${API}posts/autor/99`).flush([{ id: 'p1', autorId: 99, dataCriacao: Date.now() }]);
    http.match(req => req.url.endsWith('/interacoes')).forEach(req => req.flush({ likesCount: 0, commentsCount: 0, curtidoUsuario: false }));
    http.expectOne(`${API}perfil`).flush([{ id: 99, id_estudante: 42 }, { id: 5, id_estudante: 1 }]);
    http.match(req => req.url.includes('/posts/republicados/')).forEach(req => req.flush([]));

    expect(page.isPublicProfile).toBeTrue();
    expect(page.userId).toBe(42);
    expect(page.canEditPost(page.posts[0])).toBeFalse();
    expect(page.canDeletePost(page.posts[0])).toBeFalse();
    expect(localStorage.getItem('perfil')).toBe('42');
    http.verify();
  });

  it('não trata como próprio um perfil de outro papel com o mesmo ID de conta', async () => {
    const { page, http } = await criar('mentoras', '1');
    page.ionViewWillEnter();
    http.expectOne(`${API}auth/session`).flush({ id: 1, role: 'estudantes' });
    http.expectOne(`${API}perfil/mentoras/1`).flush({ id: 7, nome: 'Mentora', usuario: 'mentora' });
    http.expectOne(`${API}perfil/7/seguindo`).flush({ seguindo: true });
    http.expectOne(`${API}posts/autor/7`).flush([{ id: 'p7', autorId: 7, dataCriacao: Date.now() }]);
    http.match(req => req.url.endsWith('/interacoes')).forEach(req => req.flush({ likesCount: 0, commentsCount: 0, curtidoUsuario: false }));
    http.expectOne(`${API}perfil`).flush([{ id: 7, id_mentora: 1 }, { id: 42, id_estudante: 1 }]);
    http.match(req => req.url.includes('/posts/republicados/')).forEach(req => req.flush([]));

    expect(page.isPublicProfile).toBeTrue();
    expect(page.seguindoPerfil).toBeTrue();
    expect(page.posts[0].autorRole).toBe('mentoras');
    expect(page.canEditPost(page.posts[0])).toBeFalse();
    http.verify();
  });

  it('reconhece o próprio perfil pela sessão quando a rota aponta para a mesma conta', async () => {
    const { page, http } = await criar('estudantes', '1');
    page.ionViewWillEnter();
    http.expectOne(`${API}auth/session`).flush({ id: 1, role: 'estudantes' });
    http.expectOne(`${API}perfil/estudantes/1`).flush({ id: 42, nome: 'Eu', usuario: 'eu' });
    http.expectOne(`${API}posts/autor/42`).flush([{ id: 'meu', autorId: 42, dataCriacao: Date.now() }]);
    http.match(req => req.url.endsWith('/interacoes')).forEach(req => req.flush({ likesCount: 0, commentsCount: 0, curtidoUsuario: false }));
    http.expectOne(`${API}perfil`).flush([{ id: 7, id_mentora: 1 }, { id: 42, id_estudante: 1 }]);
    http.match(req => req.url.includes('/posts/republicados/')).forEach(req => req.flush([]));

    expect(page.isPublicProfile).toBeFalse();
    expect(page.userRole).toBe('estudantes');
    expect(page.userId).toBe(1); // PUT /perfil/{role}/{id} recebe a conta, não o perfil
    expect(page.canEditPost(page.posts[0])).toBeTrue();
    expect(localStorage.getItem('perfil')).toBe('42');
    http.verify();
  });

  it('abre o autor pela conta resolvida a partir do ID de perfil', async () => {
    const { page, http, router } = await criar('estudantes', '1');
    spyOn(router, 'navigate').and.resolveTo(true);
    page.ionViewWillEnter();
    http.expectOne(`${API}auth/session`).flush({ id: 1, role: 'estudantes' });
    http.expectOne(`${API}perfil/estudantes/1`).flush({ id: 42, nome: 'Eu', usuario: 'eu' });
    http.expectOne(`${API}posts/autor/42`).flush([]);
    http.expectOne(`${API}perfil`).flush([{ id: 7, id_mentora: 1 }, { id: 42, id_estudante: 1 }]);
    http.match(req => req.url.includes('/posts/republicados/')).forEach(req => req.flush([]));

    page.abrirPerfilAutor({ autorId: 7, autorRole: 'mentoras' }, new Event('click'));
    expect(router.navigate).toHaveBeenCalledWith(['/profile', 'mentoras', '1']);
    page.abrirPerfilAutor({ autorId: 42 }, new Event('click'));
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    http.verify();
  });
});
