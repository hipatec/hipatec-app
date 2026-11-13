import { TestBed } from '@angular/core/testing';
import { AvatarComponent, iniciais } from './avatar.component';

const FOTO = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

describe('AvatarComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AvatarComponent] }));

  it('gera até duas iniciais e usa fallback para nome vazio', () => {
    expect(iniciais('ana maria souza')).toBe('AM');
    expect(iniciais('  Bia ')).toBe('B');
    expect(iniciais(null)).toBe('U');
    expect(iniciais('')).toBe('U');
    expect(iniciais('   ')).toBe('U');
    expect(iniciais('\t\n ')).toBe('U');
  });

  it('mostra a foto quando existe e é decorativa por padrão', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('src', FOTO);
    fixture.componentRef.setInput('nome', 'Ana Souza');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(FOTO);
    expect(img.getAttribute('alt')).toBe('');
  });

  it('mostra U para nome só com espaços', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('nome', '   ');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('U');
  });

  it('mostra iniciais sem foto e quando a foto falha, voltando à foto se a origem mudar', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('nome', 'Ana Souza');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('AS');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();

    fixture.componentRef.setInput('src', 'https://exemplo.invalido/quebrada.png');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.textContent.trim()).toBe('AS');

    fixture.componentRef.setInput('src', FOTO);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeTruthy();
  });

  it('expõe nome acessível nas iniciais quando recebe alt', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('nome', 'Ana Souza');
    fixture.componentRef.setInput('alt', 'Foto de Ana Souza');
    fixture.detectChanges();

    const span = fixture.nativeElement.querySelector('.avatar-initials') as HTMLElement;
    expect(span.getAttribute('role')).toBe('img');
    expect(span.getAttribute('aria-label')).toBe('Foto de Ana Souza');
    expect(span.getAttribute('aria-hidden')).toBeNull();
  });
});
