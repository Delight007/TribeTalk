// PreviewScreen.tsx

import Ionicons from '@react-native-vector-icons/ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { VideoRef } from 'react-native-video';
import { PostRequestBody, useCreatePost } from '../../../api/auth';
import api from '../../../api/axios';
import { RootStackParamList } from '../../../types/navigation';
import { uploadImageToCloudinary } from '../../../utils/uploadImages';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'PreviewScreen'>;

type MediaItem = {
  id: string;
  image: { uri: string };
  isVideo: boolean;
  thumbnail?: string;
  duration?: number;
};

type Tag = {
  id: string;
  name: string;
};

// Define proper types for video progress
interface VideoProgress {
  currentTime: number;
  playableDuration: number;
  seekableDuration: number;
}

interface VideoLoad {
  duration: number;
  naturalSize: {
    width: number;
    height: number;
    orientation: 'landscape' | 'portrait';
  };
}

export default function PreviewScreen({ route, navigation }: Props) {
  const { selectedMedia: initialMedia, postType } = route.params;
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>(initialMedia);
  const [captions, setCaptions] = useState<string[]>(
    initialMedia.map(() => ''),
  );
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [location, setLocation] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [postSettings, setPostSettings] = useState({
    audience: 'Public' as 'Public' | 'Friends' | 'Private',
    notifications: true,
    schedule: null as Date | null,
  });
  const createPostMutation = useCreatePost();

  const flatListRef = useRef<FlatList>(null);
  const videoRef = useRef<VideoRef>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Add tags
  const addTag = useCallback(() => {
    if (
      newTag.trim() &&
      !tags.some(t => t.name.toLowerCase() === newTag.toLowerCase())
    ) {
      setTags([...tags, { id: Date.now().toString(), name: newTag.trim() }]);
      setNewTag('');
    }
  }, [newTag, tags]);

  // Remove tag
  const removeTag = useCallback(
    (id: string) => {
      setTags(tags.filter(tag => tag.id !== id));
    },
    [tags],
  );

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Remove item
  const removeItem = (id: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        onPress: () => {
          const idx = selectedMedia.findIndex(item => item.id === id);
          const updated = selectedMedia.filter(item => item.id !== id);
          const updatedCap = captions.filter((_, i) => i !== idx);

          setSelectedMedia(updated);
          setCaptions(updatedCap);

          if (activeIndex >= updated.length && updated.length > 0) {
            setActiveIndex(updated.length - 1);
            flatListRef.current?.scrollToIndex({
              index: updated.length - 1,
              animated: true,
            });
          }
        },
        style: 'destructive',
      },
    ]);
  };

  // Handle video progress
  const onVideoProgress = (data: VideoProgress) => {
    setVideoProgress(data.currentTime);
  };

  // Handle video load
  const onVideoLoad = (data: VideoLoad) => {
    setVideoDuration(data.duration);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Seek video
  const seekVideo = (value: number) => {
    if (videoRef.current) {
      videoRef.current.seek(value);
      setVideoProgress(value);
    }
  };

  // Handle viewable items
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        const newIndex = viewableItems[0].index;
        setActiveIndex(newIndex);
        setIsPlaying(true);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  // Handle post
  const handlePost = async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      // setTimeout(() => {
      //   setIsLoading(false);
      //   Alert.alert('Posted!', 'Your content has been posted successfully.', [
      //     {
      //       text: 'OK',
      //       onPress: () => navigation.goBack(),
      //     },
      //   ]);
      // }, 2000);

      // 1. Upload all selected media
      const uploadedMedia = await Promise.all(
        selectedMedia.map(async item => {
          const url = await uploadImageToCloudinary(
            item.image.uri,
            item.isVideo,
          );
          return {
            url,
            type: item.isVideo ? ('video' as const) : ('image' as const),
          };
        }),
      );

      // 2. Build caption text for post
      const captionText = captions[activeIndex] || '';
      const tagNames = tags.map(tag => tag.name);

      const apiType =
        postType === 'POST' ? 'feed' : postType === 'STORY' ? 'story' : 'reel';

      const body: PostRequestBody = {
        type: apiType,
        media: uploadedMedia,
      };

      if (captionText.trim().length > 0) {
        body.caption = captionText;
      }

      if (tagNames.length > 0) {
        body.tags = tagNames;
      }

      console.log('Posting to:', api.defaults.baseURL + '/posts');
      console.log('Body:', body);

      // 3️⃣ Call mutation
      await createPostMutation.mutateAsync(body);

      Alert.alert('Posted!', 'Your content has been posted successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render media item
  const renderMediaItem = ({
    item,
    index,
  }: {
    item: MediaItem;
    index: number;
  }) => {
    const currentCaption = captions[index] || '';
    const isCurrentVideo = activeIndex === index && item.isVideo;

    return (
      <View style={styles.mediaContainer}>
        {item.isVideo ? (
          <View style={styles.videoContainer}>
            <Video
              ref={isCurrentVideo ? videoRef : null}
              source={{ uri: item.image.uri }}
              style={styles.video}
              paused={!isCurrentVideo || !isPlaying}
              controls={false}
              resizeMode="contain"
              onProgress={onVideoProgress}
              // onLoad={onVideoLoad}
              onEnd={() => setIsPlaying(false)}
              repeat={false}
            />
            <View style={styles.videoOverlay}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={togglePlayPause}
              >
                <Ionicons
                  name={isPlaying && isCurrentVideo ? 'pause' : 'play'}
                  size={36}
                  color="white"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.videoProgressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(videoProgress / (item.duration || videoDuration || 1)) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.durationText}>
                {formatDuration(videoProgress)} /{' '}
                {formatDuration(item.duration || videoDuration || 0)}
              </Text>
            </View>
          </View>
        ) : (
          <Image
            source={{ uri: item.image.uri }}
            style={styles.image}
            resizeMode="contain"
          />
        )}

        {currentCaption ? (
          <Animated.View
            style={[
              styles.captionOverlay,
              {
                opacity: scrollY.interpolate({
                  inputRange: [0, 50],
                  outputRange: [0.8, 0],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          >
            <Text style={styles.captionText} numberOfLines={3}>
              {currentCaption}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    );
  };

  // Render thumbnail
  const renderThumbnail = ({
    item,
    index,
  }: {
    item: MediaItem;
    index: number;
  }) => (
    <TouchableOpacity
      style={[
        styles.thumbnail,
        activeIndex === index && styles.activeThumbnail,
      ]}
      onPress={() => {
        setActiveIndex(index);
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
        });
      }}
    >
      <Image
        source={{ uri: item.thumbnail || item.image.uri }}
        style={styles.thumbnailImage}
        resizeMode="cover"
      />
      {item.isVideo && (
        <View style={styles.thumbnailVideoIndicator}>
          <Ionicons name="play" size={12} color="white" />
        </View>
      )}
      <TouchableOpacity
        style={styles.thumbnailRemove}
        onPress={() => removeItem(item.id)}
      >
        <Ionicons name="close-circle" size={20} color="#ff4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#000000', '#111111', '#222222']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Preview</Text>
            <Text style={styles.headerSubtitle}>
              {activeIndex + 1} of {selectedMedia.length}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowThumbnails(!showThumbnails)}
          >
            <Ionicons
              name={showThumbnails ? 'grid' : 'grid-outline'}
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {selectedMedia.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No media to preview</Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Main Media Carousel */}
            <Animated.View style={styles.carouselContainer}>
              <FlatList
                ref={flatListRef}
                data={selectedMedia}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                renderItem={renderMediaItem}
                keyExtractor={item => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollY } } }],
                  { useNativeDriver: false },
                )}
                scrollEventThrottle={16}
              />
            </Animated.View>

            {/* Thumbnail Strip */}
            {showThumbnails && selectedMedia.length > 1 && (
              <View style={styles.thumbnailStrip}>
                <FlatList
                  data={selectedMedia}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={renderThumbnail}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.thumbnailList}
                />
              </View>
            )}

            {/* Details Panel */}
            <ScrollView
              style={styles.detailsPanel}
              showsVerticalScrollIndicator={false}
            >
              {/* Caption Input */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="create-outline" size={20} color="#aaa" />
                  <Text style={styles.sectionTitle}>Caption</Text>
                </View>
                <TextInput
                  placeholder="Write a caption..."
                  placeholderTextColor="#666"
                  value={captions[activeIndex]}
                  onChangeText={text => {
                    const newCaps = [...captions];
                    newCaps[activeIndex] = text;
                    setCaptions(newCaps);
                  }}
                  style={styles.captionInput}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>
                  {captions[activeIndex].length}/2,200
                </Text>
              </View>

              {/* Tags */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="pricetag-outline" size={20} color="#aaa" />
                  <Text style={styles.sectionTitle}>Tags</Text>
                </View>
                <View style={styles.tagInputContainer}>
                  <TextInput
                    placeholder="Add tags..."
                    placeholderTextColor="#666"
                    value={newTag}
                    onChangeText={setNewTag}
                    style={styles.tagInput}
                    onSubmitEditing={addTag}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={addTag}
                  >
                    <Ionicons name="add" size={24} color="#16a34a" />
                  </TouchableOpacity>
                </View>
                {tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {tags.map(tag => (
                      <View key={tag.id} style={styles.tagItem}>
                        <Text style={styles.tagText}>#{tag.name}</Text>
                        <TouchableOpacity onPress={() => removeTag(tag.id)}>
                          <Ionicons name="close" size={16} color="#ff4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Location */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location-outline" size={20} color="#aaa" />
                  <Text style={styles.sectionTitle}>Location</Text>
                </View>
                <TextInput
                  placeholder="Add location"
                  placeholderTextColor="#666"
                  value={location}
                  onChangeText={setLocation}
                  style={styles.locationInput}
                />
              </View>

              {/* Post Settings */}
              <TouchableOpacity
                style={styles.section}
                onPress={() => setShowSettings(true)}
              >
                <View style={styles.sectionHeader}>
                  <Ionicons name="settings-outline" size={20} color="#aaa" />
                  <Text style={styles.sectionTitle}>Post Settings</Text>
                </View>
                <View style={styles.settingPreview}>
                  <Text style={styles.settingText}>
                    {postSettings.audience} •{' '}
                    {postSettings.notifications
                      ? 'Notifications On'
                      : 'Notifications Off'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Bottom Bar */}
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.postButton}
                onPress={handlePost}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.postButtonText}>
                      Post {selectedMedia.length}{' '}
                      {selectedMedia.length === 1 ? 'Item' : 'Items'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </SafeAreaView>

      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Post Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Audience</Text>
              {(['Public', 'Friends', 'Private'] as const).map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.settingOption}
                  onPress={() =>
                    setPostSettings({ ...postSettings, audience: item })
                  }
                >
                  <Text style={styles.settingOptionText}>{item}</Text>
                  {postSettings.audience === item && (
                    <Ionicons name="checkmark" size={20} color="#16a34a" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Notifications</Text>
              <TouchableOpacity
                style={styles.settingOption}
                onPress={() =>
                  setPostSettings({
                    ...postSettings,
                    notifications: !postSettings.notifications,
                  })
                }
              >
                <Text style={styles.settingOptionText}>
                  {postSettings.notifications ? 'On' : 'Off'}
                </Text>
                <Ionicons
                  name={
                    postSettings.notifications ? 'toggle' : 'toggle-outline'
                  }
                  size={24}
                  color={postSettings.notifications ? '#16a34a' : '#666'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.applyButtonText}>Apply Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerButton: {
    padding: 8,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
  carouselContainer: {
    height: height * 0.5,
  },
  mediaContainer: {
    width,
    height: '100%',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 1.5,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: 1.5,
  },
  durationText: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  captionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  captionText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    marginTop: 12,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  thumbnailStrip: {
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingVertical: 12,
  },
  thumbnailList: {
    paddingHorizontal: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  activeThumbnail: {
    borderColor: '#16a34a',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailVideoIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: 4,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  detailsPanel: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  captionInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 14,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    paddingVertical: 12,
  },
  addTagButton: {
    padding: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    marginRight: 6,
  },
  locationInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 14,
  },
  settingPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    color: '#aaa',
    fontSize: 14,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  postButton: {
    backgroundColor: '#16a34a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  modalSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalSectionTitle: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 12,
  },
  settingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingOptionText: {
    color: 'white',
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: '#16a34a',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
