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
  imports: [IonLabel, IonSegment, IonSegmentButton, CommonModule, FormsModule, RouterLink] // adicionei o RouterLink aqui
})
export class LoginPage {

  role: 'estudantes' | 'mentoras' = 'estudantes';
  email = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) { } // isso aqui precisa estar em todas? acredito que sim


  switchRole(ev: any) {
    this.role = ev.detail?.value || 'estudantes';
    this.email = '';
    this.password = '';
  }

  login() {
    if (!this.email || !this.password) {
      alert('Informe seu e-mail ou usuário e a senha para continuar.');
      return;
    }

    this.auth.login(this.role, this.email, this.password)
      .subscribe({
        next: () => {
          this.password = '';
          window.location.assign('/home');
        },
        error: (err) => {
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
          alert(mensagem);
        }
      });
  }

}
