import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { sessionInterceptor } from './session.interceptor';
import { authGuard } from './auth.guard';
import { environment } from '../../environments/environment';

describe('Sessão de navegador', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const base = environment.apiUrl;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([sessionInterceptor])), provideHttpClientTesting(), provideRouter([])] });
    auth = TestBed.inject(AuthService); http = TestBed.inject(HttpTestingController);
    auth.limparEstado();
  });
  afterEach(() => { http.verify(); auth.limparEstado(); });
  function csrf() {
    const request = http.expectOne(`${base}auth/csrf`);
    expect(request.request.method).toBe('GET'); expect(request.request.withCredentials).toBeTrue();
    expect(request.request.body).toBeNull();
    request.flush({ token: 'csrf-teste', headerName: 'X-CSRF-TOKEN' });
  }
  it('envia senha somente no corpo e atualiza a identidade da sessão', () => {
    localStorage.setItem('perfil', '999');
    let sessao: any = null;
    auth.sessaoAtual$.subscribe(valor => sessao = valor);
    auth.login('estudantes', 'aluna@example.test', 'TesteLocal123!').subscribe();
    csrf();
    const login = http.expectOne(`${base}auth/login`);
    expect(login.request.params.keys()).toEqual([]);
    expect(login.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-teste');
    expect(login.request.body.senha).toBe('TesteLocal123!');
    login.flush({ id: 1, role: 'estudantes' });
    expect(localStorage.getItem('perfil')).toBeNull();
    expect(sessao).toEqual({ id: 1, role: 'estudantes' });
  });
  it('limpa identidade e perfil após logout confirmado pelo servidor', () => {
    localStorage.setItem('userId', '1'); localStorage.setItem('perfil', '42');
    auth.logout().subscribe(); csrf();
    http.expectOne(`${base}auth/logout`).flush(null, { status: 204, statusText: 'No Content' });
    expect(localStorage.getItem('userId')).toBeNull(); expect(localStorage.getItem('perfil')).toBeNull();
  });
  it('uma identificação local não libera rota privada sem sessão', async () => {
    localStorage.setItem('userId', '1');
    const result: any = TestBed.runInInjectionContext(() => authGuard({ data: {} } as any, {} as any));
    const promise = firstValueFrom(result);
    http.expectOne(`${base}auth/session`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(Router).serializeUrl(await promise as any)).toBe('/login');
    expect(localStorage.getItem('userId')).toBeNull();
  });
  it('impede estudante de abrir cadastro de mentoria', async () => {
    const result: any = TestBed.runInInjectionContext(() => authGuard({ data: { mentora: true } } as any, {} as any));
    const promise = firstValueFrom(result);
    http.expectOne(`${base}auth/session`).flush({ id: 1, role: 'estudantes' });
    expect(TestBed.inject(Router).serializeUrl(await promise as any)).toBe('/home');
  });
  it('não envia cookies da sessão para outro serviço', () => {
    TestBed.inject(HttpClient).get('https://outro.example/dados').subscribe();
    const req = http.expectOne('https://outro.example/dados');
    expect(req.request.withCredentials).toBeFalse(); req.flush({});
  });
});
