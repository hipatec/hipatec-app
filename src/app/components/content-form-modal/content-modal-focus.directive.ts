import { Directive, ElementRef, HostListener } from '@angular/core';

/** Completa o ciclo de Tab quando todos os elementos atrás do Ionic estão inert. */
@Directive({ selector: '[appContentModalFocus]', standalone: true })
export class ContentModalFocusDirective {
  constructor(private host: ElementRef<HTMLElement>) {}

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;
    const controls = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )).filter(control => control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls[controls.length - 1];
    const target = event.target as HTMLElement;
    if (last && event.shiftKey && (target === first || target.classList.contains('modal-title'))) {
      event.preventDefault(); last.focus();
    } else if (first && !event.shiftKey && target === last) {
      event.preventDefault(); first.focus();
    }
  }
}
