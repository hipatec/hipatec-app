import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({ selector: 'app-admin-perfis', templateUrl: './admin-perfis.page.html', styleUrls: ['./admin-perfis.page.scss'], standalone: true, imports: [IonicModule, CommonModule] })
export class AdminPerfisPage {
  solicitacoes: Array<{ nome: string; email: string; area: string; data: string }> = [];
  autorizar(pessoa: any) { this.solicitacoes = this.solicitacoes.filter(item => item !== pessoa); alert(`${pessoa.nome} foi autorizada.`); }
  recusar(pessoa: any) { this.solicitacoes = this.solicitacoes.filter(item => item !== pessoa); alert(`${pessoa.nome} foi recusada.`); }
}
