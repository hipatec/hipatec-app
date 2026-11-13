import { Perfil } from './perfil.service';
import { Sessao } from './auth.service';

/**
 * Identidades da API:
 * - conta = { role, id } da sessão (`/auth/session`), usada por GET/PUT `/perfil/{role}/{id}`;
 * - perfil = `Perfil.id`, usado como `autorId` dos posts, em `/posts/autor/{id}` e nos seguimentos.
 * IDs de conta só são únicos dentro do mesmo papel (estudante 1 ≠ mentora 1).
 */
export interface Conta { role: Sessao['role']; id: number; }

type PerfilConta = Pick<Perfil, 'id_estudante' | 'id_mentora'>;

/** Conta dona do perfil; null quando o vínculo é ausente ou ambíguo. */
export function contaDoPerfil(perfil: PerfilConta | null | undefined): Conta | null {
  const estudante = perfil?.id_estudante ?? null;
  const mentora = perfil?.id_mentora ?? null;
  if (estudante !== null && mentora === null) return { role: 'estudantes', id: Number(estudante) };
  if (mentora !== null && estudante === null) return { role: 'mentoras', id: Number(mentora) };
  return null;
}

/** Mesma conta exige mesmo papel e mesmo ID de conta. */
export function mesmaConta(a: Conta | null | undefined, b: Conta | null | undefined): boolean {
  return Boolean(a && b) && a!.role === b!.role && Number(a!.id) === Number(b!.id);
}

/** Perfil da sessão autenticada dentro da lista de perfis. */
export function perfilDaSessao<T extends PerfilConta>(perfis: T[], sessao: Conta | null | undefined): T | undefined {
  return sessao ? perfis.find(perfil => mesmaConta(contaDoPerfil(perfil), sessao)) : undefined;
}

/**
 * Rota do perfil do autor de um post (autorId = ID de perfil).
 * Retorna `/profile` para a própria conta, `/profile/{role}/{idConta}` para as demais,
 * ou null quando a conta do autor não pode ser resolvida.
 */
export function rotaDoAutor(
  autorPerfilId: number | string | null | undefined,
  perfis: Array<PerfilConta & Pick<Perfil, 'id'>>,
  sessao?: Conta | null
): string[] | null {
  const perfil = perfis.find(item => Number(item.id) === Number(autorPerfilId));
  const conta = contaDoPerfil(perfil);
  if (!conta) return null;
  if (mesmaConta(conta, sessao)) return ['/profile'];
  return ['/profile', conta.role, String(conta.id)];
}
