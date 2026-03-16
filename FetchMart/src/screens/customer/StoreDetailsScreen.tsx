import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { storesApi } from '../../api';
import { Store, Product } from '../../types';
import { useCartStore } from '../../store';
import { COLORS, SPACING } from '../../constants/config';
import { CustomerStackParamList } from '../../navigation/types';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - SPACING.md * 3) / 2.3;

type Props = NativeStackScreenProps<CustomerStackParamList, 'StoreDetails'>;

export const StoreDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { storeId } = route.params;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addItem, getItemCount } = useCartStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [storeData, productsData] = await Promise.all([
          storesApi.getById(storeId),
          storesApi.getProducts(storeId),
        ]);
        setStore(storeData);
        setProducts(productsData);
      } catch (err) {
        console.error('Failed to load store:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [storeId]);

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { productId: product.id });
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
  };

  const cartCount = getItemCount();

  const renderProductCard = (product: Product, index: number) => (
    <TouchableOpacity
      key={product.id || index}
      style={styles.productCard}
      onPress={() => handleProductPress(product)}
      activeOpacity={0.8}
    >
      <View style={styles.productImageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={40} color={COLORS.textSecondary} />
          </View>
        )}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation();
          }}
        >
          <Ionicons name="heart-outline" size={16} color={COLORS.error} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAddToCart(product);
          }}
        >
          <Ionicons name="add" size={16} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.productPrice}>#{Number(product.price).toLocaleString()}</Text>
    </TouchableOpacity>
  );

  const renderSection = (title: string, productList: Product[]) => {
    if (productList.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.productRow}
        >
          {productList.map((product, index) => renderProductCard(product, index))}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Store not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Store Header Image */}
        <View style={styles.headerImageContainer}>
          {store.logoUrl ? (
            <Image source={{ uri: store.logoUrl }} style={styles.headerImage} />
          ) : (
            <View style={styles.headerImagePlaceholder}>
              <Ionicons name="storefront" size={60} color={COLORS.textSecondary} />
            </View>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* Store Info */}
        <View style={styles.storeInfoContainer}>
          <Text style={styles.storeName}>{store.name}</Text>
          {store.description && (
            <Text style={styles.storeDescription}>{store.description}</Text>
          )}
        </View>

        {/* Product Sections */}
        {products.length > 0 && (
          <>
            {renderSection('Suggested for you', products.slice(0, 4))}
            {renderSection('Similar items', products.slice(0, 4))}
            {renderSection('All products', products)}
          </>
        )}

        {products.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products available</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add to Cart Button */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.addToCartButton} 
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={styles.addToCartText}>
            {cartCount > 0 ? `View Cart (${cartCount})` : 'Cart'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
  },
  headerImageContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#E8E8E8',
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storeInfoContainer: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  storeDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  productRow: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  productCard: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    height: PRODUCT_CARD_WIDTH,
    backgroundColor: '#E8E8E8',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 4,
  },
  productName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  productPrice: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addToCartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: SPACING.md,
    borderRadius: 30,
    alignItems: 'center',
  },
  addToCartText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
