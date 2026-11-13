import { sessionInterceptor } from '../../services/session.interceptor';
import { guestGuard } from '../../guards/guest.guard';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { fakeAsync, tick, TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CreatePostModalComponent } from '../../components/create-post-modal/create-post-modal.component';
import { Router, provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { WorkspaceFormPage } from './workspace-form.page';

const API = 'http://localhost:8080/';
describe('Configurações reais', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WorkspaceFormPage, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });
  function abrir() {
    const fixture = TestBed.createComponent(WorkspaceFormPage);
    http.expectOne(API + 'auth/session').flush({ role: 'mentoras', id: 1 });
    fixture.componentInstance.ionViewWillEnter();
    http.expectOne(API + 'auth/session').flush({ role: 'mentoras', id: 1 });
    return fixture;
  }
  it('não salva antes de carregar e preserva biografia, conta e senha omitida', () => {
    const fixture = abrir(); const page = fixture.componentInstance;
    page.save(); http.expectNone(req => req.method === 'PUT');
    http.expectOne(API + 'perfil/mentoras/1').flush({ id: 7, nome: 'Mentora', usuario: 'm', email: 'm@example.test', biografia: 'Preservar' });
    expect(page.form['novaSenha']).toBe(''); expect(page.form['confirmarSenha']).toBe('');
    page.form['nome'] = 'Nome atualizado'; page.save();
    const req = http.expectOne(API + 'perfil/mentoras/1');
    expect(req.request.body.get('biografia')).toBe('Preservar'); expect(req.request.body.has('novaSenha')).toBeFalse();
    req.flush({ id: 7, nome: 'Nome confirmado', usuario: 'm', email: 'm@example.test', biografia: 'Preservar' });
    expect(page.form['nome']).toBe('Nome confirmado'); expect(page.saved).toBeTrue();
    expect(localStorage.getItem('hipatec-draft-settings')).toBeNull();
  });
  it('falha de carga não apresenta formulário vazio nem habilita salvar', () => {
    const fixture = abrir();
    http.expectOne(API + 'perfil/mentoras/1').flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Tentar novamente');
    fixture.componentInstance.save(); http.expectNone(req => req.method === 'PUT');
  });
  it('edição legada de evento não grava rascunho nem simula confirmação', () => {
    const fixture = TestBed.createComponent(WorkspaceFormPage);
    http.expectOne(API + 'auth/session').flush({ role: 'mentoras', id: 1 });
    fixture.componentInstance.mode = 'event';
    fixture.componentInstance.form = { titulo: 'Alteração' };
    fixture.componentInstance.save(); fixture.detectChanges();
    expect(fixture.componentInstance.saved).toBeFalse();
    expect(localStorage.getItem('hipatec-draft-event')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('edição de eventos ainda não está disponível');
  });
  for (const mode of ['course', 'mentoring', 'job'] as const) {
    it(`anuncia apenas rascunho local em ${mode}`, fakeAsync(() => {
      const fixture = TestBed.createComponent(WorkspaceFormPage);
      http.expectOne(API + 'auth/session').flush({ role: 'mentoras', id: 1 });
      const page = fixture.componentInstance;
      spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
      page.mode = mode;
      page.form = { titulo: 'Rascunho' };
      page.save(); fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Rascunho salvo apenas neste navegador');
      expect(fixture.nativeElement.textContent).not.toContain('Dados confirmados pelo servidor');
      http.expectNone(req => req.method === 'POST' || req.method === 'PUT');
      tick(500);
    }));
  }

  it('abre o compositor sem reload com o nome da resposta confirmada, nunca do envio falho', () => {
    localStorage.setItem('perfilNome', 'Nome antigo');
    const fixture = abrir(); const page = fixture.componentInstance;
    http.expectOne(API + 'perfil/mentoras/1').flush({ id: 7, nome: 'Nome antigo', usuario: 'm', email: 'm@example.test' });
    page.form['nome'] = 'Nome solicitado'; page.save();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Dados confirmados pelo servidor');
    http.expectOne(API + 'perfil/mentoras/1').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(localStorage.getItem('perfilNome')).toBe('Nome antigo');
    page.save();
    http.expectOne(API + 'perfil/mentoras/1').flush({ id: 7, nome: 'Nome confirmado', usuario: 'm', email: 'm@example.test' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Dados confirmados pelo servidor');
    const modal = TestBed.createComponent(CreatePostModalComponent);
    modal.detectChanges();
    expect(modal.componentInstance.nome).toBe('Nome confirmado');
    expect(modal.nativeElement.querySelector('.avatar-initials').textContent).toBe('NC');
  });

});


describe('Troca de senha encerra a sessão HTTP', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WorkspaceFormPage, IonicModule.forRoot()],
      providers: [provideHttpClient(withInterceptors([sessionInterceptor])), provideHttpClientTesting(), provideRouter([])] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });
  function csrf() {
    const req = http.expectOne(API + 'auth/csrf');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ token: 'csrf-fixture', headerName: 'X-CSRF-TOKEN' });
  }
  function alterar() {
    const fixture = TestBed.createComponent(WorkspaceFormPage);
    http.expectOne(API + 'auth/session').flush({ role: 'mentoras', id: 1 });
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    http.expectOne(API + 'auth/session').flush({ role: 'mentoras', id: 1 });
    http.expectOne(API + 'perfil/mentoras/1').flush({ id: 7, nome: 'Mentora', usuario: 'm', email: 'm@example.test' });
    localStorage.setItem('perfil', '7');
    page.form['novaSenha'] = page.form['confirmarSenha'] = 'senha-fixture';
    const navegar = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    page.save(); csrf();
    const put = http.expectOne(API + 'perfil/mentoras/1');
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.get('novaSenha')).toBe('senha-fixture');
    http.expectNone(API + 'auth/logout');
    return { page, put, navegar };
  }
  it('aguarda PUT, CSRF e POST logout antes de limpar e ir ao login; guard aceita sessão encerrada', () => {
    const { page, put, navegar } = alterar();
    put.flush({ id: 7, nome: 'Mentora', usuario: 'm', email: 'm@example.test' });
    expect(navegar).not.toHaveBeenCalled();
    expect(localStorage.getItem('perfil')).toBe('7');
    expect(page.saving).toBeTrue();
    csrf();
    const logout = http.expectOne(API + 'auth/logout');
    expect(logout.request.method).toBe('POST');
    expect(logout.request.withCredentials).toBeTrue();
    expect(logout.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-fixture');
    expect(navegar).not.toHaveBeenCalled();
    logout.flush(null);
    expect(localStorage.getItem('perfil')).toBeNull();
    expect(navegar).toHaveBeenCalledOnceWith('/login');
    const guard = TestBed.runInInjectionContext(() => guestGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)) as Observable<unknown>;
    guard.subscribe(result => expect(result).toBeTrue());
    http.expectOne(API + 'auth/session').flush(null, { status: 401, statusText: 'Unauthorized' });
  });
  it('informa senha salva e falha do logout, sem navegar nem reenviar PUT ao tentar novamente', () => {
    const { page, put, navegar } = alterar();
    put.flush({ id: 7, nome: 'Mentora', usuario: 'm', email: 'm@example.test' }); csrf();
    http.expectOne(API + 'auth/logout').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(navegar).not.toHaveBeenCalled();
    expect(localStorage.getItem('perfil')).toBe('7');
    expect(page.form['novaSenha']).toBe('');
    expect(page.formError).toContain('senha foi alterada');
    expect(page.saving).toBeFalse();
    page.save(); csrf(); http.expectNone(req => req.method === 'PUT');
    http.expectOne(API + 'auth/logout').flush(null);
    expect(navegar).toHaveBeenCalledOnceWith('/login');
  });
  it('PUT rejeitado não dispara logout', () => {
    const { page, put, navegar } = alterar();
    put.flush(null, { status: 503, statusText: 'Unavailable' });
    http.expectNone(API + 'auth/logout'); http.expectNone(API + 'auth/csrf');
    expect(navegar).not.toHaveBeenCalled(); expect(page.saved).toBeFalse();
  });
});
