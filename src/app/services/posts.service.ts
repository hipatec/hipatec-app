import { alvoInteracao } from './repost-context';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PostPayload {
  conteudo: string;
  requisicaoId?: string;
}

export interface Post {
  id: number | string;
  autorId: number;
  conteudo: string;
  autorFoto: string;
  createdAt?: string;
  likesCount?: number;
  commentsCount?: number;
  curtidoUsuario?: boolean;
  interacoesDesconhecidas?: boolean;
}

export interface InteracoesPost {
  likesCount: number;
  commentsCount: number;
  curtidoUsuario: boolean;
  repostsCount?: number;
  repostadoUsuario?: boolean;
}

export interface Comentario {
  id?: string;
  autorId: number;
  autorNome: string;
  autorFoto?: string;
  texto: string;
  dataCriacao?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private readonly apiUrl = `${environment.apiUrl}posts`;

  constructor(private http: HttpClient) {}

  createPost(payload: PostPayload | FormData): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl).pipe(switchMap(posts => this.comInteracoes(posts)));
  }

  getComentarios(postId: string | number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.apiUrl}/${postId}/comments`);
  }

  addComentario(postId: string | number, texto: string, requisicaoId?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${postId}/comment`, { texto, requisicaoId });
  }

  getInteracoes(id: string | number): Observable<InteracoesPost> {
    return this.http.get<InteracoesPost>(`${this.apiUrl}/${id}/interacoes`);
  }

  private comInteracoes(posts: Post[]): Observable<Post[]> {
    return posts.length ? forkJoin(posts.map(post => this.getInteracoes(alvoInteracao(post) ?? post.id).pipe(
      map(estado => ({ ...post, ...estado, interacoesDesconhecidas: false })),
      catchError(() => of({ ...post, curtidoUsuario: undefined, repostadoUsuario: undefined, interacoesDesconhecidas: true }))))) : of([]);
  }

  confirmarInteracoes(post: any): Observable<InteracoesPost | null> {
    const id = alvoInteracao(post);
    if (!id) return of(null);
    return this.getInteracoes(id).pipe(tap(estado => {
      const detalhe = { id, ...estado };
      this.aplicarInteracoes(post, detalhe);
      window.dispatchEvent(new CustomEvent('hipatec-post-updated', { detail: detalhe }));
    }), catchError(erro => {
      post.interacoesDesconhecidas = true;
      post.curtidoUsuario = post.repostadoUsuario = undefined;
      return throwError(() => erro);
    }));
  }

  recuperarInteracoes(post: any) {
    if (post.interacaoPendente) return;
    post.interacaoPendente = true;
    this.confirmarInteracoes(post).subscribe({
      next: () => { post.interacaoPendente = false; post.erroInteracao = ''; },
      error: erro => { post.interacaoPendente = false; post.erroInteracao = mensagemErro(erro); }
    });
  }

  aplicarInteracoes(post: any, estado: any) {
    if (String(alvoInteracao(post)) !== String(estado.id)) return;
    Object.assign(post, { interacoesDesconhecidas: false, curtidas: estado.likesCount, comentarios: estado.commentsCount,
      likesCount: estado.likesCount, commentsCount: estado.commentsCount, curtidoUsuario: estado.curtidoUsuario, reposts: estado.repostsCount, repostsCount: estado.repostsCount, repostadoUsuario: estado.repostadoUsuario });
    if (post.repostOriginal) this.aplicarInteracoes(post.repostOriginal, estado);
  }

  alternarCurtida(post: any) {
    if (post.interacaoPendente || post.interacoesDesconhecidas || typeof post.curtidoUsuario !== 'boolean') return;
    post.interacaoPendente = true;
    post.erroInteracao = '';
    const id = alvoInteracao(post);
    if (!id) { post.interacaoPendente = false; return; }
    const url = `${this.apiUrl}/${id}/like`;
    const pedido = post.curtidoUsuario ? this.http.delete<void>(url) : this.http.post<void>(url, {});
    pedido.pipe(switchMap(() => this.confirmarInteracoes(post))).subscribe({
      next: () => post.interacaoPendente = false,
      error: erro => { post.interacaoPendente = false; post.erroInteracao = mensagemErro(erro); }
    });
  }

  getRepublicados(perfilId: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/republicados/${perfilId}`).pipe(switchMap(posts => this.comInteracoes(posts)));
  }
  repostar(post: any, comentario = '', requisicaoId = crypto.randomUUID()): Observable<void> {
    const id = alvoInteracao(post);
    if (comentario) return this.http.post<void>(`${this.apiUrl}/${id}/repost-comentario`, { conteudo: comentario, requisicaoId });
    if (post.interacoesDesconhecidas || typeof post.repostadoUsuario !== 'boolean') return throwError(() => ({ status: 503 }));
    return post.repostadoUsuario ? this.http.delete<void>(`${this.apiUrl}/${id}/repost`)
      : this.http.post<void>(`${this.apiUrl}/${id}/repost`, {});
  }
  editar(id: string | number, conteudo: string, versao = 0) { return this.http.put<void>(`${this.apiUrl}/${id}`, { conteudo, versao }); }
  excluir(id: string | number) { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
  denunciar(id: string | number, motivo: string, comentarioId?: string) {
    return this.http.post<{ protocolo: number; status: string }>(`${this.apiUrl}/${id}/denuncias`, { motivo, comentarioId });
  }

  getPostsPerfil(id: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/autor/${id}`).pipe(switchMap(posts => this.comInteracoes(posts)));
  }
}

/** Não inclui payloads, credenciais ou respostas brutas nas mensagens. */
export function mensagemErro(erro: { status?: number }): string {
  if (erro.status === 0) return 'Sem conexão com o servidor. Tente novamente.';
  if (erro.status === 401) return 'Sua sessão expirou. Entre novamente.';
  if (erro.status === 403) return 'A operação não foi autorizada. Atualize a página e tente novamente.';
  if (erro.status === 400) return 'Dados inválidos. Revise o conteúdo e tente novamente.';
  if (erro.status === 409) return 'Estes dados não estão disponíveis. Revise e tente novamente.';
  return 'O servidor não confirmou a operação. Atualize para conferir antes de tentar novamente.';
}
