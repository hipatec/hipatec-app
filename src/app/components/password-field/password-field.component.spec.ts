import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { PasswordFieldComponent } from './password-field.component';

@Component({ standalone: true, imports: [FormsModule, PasswordFieldComponent], template: `
  <form (ngSubmit)="submitted = true">
    <app-password-field [resetKey]="reset"><input name="first" type="password" [(ngModel)]="first" autocomplete="new-password" /></app-password-field>
    <app-password-field><input name="second" type="password" [(ngModel)]="second" /></app-password-field>
  </form>` })
class HostComponent { first = 'Fixture123!'; second = 'Fixture123!'; reset = 0; submitted = false; }

describe('PasswordFieldComponent', () => {
  it('alterna cada campo independentemente, preserva valor/foco e não submete', async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent); fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll('input');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(inputs[0].type).toBe('password'); expect(inputs[1].type).toBe('password');
    inputs[0].focus(); inputs[0].setSelectionRange(2, 4); buttons[0].click(); fixture.detectChanges();
    expect(inputs[0].type).toBe('text'); expect(inputs[1].type).toBe('password');
    expect(inputs[0].value).toBe('Fixture123!'); expect(inputs[0].selectionStart).toBe(2);
    expect(document.activeElement).toBe(inputs[0]); expect(fixture.componentInstance.submitted).toBeFalse();
    expect(buttons[0].getAttribute('aria-label')).toBe('Ocultar senha');
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    fixture.componentInstance.reset++; fixture.detectChanges(); expect(inputs[0].type).toBe('password');
  });
});
