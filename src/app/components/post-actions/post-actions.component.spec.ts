import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { PostActionsComponent } from './post-actions.component';

describe('PostActionsComponent', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [PostActionsComponent, IonicModule.forRoot()] }));

  function criar(post: object, repostavel = true) {
    const fixture = TestBed.createComponent(PostActionsComponent);
    fixture.componentRef.setInput('post', post);
    fixture.componentRef.setInput('repostavel', repostavel);
    fixture.detectChanges();
    return fixture;
  }

  it('nomeia as quatro ações, informa estado e emite cada uma', () => {
    const fixture = criar({ autor: 'Ana', curtidas: 3, comentarios: 1, reposts: 2, curtidoUsuario: true, repostadoUsuario: false });
    const el: HTMLElement = fixture.nativeElement;
    const [curtir, comentar, repostar, comComentario] = Array.from(el.querySelectorAll<HTMLButtonElement>('button'));

    expect(curtir.getAttribute('aria-label')).toBe('Curtir publicação de Ana');
    expect(curtir.getAttribute('aria-pressed')).toBe('true');
    expect(comentar.getAttribute('aria-label')).toBe('Comentar publicação de Ana');
    expect(repostar.getAttribute('aria-pressed')).toBe('false');
    expect(comComentario.getAttribute('aria-label')).toContain('Comentar');
    expect(el.textContent).toContain('3');

    const emitidos: string[] = [];
    const c = fixture.componentInstance;
    c.curtir.subscribe(() => emitidos.push('curtir'));
    c.comentar.subscribe(() => emitidos.push('comentar'));
    c.repostar.subscribe(() => emitidos.push('repostar'));
    c.repostarComComentario.subscribe(() => emitidos.push('comComentario'));
    [curtir, comentar, repostar, comComentario].forEach(botao => botao.click());

    expect(emitidos).toEqual(['curtir', 'comentar', 'repostar', 'comComentario']);
  });

  it('estado desconhecido bloqueia toggles, não anuncia false/zero e oferece recuperação', () => {
    const fixture = criar({ interacoesDesconhecidas: true });
    const host: HTMLElement = fixture.nativeElement;
    for (const selector of ['.btn-like', '.btn-repost']) {
      const button = host.querySelector<HTMLButtonElement>(selector)!;
      expect(button.disabled).toBeTrue(); expect(button.hasAttribute('aria-pressed')).toBeFalse();
      expect(button.textContent).toContain('—');
    }
    const recuperar = spyOn(fixture.componentInstance.recuperar, 'emit');
    host.querySelector<HTMLButtonElement>('.retry-interactions')!.click();
    expect(recuperar).toHaveBeenCalledTimes(1);
  });

  it('sem republicação, mostra o total apenas como informação', () => {
    const fixture = criar({ autor: 'Ana', reposts: 4 }, false);
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('button').length).toBe(2);
    expect(el.querySelector('.action-static')?.textContent).toContain('4');
  });
});
