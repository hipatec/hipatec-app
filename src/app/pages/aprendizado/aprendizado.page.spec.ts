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

  it('exibe o estado vazio quando não há atividades reais carregadas', () => {
    const fixture = TestBed.createComponent(AprendizadoPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Meu aprendizado');
    expect(fixture.nativeElement.textContent).toContain('Suas atividades');
    expect(fixture.nativeElement.textContent).toContain('Você ainda não possui atividades de aprendizado cadastradas.');
    expect(fixture.componentInstance.itens.length).toBe(0);
  });

  it('filtra atividades em andamento e concluídas', () => {
    const fixture = TestBed.createComponent(AprendizadoPage);
    const page = fixture.componentInstance;

    page.alterarFiltroAtividade('Concluídas');
    expect(page.atividadesPaginadas.length).toBe(0);
    page.alterarFiltroAtividade('Em andamento');
    expect(page.atividadesPaginadas.length).toBe(0);
  });

  it('filtra sugestões por tipo', () => {
    const fixture = TestBed.createComponent(AprendizadoPage);
    const page = fixture.componentInstance;

    page.alterarFiltroSugestao('Curso');
    expect(page.sugestoesPaginadas.length).toBe(0);
    page.alterarFiltroSugestao('Mentoria');
    expect(page.sugestoesPaginadas.length).toBe(0);
  });
});
