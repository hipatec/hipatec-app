import { ReportModalComponent } from '../components/content-form-modal/report-modal.component';
import { Subject } from 'rxjs';
import { HomePage } from '../pages/home/home.page';
import { ProfilePage } from '../pages/profile/profile.page';
import { VagasPage } from '../pages/vagas/vagas.page';
import { AprendizadoPage } from '../pages/aprendizado/aprendizado.page';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { LoginPage } from '../pages/login/login.page';
import { CadastroPage } from '../pages/cadastro/cadastro.page';
import { FeedbackService } from './feedback.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { provideRouter } from '@angular/router';
import { AdminPerfisPage } from '../pages/admin-perfis/admin-perfis.page';
import { PostDetailPage } from '../pages/post-detail/post-detail.page';
import { WorkspaceFormPage } from '../pages/workspace-form/workspace-form.page';
import { CreatePostModalComponent } from '../components/create-post-modal/create-post-modal.component';

describe('Feedback: preservar a verdade da operação', () => {
  beforeEach(() => { spyOn(window, 'alert'); spyOn(window, 'confirm').and.returnValue(true); });
  it('aprovação e recusa indisponíveis não removem pessoas nem confirmam sucesso', () => {
    const page = new AdminPerfisPage();
    const pessoa = { nome: 'Teste', email: 'teste@example.test', area: '', data: '' };
    page.solicitacoes = [pessoa]; page.autorizar(pessoa); page.recusar(pessoa);
    expect(page.solicitacoes).toEqual([pessoa]); expect(window.alert).not.toHaveBeenCalled();
  });
  it('exclusão cancelada não chama a API nem usa confirmação nativa', async () => {
    const page = Object.create(PostDetailPage.prototype) as any;
    page.post = { id: 'post' };
    page.alertas = { create: async () => ({ present: async () => {}, onDidDismiss: async () => ({ role: 'cancel' }) }) };
    page.postsService = { excluir: jasmine.createSpy() };
    await page.excluirPublicacao();
    expect(page.postsService.excluir).not.toHaveBeenCalled();
    expect(window.confirm).not.toHaveBeenCalled();
  });
  it('vagas, cursos e menus de publicações informam indisponibilidade sem sucesso', () => {
    for (const [tipo, metodos] of [[VagasPage, ['abrirVaga','inscrever']], [AprendizadoPage, ['continuar','inscrever']]] as const) {
      const page = Object.create(tipo.prototype);
      for (const metodo of metodos) { page[metodo]({ titulo: 'Teste' }); expect(page.aviso).toContain('disponív'); }
    }
    expect(window.alert).not.toHaveBeenCalled();
  });
  it('denúncia conserva seleção; exclusão de conta mantém cache e não navega', () => {
    const resposta = new Subject<any>();
    const modal = new ReportModalComponent({ denunciar: () => resposta } as any, {} as any);
    modal.postId = 3; modal.motivo = 'spam'; modal.enviar(); resposta.error({ status: 503 });
    expect(modal.motivo).toBe('spam'); expect(modal.erro).toContain('não confirmou');
    const page = Object.create(WorkspaceFormPage.prototype) as WorkspaceFormPage;
    localStorage.setItem('hipatec-draft-settings','preservar'); page.excluirConta();
    expect(localStorage.getItem('hipatec-draft-settings')).toBe('preservar');
    expect(page.formError).toContain('foram mantidos'); localStorage.removeItem('hipatec-draft-settings');
    expect(window.confirm).not.toHaveBeenCalled();
  });
  it('perfil só fecha e confirma na resposta real; falha mantém o editor', () => {
    const page = Object.create(ProfilePage.prototype) as any;
    let resposta = new Subject<any>();
    page.perfilService = { updatePerfil: () => resposta }; page.feedback = { sucesso: jasmine.createSpy() };
    page.userRole = 'estudantes'; page.userId = 1; page.perfil = { nome: 'Anterior' }; page.showEditModal = true;
    const payload = {perfil:{nome:'Solicitado',usuario:'aluna',biografia:'Texto'}};
    page.salvarFromModal(payload); expect(page.feedback.sucesso).not.toHaveBeenCalled();
    resposta.error({status:503}); expect(page.showEditModal).toBeTrue(); expect(page.erroSalvarPerfil).toContain('mantidos');
    resposta = new Subject<any>(); page.salvarFromModal(payload); resposta.next({nome:'Confirmado',usuario:'aluna'});
    expect(page.perfil.nome).toBe('Confirmado'); expect(page.showEditModal).toBeFalse(); expect(page.feedback.sucesso).toHaveBeenCalledTimes(1);
  });
  it('logout falho preserva sessão e apresenta erro persistente', async () => {
    const page = Object.create(NavbarComponent.prototype) as any;
    const resposta = new Subject<void>(); page.authService = { logout: () => resposta };
    page.logout({dismiss: async()=>undefined}); await Promise.resolve(); resposta.error({status:503});
    expect(page.erroLogout).toContain('Não foi possível encerrar'); expect(window.alert).not.toHaveBeenCalled();
  });
  it('login apresenta validação e erro regional sem diálogo nativo', () => {
    const resposta = new Subject<any>(); const auth = { login: jasmine.createSpy().and.returnValue(resposta) };
    const page = new LoginPage(auth as any, {} as any);
    page.login(); expect(auth.login).not.toHaveBeenCalled();
    page.email = 'aluna'; page.password = 'sintetica'; page.login(); page.login();
    expect(auth.login).toHaveBeenCalledTimes(1); resposta.error({status:429});
    expect(page.erro).toContain('Muitas tentativas'); expect(page.email).toBe('aluna'); expect(page.enviando).toBeFalse();
  });
  it('cadastro mantém dados ao falhar e toast só após API confirmar', async () => {
    await TestBed.configureTestingModule({ imports:[CadastroPage,IonicModule.forRoot()],
      providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([])] }).compileComponents();
    const page = TestBed.createComponent(CadastroPage).componentInstance;
    const sucesso = spyOn(TestBed.inject(FeedbackService),'sucesso').and.resolveTo();
    const http = TestBed.inject(HttpTestingController);
    Object.assign(page,{nome:'Teste',email:'teste@example.test',usuario:'teste',senha:'sintetica',dataNascimento:'2000-01-01'});
    page.cadastrar(); page.cadastrar(); expect(sucesso).not.toHaveBeenCalled();
    http.expectOne(r=>r.method==='POST').flush({}, {status:503,statusText:'Unavailable'});
    expect(page.nome).toBe('Teste'); expect(page.erro).toContain('Falha');
    page.cadastrar(); page.role = 'mentoras'; http.expectOne(r=>r.method==='POST').flush({id:8});
    expect(sucesso).toHaveBeenCalledOnceWith('Cadastro realizado. Você já pode entrar.'); http.verify();
  });
  it('criação preserva conteúdo ao falhar e não fecha ou confirma antes da API', async () => {
    await TestBed.configureTestingModule({ imports: [CreatePostModalComponent, IonicModule.forRoot({ animated: false })],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(CreatePostModalComponent);
    const page = fixture.componentInstance;
    const modal = fixture.debugElement.injector.get(ModalController);
    spyOn(modal, 'dismiss').and.resolveTo(true);
    const http = TestBed.inject(HttpTestingController);
    page.conteudo = 'Texto preservado'; page.postar(); page.postar();
    const request = http.expectOne(r => r.method === 'POST');
    expect(modal.dismiss).not.toHaveBeenCalled();
    request.flush({}, { status: 503, statusText: 'Unavailable' }); fixture.detectChanges();
    expect(page.conteudo).toBe('Texto preservado');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(window.alert).not.toHaveBeenCalled(); http.verify();
  });
});
