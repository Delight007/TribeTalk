// SkeletonPostCard.tsx
import React from 'react';
import { View } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';

export default function SkeletonPostCard() {
  return (
    <SkeletonPlaceholder>
      <View className="mb-4 p-2">
        {/* User Info */}
        <View className="flex-row items-center px-3 mb-2">
          <View style={{ width: 40, height: 40, borderRadius: 20 }} />
          <View style={{ marginLeft: 12 }}>
            <View style={{ width: 120, height: 14, borderRadius: 4 }} />
            <View
              style={{ width: 80, height: 12, borderRadius: 4, marginTop: 6 }}
            />
          </View>
        </View>

        {/* Media */}
        <View style={{ width: '100%', height: 240, borderRadius: 8 }} />

        {/* Caption lines */}
        <View style={{ marginTop: 8 }}>
          <View style={{ width: '80%', height: 12, borderRadius: 4 }} />
          <View
            style={{ width: '60%', height: 12, borderRadius: 4, marginTop: 6 }}
          />
        </View>
      </View>
    </SkeletonPlaceholder>
  );
}
