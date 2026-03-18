export interface PriceBreakup {
  metal: number;
  vaMaking: number;
  stoneBeads: number;
  tax: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image: string;
  productCode: string;
  grossWeight: number;
  goldWeight: number;
  purity: string;
  metalColor: string;
  price: number; // Total price in USD (Base)
  priceBreakup: PriceBreakup; // Breakup in USD
  rating: number;
  popularity: number;
  createdAt: string; // ISO date for "latest" sorting
}

// Helper to create price breakup based on total (proportional for demo)
const createBreakup = (total: number): PriceBreakup => ({
  metal: total * 0.77,
  vaMaking: total * 0.16,
  stoneBeads: total * 0.04,
  tax: total * 0.03
});

export const PRODUCTS: Product[] = [
  { 
    id: "r1", 
    name: "Classic Gold Band", 
    category: "Rings", 
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&q=80",
    productCode: "RG/1024",
    grossWeight: 8.50,
    goldWeight: 8.20,
    purity: "22 KT",
    metalColor: "Yellow",
    price: 499,
    priceBreakup: createBreakup(499),
    rating: 4.5,
    popularity: 85,
    createdAt: "2024-01-15T10:00:00Z"
  },
  { 
    id: "r2", 
    name: "Diamond Solitaire", 
    category: "Rings", 
    image: "https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=500&q=80",
    productCode: "RG/8821",
    grossWeight: 4.20,
    goldWeight: 3.80,
    purity: "18 KT",
    metalColor: "White",
    price: 1299,
    priceBreakup: createBreakup(1299),
    rating: 4.9,
    popularity: 98,
    createdAt: "2024-02-20T10:00:00Z"
  },
  { 
    id: "n1", 
    name: "Gold Heritage Necklace", 
    category: "Necklaces", 
    image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=500&q=80",
    productCode: "NL/3572",
    grossWeight: 24.330,
    goldWeight: 23.032,
    purity: "22 KT",
    metalColor: "Yellow",
    price: 5400, // Roughly 4.3L INR at 80 rate
    priceBreakup: {
      metal: 4183,
      vaMaking: 878,
      stoneBeads: 179,
      tax: 160
    },
    rating: 4.8,
    popularity: 92,
    createdAt: "2024-03-01T10:00:00Z"
  },
  { 
    id: "n2", 
    name: "Emerald Pendant", 
    category: "Necklaces", 
    image: "https://images.unsplash.com/photo-1515562141207-7a18b5ce3377?w=500&q=80",
    productCode: "NL/5510",
    grossWeight: 12.40,
    goldWeight: 10.10,
    purity: "18 KT",
    metalColor: "Yellow",
    price: 1500,
    priceBreakup: createBreakup(1500),
    rating: 4.7,
    popularity: 78,
    createdAt: "2024-01-10T10:00:00Z"
  },
  { 
    id: "e1", 
    name: "Diamond Studs", 
    category: "Earrings", 
    image: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?w=500&q=80",
    productCode: "ER/9920",
    grossWeight: 3.10,
    goldWeight: 2.90,
    purity: "18 KT",
    metalColor: "Rose",
    price: 599,
    priceBreakup: createBreakup(599),
    rating: 4.6,
    popularity: 88,
    createdAt: "2023-12-05T10:00:00Z"
  },
  { 
    id: "b1", 
    name: "Tennis Bracelet", 
    category: "Bracelets", 
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&q=80",
    productCode: "BR/4412",
    grossWeight: 15.60,
    goldWeight: 14.20,
    purity: "18 KT",
    metalColor: "White",
    price: 1100,
    priceBreakup: createBreakup(1100),
    rating: 4.4,
    popularity: 72,
    createdAt: "2024-02-15T10:00:00Z"
  },
];
