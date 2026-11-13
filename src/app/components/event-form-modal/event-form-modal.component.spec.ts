import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AlertController, IonicModule, ModalController } from '@ionic/angular';
import { EventFormModalComponent, abrirModalEvento, podePublicarEvento } from './event-form-modal.component';

describe('EventFormModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventFormModalComponent, IonicModule.forRoot({ animated: false })],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
    localStorage.clear();
  });

  function criar(podePublicar: boolean) {
    const fixture = TestBed.createComponent(EventFormModalComponent);
    fixture.componentRef.setInput('podePublicar', podePublicar);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    // ModalController vem do IonicModule importado pelo componente standalone (injetor próprio).
    const modalController = fixture.debugElement.injector.get(ModalController);
    return { fixture, page: fixture.componentInstance, el, modalController };
  }

  function digitar(el: HTMLElement, seletor: string, valor: string) {
    const campo = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(seletor)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('usa o mesmo critério de papel do formulário anterior', () => {
    expect(podePublicarEvento('mentoras')).toBeTrue();
    expect(podePublicarEvento('administradores')).toBeFalse();
    expect(podePublicarEvento('estudantes')).toBeFalse();
    expect(podePublicarEvento('')).toBeFalse();
  });

  it('estudante vê horário/local opcionais, com privado implícito e sem seletor', () => {
    const { el, page } = criar(false);
    expect(el.querySelector('.modal-title')?.textContent).toContain('Adicionar evento');
    expect(el.querySelector('#evento-titulo')).toBeTruthy();
    expect(el.querySelector('#evento-data')).toBeTruthy();
    expect(el.querySelector('#evento-descricao')).toBeTruthy();
    expect(el.querySelector('#evento-horario')).toBeTruthy();
    expect(el.querySelector('#evento-local')).toBeTruthy();
    expect(el.querySelector('#evento-privacidade')).toBeNull();
    expect(el.textContent).toContain('Seus eventos ficam privados.');
    expect(page.form.privacidade).toBe('Privado');
  });

  it('mentora vê todos os campos e visibilidade com padrão seguro Privado', () => {
    const { el } = criar(true);
    for (const id of ['titulo', 'data', 'horario', 'local', 'descricao', 'privacidade']) {
      expect(el.querySelector(`#evento-${id}`)).withContext(id).toBeTruthy();
    }
    const select = el.querySelector<HTMLSelectElement>('#evento-privacidade')!;
    expect(Array.from(select.options).map(opcao => opcao.value)).toEqual(['Privado', 'Público']);
  });

  it('envio direto inválido não grava, marca erros e foca o primeiro campo', fakeAsync(() => {
    const { fixture, el } = criar(true);
    document.body.appendChild(el);
    el.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fixture.detectChanges();
    tick();

    expect(el.querySelector('#evento-titulo')?.getAttribute('aria-invalid')).toBe('true');
    expect(el.querySelector('#evento-titulo')?.getAttribute('aria-describedby')).toBe('evento-titulo-erro');
    expect(el.querySelector('#evento-titulo-erro')?.textContent).toContain('Informe o nome do evento.');
    expect(el.querySelector('#evento-data-erro')).toBeTruthy();
    expect(el.querySelector('#evento-horario-erro')).toBeNull();
    expect(document.activeElement).toBe(el.querySelector('#evento-titulo'));
    el.remove();
  }));

  it('desabilita Salvar vazio sem revelar erros e habilita apenas com campos válidos', fakeAsync(() => {
    const { fixture, el } = criar(false); tick();
    const salvar = el.querySelector<HTMLButtonElement>('.evento-salvar')!;
    expect(salvar.disabled).toBeTrue();
    salvar.click(); fixture.detectChanges();
    expect(el.querySelector('.field-error')).toBeNull();
    digitar(el, '#evento-titulo', '   ');
    digitar(el, '#evento-data', '2026-12-01');
    fixture.detectChanges();
    expect(salvar.disabled).toBeTrue();
    digitar(el, '#evento-titulo', 'Encontro'); fixture.detectChanges();
    expect(salvar.disabled).toBeFalse();
    digitar(el, '#evento-data', '1999-12-31'); fixture.detectChanges();
    expect(salvar.disabled).toBeTrue();
    expect(el.querySelector('.field-error')).toBeNull();
    digitar(el, '#evento-data', '2026-12-01'); fixture.detectChanges();
    expect(salvar.disabled).toBeFalse();
    digitar(el, '#evento-local', 'x'.repeat(1001)); fixture.detectChanges();
    expect(salvar.disabled).toBeTrue();
    digitar(el, '#evento-local', ''); fixture.detectChanges();
    expect(salvar.disabled).toBeFalse();
    TestBed.inject(HttpTestingController).verify();
  }));

  it('valida somente o campo tocado antes do envio', fakeAsync(() => {
    const { fixture, el } = criar(true); tick();
    el.querySelector('#evento-titulo')!.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(el.querySelector('#evento-titulo-erro')).toBeTruthy();
    expect(el.querySelector('#evento-data-erro')).toBeNull();
    digitar(el, '#evento-titulo', 'Encontro'); fixture.detectChanges();
    expect(el.querySelector('#evento-titulo-erro')).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  }));

  it('marca alterações e Cancelar pede o fechamento pelo papel cancel', async () => {
    const { fixture, el, page, modalController } = criar(false);
    spyOn(modalController, 'dismiss').and.resolveTo(true);
    await fixture.whenStable();
    expect(page.estado.alterado).toBeFalse();
    digitar(el, '#evento-descricao', 'algo');
    fixture.detectChanges();
    expect(page.estado.alterado).toBeTrue();
    digitar(el, '#evento-descricao', '');
    expect(page.estado.alterado).toBeFalse();

    (el.querySelector('.evento-cancelar') as HTMLButtonElement).click();
    expect(modalController.dismiss).toHaveBeenCalledWith(undefined, 'cancel');
  });

  it('envia uma vez e só fecha após gravação confirmada; falha preserva campos', fakeAsync(() => {
    const { fixture, el, page, modalController } = criar(false);
    spyOn(modalController, 'dismiss').and.resolveTo(true);
    tick();
    digitar(el, '#evento-titulo', 'Estudo');
    digitar(el, '#evento-data', '2026-12-01');
    fixture.detectChanges();
    const salvar = el.querySelector<HTMLButtonElement>('.evento-salvar')!;
    expect(salvar.disabled).toBeFalse();
    salvar.click(); fixture.detectChanges();
    expect(salvar.disabled).toBeTrue();
    salvar.click(); page.salvar();
    const http = TestBed.inject(HttpTestingController);
    const request = http.expectOne(r => r.url.endsWith('/eventos') && r.method === 'POST');
    expect(request.request.body.visibilidade).toBe('PRIVADO');
    expect(request.request.body.horario).toBeNull();
    expect(modalController.dismiss).not.toHaveBeenCalled();
    request.flush({}, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(page.form.titulo).toBe('Estudo');
    expect(page.form.data).toBe('2026-12-01');
    expect(salvar.disabled).toBeFalse();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('O servidor não confirmou');
    salvar.click();
    const retry = http.expectOne(r => r.url.endsWith('/eventos'));
    expect(retry.request.body.requisicaoId).toBe(request.request.body.requisicaoId);
    retry.flush({ id: 7, ...retry.request.body, fuso: 'America/Sao_Paulo' }); tick();
    expect(modalController.dismiss).toHaveBeenCalledWith(jasmine.objectContaining({ id: 7 }), 'saved');
    http.verify();
  }));

  describe('em um ion-modal real', () => {
    let alertas: string[];

    function simularAlerta(role: 'cancel' | 'destructive') {
      const alertController = TestBed.inject(AlertController);
      alertas = [];
      spyOn(alertController, 'create').and.callFake(async (opcoes: any) => {
        alertas.push(opcoes.header);
        return { present: async () => undefined, onDidDismiss: async () => ({ role }) } as any;
      });
    }

    async function abrir(podePublicar = false) {
      const modal = await abrirModalEvento(TestBed.inject(ModalController), TestBed.inject(AlertController), podePublicar);
      await new Promise(resolve => setTimeout(resolve));
      return modal;
    }

    function preencher(modal: HTMLElement) {
      const titulo = modal.querySelector<HTMLInputElement>('#evento-titulo')!;
      titulo.value = 'Alterado';
      titulo.dispatchEvent(new Event('input', { bubbles: true }));
    }

    afterEach(async () => {
      const modalController = TestBed.inject(ModalController);
      let topo = await modalController.getTop();
      while (topo) {
        topo.canDismiss = true;
        await topo.dismiss();
        topo = await modalController.getTop();
      }
    });

    it('abre com classe compartilhada, título nomeando o diálogo e foco inicial no título', async () => {
      const modal = await abrir();
      expect(modal.classList).toContain('hipatec-modal');
      const titulo = modal.querySelector<HTMLElement>('.modal-title')!;
      expect(modal.getAttribute('aria-labelledby')).toBe(titulo.id);
      expect(document.activeElement).toBe(titulo);
      expect(modal.querySelector('input:focus, textarea:focus')).toBeNull();
    });

    it('fecha direto sem alterações (Escape incluído)', async () => {
      simularAlerta('cancel');
      const modal = await abrir();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      const resultado = await modal.onDidDismiss();
      expect(resultado.role).toBe('backdrop');
      expect(alertas).toEqual([]);
    });

    it('com alterações, Escape/fundo/fechar pedem confirmação e "Continuar editando" mantém o modal', async () => {
      simularAlerta('cancel');
      const modal = await abrir();
      preencher(modal);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(await modal.dismiss(undefined, 'backdrop')).toBeFalse();
      modal.querySelector<HTMLButtonElement>('.modal-close')!.click();
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(alertas.length).toBe(3);
      expect(alertas[0]).toBe('Descartar alterações?');
      expect(modal.isConnected).toBeTrue();
      expect((await TestBed.inject(ModalController).getTop())).toBe(modal);
    });

    it('com alterações, "Descartar" fecha o modal', async () => {
      simularAlerta('destructive');
      const modal = await abrir(true);
      preencher(modal);
      modal.querySelector<HTMLButtonElement>('.evento-cancelar')!.click();
      const resultado = await modal.onDidDismiss();
      expect(resultado.role).toBe('cancel');
      expect(alertas).toEqual(['Descartar alterações?']);
    });
  });
});
