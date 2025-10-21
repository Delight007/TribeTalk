import Ionicons from '@react-native-vector-icons/ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';

const APP_ID = '04b57386871b4f16907a833e4bb82c7c';

export default function VideoCall() {
  const route = useRoute<any>();
  const navigation = useNavigation();

  // Get params passed from ChatScreen
  const { channel, token, uid } = route.params;

  const [engine, setEngine] = useState<IRtcEngine | null>(null);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isJoined, setIsJoined] = useState(false);

  // --- Request camera + mic permissions ---
  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  useEffect(() => {
    const init = async () => {
      await requestPermissions();

      const agoraEngine = createAgoraRtcEngine();
      setEngine(agoraEngine);

      agoraEngine.initialize({
        appId: APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      agoraEngine.enableVideo();

      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log('✅ Joined Agora channel:', channel);
          setIsJoined(true);
        },
        onUserJoined: (_conn, uid) => {
          console.log('👥 Remote user joined:', uid);
          setRemoteUid(uid);
        },
        onUserOffline: (_conn, uid) => {
          console.log('🚪 Remote user left:', uid);
          setRemoteUid(null);
        },
      });

      agoraEngine.startPreview();

      agoraEngine.joinChannel(token, channel, uid || 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    };

    init();

    return () => {
      if (engine) {
        engine.leaveChannel();
        engine.release();
      }
    };
  }, []);

  const leaveChannel = () => {
    if (engine) {
      engine.leaveChannel();
      engine.release();
      setRemoteUid(null);
      setIsJoined(false);
    }
    navigation.goBack();
  };

  return (
    <View className="flex-1 bg-black relative">
      {/* Remote video or waiting message */}
      {!isJoined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
          <Text className="text-white text-lg mt-3">Joining call...</Text>
        </View>
      ) : remoteUid !== null ? (
        <RtcSurfaceView style={{ flex: 1 }} canvas={{ uid: remoteUid }} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white text-lg">Waiting for remote user...</Text>
        </View>
      )}

      {/* Local video (top-right corner) */}
      {isJoined && (
        <RtcSurfaceView
          style={{
            width: 120,
            height: 160,
            position: 'absolute',
            top: 40,
            right: 20,
            borderRadius: 10,
            overflow: 'hidden',
          }}
          canvas={{ uid: uid || 0 }}
        />
      )}

      {/* End Call Button */}
      <View className="absolute bottom-10 w-full flex-row items-center justify-center">
        <TouchableOpacity
          onPress={leaveChannel}
          className="bg-red-600 p-4 rounded-full"
        >
          <Ionicons name="call" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
