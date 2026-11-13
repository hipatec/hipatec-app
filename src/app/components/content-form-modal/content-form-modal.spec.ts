import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AlertController, ModalController, provideIonicAngular } from '@ionic/angular/standalone';
import { CourseFormModalComponent } from './course-form-modal.component';
import { MentoringFormModalComponent } from './mentoring-form-modal.component';
import { abrirModalConteudo } from './open-content-modal';

for (const component of [CourseFormModalComponent, MentoringFormModalComponent]) {
  describe(component.name, () => {
    it('preserva campos, foco e bloqueia envio inválido', async () => {
      TestBed.configureTestingModule({ imports: [component, IonicModule.forRoot()], providers: [provideIonicAngular(), provideHttpClient(), provideHttpClientTesting()] });
      const fixture = TestBed.createComponent(component as typeof CourseFormModalComponent);
      fixture.detectChanges();
      await fixture.whenStable();
      const host = fixture.nativeElement as HTMLElement;
      document.body.appendChild(host);
      const first = host.querySelector<HTMLButtonElement>('.modal-close')!;
      const last = host.querySelector<HTMLButtonElement>('.hipatec-btn-secondary')!;
      last.focus(); last.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
      expect(document.activeElement).toBe(first);
      first.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
      expect(document.activeElement).toBe(last);
      expect(host.querySelectorAll('input, select, textarea').length).toBe(4);
      expect(host.querySelectorAll('[required]').length).toBe(2);
      expect(host.querySelectorAll('option').length).toBe(4);
      expect(host.querySelector<HTMLButtonElement>('.hipatec-btn-primary')!.disabled).toBeTrue();
      expect(host.textContent).not.toContain('não serão salvos');
      const write = spyOn(Storage.prototype, 'setItem');
      const input = host.querySelector<HTMLInputElement>('input')!;
      input.value = 'Rascunho'; input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(fixture.componentInstance.estado.alterado).toBeTrue();
      host.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      expect(write).not.toHaveBeenCalled();
      input.value = ''; input.dispatchEvent(new Event('input')); fixture.detectChanges();
      expect(fixture.componentInstance.estado.alterado).toBeFalse();
      fixture.componentInstance.form.titulo = 'Curso real';
      fixture.componentInstance.form.formato = 'Online';
      fixture.detectChanges();
      const salvar = host.querySelector<HTMLButtonElement>('.hipatec-btn-primary')!;
      expect(salvar.disabled).toBeFalse();
      salvar.click(); fixture.detectChanges();
      expect(salvar.disabled).toBeTrue();
      await fixture.whenStable();
      const fields = Array.from(host.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'));
      expect(fields.length).toBe(4);
      fields.forEach(field => expect(field.disabled).withContext(field.id).toBeTrue());
      salvar.click();
      const http = TestBed.inject(HttpTestingController);
      const req = http.expectOne(r => r.method === 'POST');
      expect(req.request.body.titulo).toBe('Curso real');
      expect(req.request.body.requisicaoId).toBeTruthy();
      req.flush({}, { status: 503, statusText: 'Unavailable' });
      fixture.detectChanges();
      expect(fixture.componentInstance.form.titulo).toBe('Curso real');
      expect(host.querySelector('[role="alert"]')?.textContent).toBeTruthy();
      expect(salvar.disabled).toBeFalse();
      await fixture.whenStable();
      fields.forEach(field => expect(field.disabled).withContext(field.id).toBeFalse());
      http.verify();
      host.remove();
    });
  });
}

describe('Abertura de curso/mentoria', () => {
  it('usa shell Ionic e confirma descarte apenas quando há alterações', async () => {
    const modal = { present: jasmine.createSpy().and.resolveTo() };
    const create = jasmine.createSpy().and.resolveTo(modal);
    const alerts = { create: jasmine.createSpy().and.resolveTo({ present: async () => {}, onDidDismiss: async () => ({ role: 'cancel' }) }) };
    await abrirModalConteudo({ create } as unknown as ModalController, alerts as unknown as AlertController, 'course');
    const options = create.calls.mostRecent().args[0];
    expect(options.cssClass).toBe('hipatec-modal');
    expect(await options.canDismiss()).toBeTrue();
    options.componentProps.estado.alterado = true;
    expect(await options.canDismiss()).toBeFalse();
    expect(alerts.create).toHaveBeenCalled();
  });
});
