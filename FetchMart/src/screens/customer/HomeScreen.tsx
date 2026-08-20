import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { storesApi } from '../../api';
import { Store } from '../../types';
import { useAuthStore, useFavouritesStore } from '../../store';
import { COLORS, SPACING } from '../../constants/config';
import { SearchScreen } from './SearchScreen';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.58;
const CARD_IMAGE_H = CARD_WIDTH * 0.75;

type Props = { navigation: NativeStackNavigationProp<any> };

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: '0', name: 'All' },
  { id: '1', name: 'Fresh Food' },
  { id: '2', name: 'Groceries' },
  { id: '3', name: 'Snacks' },
  { id: '4', name: 'Beverages' },
  { id: '5', name: 'Household' },
];

interface Promo {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconBg: string;
}

const PROMO_BANNERS: Promo[] = [
  {
    id: '1',
    tag: 'Limited time',
    title: '20% off\nyour order',
    subtitle: 'Use code FETCH20 at checkout',
    ctaLabel: 'Claim offer',
    ctaColor: COLORS.primary,
    iconName: 'nutrition',
    iconBg: 'rgba(56,180,73,0.12)',
  },
  {
    id: '2',
    tag: 'Free delivery',
    title: 'On orders\nabove ₦5,000',
    subtitle: 'Applied automatically — no code needed',
    ctaLabel: 'Shop now',
    ctaColor: COLORS.accent,
    iconName: 'bicycle',
    iconBg: 'rgba(232,87,44,0.12)',
  },
  {
    id: '3',
    tag: 'New stores',
    title: 'Fresh picks\nnear you',
    subtitle: 'Stores just added in your area',
    ctaLabel: 'Explore',
    ctaColor: '#4A7FE5',
    iconName: 'storefront',
    iconBg: 'rgba(74,127,229,0.12)',
  },
];

// Per-index palette for store card placeholder backgrounds
const STORE_PALETTES = [
  { bg: '#E8F7EB', fg: COLORS.primary },
  { bg: '#FEF0EB', fg: COLORS.accent },
  { bg: '#EEF4FF', fg: '#4A7FE5' },
  { bg: '#FFF8EC', fg: '#E0920A' },
  { bg: '#F3EEFF', fg: '#8B5CF6' },
  { bg: '#E8F7F5', fg: '#0EA5A0' },
];

// ─── Reusable sub-components ───────────────────────────────────────────────────

const PressableCard: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}> = ({ children, onPress, style }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

const HeartButton: React.FC<{ storeId: string }> = ({ storeId }) => {
  // Subscribe directly to `ids` so any Set change triggers a re-render.
  const active = useFavouritesStore(state => state.ids.has(storeId));
  const toggle = useFavouritesStore(state => state.toggle);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }),
    ]).start();
    toggle(storeId);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={6}>
      <Animated.View style={[styles.heartBtn, { transform: [{ scale }] }]}>
        <Ionicons
          name={active ? 'heart' : 'heart-outline'}
          size={15}
          color={active ? COLORS.accent : COLORS.textSecondary}
        />
      </Animated.View>
    </Pressable>
  );
};

