import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  FlatList,
  Platform,
  Image
} from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCountry } from '../contexts/CountryContext';
import { formatPrice } from '../utils/currency';
import { Product, fetchProductsFromSupabase } from '../data/products';

interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  rating: number;
}

interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  lowStockItems: number;
}

const AdminDashboardScreen: React.FC<any> = (props) => {
  const { isAdmin, user } = useAuth();
  const { countryCode } = useCountry();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'vendors'>('overview');
  
  const [stats, setStats] = useState<AdminStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);

  useEffect(() => {
    console.log("AdminDashboard: isAdmin check:", isAdmin, "User:", user?.email);
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Stats & Orders
      const { data: orders, error: ordersError } = await supabase.from('orders').select('total_amount, status');
      if (ordersError) console.error("Admin: Error fetching orders:", ordersError);

      const allProducts = await fetchProductsFromSupabase("All");
      setInventory(allProducts);

      const lowStockCount = allProducts.filter(p => (p as any).stock_quantity < 5).length;
      const totalSales = orders?.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0) || 0;

      setStats({
        totalSales,
        totalOrders: orders?.length || 0,
        totalProducts: allProducts.length,
        lowStockItems: lowStockCount
      });

      // 2. Fetch Vendors
      const { data: vendorData, error: vError } = await supabase.from('vendors').select('*');
      if (vError) console.error("Admin: Error fetching vendors:", vError);
      setVendors(vendorData || []);

      // 3. Fetch Recent Orders
      const { data: recent, error: rError } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (rError) console.error("Admin: Error fetching recent orders:", rError);
      setRecentOrders(recent || []);

    } catch (error) {
      console.error('Unexpected error in Admin fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <Header {...props} />
        <View style={styles.center}>
          <Text style={styles.errorText}>Access Denied</Text>
          <Text style={styles.infoText}>You are logged in as {user?.email}, but you do not have administrative privileges. Please contact the system owner to elevate your role.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={props.onGoHome}>
            <Text style={styles.backBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header {...props} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.adminHeader}>
          <Text style={styles.adminTitle}>Admin Oversight</Text>
          <Text style={styles.adminSubtitle}>Analytical insights and logistical control for Moksha Jewels.</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'overview' && styles.activeTab]} 
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'inventory' && styles.activeTab]} 
            onPress={() => setActiveTab('inventory')}
          >
            <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>Inventory</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'vendors' && styles.activeTab]} 
            onPress={() => setActiveTab('vendors')}
          >
            <Text style={[styles.tabText, activeTab === 'vendors' && styles.activeTabText]}>Vendors</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.dashboard}>
            
            {activeTab === 'overview' && (
              <>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total Revenue</Text>
                    <Text style={styles.statValue}>{formatPrice(stats.totalSales, countryCode)}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Active Orders</Text>
                    <Text style={styles.statValue}>{stats.totalOrders}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Inventory Size</Text>
                    <Text style={styles.statValue}>{stats.totalProducts}</Text>
                  </View>
                  <View style={[styles.statCard, stats.lowStockItems > 0 && styles.warningCard]}>
                    <Text style={styles.statLabel}>Low Stock Alert</Text>
                    <Text style={[styles.statValue, stats.lowStockItems > 0 && styles.warningText]}>
                      {stats.lowStockItems} Items
                    </Text>
                  </View>
                </View>

                {/* Recent Orders */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Transactions</Text>
                  {recentOrders.length === 0 ? (
                    <Text style={styles.emptyText}>No transactions recorded yet.</Text>
                  ) : (
                    <View style={styles.orderList}>
                      {recentOrders.map(order => (
                        <View key={order.id} style={styles.orderRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.orderId}>ORDER ID: {order.id.slice(0, 8).toUpperCase()}</Text>
                            <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.orderAmount}>{formatPrice(order.total_amount, countryCode)}</Text>
                            <Text style={styles.orderStatus}>{order.status.toUpperCase()}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            {activeTab === 'inventory' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Product Inventory</Text>
                <View style={styles.inventoryList}>
                  {inventory.map(item => (
                    <View key={item.id} style={styles.inventoryCard}>
                      <Image source={{ uri: item.image }} style={styles.invThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.invName}>{item.name}</Text>
                        <Text style={styles.invCode}>{item.productCode}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.invStock}>Stock: {(item as any).stock_quantity || 0}</Text>
                        <Text style={styles.invCost}>Cost: {formatPrice((item as any).sourcing_cost || 0, countryCode)}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeTab === 'vendors' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Global Vendors</Text>
                <View style={styles.vendorList}>
                  {vendors.length === 0 ? (
                    <Text style={styles.emptyText}>No vendors linked to the system.</Text>
                  ) : (
                    vendors.map(vendor => (
                      <View key={vendor.id} style={styles.vendorCard}>
                        <View>
                          <Text style={styles.vendorName}>{vendor.name}</Text>
                          <Text style={styles.vendorMeta}>Contact: {vendor.contact_person}</Text>
                        </View>
                        <View style={styles.ratingBadge}>
                          <Text style={styles.ratingText}>★ {vendor.rating}</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </View>
        )}
        <Footer />
      </ScrollView>
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
  adminHeader: {
    padding: 40,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.15)',
  },
  adminTitle: {
    fontFamily: 'TrajanPro',
    fontSize: 32,
    color: '#D4AF37',
    letterSpacing: 3,
    marginBottom: 10,
  },
  adminSubtitle: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#D4AF37',
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#D4AF37',
  },
  dashboard: {
    padding: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 40,
  },
  statCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#3d2b1a',
    padding: 25,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a3520',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'TrajanPro',
  },
  warningCard: {
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255, 68, 68, 0.05)',
  },
  warningText: {
    color: '#ff4444',
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontFamily: 'TrajanPro',
    fontSize: 20,
    color: '#D4AF37',
    marginBottom: 20,
    letterSpacing: 1,
  },
  orderList: {
    backgroundColor: '#3d2b1a',
    borderRadius: 8,
    overflow: 'hidden',
  },
  orderRow: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3520',
    alignItems: 'center',
  },
  orderId: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDate: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  orderAmount: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderStatus: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  inventoryList: {
    gap: 10,
  },
  inventoryCard: {
    flexDirection: 'row',
    backgroundColor: '#3d2b1a',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    gap: 15,
  },
  invThumb: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  invName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  invCode: {
    color: '#666',
    fontSize: 11,
  },
  invStock: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  invCost: {
    color: '#888',
    fontSize: 11,
  },
  vendorList: {
    gap: 15,
  },
  vendorCard: {
    backgroundColor: '#3d2b1a',
    padding: 20,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#D4AF37',
  },
  vendorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  vendorMeta: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  ratingBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  ratingText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
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
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
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

export default AdminDashboardScreen;
