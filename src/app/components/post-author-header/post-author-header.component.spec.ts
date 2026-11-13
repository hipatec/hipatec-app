import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { PostAuthorHeaderComponent } from './post-author-header.component';

@Component({
  standalone: true,
  imports: [PostAuthorHeaderComponent],
  template: `
    <app-post-author-header [autor]="autor" funcao="mentoras" tempo="há 2 h" (autorClick)="cliques = cliques + 1">
      <button type="button" role="menuitem" class="hipatec-menu-item" (click)="acoes = acoes + 1">Primeira</button>
      <button type="button" role="menuitem" class="hipatec-menu-item">Segunda</button>
      <button type="button" role="menuitem" class="hipatec-menu-item" (click)="campo.focus()">Move o foco</button>
    </app-post-author-header>
    <button type="button" class="fora">Fora</button>
    <input #campo class="campo" aria-label="Campo da página" />
  `
})
class HostComponent {
  autor = 'Ana Souza';
  cliques = 0;
  acoes = 0;
}

describe('PostAuthorHeaderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, IonicModule.forRoot()] });
    fixture = TestBed.createComponent(HostComponent);
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    el.remove();
  });

  const gatilho = () => el.querySelector('.btn-options') as HTMLButtonElement;
  const menu = () => el.querySelector('[role="menu"]') as HTMLElement;
  const itens = () => Array.from(el.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));

  it('exibe autor, função legível e horário, e emite o clique no autor', () => {
    expect(el.querySelector('.author-name')?.textContent).toContain('Ana Souza');
    expect(el.querySelector('.author-role')?.textContent).toContain('Mentora');
    expect(el.querySelector('time')?.textContent).toContain('há 2 h');

    (el.querySelector('.author') as HTMLButtonElement).click();
    expect(fixture.componentInstance.cliques).toBe(1);
  });

  it('abre o menu, foca o primeiro item e navega pelas setas', fakeAsync(() => {
    expect(gatilho().getAttribute('aria-label')).toBe('Mais opções da publicação de Ana Souza');
    expect(menu().hidden).toBeTrue();

    gatilho().click();
    fixture.detectChanges();
    tick();
    expect(menu().hidden).toBeFalse();
    expect(gatilho().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(itens()[0]);

    menu().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(itens()[1]);
    menu().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(itens()[2]);
    menu().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(itens()[0]);
    menu().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(document.activeElement).toBe(itens()[2]);
  }));

  it('fecha com Escape devolvendo o foco ao gatilho', fakeAsync(() => {
    gatilho().click();
    fixture.detectChanges();
    tick();

    itens()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(menu().hidden).toBeTrue();
    expect(document.activeElement).toBe(gatilho());
  }));

  // Teclado: o navegador ativa o item focado com Enter/Espaço disparando `click` no próprio item.
  function escolherPeloTeclado(indice: number) {
    for (let i = 0; i < indice; i++) {
      menu().dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    }
    const item = itens()[indice];
    expect(document.activeElement).toBe(item);
    item.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    item.click();
    fixture.detectChanges();
    tick();
  }

  it('após escolher um item pelo teclado, devolve o foco ao gatilho em vez de deixá-lo no item oculto', fakeAsync(() => {
    gatilho().focus();
    gatilho().click();
    fixture.detectChanges();
    tick();

    escolherPeloTeclado(0);

    expect(fixture.componentInstance.acoes).toBe(1);
    expect(menu().hidden).toBeTrue();
    expect(document.activeElement).toBe(gatilho());
    expect(menu().contains(document.activeElement)).toBeFalse();
  }));

  it('mantém o foco onde a ação o colocou', fakeAsync(() => {
    gatilho().click();
    fixture.detectChanges();
    tick();

    escolherPeloTeclado(2);

    expect(menu().hidden).toBeTrue();
    expect(document.activeElement).toBe(el.querySelector('.campo'));
  }));

  it('fecha ao escolher um item (a ação continua na página) e ao clicar fora', fakeAsync(() => {
    gatilho().click();
    fixture.detectChanges();
    tick();
    itens()[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.acoes).toBe(1);
    expect(menu().hidden).toBeTrue();

    gatilho().click();
    fixture.detectChanges();
    tick();
    (el.querySelector('.fora') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(menu().hidden).toBeTrue();
  }));
});
