import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { CurrencyPipe, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-products',
  imports: [TitleCasePipe, KeyValuePipe, CurrencyPipe, ReactiveFormsModule],
  templateUrl: './products.component.html',
})
export default class ProductsComponent implements OnInit {
  authService = inject(AuthService);
  toastr = inject(ToastrService);
  productService = inject(ProductService);
  private fb = inject(FormBuilder);

  registerForm!: FormGroup;
  isEditing: boolean = false;
  editingProductId: string | null = null;

  ngOnInit() {
    this.productService.getProductsUser().subscribe();

    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      imageUrl: ['', [Validators.required]],
      price: ['', [Validators.required]],
      technicalDetails: this.fb.array([this.createTechnicalDetail()])
    });
  }

  get technicalDetailsArray() {
    return this.registerForm.get('technicalDetails') as FormArray;
  }

  createTechnicalDetail() {
    return this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    });
  }

  addTechnicalDetail() {
    this.technicalDetailsArray.push(this.createTechnicalDetail());
  }

  removeTechnicalDetail(index: number) {
    this.technicalDetailsArray.removeAt(index);
  }

  onSubmitRegister(): void {
    if (this.registerForm.invalid) {
      return;
    }

    // Convertir el FormArray de detalles técnicos a un objeto
    const formValue = { ...this.registerForm.value };
    const technicalDetails: Record<string, string> = {};

    formValue.technicalDetails.forEach((detail: { key: string, value: string }) => {
      technicalDetails[detail.key] = detail.value;
    });

    // Reemplazar el array con el objeto
    formValue.technicalDetails = technicalDetails;

    if (this.isEditing && this.editingProductId) {
      // Si estamos editando, llamar a updateProduct
      this.productService.updateProduct(this.editingProductId, formValue).subscribe({
        next: () => {
          this.toastr.success('Producto actualizado con éxito', 'Éxito!');
          this.productService.getProductsUser().subscribe();
          this.resetForm();
        },
        error: (error) => {
          this.toastr.error(error.message, 'Error al actualizar!');
        }
      });
    } else {
      // Si no estamos editando, llamar a createProduct
      this.productService.createProduct(formValue).subscribe({
        next: () => {
          this.toastr.success('Registro exitoso', 'Éxito!');
          this.productService.getProductsUser().subscribe();
          this.resetForm();
        },
        error: (error) => {
          this.toastr.error(error.message, 'Error!');
        }
      });
    }
  }

  resetForm(): void {
    this.registerForm.reset();
    // Reiniciar los detalles técnicos
    while (this.technicalDetailsArray.length !== 0) {
      this.technicalDetailsArray.removeAt(0);
    }
    this.technicalDetailsArray.push(this.createTechnicalDetail());
    // Resetear estado de edición
    this.isEditing = false;
    this.editingProductId = null;
  }

  getProductUser(id: string): void {
    this.productService.getProductById(id).subscribe({
      next: (product) => {
        if (product) {
          // Establecer el estado de edición
          this.isEditing = true;
          this.editingProductId = id;

          // Resetear el formulario antes de cargar nuevos valores
          while (this.technicalDetailsArray.length !== 0) {
            this.technicalDetailsArray.removeAt(0);
          }

          // Llenar el formulario con los datos del producto
          this.registerForm.patchValue({
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            price: product.price
          });

          // Cargar detalles técnicos
          if (product.technicalDetails && typeof product.technicalDetails === 'object') {
            Object.entries(product.technicalDetails).forEach(([key, value]) => {
              this.technicalDetailsArray.push(
                this.fb.group({
                  key: [key, Validators.required],
                  value: [value, Validators.required]
                })
              );
            });
          } else {
            // Si no hay detalles técnicos, agregar un campo vacío
            this.technicalDetailsArray.push(this.createTechnicalDetail());
          }
        }
      },
      error: (error) => {
        this.toastr.error('Error al obtener el producto', 'Error!');
      }
    });
  }

  updateProduct(id: string): void {
    this.getProductUser(id);
  }

  cancelEdit(): void {
    this.resetForm();
    this.toastr.info('Edición cancelada');
  }

  deleteProduct(id: string): void {
    this.productService.deleteProduct(id).subscribe({
      next: (success) => {
        this.toastr.success('Eliminado correctamente', 'Éxito!');
        this.productService.getProductsUser().subscribe();
      },
      error: (err) => {
        this.toastr.error('Error al eliminar producto', 'Error!');
        this.productService.getProductsUser().subscribe();
      }
    })
  }
}
