import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PostDetailPage } from './post-detail.page';

const API = 'http://localhost:8080/';
// Estudante conta 1 → perfil 42; mentora conta 1 → perfil 7.
const PERFIS = [{ id: 7, id_mentora: 1, nome: 'Mentora Um' }, { id: 42, id_estudante: 1, nome: 'Estudante Um' }];

describe('PostDetailPage', () => {
  async function abrir(postId: string, autorId: number) {
    await TestBed.configureTestingModule({
      imports: [PostDetailPage, IonicModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: postId }) } } }
      ]
    }).compileComponents();
    localStorage.clear();
    localStorage.setItem('perfil', String(autorId)); // cache não deve decidir a autoria
    history.replaceState(null, '');
    const fixture = TestBed.createComponent(PostDetailPage);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${API}auth/session`).flush({ id: 1, role: 'estudantes' });
    http.expectOne(`${API}posts`).flush([{ id: postId, autorId, conteudo: 'Texto', dataCriacao: Date.now() }]);
    http.match(req => req.url.endsWith('/interacoes')).forEach(req => req.flush({ likesCount: 0, commentsCount: 0, curtidoUsuario: false }));
    http.expectOne(`${API}perfil`).flush(PERFIS);
    http.expectOne(`${API}posts/${postId}/comments`).flush([]);
    fixture.detectChanges();
    return { page: fixture.componentInstance, router, http };
  }

  it('abre a autora mentora pela conta, sem confundir com a estudante de mesmo ID de conta', async () => {
    const { page, router, http } = await abrir('p7', 7);

    expect(page.post.autorRole).toBe('mentoras');
    expect(page.ehDonoPost()).toBeFalse();
    page.abrirPerfilAutor(new Event('click'));
    expect(router.navigate).toHaveBeenCalledWith(['/profile', 'mentoras', '1']);
    http.verify();
  });

  it('reconhece o post próprio pelo perfil da sessão', async () => {
    const { page, router, http } = await abrir('p42', 42);

    expect(page.ehDonoPost()).toBeTrue();
    page.abrirPerfilAutor(new Event('click'));
    expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    http.verify();
  });
});
