import { PasswordFieldComponent } from '../../components/password-field/password-field.component';
import { QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import { Perfil, PerfilService } from '../../services/perfil.service';
import { Sessao } from '../../services/auth.service';
import { mensagemErro } from '../../services/posts.service';
import { switchMap, Subscription, tap, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';

type FormMode = 'settings' | 'course' | 'mentoring' | 'job' | 'event';

interface FieldConfig {
  key: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

@Component({
  selector: 'app-workspace-form',
  standalone: true,
  imports: [PasswordFieldComponent, CommonModule, FormsModule, IonicModule, RouterLink],
  templateUrl: './workspace-form.page.html',
  styleUrls: ['./workspace-form.page.scss']
})
export class WorkspaceFormPage implements OnDestroy {
  @ViewChildren(PasswordFieldComponent) passwordFields?: QueryList<PasswordFieldComponent>;

  loading = false;
  loaded = false;
  saving = false;
  private conta?: Sessao;
  private perfilAtual?: Perfil;
  private pedido?: Subscription;
  private logoutPendente = false;

  mode: FormMode = 'settings';
  editing = false;
  saved = false;
  formError = '';
  optionsByField: Record<string, string[]> = {};
  userRole = '';
  form: Record<string, string> = {};

  private readonly configs: Record<FormMode, { title: string; subtitle: string; back: string; fields: FieldConfig[] }> = {
    settings: {
      title: 'Configurações',
      subtitle: 'Atualize seus dados pessoais e preferências do perfil.',
      back: '/profile',
      fields: [
        { key: 'nome', label: 'Nome completo', placeholder: 'Como você quer ser apresentada?', required: true },
        { key: 'usuario', label: 'Usuário', placeholder: '@seuusuario', required: true },
        { key: 'email', label: 'E-mail', type: 'email', placeholder: 'voce@exemplo.com', required: true },
        { key: 'novaSenha', label: 'Nova senha', type: 'password', placeholder: 'Deixe em branco para manter a senha' },
        { key: 'confirmarSenha', label: 'Confirmar nova senha', type: 'password', placeholder: 'Repita a nova senha' }
      ]
    },
    course: {
      title: 'Adicionar curso',
      subtitle: 'Cadastre um curso para organizar seu próximo passo de aprendizado.',
      back: '/aprendizado',
      fields: [
        { key: 'titulo', label: 'Nome do curso', placeholder: 'Ex.: Introdução à pesquisa social', required: true },
        { key: 'instituicao', label: 'Instituição', placeholder: 'Nome da instituição' },
        { key: 'formato', label: 'Formato', type: 'select', options: ['Online', 'Presencial', 'Híbrido'], required: true },
        { key: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Descreva o conteúdo e o objetivo do curso.' }
      ]
    },
    mentoring: {
      title: 'Adicionar mentoria',
      subtitle: 'Crie uma oportunidade de mentoria para a comunidade.',
      back: '/painel',
      fields: [
        { key: 'titulo', label: 'Título da mentoria', placeholder: 'Ex.: Carreira em tecnologia', required: true },
        { key: 'area', label: 'Área', placeholder: 'Ex.: Produto, dados, comunicação' },
        { key: 'formato', label: 'Formato', type: 'select', options: ['Online', 'Presencial', 'Híbrido'], required: true },
        { key: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Explique para quem é a mentoria e o que será desenvolvido.' }
      ]
    },
    job: {
      title: 'Adicionar vaga',
      subtitle: 'Publique uma oportunidade clara e acessível para a comunidade.',
      back: '/vagas',
      fields: [
        { key: 'titulo', label: 'Título da vaga', placeholder: 'Ex.: Analista de projetos', required: true },
        { key: 'empresa', label: 'Empresa ou organização', placeholder: 'Nome da organização', required: true },
        { key: 'area', label: 'Área', placeholder: 'Ex.: Tecnologia, educação, comunicação' },
        { key: 'pais', label: 'País', type: 'select', required: true },
        { key: 'estado', label: 'Estado', type: 'select', required: true },
        { key: 'cidade', label: 'Cidade', type: 'select', required: true },
        { key: 'formacao', label: 'Formação', type: 'select', options: ['Não informado', 'Ensino fundamental', 'Ensino médio', 'Curso técnico', 'Ensino superior incompleto', 'Ensino superior completo', 'Pós-graduação', 'Mestrado', 'Doutorado', 'Outra'] },
        { key: 'senioridade', label: 'Senioridade', type: 'select', options: ['Estágio', 'Júnior', 'Pleno', 'Sênior', 'Liderança'] },
        { key: 'idiomas', label: 'Idiomas', placeholder: 'Ex.: Português, Inglês' },
        { key: 'modalidade', label: 'Modalidade', type: 'select', options: ['Presencial', 'Híbrido', 'Remoto'] },
        { key: 'contrato', label: 'Tipo de contrato', type: 'select', options: ['CLT', 'PJ', 'Estágio', 'Temporário', 'Freelance'] },
        { key: 'localizacao', label: 'Localização complementar', placeholder: 'Endereço ou outra informação de local' },
        { key: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Descreva responsabilidades, requisitos e benefícios.' }
      ]
    },
    event: {
      title: 'Adicionar evento',
      subtitle: 'Inclua um evento no calendário da comunidade.',
      back: '/painel',
      fields: [
        { key: 'titulo', label: 'Nome do evento', placeholder: 'Ex.: Encontro da comunidade', required: true },
        { key: 'data', label: 'Data', type: 'date', required: true },
        { key: 'horario', label: 'Horário', type: 'time', required: true },
        { key: 'local', label: 'Local ou link', placeholder: 'Endereço ou URL da transmissão' },
        { key: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Adicione as informações principais do evento.' },
        { key: 'privacidade', label: 'Visibilidade', type: 'select', options: ['Privado', 'Público'] }
      ]
    }
  };

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient, private authService: AuthService, private perfilService: PerfilService) {
    this.authService.sessao().subscribe({ next: sessao => this.userRole = sessao.role, error: () => this.userRole = '' });
    this.route.data.subscribe(data => {
      this.mode = (data['mode'] || 'settings') as FormMode;
      if (this.mode === 'job') this.carregarPaises();
    });
    this.editing = this.route.snapshot.routeConfig?.path?.includes(':id') ?? false;
  }

  ionViewWillEnter() {
    if (this.mode === 'settings') this.carregarConfiguracoes();
  }

  ionViewWillLeave() {
    this.passwordFields?.forEach(field => field.hide());
    this.pedido?.unsubscribe();
    this.form['novaSenha'] = this.form['confirmarSenha'] = '';
  }

  ngOnDestroy() { this.ionViewWillLeave(); }

  carregarConfiguracoes() {
    // Remove o rascunho legado que podia conter senha; jamais o carregar.
    localStorage.removeItem('hipatec-draft-settings');
    this.pedido?.unsubscribe();
    this.loading = true;
    this.loaded = false;
    this.saving = false;
    this.saved = false;
    this.formError = '';
    this.form = {};
    this.pedido = this.authService.sessao().pipe(switchMap(conta => {
      this.conta = conta;
      return this.perfilService.getPerfil(conta.role, conta.id);
    })).subscribe({
      next: perfil => { this.preencherPerfil(perfil); this.loading = false; this.loaded = true; },
      error: erro => { this.loading = false; this.formError = mensagemErro(erro); }
    });
  }

  private preencherPerfil(perfil: Perfil) {
    this.perfilAtual = perfil;
    this.form = { nome: perfil.nome, usuario: perfil.usuario, email: perfil.email || '', novaSenha: '', confirmarSenha: '' };
  }

  private salvarConfiguracoes() {
    if (!this.loaded || !this.conta || !this.perfilAtual || this.saving) return;
    if (this.logoutPendente) { this.encerrarSessao(); return; }
    if (this.form['novaSenha'] !== this.form['confirmarSenha']) {
      this.formError = 'As senhas não coincidem.';
      return;
    }
    const senha = this.form['novaSenha'];
    if (senha && (senha.length < 8 || !senha.trim() || new TextEncoder().encode(senha).length > 72)) {
      this.formError = 'Use pelo menos 8 caracteres e no máximo 72 bytes na senha.';
      return;
    }
    const dados = new FormData();
    for (const key of ['nome', 'usuario', 'email']) dados.append(key, this.form[key]);
    dados.append('biografia', this.perfilAtual.biografia ?? '');
    if (senha) dados.append('novaSenha', senha);
    this.saving = true;
    this.pedido = this.perfilService.updatePerfil(this.conta.role, this.conta.id, dados).pipe(
      tap(perfil => {
        this.preencherPerfil(perfil);
        this.saved = true;
        localStorage.setItem('perfilNome', perfil.nome || perfil.usuario || '');
        window.dispatchEvent(new CustomEvent('hipatec-profile-updated', { detail: perfil }));
        this.logoutPendente = Boolean(senha);
      }),
      switchMap(() => senha ? this.authService.logout() : of(undefined))
    ).subscribe({
      next: () => {
        this.saving = false;
        if (senha) { this.logoutPendente = false; this.router.navigateByUrl('/login'); }
      },
      error: erro => this.erroAoSalvar(erro)
    });
  }

  private encerrarSessao() {
    this.saving = true;
    this.pedido = this.authService.logout().subscribe({
      next: () => {
        this.saving = false;
        this.logoutPendente = false;
        this.router.navigateByUrl('/login');
      },
      error: erro => this.erroAoSalvar(erro)
    });
  }

  private erroAoSalvar(erro: { status?: number }) {
    this.saving = false;
    this.formError = this.logoutPendente
      ? 'Sua senha foi alterada, mas não foi possível confirmar o encerramento da sessão. Clique em Salvar para tentar encerrar novamente.'
      : mensagemErro(erro);
  }

  get config() { return this.configs[this.mode]; }

  get podePublicarConteudo(): boolean {
    return ['mentoras', 'administradores', 'administrador'].includes(this.userRole);
  }

  campoVisivel(field: FieldConfig): boolean {
    if (this.mode !== 'event' || this.podePublicarConteudo) return true;
    return ['titulo', 'data', 'descricao'].includes(field.key);
  }

  optionsFor(field: FieldConfig): string[] {
    return this.optionsByField[field.key] || field.options || [];
  }

  onFieldChange(key: string, value: string) {
    this.saved = false;
    if (this.mode !== 'job') return;
    if (key === 'pais') {
      this.form['estado'] = '';
      this.form['cidade'] = '';
      this.optionsByField['estado'] = ['Não informado'];
      this.optionsByField['cidade'] = ['Não informado'];
      if (value === 'Brasil') this.carregarEstados();
    }
    if (key === 'estado') {
      this.form['cidade'] = '';
      this.optionsByField['cidade'] = ['Não informado'];
      const uf = this.optionsByField['estadoSiglas']?.[this.optionsByField['estado']?.indexOf(value)];
      if (value === 'Não informado') return;
      if (uf) this.carregarCidades(uf);
    }
  }

  private carregarPaises() {
    this.http.get<Array<{ nome: string }>>('https://servicodados.ibge.gov.br/api/v1/localidades/paises?orderBy=nome').subscribe({
      next: paises => this.optionsByField['pais'] = ['Não informado', ...paises.map(pais => pais.nome)],
      error: () => this.optionsByField['pais'] = ['Não informado', 'Brasil']
    });
  }

  private carregarEstados() {
    this.http.get<Array<{ nome: string; sigla: string }>>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').subscribe({
      next: estados => {
        this.optionsByField['estado'] = ['Não informado', ...estados.map(estado => estado.nome)];
        this.optionsByField['estadoSiglas'] = ['', ...estados.map(estado => estado.sigla)];
      },
      error: () => { this.optionsByField['estado'] = ['Não informado']; this.optionsByField['estadoSiglas'] = ['']; }
    });
  }

  private carregarCidades(uf: string) {
    this.http.get<Array<{ nome: string }>>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`).subscribe({
      next: cidades => this.optionsByField['cidade'] = ['Não informado', ...cidades.map(cidade => cidade.nome)],
      error: () => this.optionsByField['cidade'] = ['Não informado']
    });
  }

  save() {
    this.formError = '';
    if (this.mode === 'settings') { this.salvarConfiguracoes(); return; }
    if (this.mode === 'event') { this.formError = 'A edição de eventos ainda não está disponível. Nenhuma alteração foi salva.'; return; }
    this.saved = true;
    const key = `hipatec-draft-${this.mode}`;
    localStorage.setItem(key, JSON.stringify(this.form));
    window.setTimeout(() => this.router.navigateByUrl(this.config.back), 500);
  }

  excluirConta() {
    this.formError = 'A exclusão de conta ainda não está disponível. Sua conta e seus dados foram mantidos.';
  }

  cancelar() { this.router.navigateByUrl(this.config.back); }
}
