import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CreatePostModalComponent } from './create-post-modal.component';
import { sessionInterceptor } from '../../services/session.interceptor';

describe('CreatePostModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePostModalComponent, IonicModule.forRoot()],
      providers: [provideHttpClient(withInterceptors([sessionInterceptor])), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    localStorage.clear();
  });

  it('renderiza com os provedores da aplicação', () => {
    const fixture = TestBed.createComponent(CreatePostModalComponent);
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

  it('envia somente o conteúdo e deixa a sessão definir a autora', () => {
    const fixture = TestBed.createComponent(CreatePostModalComponent);
    fixture.componentInstance.conteudo = 'Publicação de teste';
    fixture.componentInstance.postar();

    const csrf = TestBed.inject(HttpTestingController).expectOne('http://localhost:8080/auth/csrf');
    csrf.flush({ token: 'csrf-teste', headerName: 'X-CSRF-TOKEN' });

    const post = TestBed.inject(HttpTestingController).expectOne('http://localhost:8080/posts');
    expect(post.request.body).toEqual({ conteudo: 'Publicação de teste' });
    expect(post.request.body.autorId).toBeUndefined();
    expect(post.request.body.autorFoto).toBeUndefined();
    post.flush(null);
  });
});
