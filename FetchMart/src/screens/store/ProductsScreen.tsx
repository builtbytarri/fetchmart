import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { storesApi, productsApi, Category } from '../../api';
import { Store, Product } from '../../types';
import { COLORS, SPACING } from '../../constants/config';
import { formatQty } from '../../utils/quantity';

type FilterType = 'all' | 'in_stock' | 'out_of_stock' | 'unavailable';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const fetchData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const stores = await storesApi.getMyStores();
      if (stores.length > 0) {
        setStore(stores[0]);
        const [prods, cats] = await Promise.all([
          storesApi.getProducts(stores[0].id),
          storesApi.getCategories(stores[0].id),
        ]);
        setProducts(prods);
        setCategories(cats);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData(false);
  };

  const handleToggleSuggested = async (product: Product) => {
    // Optimistic update
    setProducts(prev =>
      prev.map(p => p.id === product.id ? { ...p, isSuggested: !p.isSuggested } : p)
    );
    try {
      await productsApi.toggleSuggested(product.id);
    } catch (err) {
      console.error('Toggle suggested failed:', err);
      // Revert
      setProducts(prev =>
        prev.map(p => p.id === product.id ? { ...p, isSuggested: product.isSuggested } : p)
      );
    }
  };

  const filteredProducts = products.filter((product) => {
    // Apply stock filter
    // An IN_STOCK product is always considered stocked.
    const inStock =
      product.stockMode === 'IN_STOCK' || Number(product.stockQuantity) > 0;
    if (activeFilter === 'in_stock' && !inStock) return false;
    if (activeFilter === 'out_of_stock' && inStock) return false;
    if (activeFilter === 'unavailable' && product.isAvailable) return false;
    
    // Apply category filter
    if (selectedCategory && product.categoryId !== selectedCategory) return false;
    
    return true;
  });

  const getStockStatus = (product: Product) => {
    if (!product.isAvailable) return { text: 'Unavailable', color: COLORS.error };
    // IN_STOCK products carry no count — availability is the whole story.
    if (product.stockMode === 'IN_STOCK') {
      return { text: 'In stock', color: COLORS.success };
    }
    const qty = Number(product.stockQuantity);
    if (qty <= 0) return { text: 'Out of stock', color: COLORS.secondary };
    if (qty <= 5) {
      return {
        text: `Low stock (${formatQty(qty, product.unit)})`,
        color: COLORS.secondary,
      };
    }
    return { text: `In stock (${formatQty(qty, product.unit)})`, color: COLORS.success };
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'in_stock', label: 'In Stock' },
    { key: 'out_of_stock', label: 'Out of Stock' },
    { key: 'unavailable', label: 'Unavailable' },
  ];

  const renderProduct = ({ item }: { item: Product }) => {
    const stockStatus = getStockStatus(item);
    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => navigation.navigate('EditProduct', { productId: item.id })}
      >
        <View style={styles.productImageContainer}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Ionicons name="cube-outline" size={30} color={COLORS.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productPrice}>₦{Number(item.price).toLocaleString()}</Text>
          <View style={styles.productMeta}>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.category.name}</Text>
              </View>
            )}
            <Text style={[styles.stockText, { color: stockStatus.color }]}>{stockStatus.text}</Text>
          </View>
        </View>
        {/* Suggested toggle — star = pinned to "Suggested for you" on customer home */}
        <TouchableOpacity
          style={styles.suggestBtn}
          onPress={() => handleToggleSuggested(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={item.isSuggested ? 'star' : 'star-outline'}
            size={20}
            color={item.isSuggested ? '#F5A623' : COLORS.textSecondary}
          />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={18} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
      </TouchableOpacity>
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
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Products</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.noStoreContainer}>
          <Ionicons name="storefront-outline" size={60} color={COLORS.textSecondary} />
          <Text style={styles.noStoreText}>Create your store first</Text>
          <Text style={styles.noStoreSubtext}>You need to set up your store before adding products</Text>
          <TouchableOpacity 
            style={styles.createStoreButton}
            onPress={() => navigation.navigate('CreateStore')}
          >
            <Text style={styles.createStoreButtonText}>Create Store</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Products ({filteredProducts.length})</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.categoryButton}
            onPress={() => navigation.navigate('ManageCategories', { storeId: store.id })}
          >
            <Ionicons name="pricetags-outline" size={20} color={COLORS.secondary} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('AddProduct')}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                activeFilter === filter.key && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === filter.key && styles.filterChipTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category Filter */}
      {categories.length > 0 && (
        <View style={styles.categoryFilterContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === null && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === null && styles.categoryChipTextActive,
                ]}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === cat.id && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.name} {cat._count ? `(${cat._count.products})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={60} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              {activeFilter !== 'all' || selectedCategory ? 'No matching products' : 'No products yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeFilter !== 'all' || selectedCategory 
                ? 'Try changing your filters' 
                : 'Add your first product to start selling'}
            </Text>
            {activeFilter === 'all' && !selectedCategory && (
              <TouchableOpacity 
                style={styles.addProductButton}
                onPress={() => navigation.navigate('AddProduct')}
              >
                <Text style={styles.addProductButtonText}>Add Product</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 6,
  },
  listContent: {
    padding: SPACING.md,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 2,
  },
  stockBadge: {
    marginTop: 4,
  },
  stockText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  addProductButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  addProductButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  noStoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  noStoreText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  noStoreSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  createStoreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  createStoreButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  suggestBtn: {
    padding: 4,
    marginLeft: 6,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.secondaryLight,
  },
  filtersContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersScroll: {
    paddingHorizontal: SPACING.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  categoryFilterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DEE2E6',
  },
  categoryChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  categoryChipTextActive: {
    color: COLORS.primary,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.primary,
  },
});
