import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCurrentUser, useUpdateProfile } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import { uploadImageToCloudinary } from '../../../utils/uploadImages';

const EditProfile = ({ navigation }: any) => {
  const { theme } = useTheme();
  const updateProfile = useUpdateProfile();
  const { data: currentUser, isLoading } = useCurrentUser();

  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('Prefer not to say');

  // 🧠 Populate fields when user data loads
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setProfileImage(currentUser.avatar || null);
      setGender(currentUser.gender || 'Prefer not to say');
    }
  }, [currentUser]);

  const handleImagePick = async () => {
    launchImageLibrary({ mediaType: 'photo' }, async response => {
      if (response.didCancel) return;
      if (response.assets && response.assets.length > 0) {
        let uri = response.assets[0]?.uri ?? null;
        if (!uri) return;

        // Android content:// fix
        if (Platform.OS === 'android' && uri.startsWith('content://')) {
          uri = uri; // For now, can upload directly. Optional: convert to file:// using react-native-fs
        }

        try {
          setUploading(true);
          const imageUrl = await uploadImageToCloudinary(uri);
          setProfileImage(imageUrl);
          setUploading(false);
          Alert.alert('Success', 'Profile image uploaded!');
        } catch (err: any) {
          setUploading(false);
          Alert.alert('Error', err.message || 'Failed to upload image');
        }
      }
    });
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        name,
        username,
        bio,
        gender,
        avatar: profileImage,
      });
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile');
    }
  };

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
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons
              name="close"
              size={26}
              color={theme === 'dark' ? '#fff' : '#000'}
            />
          </TouchableOpacity>

          <Text
            className={`text-lg font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}
          >
            Edit Profile
          </Text>

          <TouchableOpacity onPress={handleSave}>
            <Text className="text-[#0095F6] text-base font-semibold">Save</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="px-6"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Profile Picture */}
          <View className="items-center mt-6">
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                className="w-[90px] h-[90px] rounded-full mb-2"
              />
            ) : (
              <View className="w-[90px] h-[90px] rounded-full mb-2 bg-gray-300" />
            )}

            <TouchableOpacity onPress={handleImagePick} disabled={uploading}>
              <Text className="text-[#0095F6] text-base">
                {uploading ? 'Uploading...' : 'Edit picture'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View className="mt-8">
            <Text
              className={`mb-2 text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Name
            </Text>
            <TextInput
              className={`p-3 rounded-full mb-5 ${
                theme === 'dark'
                  ? 'bg-[#1a2a22] text-white'
                  : 'bg-zinc-200 text-black'
              }`}
              value={name}
              onChangeText={setName}
            />

            <Text
              className={`mb-2 text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Username
            </Text>
            <TextInput
              className={`p-3 rounded-full mb-5 ${
                theme === 'dark'
                  ? 'bg-[#1a2a22] text-white'
                  : 'bg-zinc-200 text-black'
              }`}
              value={username}
              onChangeText={setUsername}
            />

            <Text
              className={`mb-2 text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Bio
            </Text>
            <TextInput
              multiline
              className={`p-3 rounded-full mb-6 ${
                theme === 'dark'
                  ? 'bg-[#1a2a22] text-white'
                  : 'bg-zinc-200 text-black'
              }`}
              value={bio}
              onChangeText={setBio}
            />

            <TouchableOpacity className="mb-6">
              <Text className="text-[#0095F6] text-base">Add link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row justify-between items-center mb-6"
              onPress={() =>
                Alert.alert('Gender', 'Gender selection coming soon!')
              }
            >
              <Text
                className={`text-sm ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Gender
              </Text>
              <Text className="text-gray-500 text-sm">{gender}</Text>
            </TouchableOpacity>

            <TouchableOpacity>
              <Text className="text-[#0095F6] text-base">
                Personal information settings
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default EditProfile;
