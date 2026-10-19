import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Perfil {
    id: number;
    nome: string;
    biografia?: string;
    usuario: string;
    num_posts?: number;
    num_seguidores?: number;
    num_seguindo?: number;
    pfp?: string;
    background?: string;
}

@Injectable({
    providedIn: 'root'
})
export class PerfilService {

    constructor(private http: HttpClient) { }

    getPerfil(role: string, id: number) {
        return this.http.get<Perfil>(
            `${environment.apiUrl}perfil/${role}/${id}`
        );
    }

    getPerfis() {
        return this.http.get<Perfil[]>(`${environment.apiUrl}perfil`);
    }

    updatePerfil(role: string, id: number, formData: FormData) {
        return this.http.put<Perfil>(
            `${environment.apiUrl}perfil/${role}/${id}`,
            formData
        );
    }

}
