import { BlurView } from '@react-native-community/blur';
import Ionicons from '@react-native-vector-icons/ionicons';
import React, { useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCall } from '../../../shared/contexts/callProvider';
import { useCallStore } from '../../../shared/global/callStore';
import { useUserStore } from '../../../shared/global/userStore';

const { height } = Dimensions.get('window');

export const IncomingCallScreen: React.FC = () => {
  const { incomingCall, clearIncomingCall } = useCallStore();
  const { handleAcceptCall, handleRejectCall } = useCall();
  const currentUser = useUserStore(state => state.currentUser);

  const ringScale = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  // Ringing animation
  useEffect(() => {
    if (incomingCall?.isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringScale, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ringScale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Slide in animation
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      // Slide out animation
      Animated.spring(slideAnim, {
        toValue: height,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  }, [incomingCall?.isActive]);

  if (!incomingCall?.isActive) return null;

  return (
    <View className="absolute inset-0">
      {/* Background with blur effect */}
      {Platform.OS === 'ios' ? (
        <BlurView
          className="absolute inset-0"
          blurType="dark"
          blurAmount={10}
          reducedTransparencyFallbackColor="rgba(0,0,0,0.9)"
        />
      ) : (
        <View className="absolute inset-0 bg-black/90" />
      )}

      <Animated.View
        className="flex-1 justify-between py-16 px-5"
        style={{ transform: [{ translateY: slideAnim }] }}
      >
        {/* Caller Info */}
        <View className="items-center mt-16">
          <Animated.View
            className="relative mb-8"
            style={{ transform: [{ scale: ringScale }] }}
          >
            <View className="w-32 h-32 rounded-full bg-blue-600 justify-center items-center border-4 border-white/20">
              <Text className="text-white text-5xl font-bold">
                {incomingCall.fromName.charAt(0).toUpperCase()}
              </Text>
            </View>
            {/* Animated Ring */}
            <View className="absolute -inset-5 rounded-full border-4 border-blue-500/50" />
          </Animated.View>

          <Text className="text-white text-3xl font-semibold mb-2">
            {incomingCall.fromName}
          </Text>
          <Text className="text-white/70 text-lg mb-1">Video Call</Text>
          <Text className="text-white/50 text-base">Ringing...</Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-around px-10">
          {/* Reject Button */}
          <TouchableOpacity
            className="items-center"
            onPress={handleRejectCall}
            activeOpacity={0.8}
          >
            <View className="w-18 h-18 p-2 rounded-full bg-red-500 justify-center items-center mb-2.5">
              {/* <Icon name="call-end" size={30} color="#FFF" /> */}
              <Ionicons
                name="call"
                size={30}
                color="#FFF"
                style={{ transform: [{ rotate: '135deg' }] }}
              />
            </View>
            <Text className="text-white text-sm mt-1">Decline</Text>
          </TouchableOpacity>

          {/* Accept Button */}
          <TouchableOpacity
            className="items-center"
            onPress={handleAcceptCall}
            activeOpacity={0.8}
          >
            <View className="w-18 h-18 rounded-full bg-green-500 justify-center items-center mb-2.5 p-2">
              <Ionicons name="call" size={30} color="#FFF" />
            </View>
            <Text className="text-white text-sm mt-1">Accept</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};
