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
  Image,
  Alert,
  TextInput,
  Animated
} from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ConfirmationModal from '../components/ConfirmationModal';
import OptimizedImage from '../components/OptimizedImage';
import { supabase } from '../../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCountry } from '../contexts/CountryContext';
import { formatPrice } from '../utils/currency';
import { Product, fetchProductsFromSupabase } from '../data/products';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { useUI } from '../contexts/UIContext';
import * as ImagePicker from 'expo-image-picker';

interface Vendor {
  id: string;
  name: string;
  contact_person: string;
  email?: string;
  phone?: string;
  address?: string;
  rating: number;
}

interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  lowStockItems: number;
}

interface AdminDashboardScreenProps {
  scrollY?: Animated.Value;
}

const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ scrollY }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { setLoginVisible } = useUI();
  const { isAdmin, user } = useAuth();
  const { countryCode } = useCountry();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'inventory' | 'vendors' | 'orders' | 'banners'>('overview');
  
  const [stats, setStats] = useState<AdminStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStockItems: 0
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<Product[]>([]);

  // Modal States
  const [deleteProductModal, setDeleteProductModal] = useState(false);
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);
  const [deleteVendorModal, setDeleteVendorModal] = useState(false);
  const [vendorIdToDelete, setVendorIdToDelete] = useState<string | null>(null);
  
  // Vendor Form States
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorEmail, setVendorContactEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');

  // Banner Form States
  const [banners, setBanners] = useState<any[]>([]);
  const [bannerModalVisible, setBannerModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any | null>(null);
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerAltText, setBannerAltText] = useState('');
  const [bannerDisplayOrder, setBannerDisplayOrder] = useState('0');
  const [deleteBannerModal, setDeleteBannerModal] = useState(false);
  const [bannerIdToDelete, setBannerIdToDelete] = useState<string | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  useEffect(() => {
    console.log("AdminDashboard: isAdmin check:", isAdmin, "User:", user?.email);
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Orders (Try join first, fallback to simple if join fails)
      let orders: any[] = [];
      try {
        const { data, error: ordersError } = await supabase
          .from('orders')
          .select('*, profiles(full_name)')
          .order('created_at', { ascending: false });
        
        if (ordersError) {
          console.warn("Admin: Join with profiles failed, falling back to simple fetch:", ordersError.message);
          const { data: simpleOrders, error: fallbackError } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (fallbackError) throw fallbackError;
          orders = simpleOrders || [];
        } else {
          orders = data || [];
        }
      } catch (err) {
        console.error("Critical error fetching orders:", err);
      }

      const allProducts = await fetchProductsFromSupabase("All");
      setInventory(allProducts);

      const lowStockCount = allProducts.filter(p => ((p as any).stock_quantity || 0) < 5).length;
      const totalSales = orders?.reduce((acc, curr) => acc + (parseFloat(curr.total_amount) || 0), 0) || 0;

      setStats({
        totalSales,
        totalOrders: orders?.length || 0,
        totalProducts: allProducts.length,
        lowStockItems: lowStockCount
      });

      // 2. Fetch Vendors
      try {
        const { data: vendorData, error: vError } = await supabase.from('vendors').select('*');
        if (vError) throw vError;
        setVendors(vendorData || []);
      } catch (err) {
        console.error("Admin: Error fetching vendors:", err);
      }

      // Fetch Homepage Banners
      try {
        const { data: bannerData, error: bError } = await supabase
          .from('homepage_banners')
          .select('*')
          .order('display_order', { ascending: true });
        if (bError) throw bError;
        setBanners(bannerData || []);
      } catch (err) {
        console.error("Admin: Error fetching banners:", err);
      }

      // 3. Store orders for the Orders tab
      setRecentOrders(orders || []);

    } catch (error) {
      console.error('Unexpected error in Admin fetch:', error);
    } finally {
      setLoading(false);
    }
  };

  const openVendorModal = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorName(vendor.name);
      setVendorContact(vendor.contact_person);
      setVendorContactEmail(vendor.email || '');
      setVendorPhone(vendor.phone || '');
      setVendorAddress(vendor.address || '');
    } else {
      setEditingVendor(null);
      setVendorName('');
      setVendorContact('');
      setVendorContactEmail('');
      setVendorPhone('');
      setVendorAddress('');
    }
    setVendorModalVisible(true);
  };

  const handleSaveVendor = async () => {
    if (!vendorName) {
      Alert.alert("Required", "Vendor name is mandatory.");
      return;
    }

    try {
      const vendorData = {
        name: vendorName,
        contact_person: vendorContact,
        email: vendorEmail,
        phone: vendorPhone,
        address: vendorAddress
      };

      if (editingVendor) {
        const { error } = await supabase.from('vendors').update(vendorData).eq('id', editingVendor.id);
        if (error) throw error;
        Alert.alert("Success", "Vendor updated successfully.");
      } else {
        const { error } = await supabase.from('vendors').insert([vendorData]);
        if (error) throw error;
        Alert.alert("Success", "New vendor registered.");
      }
      setVendorModalVisible(false);
      fetchAdminData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save vendor.");
    }
  };

  const openBannerModal = (banner?: any) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerImageUrl(banner.image_url);
      setBannerAltText(banner.alt_text || '');
      setBannerDisplayOrder(String(banner.display_order || 0));
    } else {
      setEditingBanner(null);
      setBannerImageUrl('');
      setBannerAltText('');
      setBannerDisplayOrder('0');
    }
    setBannerModalVisible(true);
  };

  const handlePickBannerImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadBannerImage(result.assets[0].uri);
    }
  };

  const uploadBannerImage = async (uri: string) => {
    setUploadingBanner(true);
    try {
      const fileName = `banners/banner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
      const response = await fetch(uri);
      const body = await response.blob();

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, body, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      setBannerImageUrl(publicUrl);
    } catch (error: any) {
      console.error("Error uploading banner:", error);
      Alert.alert("Upload Failed", error.message || "Failed to upload banner image.");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSaveBanner = async () => {
    if (!bannerImageUrl) {
      Alert.alert("Required", "Image URL is mandatory.");
      return;
    }

    try {
      const bannerData = {
        image_url: bannerImageUrl,
        alt_text: bannerAltText,
        display_order: parseInt(bannerDisplayOrder) || 0
      };

      if (editingBanner) {
        const { error } = await supabase.from('homepage_banners').update(bannerData).eq('id', editingBanner.id);
        if (error) throw error;
        Alert.alert("Success", "Banner updated successfully.");
      } else {
        const { error } = await supabase.from('homepage_banners').insert([bannerData]);
        if (error) throw error;
        Alert.alert("Success", "New banner added.");
      }
      setBannerModalVisible(false);
      fetchAdminData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save banner.");
    }
  };

  const handleDeleteBanner = async () => {
    if (!bannerIdToDelete) return;
    try {
      const { error } = await supabase.from('homepage_banners').delete().eq('id', bannerIdToDelete);
      if (error) throw error;
      Alert.alert("Success", "Banner removed.");
      setDeleteBannerModal(false);
      fetchAdminData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete banner.");
    }
  };

  const handleDeleteProduct = async () => {
    if (!productIdToDelete) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', productIdToDelete);
      if (error) throw error;
      setInventory(prev => prev.filter(p => p.id !== productIdToDelete));
      setDeleteProductModal(false);
      setProductIdToDelete(null);
      Alert.alert("Success", "Product removed from catalog.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete product.");
    }
  };

  const handleDeleteVendor = async () => {
    if (!vendorIdToDelete) return;
    try {
      const { error } = await supabase.from('vendors').delete().eq('id', vendorIdToDelete);
      if (error) throw error;
      setVendors(prev => prev.filter(v => v.id !== vendorIdToDelete));
      setDeleteVendorModal(false);
      setVendorIdToDelete(null);
      Alert.alert("Success", "Vendor removed from system.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to delete vendor.");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      setRecentOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      Alert.alert("Success", `Order status updated to ${newStatus.toUpperCase()}`);
    } catch (err: any) {
      console.error("Error updating order status:", err);
      Alert.alert("Error", err.message || "Failed to update order status.");
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.contentWrapper}>
            <View style={styles.center}>
              <Text style={styles.errorText}>Access Denied</Text>
              <Text style={styles.infoText}>You are logged in as {user?.email}, but you do not have administrative privileges. Please contact the system owner to elevate your role.</Text>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.backBtnText}>Return Home</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Footer />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.contentWrapper}>
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
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'orders' && styles.activeTab]} 
              onPress={() => setActiveTab('orders')}
            >
              <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'banners' && styles.activeTab]} 
              onPress={() => setActiveTab('banners')}
            >
              <Text style={[styles.tabText, activeTab === 'banners' && styles.activeTabText]}>Banners</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#D4AF37" size="large" style={{ marginTop: 50 }} />
          ) : (
            <View style={styles.dashboard}>
              
              {activeTab === 'overview' ? (
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

                  {/* Recent Orders Overview */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    {recentOrders.length === 0 ? (
                      <Text style={styles.emptyText}>No transactions recorded yet.</Text>
                    ) : (
                      <View style={styles.orderList}>
                        {recentOrders.slice(0, 5).map(order => (
                          <View key={order.id} style={styles.orderRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.orderId}>ORDER ID: {order.id.slice(0, 8).toUpperCase()}</Text>
                              <Text style={styles.customerNameSmall}>{order.profiles?.full_name || 'Guest Customer'}</Text>
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
              ) : null}

              {activeTab === 'inventory' ? (
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>Product Inventory</Text>
                    <TouchableOpacity 
                      style={styles.addBtn} 
                      onPress={() => {
                        if (vendors.length > 0) {
                          navigation.navigate('AddProduct', { vendorId: vendors[0].id });
                        } else {
                          Alert.alert("Action Required", "Please create a vendor first.");
                        }
                      }}
                    >
                      <Text style={styles.addBtnText}>+ NEW ITEM</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.inventoryList}>
                    {inventory.map(item => (
                      <View key={item.id} style={styles.inventoryCard}>
                        <OptimizedImage url={item.image} style={styles.invThumb} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.invName}>{item.name}</Text>
                          <Text style={styles.invCode}>{item.productCode}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.invStock}>Stock: {item.stockQuantity || 0}</Text>
                          <Text style={styles.invCost}>Cost: {formatPrice(item.sourcingCost || 0, countryCode)}</Text>
                          <View style={styles.actionRow}>
                             <TouchableOpacity onPress={() => navigation.navigate('AddProduct', { vendorId: (item as any).vendor_id || '', product: item })} style={styles.editAction}>
                                <Text style={styles.editActionText}>EDIT</Text>
                             </TouchableOpacity>
                             <TouchableOpacity 
                                onPress={() => {
                                  setProductIdToDelete(item.id);
                                  setDeleteProductModal(true);
                                }} 
                                style={styles.deleteAction}
                              >
                                <Text style={styles.deleteActionText}>DELETE</Text>
                             </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {activeTab === 'vendors' ? (
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>Global Vendors</Text>
                    <TouchableOpacity 
                      style={styles.addBtn} 
                      onPress={() => openVendorModal()}
                    >
                      <Text style={styles.addBtnText}>+ NEW VENDOR</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.vendorList}>
                    {vendors.length === 0 ? (
                      <Text style={styles.emptyText}>No vendors linked to the system.</Text>
                    ) : (
                      vendors.map(vendor => (
                        <View key={vendor.id} style={styles.vendorCard}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vendorName}>{vendor.name}</Text>
                            <Text style={styles.vendorMeta}>Contact: {vendor.contact_person}</Text>
                          </View>
                          <View style={styles.vendorActions}>
                            <TouchableOpacity 
                              style={styles.vendorActionBtn} 
                              onPress={() => navigation.navigate('AddProduct', { vendorId: vendor.id })}
                            >
                              <Text style={styles.vendorActionText}>ADD PRODUCT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={styles.vendorActionBtn} 
                              onPress={() => openVendorModal(vendor)}
                            >
                              <Text style={styles.vendorActionText}>EDIT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.vendorActionBtn, { borderColor: '#ff4444' }]} 
                              onPress={() => {
                                setVendorIdToDelete(vendor.id);
                                setDeleteVendorModal(true);
                              }}
                            >
                              <Text style={[styles.vendorActionText, { color: '#ff4444' }]}>DELETE</Text>
                            </TouchableOpacity>
                            <View style={styles.ratingBadge}>
                              <Text style={styles.ratingText}>★ {vendor.rating}</Text>
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ) : null}

              {activeTab === 'orders' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>All Customer Orders</Text>
                  {recentOrders.length === 0 ? (
                    <Text style={styles.emptyText}>No orders recorded yet.</Text>
                  ) : (
                    <View style={styles.orderList}>
                      {recentOrders.map(order => (
                        <View key={order.id} style={styles.orderCardFull}>
                          <View style={styles.orderHeader}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.orderId}>ID: {order.id.slice(0, 8).toUpperCase()}</Text>
                              <Text style={styles.customerName}>{order.profiles?.full_name || 'Guest Customer'}</Text>
                              <Text style={styles.orderDate}>{new Date(order.created_at).toLocaleString()}</Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.orderTotal}>{formatPrice(order.total_amount, countryCode)}</Text>
                              <View style={[styles.statusBadge, { marginTop: 5 }]}>
                                <Text style={styles.statusText}>{order.status.toUpperCase()}</Text>
                              </View>
                            </View>
                          </View>
                          <View style={styles.orderControls}>
                            <Text style={styles.controlLabel}>UPDATE STATUS:</Text>
                            <View style={styles.controlButtons}>
                              {['processing', 'shipped', 'delivered'].map(s => (
                                <TouchableOpacity 
                                  key={s} 
                                  style={[styles.statusBtn, order.status === s && styles.statusBtnActive]}
                                  onPress={() => updateOrderStatus(order.id, s)}
                                >
                                  <Text style={[styles.statusBtnText, order.status === s && styles.statusBtnTextActive]}>
                                    {s.toUpperCase()}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ) : null}

              {activeTab === 'banners' ? (
                <View style={styles.section}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.sectionTitle}>Homepage Banners</Text>
                    <TouchableOpacity 
                      style={styles.addBtn} 
                      onPress={() => openBannerModal()}
                    >
                      <Text style={styles.addBtnText}>+ ADD BANNER</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.vendorList}>
                    {banners.length === 0 ? (
                      <Text style={styles.emptyText}>No banners configured. Add a new banner image URL.</Text>
                    ) : (
                      banners.map(banner => (
                        <View key={banner.id} style={styles.vendorCard}>
                          <Image 
                            source={{ uri: banner.image_url }} 
                            style={{ width: 80, height: 50, borderRadius: 4, marginRight: 15 }} 
                            resizeMode="cover"
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.vendorName} numberOfLines={1}>{banner.alt_text || 'Untitled Banner'}</Text>
                            <Text style={styles.vendorMeta}>Order: {banner.display_order}</Text>
                          </View>
                          <View style={styles.vendorActions}>
                            <TouchableOpacity 
                              style={styles.vendorActionBtn} 
                              onPress={() => openBannerModal(banner)}
                            >
                              <Text style={styles.vendorActionText}>EDIT</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.vendorActionBtn, { borderColor: '#ff4444' }]} 
                              onPress={() => {
                                setBannerIdToDelete(banner.id);
                                setDeleteBannerModal(true);
                              }}
                            >
                              <Text style={[styles.vendorActionText, { color: '#ff4444' }]}>DELETE</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              ) : null}
            </View>
          )}
        </View>
        <Footer />
      </ScrollView>

      {/* Vendor Form Modal */}
      <ConfirmationModal
        visible={vendorModalVisible}
        title={editingVendor ? "Edit Vendor" : "Register New Vendor"}
        message=""
        onConfirm={handleSaveVendor}
        onCancel={() => setVendorModalVisible(false)}
        confirmLabel="Save Details"
      >
        <View style={styles.modalForm}>
          <TextInput 
            style={styles.modalInput} 
            placeholder="Business Name" 
            placeholderTextColor="#666"
            value={vendorName}
            onChangeText={setVendorName}
          />
          <TextInput 
            style={styles.modalInput} 
            placeholder="Contact Person" 
            placeholderTextColor="#666"
            value={vendorContact}
            onChangeText={setVendorContact}
          />
          <TextInput 
            style={styles.modalInput} 
            placeholder="Email Address" 
            placeholderTextColor="#666"
            value={vendorEmail}
            onChangeText={setVendorContactEmail}
            keyboardType="email-address"
          />
          <TextInput 
            style={styles.modalInput} 
            placeholder="Phone Number" 
            placeholderTextColor="#666"
            value={vendorPhone}
            onChangeText={setVendorPhone}
            keyboardType="phone-pad"
          />
          <TextInput 
            style={[styles.modalInput, { height: 60 }]} 
            placeholder="Full Address" 
            placeholderTextColor="#666"
            value={vendorAddress}
            onChangeText={setVendorAddress}
            multiline
          />
        </View>
      </ConfirmationModal>

      <ConfirmationModal
        visible={deleteProductModal}
        title="Delete Masterpiece"
        message="Are you sure you want to remove this item from the catalog? This action is permanent."
        onConfirm={handleDeleteProduct}
        onCancel={() => setDeleteProductModal(false)}
        isDestructive={true}
      />

      <ConfirmationModal
        visible={deleteVendorModal}
        title="Remove Vendor"
        message="Are you sure you want to remove this vendor? All associated products will be unlinked."
        onConfirm={handleDeleteVendor}
        onCancel={() => setDeleteVendorModal(false)}
        isDestructive={true}
      />

      {/* Banner Form Modal */}
      <ConfirmationModal
        visible={bannerModalVisible}
        title={editingBanner ? "Edit Homepage Banner" : "Add Homepage Banner"}
        message=""
        onConfirm={handleSaveBanner}
        onCancel={() => setBannerModalVisible(false)}
        confirmLabel="Save Banner"
      >
        <View style={styles.modalForm}>
          {bannerImageUrl ? (
            <Image 
              source={{ uri: bannerImageUrl }} 
              style={{ width: '100%', height: 120, borderRadius: 6, marginBottom: 5 }} 
              resizeMode="cover"
            />
          ) : null}
          
          <TouchableOpacity 
            style={[styles.uploadBtn, { marginBottom: 5 }]} 
            onPress={handlePickBannerImage}
            disabled={uploadingBanner}
          >
            {uploadingBanner ? (
              <ActivityIndicator color="#000" size="small" />
            ) : (
              <Text style={styles.uploadBtnText}>
                {bannerImageUrl ? "Change Banner Image" : "Upload Banner Image"}
              </Text>
            )}
          </TouchableOpacity>

          <TextInput 
            style={styles.modalInput} 
            placeholder="Or enter Image URL manually" 
            placeholderTextColor="#666"
            value={bannerImageUrl}
            onChangeText={setBannerImageUrl}
          />
          <TextInput 
            style={styles.modalInput} 
            placeholder="Alt Accessibility Text" 
            placeholderTextColor="#666"
            value={bannerAltText}
            onChangeText={setBannerAltText}
          />
          <TextInput 
            style={styles.modalInput} 
            placeholder="Display Order (e.g. 1, 2, 3)" 
            placeholderTextColor="#666"
            value={bannerDisplayOrder}
            onChangeText={setBannerDisplayOrder}
            keyboardType="number-pad"
          />
        </View>
      </ConfirmationModal>

      {/* Delete Banner Modal */}
      <ConfirmationModal
        visible={deleteBannerModal}
        title="Delete Homepage Banner"
        message="Are you sure you want to remove this banner image from the homepage slider?"
        onConfirm={handleDeleteBanner}
        onCancel={() => setDeleteBannerModal(false)}
        isDestructive={true}
      />
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
  contentWrapper: {
    flex: 1,
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
    flexWrap: 'wrap',
  },
  tab: {
    flex: 1,
    minWidth: 80,
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
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
  },
  addBtnText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
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
  customerNameSmall: {
    color: '#D4AF37',
    fontSize: 11,
    marginTop: 2,
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
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 5,
  },
  editAction: {
    padding: 2,
  },
  editActionText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: 'bold',
  },
  deleteAction: {
    padding: 2,
  },
  deleteActionText: {
    color: '#ff4444',
    fontSize: 9,
    fontWeight: 'bold',
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
  vendorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vendorActionBtn: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
  },
  vendorActionText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: 'bold',
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
  },
  // Order Tab Styles
  orderCardFull: {
    backgroundColor: '#3d2b1a',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#4a3520',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  customerName: {
    color: '#D4AF37',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  orderTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderControls: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.1)',
  },
  controlLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  controlButtons: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusBtn: {
    borderWidth: 1,
    borderColor: '#555',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  statusBtnActive: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  statusBtnText: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBtnTextActive: {
    color: '#D4AF37',
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Modal Form Styles
  modalForm: {
    marginVertical: 20,
    gap: 12,
    width: '100%',
  },
  modalInput: {
    backgroundColor: '#291c0e',
    borderWidth: 1,
    borderColor: '#4a3520',
    borderRadius: 6,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  uploadBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdminDashboardScreen;
