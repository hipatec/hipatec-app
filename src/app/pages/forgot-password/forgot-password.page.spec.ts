import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { ForgotPasswordPage } from './forgot-password.page';
import { environment } from '../../../environments/environment';

describe('ForgotPasswordPage', () => {
  let component: ForgotPasswordPage;
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let http: HttpTestingController;
  let data: { redefinir?: boolean };
  const url = environment.apiUrl + 'auth/recuperacao-senha';

  beforeEach(async () => {
    data = {};
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data } } }]
    }).compileComponents();
    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    component.ionViewWillEnter();
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    http.verify();
  });

  async function preencher(campo: string, valor: string) {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#' + campo);
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function enviar() {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  it('envia somente o email e só confirma após resposta; ao voltar, mostra o formulário limpo', async () => {
    await preencher('email', 'mentora@example.test');
    enviar();
    const pedido = http.expectOne(url);
    expect(pedido.request.method).toBe('POST');
    expect(pedido.request.body).toEqual({ email: 'mentora@example.test' });
    expect(component.emailEnviado).toBeFalse();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBeTrue();
    enviar();
    http.expectNone(url);
    pedido.flush(null, { status: 202, statusText: 'Accepted' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Verifique seu email');
    component.ionViewWillLeave();
    component.ionViewWillEnter();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('#email').value).toBe('');
    expect(component.enviando).toBeFalse();
    expect(component.erro).toBe('');
  });

  it('cancela o pedido ao sair para impedir confirmação tardia na próxima visita', async () => {
    await preencher('email', 'estudante@example.test');
    enviar();
    const pedido = http.expectOne(url);
    component.ionViewWillLeave();
    expect(pedido.cancelled).toBeTrue();
    component.ionViewWillEnter();
    expect(component.emailEnviado).toBeFalse();
    expect(component.enviando).toBeFalse();
  });

  it('valida email e permite tentar novamente após falhas', async () => {
    await preencher('email', 'invalido');
    enviar();
    http.expectNone(url);
    await preencher('email', 'estudante@example.test');
    for (const status of [429, 503, 0]) {
      enviar();
      const pedido = http.expectOne(url);
      if (status === 0) pedido.error(new ProgressEvent('error'));
      else pedido.flush(null, { status, statusText: 'Falha' });
      fixture.detectChanges();
      expect(component.emailEnviado).toBeFalse();
      expect(component.enviando).toBeFalse();
      expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    }
  });

  async function abrirLink(token: string) {
    data.redefinir = true;
    spyOn(TestBed.inject(Location), 'path').and.returnValue('/redefinir-senha#token=' + token);
    const limparUrl = spyOn(TestBed.inject(Location), 'replaceState');
    component.ionViewWillEnter();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(limparUrl).toHaveBeenCalledWith('/redefinir-senha');
  }

  it('valida senhas, envia token no corpo e limpa os campos após redefinir', async () => {
    await abrirLink('a'.repeat(43));
    await preencher('senha', 'NovaSenha123!');
    await preencher('confirmacao', 'OutraSenha123!');
    enviar();
    http.expectNone(environment.apiUrl + 'auth/redefinir-senha');
    await preencher('confirmacao', 'NovaSenha123!');
    enviar();
    const pedido = http.expectOne(environment.apiUrl + 'auth/redefinir-senha');
    expect(pedido.request.body).toEqual({ token: 'a'.repeat(43), senha: 'NovaSenha123!' });
    pedido.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain('Senha alterada');
    expect(component.senha).toBe('');
    expect(component.confirmacao).toBe('');
  });

  it('oferece novo link quando o backend rejeita token expirado ou usado', async () => {
    await abrirLink('a'.repeat(43));
    await preencher('senha', 'NovaSenha123!');
    await preencher('confirmacao', 'NovaSenha123!');
    enviar();
    http.expectOne(environment.apiUrl + 'auth/redefinir-senha').flush(null, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('a[href="/forgot-password"]')).not.toBeNull();
    expect(component.senha).toBe('');
  });

  it('não exibe formulário de nova senha sem token válido', async () => {
    await abrirLink('invalido');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    http.expectNone(environment.apiUrl + 'auth/redefinir-senha');
  });
});
