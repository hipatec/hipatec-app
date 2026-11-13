import { FeedbackService } from '../../services/feedback.service';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { CreatePostModalComponent } from './create-post-modal.component';
import { sessionInterceptor } from '../../services/session.interceptor';

describe('CreatePostModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePostModalComponent, IonicModule.forRoot()],
      providers: [{ provide: FeedbackService, useValue: { sucesso: jasmine.createSpy('sucesso').and.resolveTo() } }, provideHttpClient(withInterceptors([sessionInterceptor])), provideHttpClientTesting(), provideRouter([])]
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

  for (const edicao of [false, true]) {
    it(`mantém dirty após apagar texto ${edicao ? 'original' : 'com imagem'}`, async () => {
      const fixture = TestBed.createComponent(CreatePostModalComponent);
      if (edicao) fixture.componentRef.setInput('post', { id: 'fixture', conteudo: 'Texto original' });
      fixture.detectChanges(); await fixture.whenStable();
      const component = fixture.componentInstance;
      expect(component.estado.alterado).toBeFalse();
      if (!edicao) component.selecionarImagem({ target: { files: [new File(['fixture'], 'fixture.png')] } } as unknown as Event);
      const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = 'Texto'; textarea.dispatchEvent(new Event('input')); fixture.detectChanges();
      textarea.value = ''; textarea.dispatchEvent(new Event('input')); fixture.detectChanges();
      expect(component.estado.alterado).toBeTrue();
      if (edicao) { textarea.value = 'Texto original'; textarea.dispatchEvent(new Event('input')); fixture.detectChanges(); expect(component.estado.alterado).toBeFalse(); }
    });
  }

  it('envia somente o conteúdo e deixa a sessão definir a autora', () => {
    const fixture = TestBed.createComponent(CreatePostModalComponent);
    fixture.componentInstance.conteudo = 'Publicação de teste';
    fixture.componentInstance.postar();

    const csrf = TestBed.inject(HttpTestingController).expectOne('http://localhost:8080/auth/csrf');
    csrf.flush({ token: 'csrf-teste', headerName: 'X-CSRF-TOKEN' });

    const post = TestBed.inject(HttpTestingController).expectOne('http://localhost:8080/posts');
    expect(post.request.body).toEqual({ conteudo: 'Publicação de teste', requisicaoId: jasmine.any(String) });
    expect(post.request.body.autorId).toBeUndefined();
    expect(post.request.body.autorFoto).toBeUndefined();
    post.flush(null);
  });

  it('usa o shell comum: título, fechar acessível, sem foco automático e sem foto de demonstração', () => {
    const fixture = TestBed.createComponent(CreatePostModalComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.modal-title')?.textContent).toContain('Criar publicação');
    expect(el.querySelector('.modal-close')?.getAttribute('aria-label')).toBe('Fechar');
    const textarea = el.querySelector('textarea')!;
    expect(textarea.hasAttribute('autofocus')).toBeFalse();
    expect(textarea.getAttribute('aria-label')).toBe('Conteúdo da publicação');
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('.avatar-initials')?.textContent?.trim()).toBe('U');
    expect(el.innerHTML).not.toContain('ionicframework.com');
  });

  it('mostra a foto real em cache e as iniciais do nome', () => {
    localStorage.setItem('pfpPerfil', 'https://cdn.exemplo/eu.png');
    localStorage.setItem('perfilNome', 'Ana Souza');
    const fixture = TestBed.createComponent(CreatePostModalComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')?.getAttribute('src')).toBe('https://cdn.exemplo/eu.png');
  });

  it('fechar e publicar continuam dispensando o modal como antes', () => {
    const fixture = TestBed.createComponent(CreatePostModalComponent);
    fixture.detectChanges();
    const modalController = fixture.debugElement.injector.get(ModalController);
    spyOn(modalController, 'dismiss').and.resolveTo(true);
    spyOn(window, 'alert');

    (fixture.nativeElement.querySelector('.modal-close') as HTMLButtonElement).click();
    expect(modalController.dismiss).toHaveBeenCalledWith(undefined, 'cancel');

    fixture.componentInstance.conteudo = 'Oi';
    (fixture.nativeElement.querySelector('.btn-submit-post') as HTMLButtonElement).click();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:8080/auth/csrf').flush({ token: 't', headerName: 'X-CSRF-TOKEN' });
    const post = http.expectOne('http://localhost:8080/posts');
    expect(post.request.headers.get('X-CSRF-TOKEN')).toBe('t');
    post.flush(null);
    expect(modalController.dismiss).toHaveBeenCalledWith({ posted: true }, 'saved');
    fixture.componentInstance.postar();
    http.expectNone(req => req.method === 'POST');
  });
});
