import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { COLORS, SPACING } from '../../constants/config';

type Props = {
  navigation: NativeStackNavigationProp<any>;
  onClose?: () => void;
};

const SEARCH_CATEGORIES = [
  'Detergents',
  'Eggs',
  'Rice',
  'Beans',
  'Toothpaste',
  'Decorations',
  'Pizza',
  'Pasta',
  'Soups',
  'Drinks',
  'Sauce',
  'Rice',
  'Bread',
  'Milk',
  'Cheese',
  'Butter',
];

export const SearchScreen: React.FC<Props> = ({ navigation, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCategories = searchQuery
    ? SEARCH_CATEGORIES.filter((cat) =>
        cat.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SEARCH_CATEGORIES;

  const handleCategoryPress = (category: string) => {
    // Navigate to search results or filter products
    console.log('Search for:', category);
  };

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search Fetchmart"
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      {/* Category List */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item)}
          >
            <Text style={styles.categoryText}>{item}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    marginRight: SPACING.sm,
  },
  searchContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  searchInput: {
    fontSize: 16,
    color: COLORS.text,
  },
  listContent: {
    paddingTop: SPACING.sm,
  },
  categoryItem: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  categoryText: {
    fontSize: 16,
    color: COLORS.text,
  },
});
