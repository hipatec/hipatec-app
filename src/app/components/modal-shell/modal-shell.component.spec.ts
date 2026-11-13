import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ModalShellComponent } from './modal-shell.component';

@Component({
  standalone: true,
  imports: [ModalShellComponent],
  template: `
    <app-modal-shell titulo="Título do teste" (fechar)="fechou = fechou + 1">
      <p class="corpo">Corpo</p>
      <button modalFooter type="button" class="acao">Ação</button>
    </app-modal-shell>
  `
})
class HostComponent { fechou = 0; }

describe('ModalShellComponent', () => {
  it('projeta corpo e rodapé, emite fechar e, ao apresentar, nomeia o diálogo e foca o título', () => {
    TestBed.configureTestingModule({ imports: [HostComponent, IonicModule.forRoot()] });
    const modal = document.createElement('div');
    document.body.appendChild(modal);
    const fixture = TestBed.createComponent(HostComponent);
    modal.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.modal-body .corpo')).toBeTruthy();
    expect(el.querySelector('.modal-footer .acao')).toBeTruthy();
    (el.querySelector('.modal-close') as HTMLButtonElement).click();
    expect(fixture.componentInstance.fechou).toBe(1);

    const titulo = el.querySelector<HTMLElement>('.modal-title')!;
    modal.dispatchEvent(new CustomEvent('ionModalWillPresent', { bubbles: true }));
    modal.dispatchEvent(new CustomEvent('ionModalDidPresent', { bubbles: true }));
    expect(modal.getAttribute('aria-labelledby')).toBe(titulo.id);
    expect(document.activeElement).toBe(titulo);

    // Outro modal apresentado não é afetado.
    const outro = document.createElement('div');
    document.body.appendChild(outro);
    outro.dispatchEvent(new CustomEvent('ionModalWillPresent', { bubbles: true }));
    expect(outro.hasAttribute('aria-labelledby')).toBeFalse();

    fixture.destroy();
    modal.remove();
    outro.remove();
  });
});
