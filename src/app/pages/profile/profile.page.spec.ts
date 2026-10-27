import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePage, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
    localStorage.clear();
  });

  it('renderiza com os provedores da aplicação', () => {
    const fixture = TestBed.createComponent(ProfilePage);
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
  it('usa o ID retornado do perfil sem foto, nunca o ID da conta ou cache anterior', () => {
    localStorage.setItem('userRole', 'estudantes');
    localStorage.setItem('userId', '1');
    localStorage.setItem('perfil', '999');
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.componentInstance.ionViewWillEnter();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('http://localhost:8080/perfil/estudantes/1').flush({ id: 42, nome: 'Aluna', usuario: 'aluna', pfp: null });
    http.expectOne('http://localhost:8080/posts/autor/42').flush([]);
    expect(localStorage.getItem('perfil')).toBe('42');
    http.verify();
  });
});
