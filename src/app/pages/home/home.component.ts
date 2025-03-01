import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { CurrencyPipe, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { PdfService } from '../../services/pdf.service';

@Component({
  selector: 'app-home',
  imports: [TitleCasePipe, KeyValuePipe, CurrencyPipe, FormsModule],
  templateUrl: './home.component.html'
})
export default class HomeComponent implements OnInit {
  authService = inject(AuthService);
  productService = inject(ProductService);
  toastr = inject(ToastrService);
  pdfService = inject(PdfService);

  productId = '';
  email = '';

  ngOnInit() {
    this.productService.getProducts().subscribe();
  }

  donwnloadProductPDF(id: string): void {
    this.pdfService.downloadProductPdf(id).subscribe();
  }

  setProductId(id: string) {
    this.productId = id;
  }

  storeMailClient(): void {
    this.pdfService.storeMailClient(this.productId, this.email).subscribe({
      next: (res) => {
        this.donwnloadProductPDF(this.productId);
      },
      error: (err) => {
        this.toastr.error('No se pudo descargar el pdf', 'Error!');
      }
    });
  }

}
