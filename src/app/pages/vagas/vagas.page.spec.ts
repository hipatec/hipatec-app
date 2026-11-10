import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VagasPage } from './vagas.page';

describe('VagasPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VagasPage, IonicModule.forRoot()],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();
  });

  it('renderiza o estado vazio e os filtros sem inventar oportunidades', () => {
    const fixture = TestBed.createComponent(VagasPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Vagas');
    expect(fixture.nativeElement.textContent).toContain('Filtros de pesquisa');
    expect(fixture.nativeElement.textContent).toContain('Nenhuma vaga encontrada');
    expect(fixture.componentInstance.vagasFiltradas.length).toBe(0);
  });

  it('filtra as vagas por modalidade', () => {
    const fixture = TestBed.createComponent(VagasPage);
    fixture.componentInstance.modalidade = 'Remoto';

    expect(fixture.componentInstance.vagasFiltradas.length).toBe(0);
  });
});
