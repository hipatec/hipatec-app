import { contaDoPerfil } from './perfil-identidade';

/** Rascunhos apenas neste navegador; não há persistência de republicações na API. */
export function lerRepostsLegados(perfilId: number | null): any[] {
  return registrosValidos(lerRegistros()).filter(item => String(item.repostOwnerId) === String(perfilId));
}

/** Substitui somente o escopo atual, preservando registros válidos das demais contas. */
export function salvarRepostsLegados(perfilId: number, registros: any[]): void {
  if (!Number.isSafeInteger(perfilId) || perfilId <= 0) return;
  const outros = registrosValidos(lerRegistros()).filter(item => String(item.repostOwnerId) !== String(perfilId));
  const atuais = registrosValidos(registros).filter(item => String(item.repostOwnerId) === String(perfilId));
  localStorage.setItem('hipatec-reposts', JSON.stringify([...outros, ...atuais]));
}

function lerRegistros(): unknown {
  try { return JSON.parse(localStorage.getItem('hipatec-reposts') || '[]'); }
  catch { localStorage.removeItem('hipatec-reposts'); return []; }
}

function registrosValidos(registros: unknown): any[] {
  if (!Array.isArray(registros)) return [];
  const vistos = new Set<string>();
  return registros.filter(item => {
    const originalId = item?.repostOriginalId;
    const dono = item?.repostOwnerId;
    const idValido = (id: unknown) => (typeof id === 'string' && id.trim().length > 0)
      || (typeof id === 'number' && Number.isSafeInteger(id) && id > 0);
    const tipoValido = (item?.repostComComentario === true && item?.repostPuro === false)
      || (item?.repostPuro === true && item?.repostComComentario === false);
    if (typeof item?.id !== 'string' || !item.id.startsWith('repost-') || item.id.length <= 7
      || !idValido(originalId) || !idValido(dono) || !Number.isSafeInteger(Number(dono)) || Number(dono) <= 0
      || !tipoValido || !idValido(item.repostOriginal?.id)
      || String(item.repostOriginal.id) !== String(originalId)
      || (item.repostComComentario && (typeof item.conteudo !== 'string' || !item.conteudo.trim()))) return false;
    const chave = JSON.stringify([String(dono), String(originalId), item.repostComComentario]);
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

/** O contrato existente de curtidas/comentários pertence sempre ao original. */
export function alvoInteracao(post: any): string | number | undefined {
  if (post?.originalIndisponivel) return undefined;
  return post?.repostOriginalId || post?.repostOriginal?.id || post?.id;
}

/** O snapshot legado só identifica o original; conteúdo/autoria/contagens vêm da API. */
export function apresentarRepost(registro: any, original: any | undefined, perfis: any[]): any {
  const dono = perfis.find(perfil => String(perfil.id) === String(registro.repostOwnerId));
  const comentario = registro.repostComComentario === true;
  return {
    ...(original || {}),
    id: registro.id,
    repostOriginalId: registro.repostOriginalId,
    repostOwnerId: registro.repostOwnerId,
    repostComComentario: comentario,
    repostPuro: !comentario,
    repostOriginal: original || null,
    originalIndisponivel: !original,
    autorId: comentario ? dono?.id : original?.autorId,
    autor: comentario ? (dono?.nome || dono?.usuario || 'Usuário') : original?.autor,
    autorRole: comentario ? contaDoPerfil(dono)?.role : original?.autorRole,
    avatar: comentario ? (dono?.pfp || '') : original?.avatar,
    autorFoto: comentario ? (dono?.pfp || '') : original?.autorFoto,
    conteudo: comentario ? registro.conteudo : (original?.conteudo || ''),
    imagemUrl: comentario ? undefined : original?.imagemUrl,
    tempo: comentario ? '' : original?.tempo,
    repostadoUsuario: true
  };
}
