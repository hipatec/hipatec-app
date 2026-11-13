import { contaDoPerfil, mesmaConta, perfilDaSessao, rotaDoAutor } from './perfil-identidade';

// Contas: estudante 1 e mentora 1 são pessoas diferentes; perfis têm IDs próprios.
const PERFIL_MENTORA = { id: 7, id_mentora: 1 };
const PERFIL_ESTUDANTE = { id: 42, id_estudante: 1 };
const SESSAO_ESTUDANTE = { role: 'estudantes' as const, id: 1 };

describe('perfil-identidade', () => {
  it('deriva a conta do perfil e rejeita vínculo ausente ou ambíguo', () => {
    expect(contaDoPerfil(PERFIL_MENTORA)).toEqual({ role: 'mentoras', id: 1 });
    expect(contaDoPerfil(PERFIL_ESTUDANTE)).toEqual({ role: 'estudantes', id: 1 });
    expect(contaDoPerfil({ id_estudante: 0 })).toEqual({ role: 'estudantes', id: 0 });
    expect(contaDoPerfil({})).toBeNull();
    expect(contaDoPerfil({ id_estudante: 1, id_mentora: 1 })).toBeNull();
    expect(contaDoPerfil(undefined)).toBeNull();
  });

  it('não confunde contas de papéis diferentes com o mesmo número', () => {
    expect(mesmaConta({ role: 'mentoras', id: 1 }, SESSAO_ESTUDANTE)).toBeFalse();
    expect(mesmaConta({ role: 'estudantes', id: 1 }, SESSAO_ESTUDANTE)).toBeTrue();
    expect(mesmaConta(null, SESSAO_ESTUDANTE)).toBeFalse();
  });

  it('encontra o perfil da sessão em qualquer ordem da lista', () => {
    expect(perfilDaSessao([PERFIL_MENTORA, PERFIL_ESTUDANTE], SESSAO_ESTUDANTE)?.id).toBe(42);
    expect(perfilDaSessao([PERFIL_ESTUDANTE, PERFIL_MENTORA], SESSAO_ESTUDANTE)?.id).toBe(42);
    expect(perfilDaSessao([PERFIL_MENTORA], SESSAO_ESTUDANTE)).toBeUndefined();
    expect(perfilDaSessao([PERFIL_ESTUDANTE], null)).toBeUndefined();
  });

  it('resolve a rota pelo ID de conta do autor, nunca pelo ID de perfil', () => {
    for (const perfis of [[PERFIL_MENTORA, PERFIL_ESTUDANTE], [PERFIL_ESTUDANTE, PERFIL_MENTORA]]) {
      expect(rotaDoAutor(7, perfis, SESSAO_ESTUDANTE)).toEqual(['/profile', 'mentoras', '1']);
      expect(rotaDoAutor(42, perfis, SESSAO_ESTUDANTE)).toEqual(['/profile']);
    }
    expect(rotaDoAutor(42, [PERFIL_ESTUDANTE], null)).toEqual(['/profile', 'estudantes', '1']);
    expect(rotaDoAutor(999, [PERFIL_ESTUDANTE], SESSAO_ESTUDANTE)).toBeNull();
  });
});
