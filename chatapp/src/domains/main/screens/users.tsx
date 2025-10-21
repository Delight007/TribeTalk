import { useMutation, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAllUsers } from '../../../api/auth';
import api from '../../../api/axios';
import { useTheme } from '../../../shared/contexts/themeContext';
import { useUserStore } from '../../../shared/global/userStore';

export default function AppUsers() {
  const { theme } = useTheme();
  const { currentUser, setCurrentUser } = useUserStore();
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const { data: users = [], isLoading } = useAllUsers();

  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-white' : 'text-[#1a2a22]';
  const subText = isDark ? 'text-gray-400' : 'text-gray-600';
  const bgColor = isDark ? 'bg-[#1a2a22]' : 'bg-gray-100';

  // Return early if no user
  if (!currentUser) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">User not logged in</Text>
      </View>
    );
  }

  const followMutation = useMutation({
    mutationFn: async (params: {
      userId: string;
      action: 'follow' | 'unfollow';
    }) => {
      const { data } = await api.post(
        `/users/${params.action}/${params.userId}`,
      );
      return data.targetUser; // we return the updated target user
    },
    onSuccess: (updatedUser, variables) => {
      // 1️⃣ Update users cache
      queryClient.setQueryData(['users'], (oldUsers: any) =>
        oldUsers.map((user: any) =>
          user._id === updatedUser._id ? updatedUser : user,
        ),
      );

      // 2️⃣ Update currentUser following
      const updatedFollowing =
        variables.action === 'follow'
          ? [...(currentUser.following || []), variables.userId]
          : (currentUser.following || []).filter(id => id !== variables.userId);

      setCurrentUser({ ...currentUser, following: updatedFollowing });
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator
          size="large"
          color={isDark ? '#6EE7B7' : '#10B981'}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0f3d2e', '#09261e', '#000000']
          : ['#b8e1af', '#d3f9d8', '#ffffff']
      }
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <SafeAreaView className="flex-1 px-6">
        <Text className={`text-2xl font-bold my-6 ${textColor}`}>
          All Users
        </Text>

        <FlatList
          data={users}
          keyExtractor={item => item._id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const isFollowing = currentUser.following?.includes(item._id);

            return (
              <View
                className={`flex-row items-center justify-between mb-4 p-4 rounded-full ${bgColor}`}
              >
                <View className="flex-row items-center">
                  <Image
                    source={{
                      uri: item.avatar || 'https://via.placeholder.com/50',
                    }}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <View>
                    <Text className={`text-lg font-medium ${textColor}`}>
                      {item.name}
                    </Text>
                    <Text className={`text-sm ${subText}`}>
                      @{item.username}
                    </Text>
                    {/* <Text className={`text-sm ${subText}`}>
                      Followers: {item.followers?.length || 0}
                    </Text> */}
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setPendingId(item._id); // mark this user as pending
                    followMutation.mutate(
                      {
                        userId: item._id,
                        action: isFollowing ? 'unfollow' : 'follow',
                      },
                      {
                        onSettled: () => setPendingId(null), // reset when done
                      },
                    );
                  }}
                  disabled={pendingId === item._id} // disable only the clicked button
                  className={`px-4 py-2 rounded-full ${
                    isFollowing ? 'bg-gray-400' : 'bg-green-600'
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isFollowing ? 'text-black' : 'text-white'
                    }`}
                  >
                    {isFollowing
                      ? pendingId === item._id
                        ? 'Unfollowing...'
                        : 'Unfollow'
                      : pendingId === item._id
                        ? 'Following...'
                        : 'Follow'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
