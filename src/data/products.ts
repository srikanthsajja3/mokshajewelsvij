import { supabase } from "../../supabase";

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
  price: number; 
  priceBreakup: PriceBreakup;
  rating: number;
  popularity: number;
  createdAt: string;
  // Metadata
  type?: string;
  collection?: string;
  gender?: string;
  occasion?: string;
  designTheme?: string;
  gemstoneType?: string;
  gemstoneWeight?: number;
}

/**
 * Maps Supabase database row to the frontend Product interface.
 */
const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  category: row.category_name || "Uncategorized",
  image: row.image_url,
  productCode: row.product_code,
  grossWeight: parseFloat(row.gross_weight || 0),
  goldWeight: parseFloat(row.gold_weight || 0),
  purity: row.purity,
  metalColor: row.metal_color,
  price: parseFloat(row.base_price_usd || 0),
  priceBreakup: {
    metal: parseFloat(row.metal_price_usd || 0),
    vaMaking: parseFloat(row.va_making_usd || 0),
    stoneBeads: parseFloat(row.stone_beads_usd || 0),
    tax: parseFloat(row.tax_usd || 0),
  },
  rating: parseFloat(row.rating || 0),
  popularity: parseInt(row.popularity || 0),
  createdAt: row.created_at,
  type: row.type,
  collection: row.collection,
  gender: row.gender,
  occasion: row.occasion,
  designTheme: row.design_theme,
  gemstoneType: row.gemstone_type,
  gemstoneWeight: parseFloat(row.gemstone_weight || 0),
});


export const fetchProductsFromSupabase = async (category: string = "All"): Promise<Product[]> => {
  try {
    let query = supabase.from("products").select("*");
    
    // If category is not "All", filter by category_name
    if (category && category !== "All") {
      query = query.eq("category_name", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase fetch error:", error.message);
      // Fallback to static PRODUCTS if Supabase fails
      return category === "All" 
        ? PRODUCTS 
        : PRODUCTS.filter(p => p.category === category);
    }

    if (data && data.length > 0) {
      return data.map(mapProduct);
    }
    
    // Fallback if no data
    return category === "All" 
        ? PRODUCTS 
        : PRODUCTS.filter(p => p.category === category);
  } catch (err) {
    console.error("Unexpected error fetching products:", err);
    return PRODUCTS;
  }
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      // Fallback to static PRODUCTS
      return PRODUCTS.find(p => p.id === id) || null;
    }

    return mapProduct(data);
  } catch (err) {
    return PRODUCTS.find(p => p.id === id) || null;
  }
};

// Static fallback products
export const PRODUCTS: Product[] = [
  {
    id: 'mj-rg-001',
    name: 'Eternal Radiance Ring',
    category: 'Gold',
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=800',
    productCode: 'MJ-RG-001',
    grossWeight: 4.5,
    goldWeight: 4.2,
    purity: '22 KT',
    metalColor: 'Yellow Gold',
    price: 550,
    priceBreakup: { metal: 400, vaMaking: 80, stoneBeads: 20, tax: 50 },
    rating: 4.8,
    popularity: 120,
    createdAt: new Date().toISOString()
  },
  {
    id: 'mj-nk-002',
    name: 'Royal Heritage Necklace',
    category: 'Gold',
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800',
    productCode: 'MJ-NK-002',
    grossWeight: 25.5,
    goldWeight: 22.8,
    purity: '22 KT',
    metalColor: 'Yellow Gold',
    price: 2800,
    priceBreakup: { metal: 2100, vaMaking: 450, stoneBeads: 0, tax: 250 },
    rating: 4.9,
    popularity: 350,
    createdAt: new Date().toISOString()
  }
]; 
