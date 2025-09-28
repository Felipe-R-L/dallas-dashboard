import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputComponent } from '../../app/components/input/input';
import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, InputComponent],
  templateUrl: './login.html',
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;
  isLoading = false;

  private authService = inject(AuthService);
  private router = inject(Router);

  async handleLogin(): Promise<void> {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    try {
      await this.authService.login(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = 'E-mail ou senha inválidos. Tente novamente.';
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}
