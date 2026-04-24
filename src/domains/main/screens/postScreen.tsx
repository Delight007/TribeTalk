import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { createThumbnail } from 'react-native-create-thumbnail';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { LinearGradient } from 'react-native-linear-gradient';
import { useTheme } from '../../../shared/contexts/themeContext';
import { RootStackParamList } from '../../../types/navigation';

type MediaType = 'POST' | 'STORY' | 'REEL';

const { width } = Dimensions.get('window');
const ITEM_SIZE = width / 3 - 4;

interface PostScreenProps {
  onContinue?: (selectedMedia: any[]) => void;
  onOpenCamera?: () => void;
}

type PostScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PostScreen'
>;

const styles = StyleSheet.create({
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#16a34a',
  },
  inactiveTab: {
    backgroundColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    color: 'white',
  },
  inactiveTabText: {
    color: '#6b7280',
  },

  mediaItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 2,
    position: 'relative',
  },

  continueFAB: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  scrollTopButton: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default function PostScreen({
  onContinue,
  onOpenCamera,
}: PostScreenProps) {
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [selectedTab, setSelectedTab] = useState<MediaType>('POST');
  const [mediaFiles, setMediaFiles] = useState<any[]>([]);
  const [filteredMediaFiles, setFilteredMediaFiles] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<any[]>([]);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation<PostScreenNavigationProp>();

  const thumbnailCache: Record<string, string> = {};

  useEffect(() => {
    requestPermissions();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    filterMediaByTab();
  }, [selectedTab, mediaFiles]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        let granted = false;
        if (Platform.Version >= 33) {
          const results = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
          ]);
          granted =
            results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO] ===
              PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          );
          granted = result === PermissionsAndroid.RESULTS.GRANTED;
        }

        if (granted) {
          setHasPermission(true);
          await loadMedia(true);
        } else {
          Alert.alert(
            'Permission Required',
            'Please grant storage permission to access your media',
            [{ text: 'OK' }],
          );
        }
      } catch (err) {
        console.warn('Permission error:', err);
      }
    } else {
      setHasPermission(true);
      await loadMedia(true);
    }
  };

  const filterMediaByTab = () => {
    if (!mediaFiles.length) {
      setFilteredMediaFiles([]);
      return;
    }

    let filtered = [];

    switch (selectedTab) {
      case 'POST':
        filtered = [...mediaFiles];
        break;

      case 'STORY':
        filtered = mediaFiles.filter(item => {
          const isImage =
            item.type?.startsWith('image') || item.type?.includes('image');
          const isVideo =
            item.type?.startsWith('video') || item.type?.includes('video');
          const duration = item.image?.playableDuration || 0;

          return isImage || (isVideo && duration <= 90);
        });
        break;

      case 'REEL':
        filtered = mediaFiles.filter(item => {
          return item.type?.startsWith('video') || item.type?.includes('video');
        });
        break;

      default:
        filtered = [...mediaFiles];
    }

    setFilteredMediaFiles(filtered);
  };

  const getThumbnail = async (uri: string) => {
    if (thumbnailCache[uri]) return thumbnailCache[uri];
    try {
      const { path } = await createThumbnail({ url: uri, timeStamp: 1000 });
      thumbnailCache[uri] = path;
      return path;
    } catch (err) {
      thumbnailCache[uri] = uri;
      return uri;
    }
  };

  const loadMedia = async (initial = false) => {
    if (loadingMore || !hasPermission) return;
    setLoadingMore(true);

    try {
      const results = await CameraRoll.getPhotos({
        first: 30,
        after: initial ? undefined : endCursor,
        assetType: 'All',
      });

      const newMedia = await Promise.all(
        results.edges.map(async (item: any) => {
          const node = item.node;
          const isVideo =
            node.type?.startsWith('video') || node.type?.includes('video');

          const mediaItem = {
            ...node,
            isVideo,
            isImage:
              node.type?.startsWith('image') || node.type?.includes('image'),
            duration: node.image?.playableDuration || 0,
          };

          if (isVideo) {
            const thumbnail = await getThumbnail(node.image.uri);
            return { ...mediaItem, thumbnail };
          }
          return mediaItem;
        }),
      );

      const updatedMedia = initial
        ? [...newMedia]
        : [...mediaFiles, ...newMedia];
      setMediaFiles(updatedMedia);
      setEndCursor(results.page_info.end_cursor);
    } catch (e) {
      console.warn('Error loading media', e);
      Alert.alert('Error', 'Failed to load media. Please try again.');
    } finally {
      setLoadingMore(false);
      if (initial) setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setEndCursor(undefined);
    setMediaFiles([]);
    setFilteredMediaFiles([]);
    await loadMedia(true);
  };

  const toggleSelect = (item: any) => {
    const id = item.image.uri + (item.isVideo ? '-video' : '');

    const exists = selectedMedia.find(m => m.id === id);
    if (exists) {
      setSelectedMedia(prev => prev.filter(m => m.id !== id));
    } else {
      setSelectedMedia(prev => [...prev, { ...item, id }]);
    }
  };

  const handleOpenCamera = () => {
    launchCamera(
      {
        mediaType: 'mixed', // can be 'photo' | 'video' | 'mixed'
        cameraType: 'back',
        saveToPhotos: true,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Camera Error', response.errorMessage || 'Unknown error');
          return;
        }
        if (response.assets?.length) {
          const asset = response.assets[0];
          const newItem = {
            image: { uri: asset.uri },
            type: asset.type?.startsWith('video') ? 'video' : 'image',
            isVideo: asset.type?.startsWith('video'),
            isImage: asset.type?.startsWith('image'),
            duration: asset.duration ?? 0,
            thumbnail: asset.uri, // camera will use same
          };
          setMediaFiles(prev => [newItem, ...prev]);
        }
      },
    );
  };

  const handleContinue = () => {
    if (onContinue) {
      onContinue(selectedMedia);
    }
    navigation.navigate('PreviewScreen', {
      selectedMedia,
      postType: selectedTab,
    });
  };
  const handleBrowseFiles = () => {
    launchImageLibrary(
      {
        mediaType: 'mixed',
        selectionLimit: 0, // 0 = unlimited
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Picker Error', response.errorMessage || 'Unknown error');
          return;
        }
        if (response.assets?.length) {
          const newFiles = response.assets.map(asset => ({
            image: { uri: asset.uri },
            type: asset.type?.startsWith('video') ? 'video' : 'image',
            isVideo: asset.type?.startsWith('video'),
            isImage: asset.type?.startsWith('image'),
            duration: asset.duration ?? 0,
            thumbnail: asset.uri,
            fromGallery: true,
          }));
          setMediaFiles(prev => [...newFiles, ...prev]);
        }
      },
    );
  };

  const renderItem = ({ item, index }: any) => {
    // First item is Camera, second is Folder Access
    if (index === 0) {
      return (
        <TouchableOpacity
          className="m-1 rounded-xl justify-center items-center"
          style={{
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
          }}
          onPress={handleOpenCamera}
          activeOpacity={0.7}
        >
          <View className="w-12 h-12 rounded-full bg-green-600 justify-center items-center">
            <Ionicons name="camera" size={24} color="white" />
          </View>
          <Text className="text-green-700 mt-2 font-medium text-xs">
            Camera
          </Text>
        </TouchableOpacity>
      );
    }

    if (index === 1) {
      return (
        <TouchableOpacity
          className="m-1 rounded-xl justify-center items-center"
          style={{
            width: ITEM_SIZE,
            height: ITEM_SIZE,
            backgroundColor: 'rgba(22, 163, 74, 0.1)',
          }}
          onPress={handleBrowseFiles}
          activeOpacity={0.7}
        >
          <View className="w-12 h-12 rounded-full bg-green-600 justify-center items-center">
            <Ionicons name="folder-open" size={24} color="white" />
          </View>
          <Text className="text-green-700 mt-2 font-medium text-xs text-center px-1">
            Browse Files
          </Text>
        </TouchableOpacity>
      );
    }

    // Adjust index for media items (skip camera and folder items)
    const mediaIndex = index - 2;
    const mediaItem = filteredMediaFiles[mediaIndex];

    if (!mediaItem) return null;

    const isVideo = mediaItem.isVideo;
    const isSelected = !!selectedMedia.find(
      m => m.id === mediaItem.image.uri + (isVideo ? '-video' : ''),
    );

    return (
      <TouchableOpacity
        style={styles.mediaItem}
        onPress={() => toggleSelect(mediaItem)}
        activeOpacity={0.8}
      >
        <Image
          source={{
            uri: isVideo
              ? mediaItem.thumbnail || mediaItem.image.uri
              : mediaItem.image.uri,
          }}
          className="w-full h-full rounded-lg"
          resizeMode="cover"
        />

        {isSelected && (
          <View className="absolute inset-0 bg-green-600/90 rounded-lg justify-center items-center">
            <View className="w-10 h-10 rounded-full bg-white justify-center items-center">
              <Ionicons name="checkmark" size={24} color="#16a34a" />
            </View>
          </View>
        )}

        {!isSelected && selectedMedia.length > 0 && (
          <View className="absolute inset-0 bg-black/30 rounded-lg" />
        )}

        {isVideo && (
          <View className="absolute bottom-2 left-2 flex-row items-center bg-black/60 rounded-full px-2 py-1">
            <Ionicons name="play" size={12} color="white" />
            <Text className="text-white text-xs font-semibold ml-1">
              {mediaItem.duration
                ? `${Math.floor(mediaItem.duration / 60)}:${('0' + (mediaItem.duration % 60)).slice(-2)}`
                : '0:00'}
            </Text>
          </View>
        )}

        {isSelected && (
          <View className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white justify-center items-center shadow-lg">
            <Text className="text-green-600 font-bold text-sm">
              {selectedMedia.findIndex(
                m => m.id === mediaItem.image.uri + (isVideo ? '-video' : ''),
              ) + 1}
            </Text>
          </View>
        )}

        {mediaItem.fromFilePicker && (
          <View className="absolute top-2 left-2 w-4 h-4 bg-green-600 rounded-full justify-center items-center">
            <Ionicons name="document" size={10} color="white" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getTabStyle = (type: MediaType) => {
    if (selectedTab === type) {
      return { backgroundColor: '#16a34a' }; // Green-600
    }
    return {};
  };

  if (!hasPermission) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <Ionicons name="lock-closed" size={64} color="#9ca3af" />
        <Text className="text-xl font-bold text-gray-800 mt-4">
          Permission Required
        </Text>
        <Text className="text-gray-600 text-center mt-2 mb-6">
          Please grant storage permission to access your photos and videos
        </Text>
        <TouchableOpacity
          className="bg-green-600 py-3 px-6 rounded-full"
          onPress={requestPermissions}
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Prepare data for FlatList (Camera + Folder + Media)
  const flatListData = [
    { id: 'camera', type: 'camera' },
    { id: 'folder', type: 'folder' },
    ...filteredMediaFiles,
  ];

  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0f3d2e', '#09261e', '#000000']
          : ['#b8e1af', '#d3f9d8', '#ffffff']
      }
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <Animated.View style={{ opacity: fadeAnim }} className="flex-1 ">
        {/* Tabs - Green theme */}
        <View
          className={`flex-row justify-around py-3  border-b  ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          {(['POST', 'STORY', 'REEL'] as MediaType[]).map(type => (
            <TouchableOpacity
              key={type}
              onPress={() => {
                setSelectedTab(type);
                if (type !== selectedTab) {
                  setSelectedMedia([]);
                }
              }}
              style={[styles.tabButton, getTabStyle(type)]}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={
                    type === 'POST'
                      ? 'grid-outline'
                      : type === 'STORY'
                        ? 'time-outline'
                        : 'videocam-outline'
                  }
                  size={16}
                  color={selectedTab === type ? 'white' : '#6b7280'}
                  className="mr-2"
                />
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === type
                      ? styles.activeTabText
                      : {
                          // dynamic inactive color
                          color: isDark ? '#9ca3af' : '#6b7280',
                        },
                  ]}
                >
                  {type}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats */}
        <View
          className={`px-4 py-3  border-b   ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <View className="flex-row justify-between items-center">
            <Text
              className={` ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} font-medium`}
            >
              {filteredMediaFiles.length} media item
              {filteredMediaFiles.length !== 1 ? 's' : ''}
            </Text>
            {selectedMedia.length > 0 && (
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                <Text className="text-green-600 font-medium">
                  {selectedMedia.length} selected
                </Text>
              </View>
            )}
          </View>

          <Text className="text-xs text-gray-500 mt-1">
            {selectedTab === 'POST' && 'All photos and videos from gallery'}
            {selectedTab === 'STORY' &&
              'Photos and short videos (≤ 90 seconds)'}
            {selectedTab === 'REEL' && 'Videos only'}
          </Text>
        </View>

        {/* Media Grid */}
        <FlatList
          ref={flatListRef}
          data={flatListData}
          keyExtractor={(item, index) => {
            if (item.type === 'camera') return 'camera';
            if (item.type === 'folder') return 'folder';
            return `${item.image?.uri}-${index}-${selectedTab}`;
          }}
          numColumns={3}
          onEndReached={() => loadMedia(false)}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={onRefresh}
          className="px-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loadingMore ? (
              <View className="py-20 items-center px-4">
                <Ionicons
                  name="images-outline"
                  size={64}
                  color="#d1d5db"
                  className="mb-4"
                />
                <Text className="text-gray-500 text-lg mb-2 text-center">
                  No media found in gallery
                </Text>
                <Text className="text-gray-400 text-sm text-center mb-6">
                  Use Camera or Browse Files to add media, or grant permission
                  to access gallery
                </Text>
                <View className="flex-row space-x-3">
                  <TouchableOpacity
                    className="bg-green-600 py-3 px-6 rounded-lg"
                    onPress={handleOpenCamera}
                  >
                    <Text className="text-white font-medium">Open Camera</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-gray-200 py-3 px-6 rounded-lg"
                    onPress={handleBrowseFiles}
                  >
                    <Text className="text-gray-700 font-medium">
                      Browse Files
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={() =>
            loadingMore ? (
              <View className="py-6">
                <ActivityIndicator size="large" color="#16a34a" />
              </View>
            ) : null
          }
          renderItem={renderItem}
        />

        {/* Scroll to top button */}
        <TouchableOpacity
          onPress={() =>
            flatListRef.current?.scrollToOffset({ animated: true, offset: 0 })
          }
          style={styles.scrollTopButton}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-up" size={24} color="#4b5563" />
        </TouchableOpacity>

        {/* Continue FAB */}
        {selectedMedia.length > 0 && (
          <TouchableOpacity
            style={styles.continueFAB}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 justify-center items-center">
              <Text className="text-white text-xs font-bold">
                {selectedMedia.length}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={28} color="white" />
          </TouchableOpacity>
        )}

        {/* Bottom Continue Button */}
        {selectedMedia.length > 0 && (
          <View className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-10 px-6 shadow-lg border-t border-gray-200">
            <TouchableOpacity
              className="py-4 rounded-xl justify-center items-center bg-green-600"
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="white"
                  className="mr-2"
                />
                <Text className="text-white text-lg font-bold">
                  Continue with {selectedMedia.length} item
                  {selectedMedia.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text className="text-white/80 text-sm mt-1">
                Tap to preview selection
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}
