export interface Product {
  _id?: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  technicalDetails?: {
    material?: string;
    dimensiones?: string;
    peso?: string;
    fabricante?: string;
    [key: string]: string | undefined;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product;
  message?: string;
}

export interface ProductsResponse {
  success: boolean;
  data: Product[];
  total?: number;
  message?: string;
}
