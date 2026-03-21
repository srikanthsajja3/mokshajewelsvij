import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../../supabase";
import { useAuth } from "../contexts/AuthContext";

interface ProfileScreenProps {
  onGoHome: () => void;
  onPressLogin: () => void;
  onPressCart: () => void;
  onPressOrders: () => void;
  onPressWishlist: () => void;
  onPressProfile: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

interface Address {
  id: string;
  label: string;
  full_name: string;
  phone_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  zip_code: string;
  country: string;
  is_default: boolean;
}

const ProfileScreen: React.FC<ProfileScreenProps> = (props) => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile State
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Addresses State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // New/Editing Address State
  const [addrLabel, setAddrLabel] = useState("Home");
  const [addrFullName, setAddrFullName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrZip, setAddrZip] = useState("");
  const [addrCountry, setAddrCountry] = useState("United States");

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAddresses();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setFullName(data.full_name || "");
        setPhoneNumber(data.phone_number || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_default", { ascending: false });

      if (error) throw error;
      setAddresses(data || []);
    } catch (error) {
      console.error("Error fetching addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (error) throw error;
      Alert.alert("Success", "Your profile has been updated.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile.");
    } finally {
      setSaving(true); // Small delay feel
      setTimeout(() => setSaving(false), 500);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    if (!addrFullName || !addrLine1 || !addrCity || !addrZip) {
      Alert.alert("Required Fields", "Please fill in all mandatory address fields.");
      return;
    }

    setSaving(true);
    const addressData = {
      user_id: user.id,
      label: addrLabel,
      full_name: addrFullName,
      phone_number: addrPhone,
      address_line1: addrLine1,
      address_line2: addrLine2,
      city: addrCity,
      zip_code: addrZip,
      country: addrCountry,
      is_default: addresses.length === 0 || (editingAddress?.is_default ?? false)
    };

    try {
      if (editingAddress) {
        const { error } = await supabase
          .from("addresses")
          .update(addressData)
          .eq("id", editingAddress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert(addressData);
        if (error) throw error;
      }

      setShowAddressForm(false);
      setEditingAddress(null);
      fetchAddresses();
      Alert.alert("Success", "Address saved successfully.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    Alert.alert("Delete Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            await supabase.from("addresses").delete().eq("id", id);
            fetchAddresses();
          } catch (error) {
            console.error("Error deleting address:", error);
          }
        }
      }
    ]);
  };

  const openAddressForm = (addr?: Address) => {
    if (addr) {
      setEditingAddress(addr);
      setAddrLabel(addr.label);
      setAddrFullName(addr.full_name);
      setAddrPhone(addr.phone_number);
      setAddrLine1(addr.address_line1);
      setAddrLine2(addr.address_line2 || "");
      setAddrCity(addr.city);
      setAddrZip(addr.zip_code);
      setAddrCountry(addr.country);
    } else {
      setEditingAddress(null);
      setAddrLabel("Home");
      setAddrFullName(fullName);
      setAddrPhone(phoneNumber);
      setAddrLine1("");
      setAddrLine2("");
      setAddrCity("");
      setAddrZip("");
      setAddrCountry("United States");
    }
    setShowAddressForm(true);
  };

  const handleLogout = async () => {
    await signOut();
    props.onGoHome();
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Header {...props} />
        <View style={styles.center}>
          <Text style={styles.emptyText}>Please log in to view your profile.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={props.onPressLogin}>
            <Text style={styles.loginButtonText}>Log In</Text>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.headerSection}>
            <Text style={styles.title}>Account Details</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>

          <View style={styles.formSection}>
            {/* Basic Info */}
            <Text style={styles.sectionHeader}>Personal Information</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor="#666"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#666"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>Update Profile</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            
            {/* Addresses Section */}
            <View style={styles.rowBetween}>
              <Text style={styles.sectionHeader}>Saved Addresses</Text>
              {!showAddressForm && (
                <TouchableOpacity onPress={() => openAddressForm()}>
                  <Text style={styles.addText}>+ ADD NEW</Text>
                </TouchableOpacity>
              )}
            </View>

            {showAddressForm ? (
              <View style={styles.addressForm}>
                <Text style={styles.formTitle}>{editingAddress ? "Edit Address" : "New Shipping Address"}</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Label (e.g. Home, Office, Gift)</Text>
                  <TextInput style={styles.input} value={addrLabel} onChangeText={setAddrLabel} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Receiver's Full Name</Text>
                  <TextInput style={styles.input} value={addrFullName} onChangeText={setAddrFullName} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Shipping Country</Text>
                  <TextInput 
                    style={styles.input} 
                    value={addrCountry} 
                    onChangeText={setAddrCountry}
                    placeholder="Enter target country"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address Line 1</Text>
                  <TextInput style={styles.input} value={addrLine1} onChangeText={setAddrLine1} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Address Line 2 (Optional)</Text>
                  <TextInput style={styles.input} value={addrLine2} onChangeText={setAddrLine2} />
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput style={styles.input} value={addrCity} onChangeText={setAddrCity} />
                  </View>
                  <View style={[styles.inputGroup, { width: 120 }]}>
                    <Text style={styles.inputLabel}>ZIP Code</Text>
                    <TextInput style={styles.input} value={addrZip} onChangeText={setAddrZip} />
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddressForm(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveAddrBtn} onPress={handleSaveAddress}>
                    <Text style={styles.saveAddrBtnText}>Save Address</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.addressList}>
                {loading ? (
                  <ActivityIndicator color="#D4AF37" />
                ) : addresses.length === 0 ? (
                  <Text style={styles.noAddressText}>No addresses saved yet.</Text>
                ) : (
                  addresses.map((addr) => (
                    <View key={addr.id} style={styles.addressCard}>
                      <View style={styles.rowBetween}>
                        <View style={styles.labelBadge}>
                          <Text style={styles.labelText}>{addr.label.toUpperCase()}</Text>
                        </View>
                        {addr.is_default && (
                          <Text style={styles.defaultTag}>DEFAULT</Text>
                        )}
                      </View>
                      <Text style={styles.addrName}>{addr.full_name}</Text>
                      <Text style={styles.addrText}>{addr.address_line1}</Text>
                      {addr.address_line2 ? <Text style={styles.addrText}>{addr.address_line2}</Text> : null}
                      <Text style={styles.addrText}>{addr.city}, {addr.zip_code}</Text>
                      <Text style={[styles.addrText, { fontWeight: 'bold', color: '#D4AF37' }]}>{addr.country}</Text>
                      
                      <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => openAddressForm(addr)}>
                          <Text style={styles.actionLink}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)}>
                          <Text style={[styles.actionLink, { color: '#ff4444' }]}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Sign Out from Moksha Jewels</Text>
            </TouchableOpacity>
          </View>

          <Footer />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#291c0e",
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    padding: 30,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(212, 175, 55, 0.15)",
  },
  title: {
    fontFamily: "TrajanPro",
    fontSize: 28,
    color: "#D4AF37",
    marginBottom: 5,
    letterSpacing: 2,
  },
  userEmail: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
  formSection: {
    padding: 25,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  sectionHeader: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 20,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#888",
    fontSize: 10,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#3d2b1a",
    borderWidth: 1,
    borderColor: "#4a3520",
    borderRadius: 6,
    padding: 14,
    color: "#fff",
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    marginVertical: 40,
  },
  saveButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  addText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 20,
  },
  addressList: {
    gap: 15,
    marginBottom: 30,
  },
  addressCard: {
    backgroundColor: "#3d2b1a",
    borderRadius: 10,
    padding: 20,
    borderWidth: 1,
    borderColor: "#4a3520",
  },
  labelBadge: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 12,
  },
  labelText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "bold",
  },
  defaultTag: {
    color: "#888",
    fontSize: 10,
    fontWeight: "bold",
  },
  addrName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  addrText: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 4,
  },
  cardActions: {
    flexDirection: "row",
    gap: 20,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(212, 175, 55, 0.05)",
  },
  actionLink: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "bold",
  },
  addressForm: {
    backgroundColor: "#3d2b1a",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D4AF37",
    marginBottom: 30,
  },
  formTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "TrajanPro",
    marginBottom: 20,
  },
  formActions: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#888",
    fontWeight: "bold",
  },
  saveAddrBtn: {
    flex: 2,
    backgroundColor: "#D4AF37",
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: "center",
  },
  saveAddrBtnText: {
    color: "#000",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  logoutButton: {
    paddingVertical: 30,
    alignItems: "center",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#ff4444",
    fontSize: 13,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
  center: {
    flex: 1,
    padding: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#888",
    fontSize: 16,
    marginBottom: 25,
  },
  loginButton: {
    borderWidth: 1,
    borderColor: "#D4AF37",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 4,
  },
  loginButtonText: {
    color: "#D4AF37",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noAddressText: {
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  }
});

export default ProfileScreen;
