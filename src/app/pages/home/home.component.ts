import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';
import { CurrencyPipe, KeyValuePipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [TitleCasePipe, KeyValuePipe, CurrencyPipe],
  templateUrl: './home.component.html'
})
export default class HomeComponent implements OnInit {
  authService = inject(AuthService);
  productService = inject(ProductService);

  ngOnInit() {
    this.productService.getProducts().subscribe();
  }

}
