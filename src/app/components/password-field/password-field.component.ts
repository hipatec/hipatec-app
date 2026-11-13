import { AfterContentInit, Component, ContentChild, DoCheck, ElementRef, Input, OnChanges, OnDestroy } from '@angular/core';
import { NgModel } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

/** Projects the original native input: bindings, validators and autocomplete stay with its form. */
@Component({
  selector: 'app-password-field',
  standalone: true,
  imports: [IonicModule],
  template: `<ng-content />
    <button type="button" [attr.aria-label]="visible ? 'Ocultar senha' : 'Mostrar senha'"
      [attr.aria-pressed]="visible" [disabled]="input?.nativeElement?.disabled"
      (pointerdown)="$event.preventDefault()" (click)="toggle()">
      <ion-icon [icon]="visible ? eyeOff : eye" aria-hidden="true" />
    </button>`,
  styles: [`:host { display: block; position: relative; width: 100%; }
    button { position: absolute; inset-inline-end: 2px; top: 50%; transform: translateY(-50%);
      width: var(--hipatec-target-min, 44px); height: 40px; display: grid; place-items: center;
      border: 0; border-radius: var(--hipatec-radius-sm, 8px); background: transparent;
      color: var(--ion-color-primary); cursor: pointer; }
    button:hover { background: var(--ion-color-light); }
    button:focus-visible { outline: 2px solid var(--ion-color-primary); outline-offset: 1px; }
    button:disabled { opacity: .5; cursor: default; }
    ion-icon { font-size: 22px; pointer-events: none; }`]
})
export class PasswordFieldComponent implements AfterContentInit, DoCheck, OnChanges, OnDestroy {
  @ContentChild(NgModel, { read: ElementRef }) input?: ElementRef<HTMLInputElement>;
  @Input() resetKey: unknown;
  visible = false;
  readonly eye = eyeOutline;
  readonly eyeOff = eyeOffOutline;
  private lastValue = '';

  ngAfterContentInit() {
    this.input?.nativeElement.style.setProperty('padding-inline-end', '48px');
    this.hide();
  }
  ngOnChanges() { this.hide(); }
  ngDoCheck() {
    const value = this.input?.nativeElement.value || '';
    if (!value && this.lastValue) this.hide();
    this.lastValue = value;
  }
  ngOnDestroy() { this.hide(); }
  hide() { this.visible = false; if (this.input) this.input.nativeElement.type = 'password'; }
  toggle() {
    const input = this.input?.nativeElement;
    if (!input || input.disabled) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    this.visible = !this.visible;
    input.type = this.visible ? 'text' : 'password';
    input.focus({ preventScroll: true });
    if (start !== null && end !== null) input.setSelectionRange(start, end);
  }
}
