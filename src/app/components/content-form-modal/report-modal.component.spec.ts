import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { ReportModalComponent } from './report-modal.component';
describe('Denúncia persistida', () => {
  it('só fecha com protocolo confirmado, mantém motivo ao erro e bloqueia envio repetido', () => {
    TestBed.configureTestingModule({ imports: [ReportModalComponent, IonicModule.forRoot()], providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(ReportModalComponent), page = fixture.componentInstance;
    const http = TestBed.inject(HttpTestingController), dismiss = spyOn(fixture.debugElement.injector.get(ModalController), 'dismiss').and.resolveTo(true);
    page.postId = 'post'; page.motivo = 'spam'; fixture.detectChanges();
    page.enviar(); page.enviar(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.hipatec-btn-primary').disabled).toBeTrue();
    http.expectOne(r => r.method === 'POST').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(page.motivo).toBe('spam'); expect(dismiss).not.toHaveBeenCalled();
    page.enviar(); http.expectOne(r => r.method === 'POST').flush({ protocolo: 12, status: 'PENDENTE' });
    expect(dismiss).toHaveBeenCalledWith({ protocolo: 12, status: 'PENDENTE' }, 'saved'); http.verify();
  });
});
