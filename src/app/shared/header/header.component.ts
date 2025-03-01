import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../interfaces';


@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  public authService = inject(AuthService);

  loginForm!: FormGroup;
  errorMessage: string = '';

  ngOnInit(): void {
    // Redirigir si ya está autenticado

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {

      },
      error: (error) => {
        this.errorMessage = error.message || 'Error al iniciar sesión';
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }

}
