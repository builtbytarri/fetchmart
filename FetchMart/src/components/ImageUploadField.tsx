import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../constants/config';
import { storageApi, UploadFolder } from '../api';

interface Props {
  label?: string;
  /** Current image URL, or null when nothing has been set yet. */
  value: string | null;
  onChange: (url: string | null) => void;
  folder: UploadFolder;
  /** Square avatar-style tile vs a wide banner. */
  shape?: 'square' | 'wide';
}

/**
 * Pick an image from the library and upload it, reporting the resulting public
 * URL through onChange. Uploading happens immediately on pick so the caller
 * only ever deals with a finished URL — the save button never has to wait on
 * a transfer.
 */
export const ImageUploadField: React.FC<Props> = ({
  label,
  value,
  onChange,
  folder,
  shape = 'square',
}) => {
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo access in Settings to add an image.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: shape === 'wide' ? [16, 9] : [1, 1],
      // Compress on-device: stores are on mobile data and Cloudinary bills by
      // stored bytes, so there is no reason to ship a 12MP original.
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return;

    setUploading(true);
    try {
      const url = await storageApi.uploadImage(result.assets[0].uri, folder);
      onChange(url);
    } catch (err: any) {
      Alert.alert(
        'Upload failed',
        err?.response?.data?.message || err?.message || 'Could not upload the image.',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={[styles.tile, shape === 'wide' && styles.tileWide]}
        onPress={pick}
        disabled={uploading}
        activeOpacity={0.8}
      >
        {uploading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : value ? (
          <Image source={{ uri: value }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.empty}>
            <Ionicons name="camera-outline" size={26} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Add photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {value && !uploading && (
        <View style={styles.actions}>
          <TouchableOpacity onPress={pick}>
            <Text style={styles.actionText}>Change</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onChange(null)}>
            <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: SPACING.md },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  tile: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileWide: { width: '100%', height: 160 },
  preview: { width: '100%', height: '100%' },
  empty: { alignItems: 'center', gap: 4 },
  emptyText: { fontSize: 12, color: COLORS.textSecondary },
  actions: { flexDirection: 'row', gap: SPACING.md, marginTop: SPACING.sm },
  actionText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  removeText: { color: COLORS.error },
});
