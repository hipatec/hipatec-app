import { PasswordFieldComponent } from '../../components/password-field/password-field.component';
import { QueryList, ViewChildren } from '@angular/core';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// import { HttpClientModule } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router'; // aqui faltou importar o RouterLink
import { IonLabel, IonSegment, IonSegmentButton } from '@ionic/angular/standalone';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [PasswordFieldComponent, IonLabel, IonSegment, IonSegmentButton, CommonModule, FormsModule, RouterLink] // adicionei o RouterLink aqui
})
export class LoginPage {
  ionViewWillLeave() { this.passwordFields?.forEach(field => field.hide()); }

  @ViewChildren(PasswordFieldComponent) passwordFields?: QueryList<PasswordFieldComponent>;


  role: 'estudantes' | 'mentoras' = 'estudantes';
  erro = '';
  tentou = false;
  enviando = false;
  email = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) { } // isso aqui precisa estar em todas? acredito que sim


  switchRole(ev: any) {
    this.role = ev.detail?.value || 'estudantes';
    this.email = '';
    this.password = '';
  }

  login() {
    if (this.enviando) return;
    this.tentou = true; this.erro = '';
    if (!this.email || !this.password) {
      document.getElementById(!this.email ? 'login-identifier' : 'login-password')?.focus();
      return;
    }

    this.enviando = true;
    this.auth.login(this.role, this.email, this.password)
      .subscribe({
        next: () => {
          this.password = '';
          window.location.assign('/home');
        },
        error: (err) => {
          this.enviando = false;
          this.password = '';
          const mensagem = err.status === 403 && this.role === 'mentoras'
            ? 'Cadastro de mentora aguardando aprovação da equipe.'
            : err.status === 403
              ? 'Não foi possível entrar com este tipo de conta. Confira a opção Estudante ou Mentora.'
              : err.status === 429
                ? 'Muitas tentativas. Aguarde 15 minutos.'
                : err.status === 0
                  ? 'Não foi possível conectar. Tente novamente.'
                  : 'E-mail, usuário ou senha inválidos';
          this.erro = mensagem;
        }
      });
  }

}
