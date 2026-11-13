import { FeedbackNoticeComponent } from '../../components/feedback-notice/feedback-notice.component';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { addIcons } from 'ionicons';
import { briefcaseOutline, locationOutline, funnelOutline, timeOutline, openOutline } from 'ionicons/icons';

interface Vaga {
  empresa: string;
  titulo: string;
  descricao: string;
  modalidade: string;
  local: string;
  pais: string;
  estado: string;
  cidade: string;
  area: string;
  formacao: string;
  senioridade: string;
  idiomas: string;
  contrato: string;
  publicada: string;
  tags: string[];
}

@Component({
  selector: 'app-vagas',
  templateUrl: './vagas.page.html',
  styleUrls: ['./vagas.page.scss'],
  standalone: true,
  imports: [FeedbackNoticeComponent, IonicModule, CommonModule, FormsModule, RouterLink]
})
export class VagasPage {
  aviso = '';
  busca = '';
  cargo = 'Todos';
  area = 'Todas';
  pais = 'Todos';
  estado = 'Todos';
  cidade = 'Todas';
  formacao = 'Todas';
  senioridade = 'Todas';
  idioma = 'Todos';
  modalidade = 'Todas';
  contrato = 'Todos';
  vagas: Vaga[] = [];
  userRole = '';

  constructor(private authService: AuthService) {
    addIcons({ briefcaseOutline, locationOutline, funnelOutline, timeOutline, openOutline });
    this.authService.sessao().subscribe({ next: sessao => this.userRole = sessao.role, error: () => this.userRole = '' });
  }

  get podePublicarVaga(): boolean {
    return ['mentoras', 'administradores', 'administrador'].includes(this.userRole);
  }

  get vagasFiltradas(): Vaga[] {
    const termo = this.busca.trim().toLowerCase();
    return this.vagas.filter(vaga => {
      const correspondeBusca = !termo || [vaga.empresa, vaga.titulo, vaga.descricao, vaga.area, vaga.cidade, ...vaga.tags]
        .join(' ').toLowerCase().includes(termo);
      const correspondeCargo = this.cargo === 'Todos' || vaga.titulo === this.cargo;
      const correspondeArea = this.area === 'Todas' || vaga.area === this.area;
      const correspondePais = this.pais === 'Todos' || vaga.pais === this.pais;
      const correspondeEstado = this.estado === 'Todos' || vaga.estado === this.estado;
      const correspondeCidade = this.cidade === 'Todas' || vaga.cidade === this.cidade;
      const correspondeFormacao = this.formacao === 'Todas' || vaga.formacao === this.formacao;
      const correspondeSenioridade = this.senioridade === 'Todas' || vaga.senioridade === this.senioridade;
      const correspondeIdioma = this.idioma === 'Todos' || vaga.idiomas === this.idioma;
      const correspondeModalidade = this.modalidade === 'Todas' || vaga.modalidade === this.modalidade;
      const correspondeContrato = this.contrato === 'Todos' || vaga.contrato === this.contrato;
      return correspondeBusca && correspondeCargo && correspondeArea && correspondePais && correspondeEstado && correspondeCidade
        && correspondeFormacao && correspondeSenioridade && correspondeIdioma && correspondeModalidade && correspondeContrato;
    }).sort((a, b) => this.idadeEmHoras(a.publicada) - this.idadeEmHoras(b.publicada));
  }

  private idadeEmHoras(publicada: string): number {
    const quantidade = Number.parseInt(publicada, 10);
    return publicada.includes('h') ? quantidade : quantidade * 24;
  }

  limparFiltros() {
    this.busca = '';
    this.cargo = 'Todos';
    this.area = 'Todas';
    this.pais = 'Todos';
    this.estado = 'Todos';
    this.cidade = 'Todas';
    this.formacao = 'Todas';
    this.senioridade = 'Todas';
    this.idioma = 'Todos';
    this.modalidade = 'Todas';
    this.contrato = 'Todos';
  }

  abrirVaga(vaga: Vaga) {
    this.aviso = 'Os detalhes de vagas ainda não estão disponíveis.';
  }

  inscrever(vaga: Vaga) {
    this.aviso = 'Esta vaga ainda não tem link de candidatura disponível. Nenhuma inscrição foi realizada.';
  }

}
