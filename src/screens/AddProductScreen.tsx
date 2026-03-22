import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { supabase } from '../../supabase';
import { useAuth } from '../contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';

interface AddProductScreenProps {
  onBack: () => void;
  vendorId: string;
  onGoHome: () => void;
  onPressLogin: () => void;
  onPressCart: () => void;
  onPressOrders: () => void;
  onPressWishlist: () => void;
  onPressProfile: () => void;
  onPressAdmin: () => void;
  onPressVendor: () => void;
  searchQuery: string;
  onSearch: (query: string) => void;
}

const CATEGORIES = ["Gold", "Diamonds", "Platinum", "Silver"];

const AddProductScreen: React.FC<AddProductScreenProps> = (props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [internalVendorId, setInternalVendorId] = useState<string>(props.vendorId || "");
  const [verifyingProfile, setVerifyingProfile] = useState(!props.vendorId);
  
  useEffect(() => {
    const initProfile = async () => {
      if (props.vendorId) {
        setInternalVendorId(props.vendorId);
        setVerifyingProfile(false);
        return;
      }

      if (!user) {
        setVerifyingProfile(false);
        return;
      }

      console.log("Missing vendorId prop, fetching from database for user:", user.id);
      try {
        const { data, error } = await supabase
          .from('vendor_settings')
          .select('vendor_id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (data?.vendor_id) {
          console.log("Fallback vendorId found:", data.vendor_id);
          setInternalVendorId(data.vendor_id);
        }
      } catch (e) {
        console.error("Error fetching fallback vendorId:", e);
      } finally {
        setVerifyingProfile(false);
      }
    };

    initProfile();
  }, [props.vendorId, user]);
  
  // Form State
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Gold");
  const [imageUrl, setImageUrl] = useState("");
  const [productCode, setProductCode] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [goldWeight, setGoldWeight] = useState("");
  const [purity, setPurity] = useState("22K");
  const [metalColor, setMetalColor] = useState("Yellow");
  
  // New Metadata
  const [type, setType] = useState("");
  const [collection, setCollection] = useState("");
  const [gender, setGender] = useState("Women");
  const [occasion, setOccasion] = useState("");
  const [designTheme, setDesignTheme] = useState("");
  const [gemstoneType, setGemstoneType] = useState("");
  const [gemstoneWeight, setGemstoneWeight] = useState("");
  
  // Price Breakup
  const [metalPrice, setMetalPrice] = useState("");
  const [vaMaking, setVaMaking] = useState("");
  const [stoneBeads, setStoneBeads] = useState("");
  const [tax, setTax] = useState("");

  const handlePickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      if (!internalVendorId) {
        throw new Error("Vendor ID is missing. Cannot upload image.");
      }

      const fileName = `${internalVendorId}/${Date.now()}.jpg`;
      
      const response = await fetch(uri);
      const body = await response.blob();

      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, body, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (error) {
        if (error.message.includes("Bucket not found")) {
          throw new Error("Supabase Storage bucket 'products' not found. Please create it in your Supabase dashboard.");
        }
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
      Alert.alert("Success", "Image uploaded successfully!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      Alert.alert("Upload Failed", error.message || "Failed to upload image. Ensure the 'products' bucket exists and is public.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddProduct = async () => {
    console.log("Attempting manual add with vendorId:", internalVendorId);

    if (!name || !imageUrl || !productCode || !grossWeight || !metalPrice) {
      Alert.alert("Error", "Please fill in all required fields (Name, Image, Code, Gross Weight, Metal Price)");
      return;
    }

    if (!internalVendorId) {
      Alert.alert("Error", "Your vendor profile is not initialized. Please re-login.");
      console.error("Error: internalVendorId is empty");
      return;
    }

    setLoading(true);
    try {
      const mPrice = parseFloat(metalPrice) || 0;
      const vMaking = parseFloat(vaMaking) || 0;
      const sBeads = parseFloat(stoneBeads) || 0;
      const tTax = parseFloat(tax) || 0;
      const basePrice = mPrice + vMaking + sBeads + tTax;

      const productPayload = {
        name,
        category_name: category,
        image_url: imageUrl,
        product_code: productCode,
        gross_weight: parseFloat(grossWeight),
        gold_weight: parseFloat(goldWeight || "0"),
        purity,
        metal_color: metalColor,
        base_price_usd: basePrice,
        metal_price_usd: mPrice,
        va_making_usd: vMaking,
        stone_beads_usd: sBeads,
        tax_usd: tTax,
        vendor_id: internalVendorId,
        rating: 0,
        popularity: 0,
        type,
        collection,
        gender,
        occasion,
        design_theme: designTheme,
        gemstone_type: gemstoneType,
        gemstone_weight: parseFloat(gemstoneWeight || "0")
      };

      console.log("Inserting Product:", JSON.stringify(productPayload, null, 2));

      const { error } = await supabase
        .from('products')
        .insert([productPayload]);

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }

      Alert.alert("Success", "Your masterpiece has been listed successfully!");
      props.onBack();
    } catch (error: any) {
      console.error("Final Error in handleAddProduct:", error);
      Alert.alert("Error", error.message || "Failed to add product. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header {...props} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.contentWrapper}>
            {verifyingProfile ? (
              <View style={[styles.formSection, styles.centerContent]}>
                <ActivityIndicator size="large" color="#D4AF37" />
                <Text style={styles.loadingText}>Verifying Vendor Profile...</Text>
              </View>
            ) : !internalVendorId ? (
              <View style={[styles.formSection, styles.centerContent]}>
                <Text style={styles.errorTitle}>Account Not Linked</Text>
                <Text style={styles.errorSubtitle}>Your artisan profile is not yet linked to a vendor account. Please go back to the Partner Portal and use the link tool.</Text>
                <TouchableOpacity onPress={props.onBack} style={styles.backBtnLarge}>
                  <Text style={styles.backBtnTextLarge}>RETURN TO PORTAL</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formSection}>
                <View style={styles.headerRow}>
                  <TouchableOpacity onPress={props.onBack} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← BACK</Text>
                  </TouchableOpacity>
                  <Text style={styles.title}>LIST NEW MASTERPIECE</Text>
                </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PRODUCT NAME *</Text>
                <TextInput 
                  style={styles.input} 
                  value={name} 
                  onChangeText={setName} 
                  placeholder="e.g. Traditional Gold Necklace"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>CATEGORY</Text>
                  <View style={styles.pickerContainer}>
                     {CATEGORIES.map(cat => (
                       <TouchableOpacity 
                          key={cat} 
                          style={[styles.pickerItem, category === cat && styles.activePickerItem]}
                          onPress={() => setCategory(cat)}
                        >
                         <Text style={[styles.pickerText, category === cat && styles.activePickerText]}>{cat}</Text>
                       </TouchableOpacity>
                     ))}
                  </View>
                </View>
                
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>PRODUCT CODE *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={productCode} 
                    onChangeText={setProductCode} 
                    placeholder="e.g. MJK-101"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PRODUCT IMAGE *</Text>
                <View style={styles.imageUploadContainer}>
                  {imageUrl ? (
                    <View style={styles.previewContainer}>
                      <Image source={{ uri: imageUrl }} style={styles.previewImage} />
                      <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUrl("")}>
                        <Text style={styles.removeImageText}>REMOVE</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.uploadBtn} 
                      onPress={handlePickImage}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <ActivityIndicator color="#D4AF37" />
                      ) : (
                        <View style={{ alignItems: 'center' }}>
                          <Text style={styles.uploadBtnText}>+ SELECT IMAGE</Text>
                          <Text style={styles.uploadBtnSubtext}>JPEG or PNG up to 5MB</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  <View style={{ marginTop: 15 }}>
                    <Text style={styles.label}>OR PROVIDE IMAGE URL</Text>
                    <TextInput 
                      style={styles.input} 
                      value={imageUrl} 
                      onChangeText={setImageUrl} 
                      placeholder="https://example.com/image.jpg"
                      placeholderTextColor="#666"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>GROSS WEIGHT (g) *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={grossWeight} 
                    onChangeText={setGrossWeight} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>GOLD WEIGHT (g)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={goldWeight} 
                    onChangeText={setGoldWeight} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>PURITY</Text>
                  <TextInput 
                    style={styles.input} 
                    value={purity} 
                    onChangeText={setPurity} 
                    placeholder="e.g. 22K"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>METAL COLOR</Text>
                  <TextInput 
                    style={styles.input} 
                    value={metalColor} 
                    onChangeText={setMetalColor} 
                    placeholder="e.g. Yellow"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>CLASSIFICATION</Text>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>TYPE</Text>
                  <TextInput 
                    style={styles.input} 
                    value={type} 
                    onChangeText={setType} 
                    placeholder="e.g. Drop, Stud, Hoop"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>COLLECTION</Text>
                  <TextInput 
                    style={styles.input} 
                    value={collection} 
                    onChangeText={setCollection} 
                    placeholder="e.g. Heritage, Royal"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>GENDER</Text>
                  <View style={styles.pickerContainer}>
                     {["Women", "Men", "Unisex"].map(g => (
                       <TouchableOpacity 
                          key={g} 
                          style={[styles.pickerItem, gender === g && styles.activePickerItem]}
                          onPress={() => setGender(g)}
                        >
                         <Text style={[styles.pickerText, gender === g && styles.activePickerText]}>{g}</Text>
                       </TouchableOpacity>
                     ))}
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>OCCASION</Text>
                  <TextInput 
                    style={styles.input} 
                    value={occasion} 
                    onChangeText={setOccasion} 
                    placeholder="e.g. Anniversary, Wedding"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>DESIGN THEME</Text>
                <TextInput 
                  style={styles.input} 
                  value={designTheme} 
                  onChangeText={setDesignTheme} 
                  placeholder="e.g. Elevated Tradition"
                  placeholderTextColor="#666"
                />
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>GEMSTONE DETAILS</Text>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>GEMSTONE TYPE</Text>
                  <TextInput 
                    style={styles.input} 
                    value={gemstoneType} 
                    onChangeText={setGemstoneType} 
                    placeholder="e.g. Synthetic, Diamond, Ruby"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>GEMSTONE WEIGHT (ct/g)</Text>
                  <TextInput 
                    style={styles.input} 
                    value={gemstoneWeight} 
                    onChangeText={setGemstoneWeight} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 20 }]}>PRICE BREAKUP (USD)</Text>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>METAL PRICE *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={metalPrice} 
                    onChangeText={setMetalPrice} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>VA / MAKING</Text>
                  <TextInput 
                    style={styles.input} 
                    value={vaMaking} 
                    onChangeText={setVaMaking} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>STONE & BEADS</Text>
                  <TextInput 
                    style={styles.input} 
                    value={stoneBeads} 
                    onChangeText={setStoneBeads} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>TAX / GST</Text>
                  <TextInput 
                    style={styles.input} 
                    value={tax} 
                    onChangeText={setTax} 
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, (loading || uploading) && styles.disabledBtn]} 
                onPress={handleAddProduct}
                disabled={loading || uploading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.submitBtnText}>CONFIRM & LIST PRODUCT</Text>
                )}
              </TouchableOpacity>
            </View>
            )}
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
    backgroundColor: '#291c0e',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  formSection: {
    padding: 20,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    marginBottom: 40,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
  loadingText: {
    color: '#D4AF37',
    marginTop: 20,
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorTitle: {
    fontFamily: 'TrajanPro',
    fontSize: 24,
    color: '#ff4444',
    marginBottom: 15,
  },
  errorSubtitle: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    maxWidth: 500,
  },
  backBtnLarge: {
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  backBtnTextLarge: {
    color: '#D4AF37',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
    gap: 20,
  },
  backBtn: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    borderRadius: 4,
  },
  backBtnText: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontFamily: 'TrajanPro',
    fontSize: 22,
    color: '#D4AF37',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontFamily: 'TrajanPro',
    fontSize: 16,
    color: '#D4AF37',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#3d2b1a',
    borderWidth: 1,
    borderColor: '#4a3520',
    borderRadius: 6,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#4a3520',
    borderRadius: 4,
    backgroundColor: '#3d2b1a',
  },
  activePickerItem: {
    borderColor: '#D4AF37',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  pickerText: {
    color: '#888',
    fontSize: 11,
  },
  activePickerText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 18,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  submitBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  imageUploadContainer: {
    backgroundColor: '#3d2b1a',
    borderWidth: 1,
    borderColor: '#4a3520',
    borderRadius: 8,
    padding: 15,
  },
  uploadBtn: {
    height: 120,
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
  },
  uploadBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  uploadBtnSubtext: {
    color: '#666',
    fontSize: 10,
  },
  previewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 4,
  },
  removeImageText: {
    color: '#ff4444',
    fontSize: 10,
    fontWeight: 'bold',
  }
});

export default AddProductScreen;
