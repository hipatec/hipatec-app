import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AprendizadoPage } from './aprendizado.page';

describe('AprendizadoPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AprendizadoPage, IonicModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('exibe as atividades completas de aprendizado', () => {
    const fixture = TestBed.createComponent(AprendizadoPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Meu aprendizado');
    expect(fixture.nativeElement.textContent).toContain('Suas atividades');
    expect(fixture.nativeElement.textContent).toContain('Lógica de programação');
    expect(fixture.componentInstance.itens.length).toBe(3);
  });

  it('filtra atividades em andamento e concluídas', () => {
    const fixture = TestBed.createComponent(AprendizadoPage);
    const page = fixture.componentInstance;

    page.alterarFiltroAtividade('Concluídas');
    expect(page.atividadesPaginadas.length).toBe(1);
    page.alterarFiltroAtividade('Em andamento');
    expect(page.atividadesPaginadas.length).toBe(2);
  });

  it('filtra sugestões por tipo', () => {
    const fixture = TestBed.createComponent(AprendizadoPage);
    const page = fixture.componentInstance;

    page.alterarFiltroSugestao('Curso');
    expect(page.sugestoesPaginadas.length).toBe(1);
    page.alterarFiltroSugestao('Mentoria');
    expect(page.sugestoesPaginadas.length).toBe(2);
  });
});
