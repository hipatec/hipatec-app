import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { MentoriasPage } from './mentorias.page';

describe('MentoriasPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MentoriasPage, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    localStorage.clear();
  });

  it('renderiza com os provedores da aplicação', () => {
    const fixture = TestBed.createComponent(MentoriasPage);
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

  it('troca o mês e gera os dias correspondentes', () => {
    const fixture = TestBed.createComponent(MentoriasPage);
    const page = fixture.componentInstance;
    expect(page.tituloDoMes).toBe('Novembro de 2026');
    page.mudarMes(1);
    expect(page.tituloDoMes).toBe('Dezembro de 2026');
    expect(page.diasComEvento).toEqual([]);
    page.mudarMes(-1);
    expect(page.diasComEvento).toEqual([12, 15, 20]);
  });
});
