import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PostPayload {
  conteudo: string;
}

export interface Post {
  id: number;
  autorId: number;
  conteudo: string;
  autorFoto: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostsService {
  private readonly apiUrl = `${environment.apiUrl}posts`;

  constructor(private http: HttpClient) {}

  createPost(payload: PostPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl);
  }

  getPostsPerfil(id: number): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/autor/${id}`);
  }
}
