import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  Alert,
  TextInput,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCountry } from '../contexts/CountryContext';
import { formatPrice } from '../utils/currency';
import { Product } from '../data/products';

const VendorDashboardScreen: React.FC<any> = (props) => {
  const { isVendor, user } = useAuth();
  const { countryCode } = useCountry();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'm2m'>('products');
  
  const [vendorSettings, setVendorSettings] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [mySales, setMySales] = useState<any[]>([]);

  useEffect(() => {
    if (isVendor) {
      fetchVendorData();
    }
  }, [isVendor]);

  const fetchVendorData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Vendor Settings
      const { data: settings, error: sError } = await supabase
        .from('vendor_settings')
        .select('*, vendors(*)')
        .eq('user_id', user?.id)
        .single();
      
      if (sError) throw sError;
      setVendorSettings(settings);

      if (settings.vendor_id) {
        // 2. Fetch Vendor's Products
        const { data: products } = await supabase
          .from('products')
          .select('*')
          .eq('vendor_id', settings.vendor_id);
        
        setMyProducts(products?.map(p => ({
          ...p,
          image: p.image_url,
          price: p.base_price_usd
        })) || []);

        // 3. Fetch Sales (Simplified for now)
        const { data: sales } = await supabase
          .from('order_items')
          .select('*, orders(*)')
          .eq('product_id', products?.[0]?.id); // This needs a proper join in real usage
        
        setMySales(sales || []);
      }

    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    // In a real app, this would call an Edge Function to generate and hash a key
    const newKey = 'mk_' + Math.random().toString(36).substring(2, 15);
    Alert.alert("API Key Generated", `Save this key safely. It will not be shown again:\n\n${newKey}`);
    
    await supabase
      .from('vendor_settings')
      .update({ api_key_hash: 'simulated_hash' })
      .eq('user_id', user?.id);
  };

  if (!isVendor) {
    return (
      <View style={styles.container}>
        <Header {...props} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Partner Access Required</Text>
          <Text style={styles.infoText}>This portal is reserved for registered Moksha Jewels partners. If you are a vendor, please contact us to activate your portal.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={props.onGoHome}>
            <Text style={styles.backBtnText}>Return to Gallery</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header {...props} />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.vendorHeader}>
            <Text style={styles.vendorTitle}>Partner Portal</Text>
            <Text style={styles.vendorSubtitle}>{vendorSettings?.business_name || 'Artisan Partner'} | {vendorSettings?.vendors?.name || 'Pending Link'}</Text>
          </View>

          <View style={styles.tabBarContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBar}
            >
              <TouchableOpacity style={[styles.tab, activeTab === 'products' && styles.activeTab]} onPress={() => setActiveTab('products')}>
                <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>My Masterpieces</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'orders' && styles.activeTab]} onPress={() => setActiveTab('orders')}>
                <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Sales & Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.tab, activeTab === 'm2m' && styles.activeTab]} onPress={() => setActiveTab('m2m')}>
                <Text style={[styles.tabText, activeTab === 'm2m' && styles.activeTabText]}>M2M Integration</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

        {loading ? (
          <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.content}>
            {activeTab === 'products' && (
              <View style={styles.section}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Current Inventory</Text>
                  <TouchableOpacity style={styles.addBtn}>
                    <Text style={styles.addBtnText}>+ LIST NEW ITEM</Text>
                  </TouchableOpacity>
                </View>
                {myProducts.length === 0 ? (
                  <Text style={styles.emptyText}>You haven't listed any products yet.</Text>
                ) : (
                  <View style={styles.grid}>
                    {myProducts.map(item => (
                      <View key={item.id} style={styles.productCard}>
                        <Image source={{ uri: item.image }} style={styles.productImage} />
                        <View style={styles.productInfo}>
                          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                          <Text style={styles.productStock}>Stock: {(item as any).stock_quantity}</Text>
                          <Text style={styles.productPrice}>{formatPrice(item.price, countryCode)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {activeTab === 'orders' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Sales</Text>
                {mySales.length === 0 ? (
                  <Text style={styles.emptyText}>No sales recorded for your items yet.</Text>
                ) : (
                  <View style={styles.orderList}>
                    {/* Simplified order display */}
                    <Text style={styles.infoText}>Detailed order tracking coming soon.</Text>
                  </View>
                )}
              </View>
            )}

            {activeTab === 'm2m' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Machine-to-Machine Integration</Text>
                <Text style={styles.infoText}>Connect your internal inventory system directly to Moksha Jewels using our Real-time Edge Functions.</Text>
                
                <View style={styles.m2mCard}>
                  <Text style={styles.m2mLabel}>API Endpoint</Text>
                  <View style={styles.codeBlock}>
                    <Text style={styles.codeText}>https://your-project.supabase.co/functions/v1/vendor-sync</Text>
                  </View>

                  <Text style={styles.m2mLabel}>Webhook URL (for sales notifications)</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="https://your-api.com/webhooks"
                    placeholderTextColor="#666"
                    value={vendorSettings?.webhook_url}
                  />

                  <TouchableOpacity style={styles.apiKeyBtn} onPress={generateApiKey}>
                    <Text style={styles.apiKeyBtnText}>Generate New M2M API Key</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.warningNote}>⚠️ Never share your M2M API key. It allows direct control over your listings.</Text>
                </View>
              </View>
            )}
          </View>
        )}
        <Footer />
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#291c0e',
  },
  scrollContent: {
    flexGrow: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  vendorHeader: {
    padding: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
  },
  vendorTitle: {
    fontFamily: 'TrajanPro',
    fontSize: 28,
    color: '#D4AF37',
    letterSpacing: 2,
    marginBottom: 5,
  },
  vendorSubtitle: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  tabBarContainer: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  tabBar: {
    flexDirection: 'row',
  },
  tab: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 120,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#D4AF37',
  },
  tabText: {
    color: '#888',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#D4AF37',
  },
  content: {
    padding: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'TrajanPro',
    fontSize: 20,
    color: '#D4AF37',
    marginBottom: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  productCard: {
    width: Platform.OS === 'web' ? '23%' : '47%',
    backgroundColor: '#3d2b1a',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#4a3520',
  },
  productImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productStock: {
    color: '#aaa',
    fontSize: 10,
    marginBottom: 4,
  },
  productPrice: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addBtnText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
  },
  m2mCard: {
    backgroundColor: '#3d2b1a',
    padding: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a3520',
  },
  m2mLabel: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  codeBlock: {
    backgroundColor: '#1a1108',
    padding: 15,
    borderRadius: 6,
    marginBottom: 25,
  },
  codeText: {
    color: '#00ff00',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#1a1108',
    color: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 25,
    fontSize: 14,
  },
  apiKeyBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: 'center',
  },
  apiKeyBtnText: {
    color: '#000',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  warningNote: {
    color: '#ff4444',
    fontSize: 11,
    marginTop: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 40,
  },
  errorText: {
    fontFamily: 'TrajanPro',
    color: '#ff4444',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 30,
    maxWidth: 500,
  },
  backBtn: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 4,
  },
  backBtnText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  }
});

export default VendorDashboardScreen;
