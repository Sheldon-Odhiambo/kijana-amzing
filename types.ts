
export type ViewId = 'home' | 'shop' | 'lookbook' | 'custom' | 'about' | 'collective' | 'product' | 'checkout';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  color: string;
  description?: string;
  features?: string[];
}

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type Category = 'All' | 'Gym' | 'Retro' | 'Street' | 'Official' | 'Accessories';
