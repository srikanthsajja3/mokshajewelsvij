import { Product } from '../data/products';

export type RootStackParamList = {
  Home: undefined;
  Category: { category: string; subCategory?: string; minPrice?: number; maxPrice?: number };
  ProductDetails: { product?: Product; id?: string };
  Cart: undefined;
  Checkout: undefined;
  Orders: undefined;
  Wishlist: undefined;
  Profile: undefined;
  AdminDashboard: undefined;
  VendorDashboard: undefined;
  AddProduct: { vendorId: string; product?: Product | null };
  Login: undefined;
};