// ─── Main screen ───────────────────────────────────────────────────────────────

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [favouriteStores, setFavouriteStores] = useState<Store[]>([]);
  const [featuredStores, setFeaturedStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('0');
  const promoRef = useRef<FlatList>(null);
  const { user } = useAuthStore();
  const { load: loadFavouriteIds } = useFavouritesStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromoIndex(prev => {
        const next = (prev + 1) % PROMO_BANNERS.length;
        promoRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async (refresh = false) => {
    refresh ? setIsRefreshing(true) : setIsLoading(true);
    // Use the user's saved delivery location; fall back to central Lagos if not set
    const lat = user?.latitude ?? 6.5244;
    const lng = user?.longitude ?? 3.3792;
    try {
      const [nearby, favs, featured] = await Promise.all([
        storesApi.getNearby({ latitude: lat, longitude: lng, radius: 20 }),
        storesApi.getFavourites().catch(() => [] as Store[]),
        storesApi.getFeatured().catch(() => [] as Store[]),
      ]);
      setStores(nearby);
      setFavouriteStores(favs);
      setFeaturedStores(featured);
    } catch (err) {
      console.error('Failed to load stores:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavouriteIds();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.latitude, user?.longitude]),
  );

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const initial = (user?.name?.[0] ?? 'U').toUpperCase();

  // ── Store card ──────────────────────────────────────────────────────────────
  const renderStoreCard = (store: Store, index: number) => {
    const palette = STORE_PALETTES[index % STORE_PALETTES.length];
    const storeInitial = (store.name?.[0] ?? 'S').toUpperCase();

    return (
      <PressableCard
        key={store.id || index}
        style={styles.card}
        onPress={() => navigation.navigate('StoreDetails', { storeId: store.id })}
      >
        {/* Image / placeholder area */}
        <View style={[styles.cardImageArea, { backgroundColor: palette.bg }]}>
          {/* Large store initial — editorial identity placeholder */}
          <Text style={[styles.cardInitialBg, { color: palette.fg, opacity: 0.12 }]}>
            {storeInitial}
          </Text>
          <View style={[styles.cardIconCircle, { backgroundColor: palette.bg }]}>
            <Ionicons name="storefront" size={28} color={palette.fg} />
          </View>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.18)']}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Heart */}
          <View style={styles.cardHeartPosition}>
            <HeartButton storeId={store.id} />
          </View>

          {/* Open / Closed badge */}
          {store.isOpen !== undefined && (
            <View style={[styles.statusBadge, { backgroundColor: store.isOpen ? COLORS.primaryLight : '#F5F5F5' }]}>
              <View style={[styles.statusDot, { backgroundColor: store.isOpen ? COLORS.primary : '#BDBDBD' }]} />
              <Text style={[styles.statusText, { color: store.isOpen ? COLORS.primaryDark : '#888' }]}>
                {store.isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>

        {/* Info area */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>{store.name}</Text>
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={11} color={COLORS.textSecondary} />
            <Text style={styles.cardDistance}>
              {store.distance !== undefined ? `${store.distance.toFixed(1)} km` : 'Nearby'}
            </Text>
          </View>
        </View>
      </PressableCard>
    );
  };

  // ── Section ─────────────────────────────────────────────────────────────────
  const renderSection = (title: string, list: Store[], accent?: string) => {
    if (list.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionDot, { backgroundColor: accent ?? COLORS.primary }]} />
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation.navigate('AllStores', { title })}
            hitSlop={10}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={13} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardRow}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + SPACING.md}
        >
          {list.map((s, i) => renderStoreCard(s, i))}
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: COLORS.surface }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (showSearch) {
    return <SearchScreen navigation={navigation} onClose={() => setShowSearch(false)} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={() => fetchData(true)}
            colors={[COLORS.primary]} tintColor={COLORS.primary} />
        }
      >
        {/* ── Header ────────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.greetingRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
            <View style={styles.greetingText}>
              <Text style={styles.welcomeBack}>Welcome back</Text>
              <Text style={styles.greetingName}>{firstName}</Text>
            </View>
            <TouchableOpacity style={styles.bellButton} activeOpacity={0.7} hitSlop={8}>
              <Ionicons name="notifications-outline" size={21} color={COLORS.text} />
              <View style={styles.bellPip} />
            </TouchableOpacity>
          </View>

          <Pressable
            style={({ pressed }) => [styles.searchBar, pressed && { opacity: 0.88 }]}
            onPress={() => setShowSearch(true)}
          >
            <Ionicons name="search" size={17} color="rgba(40,28,24,0.45)" />
            <Text style={styles.searchPlaceholder}>Search stores or products</Text>
            <View style={styles.searchDivider} />
            <Ionicons name="options-outline" size={17} color="rgba(40,28,24,0.45)" />
          </Pressable>
        </View>

        {/* ── Categories ────────────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Promo carousel ────────────────────────────────────────────────── */}
        <View style={{ marginTop: SPACING.lg }}>
          <FlatList
            ref={promoRef}
            data={PROMO_BANNERS}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id}
            onMomentumScrollEnd={e => {
              const i = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentPromoIndex(i);
            }}
            renderItem={({ item }) => (
              <View style={{ width, paddingHorizontal: SPACING.md }}>
                {/* Dark editorial card */}
                <View style={styles.promoBanner}>
                  {/* Left: copy */}
                  <View style={styles.promoLeft}>
                    <View style={styles.promoTag}>
                      <Text style={styles.promoTagText}>{item.tag.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.promoTitle}>{item.title}</Text>
                    <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
                    <TouchableOpacity
                      style={[styles.promoCta, { backgroundColor: item.ctaColor }]}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.promoCtaText}>{item.ctaLabel}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Right: oversized icon in tinted circle — food feel without real image */}
                  <View style={[styles.promoIconWrap, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.iconName} size={56} color={item.ctaColor} />
                  </View>

                  {/* Subtle decorative circles */}
                  <View style={[styles.promoDecor, { top: -40, right: 60, width: 120, height: 120, opacity: 0.04 }]} />
                  <View style={[styles.promoDecor, { bottom: -30, right: -20, width: 100, height: 100, opacity: 0.06 }]} />
                </View>
              </View>
            )}
          />

          {/* Dots */}
          <View style={styles.dotsRow}>
            {PROMO_BANNERS.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, currentPromoIndex === i && styles.dotActive]}
              />
            ))}
          </View>
        </View>

        {/* ── Store sections ────────────────────────────────────────────────── */}
        {stores.length > 0 || favouriteStores.length > 0 || featuredStores.length > 0 ? (
          <>
            {/* Only shown when user has saved at least one favourite */}
            {favouriteStores.length > 0 && renderSection('Your favourites', favouriteStores, COLORS.accent)}

            {/* Only shown when admin has curated featured stores */}
            {featuredStores.length > 0 && renderSection('Handpicked for you', featuredStores, COLORS.primary)}

            {/* Always shown — the core discovery section */}
            {renderSection('Nearby stores', stores)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="storefront-outline" size={30} color={COLORS.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No stores nearby</Text>
            <Text style={styles.emptySub}>Pull down to refresh</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  scrollView: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.md, gap: SPACING.md },
  greetingRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4,
  },
  avatarInitial: { fontSize: 20, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  greetingText: { flex: 1, gap: 2 },
  welcomeBack: { fontSize: 11, fontWeight: '600', color: 'rgba(40,28,24,0.42)', letterSpacing: 0.6, textTransform: 'uppercase' },
  greetingName: { fontSize: 22, fontWeight: '800', color: COLORS.text, letterSpacing: -0.4 },
  bellButton: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: 'rgba(60,20,10,1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  bellPip: {
    position: 'absolute', top: 11, right: 12,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.accent, borderWidth: 1.5, borderColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 16,
    paddingVertical: 13, paddingHorizontal: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: 'rgba(60,20,10,1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2,
    gap: SPACING.sm,
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: 'rgba(40,28,24,0.38)', fontWeight: '500' },
  searchDivider: { width: 1, height: 18, backgroundColor: 'rgba(0,0,0,0.08)' },

  // ── Categories ──────────────────────────────────────────────────────────────
  categoriesRow: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.white,
  },

  // ── Promo banner ────────────────────────────────────────────────────────────
  promoBanner: {
    backgroundColor: '#161C17',   // near-black warm — dark editorial
    borderRadius: 22,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 168,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  promoLeft: { flex: 1, gap: 6, paddingRight: SPACING.md },
  promoTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  promoTagText: { color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  promoTitle: { color: COLORS.white, fontSize: 22, fontWeight: '800', lineHeight: 28, letterSpacing: -0.3 },
  promoSubtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500', lineHeight: 17 },
  promoCta: {
    alignSelf: 'flex-start',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 9,
    marginTop: 4,
  },
  promoCtaText: { color: COLORS.white, fontSize: 13, fontWeight: '700' },
  promoIconWrap: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoDecor: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: COLORS.white,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md, gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary, width: 20, borderRadius: 3 },

  // ── Section ─────────────────────────────────────────────────────────────────
  section: { marginTop: SPACING.xl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, marginBottom: SPACING.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.3 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  cardRow: { paddingHorizontal: SPACING.md, gap: SPACING.md, paddingRight: SPACING.lg },

  // ── Store card ──────────────────────────────────────────────────────────────
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },
  cardImageArea: {
    width: '100%',
    height: CARD_IMAGE_H,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  // Giant background letter — like a magazine editorial initial
  cardInitialBg: {
    position: 'absolute',
    fontSize: 110,
    fontWeight: '900',
    letterSpacing: -4,
  },
  cardIconCircle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardHeartPosition: { position: 'absolute', top: 10, right: 10 },
  heartBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  statusBadge: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardInfo: { paddingHorizontal: SPACING.md, paddingVertical: 12, gap: 4 },
  cardName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardDistance: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '500' },

  // ── Empty state ─────────────────────────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xl * 2 },
  emptyIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  emptySub: { fontSize: 13, color: COLORS.textSecondary },
});
