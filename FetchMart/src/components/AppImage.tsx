import React from 'react';
import { Image as RNImage, ImageStyle, StyleProp } from 'react-native';

/**
 * Remote image with disk caching and fade-in, falling back to the plain
 * React Native Image when the expo-image native module is absent (older dev
 * clients). Production builds always have the module.
 *
 * expo-image gives us the two things the plain Image lacks on slow
 * connections: a persistent disk cache (first load is the only slow load)
 * and progressive per-image rendering, so cards appear as each photo
 * arrives instead of the screen waiting on the whole set.
 */
let ExpoImage: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoImage = require('expo-image').Image;
} catch {
  ExpoImage = null;
}

interface Props {
  uri: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain';
}

export const AppImage: React.FC<Props> = ({ uri, style, contentFit = 'cover' }) => {
  if (ExpoImage) {
    return (
      <ExpoImage
        source={{ uri }}
        style={style}
        contentFit={contentFit}
        transition={180}
        cachePolicy="disk"
      />
    );
  }
  return <RNImage source={{ uri }} style={style} resizeMode={contentFit} />;
};
