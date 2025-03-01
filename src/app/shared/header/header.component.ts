import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { User } from '../../interfaces';
import { ToastrService } from 'ngx-toastr';


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
  public toastr = inject(ToastrService);

  loginForm!: FormGroup;
  registerForm!: FormGroup;
  option: string = 'login';
  errorMessage: string = '';

  ngOnInit(): void {
    // Redirigir si ya está autenticado

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  get fr() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.toastr.success('Inicio de sesión exitoso', 'Éxito!');
      },
      error: (error) => {
        this.toastr.error(error.message, 'Error!');
        this.errorMessage = error.message || 'Error al iniciar sesión';
      }
    });
  }

  onSubmitRegister(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const { username, email, password } = this.registerForm.value;

    this.authService.register(username, email, password).subscribe({
      next: () => {
        this.toastr.success('Regsitro exitoso', 'Éxito!');
      },
      error: (error) => {
        this.toastr.error(error.message, 'Error!');
        this.errorMessage = error.message || 'Error al registrar';
      }
    });
  }

  changeOption(option: string): void {
    this.option = option;
  }

  logout(): void {
    this.authService.logout();
  }

}
