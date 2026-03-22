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
      return [];
    }

    if (data && data.length > 0) {
      return data.map(mapProduct);
    }
    return [];
  } catch (err) {
    console.error("Unexpected error fetching products:", err);
    return [];
  }
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("Error fetching product:", error);
    return null;
  }

  return mapProduct(data);
};

// Keep the interface but mark the static PRODUCTS as empty or deprecated
export const PRODUCTS: Product[] = []; 
