import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  StatusBar,
  Image,
  Alert
} from 'react-native';
import { supabase } from '../../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCountry } from '../contexts/CountryContext';
import { formatPrice } from '../utils/currency';
import Header from '../components/Header';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  product: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: OrderItem[];
}

interface OrdersScreenProps {
  onGoHome: () => void;
  onPressLogin: () => void;
  onPressOrders: () => void;
  onPressCart: () => void;
}

const OrdersScreen: React.FC<OrdersScreenProps> = ({ onGoHome, onPressLogin, onPressOrders, onPressCart }) => {
  const { user } = useAuth();
  const { countryCode } = useCountry();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            id,
            quantity,
            price_at_purchase,
            product:products (
              name,
              image_url
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedOrders = (data || []).map((order: any) => ({
        ...order,
        order_items: order.order_items.map((item: any) => ({
          ...item,
          product: Array.isArray(item.product) ? item.product[0] : item.product
        }))
      }));
      
      setOrders(formattedOrders);
    } catch (error: any) {
      console.error('Error fetching orders:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    Alert.alert(
      "Cancel Order",
      "Are you sure you want to cancel this luxury order? This action cannot be undone.",
      [
        { text: "No, Keep Order", style: "cancel" },
        { 
          text: "Yes, Cancel It", 
          style: "destructive",
          onPress: async () => {
            setIsDeleting(orderId);
            try {
              const { error } = await supabase
                .from('orders')
                .delete()
                .eq('id', orderId);

              if (error) throw error;
              
              setOrders(prev => prev.filter(o => o.id !== orderId));
              Alert.alert("Success", "Your order has been cancelled and removed.");
            } catch (error: any) {
              console.error('Error deleting order:', error.message);
              Alert.alert("Error", "We couldn't cancel your order. Please contact support.");
            } finally {
              setIsDeleting(null);
            }
          }
        }
      ]
    );
  };

  const renderOrderItem = (item: OrderItem) => (
    <View key={item.id} style={styles.orderItemRow}>
      <Image source={{ uri: item.product.image_url }} style={styles.itemThumb} />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
        <Text style={styles.itemMeta}>Qty: {item.quantity} • {formatPrice(item.price_at_purchase, countryCode)} each</Text>
      </View>
    </View>
  );

  const renderOrderCard = ({ item }: { item: Order }) => {
    const orderDate = new Date(item.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order ID: {item.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.itemsSection}>
          {item.order_items.map(renderOrderItem)}
        </View>

        <View style={styles.divider} />

        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Amount Paid:</Text>
            <Text style={styles.totalValue}>{formatPrice(item.total_amount, countryCode)}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.deleteBtn, isDeleting === item.id && styles.deleteBtnDisabled]} 
            onPress={() => handleDeleteOrder(item.id)}
            disabled={isDeleting === item.id}
          >
            {isDeleting === item.id ? (
              <ActivityIndicator size="small" color="#ff4444" />
            ) : (
              <Text style={styles.deleteBtnText}>Cancel Order</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Header onPressLogo={onGoHome} onPressLogin={onPressLogin} onPressOrders={onPressOrders} onPressCart={onPressCart} />
        <View style={styles.centerContent}>
          <Text style={styles.messageText}>Please log in to view your order history.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={onPressLogin}>
            <Text style={styles.loginBtnText}>Log In Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Header onPressLogo={onGoHome} onPressLogin={onPressLogin} onPressOrders={onPressOrders} onPressCart={onPressCart} />
      
      <View style={styles.content}>
        <Text style={styles.title}>Your Order History</Text>
        
        {isLoading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#D4AF37" />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.messageText}>You haven't placed any orders yet.</Text>
            <TouchableOpacity style={styles.shopBtn} onPress={onGoHome}>
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrderCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#291c0e',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontFamily: 'TrajanPro',
    fontSize: 24,
    color: '#D4AF37',
    marginBottom: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageText: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  orderCard: {
    backgroundColor: '#3d2b1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4a3520',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderId: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'TrajanPro',
  },
  orderDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  statusText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#4a3520',
    marginVertical: 12,
  },
  itemsSection: {
    gap: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemThumb: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#291c0e',
  },
  itemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 14,
  },
  itemMeta: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  totalLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  totalValue: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  deleteBtnDisabled: {
    borderColor: '#666',
  },
  deleteBtnText: {
    color: '#ff4444',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 4,
  },
  loginBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shopBtn: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 4,
  },
  shopBtnText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
});

export default OrdersScreen;
