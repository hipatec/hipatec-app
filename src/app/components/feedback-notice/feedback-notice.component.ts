import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({ selector: 'app-feedback-notice', standalone: true, imports: [CommonModule],
  template: `<p *ngIf="mensagem" class="hipatec-state" [class.hipatec-state-error]="erro" [attr.role]="erro ? 'alert' : 'status'">{{ mensagem }}</p>`
})
export class FeedbackNoticeComponent {
  @Input() mensagem = '';
  @Input() erro = false;
}
