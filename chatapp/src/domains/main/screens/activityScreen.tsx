import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Activity, markActivitiesRead, useActivities } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';
import BottomNavigator from '../components/bottomNavigator';

type ActivityTab = 'all' | 'mentions' | 'requests';

type NotificationItem = Activity & {
  id: string;
  name: string;
  avatar?: string;
  time: string;
  group: 'Today' | 'Earlier';
};

const ActivityScreen = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActivityTab>('all');
  const { data: activities = [], isLoading } = useActivities();

  useEffect(() => {
    void markActivitiesRead();
  }, []);

  const isDark = theme === 'dark';

  const colors = {
    title: isDark ? '#FFFFFF' : '#17211D',
    text: isDark ? '#F8FAFC' : '#17211D',
    muted: isDark ? '#A7B6B0' : '#64748B',
    card: isDark ? 'rgba(12, 52, 42, 0.76)' : 'rgba(255,255,255,0.88)',
    border: isDark ? '#255244' : '#C7D8CF',
    emerald: '#34D399',
    activeTab: isDark ? '#0D6B4A' : '#D1FAE5',
  };

  const activityItems = useMemo<NotificationItem[]>(
    () =>
      activities.map(activity => ({
        ...activity,
        id: activity._id,
        name: activity.actorName,
        avatar: activity.actorAvatar,
        time: new Date(activity.createdAt).toLocaleDateString(),
        group:
          new Date(activity.createdAt).toDateString() ===
          new Date().toDateString()
            ? 'Today'
            : 'Earlier',
      })),
    [activities],
  );

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return activityItems;

    if (activeTab === 'mentions') {
      return activityItems.filter(item => item.type === 'mention');
    }

    return activityItems.filter(item => item.type === 'request');
  }, [activeTab]);

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'like':
        return { name: 'heart' as const, color: '#FB5B7A' };
      case 'comment':
        return { name: 'chatbubble' as const, color: '#34D399' };
      case 'request':
        return { name: 'person-add' as const, color: '#60A5FA' };
      case 'mention':
        return { name: 'at' as const, color: '#A78BFA' };
    }
  };

  const NotificationRow = ({ item }: { item: NotificationItem }) => {
    const badge = getNotificationIcon(item.type);

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <View style={{ position: 'relative', marginRight: 13 }}>
          <View
            style={{
              width: 58,
              height: 58,
              borderRadius: 29,
              backgroundColor: '#36564B',
              overflow: 'hidden',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {item.avatar ? (
              <Image
                source={{ uri: item.avatar }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <Ionicons name="person-outline" size={28} color="#FFFFFF" />
            )}
          </View>

          <View
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: 25,
              height: 25,
              borderRadius: 13,
              backgroundColor: badge.color,
              borderWidth: 2,
              borderColor: colors.card,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name={badge.name} size={13} color="#FFFFFF" />
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 15,
              lineHeight: 21,
            }}
          >
            <Text style={{ fontWeight: '800' }}>{item.name} </Text>
            {item.message}
          </Text>

          <Text
            style={{
              color: colors.muted,
              fontSize: 13,
              marginTop: 4,
            }}
          >
            {item.time}
          </Text>
        </View>

        {item.type === 'request' && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              backgroundColor: colors.emerald,
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 9,
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                color: '#073326',
                fontSize: 13,
                fontWeight: '800',
              }}
            >
              Accept
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const Tab = ({ label, value }: { label: string; value: ActivityTab }) => {
    const selected = activeTab === value;

    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setActiveTab(value)}
        style={{
          flex: 1,
          height: 46,
          borderRadius: 14,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: selected ? colors.activeTab : 'transparent',
        }}
      >
        <Text
          style={{
            color: selected ? colors.emerald : colors.muted,
            fontSize: 15,
            fontWeight: selected ? '800' : '600',
          }}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const todayItems = filteredItems.filter(item => item.group === 'Today');
  const earlierItems = filteredItems.filter(item => item.group === 'Earlier');

  return (
    <LinearGradient
      colors={
        isDark
          ? ['#0C3E31', '#08271F', '#020B08']
          : ['#E6F4EA', '#C8E6C9', '#A5D6A7']
      }
      locations={[0, 0.42, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 20,
          }}
        >
          <Text
            style={{
              color: colors.title,
              fontSize: 32,
              fontWeight: '800',
              letterSpacing: -0.6,
            }}
          >
            Activity
          </Text>

          <TouchableOpacity
            activeOpacity={0.75}
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.card,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons name="options-outline" size={26} color={colors.emerald} />
          </TouchableOpacity>
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            padding: 4,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 18,
            backgroundColor: isDark
              ? 'rgba(7, 38, 30, 0.52)'
              : 'rgba(255,255,255,0.56)',
          }}
        >
          <Tab label="All" value="all" />
          <Tab label="Mentions" value="mentions" />
          <Tab label="Requests" value="requests" />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 26,
            paddingBottom: 118,
          }}
        >
          {todayItems.length > 0 && (
            <>
              <Text
                style={{
                  color: colors.title,
                  fontSize: 19,
                  fontWeight: '800',
                  marginBottom: 14,
                }}
              >
                Today
              </Text>

              {todayItems.map(item => (
                <NotificationRow key={item.id} item={item} />
              ))}
            </>
          )}

          {earlierItems.length > 0 && (
            <>
              <Text
                style={{
                  color: colors.title,
                  fontSize: 19,
                  fontWeight: '800',
                  marginTop: 16,
                  marginBottom: 14,
                }}
              >
                Earlier
              </Text>

              {earlierItems.map(item => (
                <NotificationRow key={item.id} item={item} />
              ))}
            </>
          )}

          {!filteredItems.length && (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Ionicons
                name="notifications-off-outline"
                size={50}
                color={colors.muted}
              />
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 16,
                  marginTop: 14,
                }}
              >
                Nothing here yet
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <BottomNavigator active="activity" />
    </LinearGradient>
  );
};

export default ActivityScreen;
