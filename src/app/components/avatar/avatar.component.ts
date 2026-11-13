import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return 'U';
  return partes.slice(0, 2).map(parte => parte[0].toUpperCase()).join('');
}

/**
 * Avatar circular com foto e fallback para iniciais (também quando a foto falha).
 * Tamanho: defina `--avatar-size` no consumidor (padrão 40px).
 * `alt` vazio = decorativo (o nome já aparece ao lado); preencha quando o avatar estiver sozinho.
 */
@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (src && !falhou) {
      <img [src]="src" [alt]="alt" width="64" height="64" loading="lazy" decoding="async" (error)="falhou = true" />
    } @else {
      <span class="avatar-initials" [attr.role]="alt ? 'img' : null" [attr.aria-label]="alt || null" [attr.aria-hidden]="alt ? null : 'true'">{{ iniciais }}</span>
    }
  `,
  styleUrls: ['./avatar.component.scss']
})
export class AvatarComponent {
  private _src: string | null | undefined;
  falhou = false;

  @Input() nome: string | null | undefined;
  @Input() alt = '';

  @Input()
  set src(valor: string | null | undefined) {
    if (valor !== this._src) this.falhou = false;
    this._src = typeof valor === 'string' ? valor.trim() : valor;
  }
  get src() { return this._src; }

  get iniciais() { return iniciais(this.nome); }
}
