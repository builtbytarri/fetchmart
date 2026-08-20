import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SPACING } from '../constants/config';
import { ProductUnit, StockMode, UNIT_LABEL } from '../types';

const UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'PIECE', label: 'Piece' },
  { value: 'MUDU', label: 'Mudu' },
  { value: 'KG', label: 'Kg' },
  { value: 'BAG', label: 'Bag' },
  { value: 'LITRE', label: 'Litre' },
  { value: 'PACK', label: 'Pack' },
];

interface Props {
  unit: ProductUnit;
  onUnitChange: (u: ProductUnit) => void;
  stepSize: string;
  onStepSizeChange: (s: string) => void;
  stockMode: StockMode;
  onStockModeChange: (m: StockMode) => void;
  stockQuantity: string;
  onStockQuantityChange: (v: string) => void;
}

/**
 * Unit of sale, smallest sellable amount, and how stock is tracked.
 *
 * Shared by Add and Edit Product so the two forms cannot drift apart.
 */
export const ProductMeasureFields: React.FC<Props> = ({
  unit,
  onUnitChange,
  stepSize,
  onStepSizeChange,
  stockMode,
  onStockModeChange,
  stockQuantity,
  onStockQuantityChange,
}) => {
  const measured = unit !== 'PIECE';
  const counted = stockMode === 'COUNTED';

  return (
    <>
      {/* ── Unit of sale ─────────────────────────────────────────────── */}
      <View style={styles.group}>
        <Text style={styles.label}>Sold by</Text>
        <View style={styles.chipRow}>
          {UNITS.map((u) => (
            <TouchableOpacity
              key={u.value}
              style={[styles.chip, unit === u.value && styles.chipActive]}
              onPress={() => {
                onUnitChange(u.value);
                // A piece is indivisible; measured goods default to halves,
                // which is what customers ask for most often.
                onStepSizeChange(u.value === 'PIECE' ? '1' : '0.5');
              }}
            >
              <Text style={[styles.chipText, unit === u.value && styles.chipTextActive]}>
                {u.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>
          {measured
            ? `Customers will see prices as ₦… / ${UNIT_LABEL[unit]} and can buy part of one.`
            : 'Customers buy whole items only.'}
        </Text>
      </View>

      {/* ── Smallest amount, only relevant for measured goods ─────────── */}
      {measured && (
        <View style={styles.group}>
          <Text style={styles.label}>Smallest amount a customer can buy</Text>
          <View style={styles.chipRow}>
            {['0.25', '0.5', '1'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, stepSize === s && styles.chipActive]}
                onPress={() => onStepSizeChange(s)}
              >
                <Text style={[styles.chipText, stepSize === s && styles.chipTextActive]}>
                  {s === '0.25' ? '¼' : s === '0.5' ? '½' : '1'} {UNIT_LABEL[unit]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* ── Stock tracking ───────────────────────────────────────────── */}
      <View style={styles.group}>
        <Text style={styles.label}>Stock</Text>
        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, counted && styles.segmentBtnActive]}
            onPress={() => onStockModeChange('COUNTED')}
          >
            <Text style={[styles.segmentText, counted && styles.segmentTextActive]}>
              Track quantity
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, !counted && styles.segmentBtnActive]}
            onPress={() => onStockModeChange('IN_STOCK')}
          >
            <Text style={[styles.segmentText, !counted && styles.segmentTextActive]}>
              In stock
            </Text>
          </TouchableOpacity>
        </View>

        {counted ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={COLORS.textSecondary}
              value={stockQuantity}
              onChangeText={onStockQuantityChange}
              keyboardType="numeric"
            />
            <Text style={styles.hint}>
              We count down as orders come in and hide the item at zero.
            </Text>
          </>
        ) : (
          <Text style={styles.hint}>
            No counting needed — the item shows as “In Stock” until you mark it
            unavailable. Best for things you buy in bulk and sell one by one.
          </Text>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  group: { marginBottom: SPACING.lg },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  hint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6, lineHeight: 17 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  chipTextActive: { color: COLORS.primaryDark },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  segmentBtn: { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  segmentBtnActive: { backgroundColor: COLORS.white },
  segmentText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  segmentTextActive: { color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.white,
  },
});
