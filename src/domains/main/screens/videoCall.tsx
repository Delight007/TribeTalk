// // src/screens/VideoCall.tsx
// import Ionicons from '@react-native-vector-icons/ionicons';
// import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
// import { NativeStackNavigationProp } from '@react-navigation/native-stack';
// import React, { useEffect, useState } from 'react';
// import {
//   ActivityIndicator,
//   Alert,
//   PermissionsAndroid,
//   Platform,
//   Text,
//   TouchableOpacity,
//   View,
// } from 'react-native';

// import {
//   ChannelProfileType,
//   ClientRoleType,
//   createAgoraRtcEngine,
//   IRtcEngine,
//   RtcSurfaceView,
// } from 'react-native-agora';

// const APP_ID = '04b57386871b4f16907a833e4bb82c7c'; // replace with your actual App ID

// type VideoCallRouteParams = {
//   channel: string;
//   token?: string; // token may be optional if you use open channel or tokenless mode
//   uid?: number; // optional — you can let Agora assign a uid if omitted
// };

// type VideoCallRoute = RouteProp<
//   { VideoCall: VideoCallRouteParams },
//   'VideoCall'
// >;
// type VideoCallNav = NativeStackNavigationProp<any, 'VideoCall'>;

// export default function VideoCall() {
//   const route = useRoute<VideoCallRoute>();
//   const navigation = useNavigation<VideoCallNav>();

//   const { channel, token, uid } = route.params;

//   const [engine, setEngine] = useState<IRtcEngine | null>(null);
//   const [joined, setJoined] = useState(false);
//   const [remoteUid, setRemoteUid] = useState<number | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const requestPermissions = async (): Promise<boolean> => {
//     if (Platform.OS === 'android') {
//       const granted = await PermissionsAndroid.requestMultiple([
//         PermissionsAndroid.PERMISSIONS.CAMERA,
//         PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
//       ]);
//       const grantedAll = Object.values(granted).every(
//         v => v === PermissionsAndroid.RESULTS.GRANTED,
//       );
//       if (!grantedAll) {
//         Alert.alert(
//           'Permission required',
//           'Camera and Microphone permission are required for video call.',
//         );
//       }
//       return grantedAll;
//     }
//     // On iOS, permissions are handled via Info.plist — assume ok
//     return true;
//   };

//   // useEffect(() => {
//   //   let isMounted = true;

//   //   const init = async () => {
//   //     const ok = await requestPermissions();
//   //     if (!ok) {
//   //       setError('Permissions not granted');
//   //       return;
//   //     }

//   //     try {
//   //       const rtcEngine = createAgoraRtcEngine();
//   //       rtcEngine.initialize({
//   //         appId: APP_ID,
//   //         channelProfile: ChannelProfileType.ChannelProfileCommunication,
//   //       });
//   //       rtcEngine.enableVideo();

//   //       rtcEngine.registerEventHandler({
//   //         onJoinChannelSuccess: (connection, elapsed) => {
//   //           console.log(
//   //             '✅ Joined channel',
//   //             connection.channelId,
//   //             'elapsed:',
//   //             elapsed,
//   //           );
//   //           setJoined(true);
//   //         },
//   //         onUserJoined: (connection, remoteUid, elapsed) => {
//   //           console.log('👥 Remote user joined', remoteUid);
//   //           setRemoteUid(remoteUid);
//   //         },
//   //         onUserOffline: (connection, remoteUid, reason) => {
//   //           console.log('🚪 Remote user left', remoteUid, 'reason', reason);
//   //           setRemoteUid(null);
//   //         },
//   //         onError: (err, msg) => {
//   //           console.error('Agora error', err, msg);
//   //           setError(`Error ${err}: ${msg}`);
//   //         },
//   //       });

//   //       rtcEngine.startPreview();

//   //       if (!token) {
//   //         console.warn('No RTC token — cannot join channel');
//   //         return;
//   //       }
//   //       console.log('Joining channel with params:', { token, channel, uid });
//   //       // rtcEngine.joinChannel(
//   //       //   token ?? undefined, // string | undefined — or token value
//   //       //   channel, // string: channel name
//   //       //   uid ?? 0, // number: uid (0 means auto‑assign)
//   //       //   { clientRoleType: ClientRoleType.ClientRoleBroadcaster }, // options
//   //       // );
//   //       if (uid === undefined) {
//   //         setError('Cannot join call: UID or token missing');
//   //         return;
//   //       }

//   //       rtcEngine.joinChannel(token, channel, uid, {
//   //         clientRoleType: ClientRoleType.ClientRoleBroadcaster,
//   //       });

//   //       setEngine(rtcEngine);
//   //     } catch (err) {
//   //       console.error('Failed to init Agora engine', err);
//   //       setError('Failed to start video call');
//   //     }
//   //   };

//   //   init();

//   //   return () => {
//   //     isMounted = false;
//   //     if (engine) {
//   //       engine.leaveChannel();
//   //       engine.release();
//   //     }
//   //   };
//   // }, []);

//   useEffect(() => {
//     let isMounted = true;
//     let joined = false; // track whether joinChannel was called

//     const init = async () => {
//       const ok = await requestPermissions();
//       if (!ok) {
//         setError('Permissions not granted');
//         return;
//       }

//       try {
//         const rtcEngine = createAgoraRtcEngine();
//         rtcEngine.initialize({
//           appId: APP_ID,
//           channelProfile: ChannelProfileType.ChannelProfileCommunication,
//         });
//         rtcEngine.enableVideo();

//         rtcEngine.registerEventHandler({
//           onJoinChannelSuccess: (connection, elapsed) => {
//             console.log(
//               '✅ Joined channel',
//               connection.channelId,
//               'elapsed:',
//               elapsed,
//             );
//             setJoined(true);
//           },
//           onUserJoined: (connection, remoteUid, elapsed) => {
//             console.log('👥 Remote user joined', remoteUid);
//             setRemoteUid(remoteUid);
//           },
//           onUserOffline: (connection, remoteUid, reason) => {
//             console.log('🚪 Remote user left', remoteUid, 'reason', reason);
//             setRemoteUid(null);
//           },
//           onError: (err, msg) => {
//             console.error('Agora error', err, msg);
//             setError(`Error ${err}: ${msg}`);
//           },
//         });

//         rtcEngine.startPreview();

//         // Only join if token & uid are valid and not already joined
//         if (!token) {
//           console.warn('No RTC token — cannot join channel');
//           return;
//         }
//         if (uid === undefined) {
//           setError('Cannot join call: UID or token missing');
//           return;
//         }
//         console.log('Joining channel with params:', { token, channel, uid });

//         if (!joined) {
//           rtcEngine.joinChannel(token, channel, uid, {
//             clientRoleType: ClientRoleType.ClientRoleBroadcaster,
//           });
//           joined = true;
//         }

//         setEngine(rtcEngine);
//       } catch (err) {
//         console.error('Failed to init Agora engine', err);
//         setError('Failed to start video call');
//       }
//     };

//     init();

//     return () => {
//       isMounted = false;
//       if (engine) {
//         try {
//           engine.leaveChannel();
//           engine.release();
//         } catch (err) {
//           console.warn('Failed to leave/release engine', err);
//         }
//       }
//     };
//   }, []);

//   const endCall = () => {
//     if (engine) {
//       engine.leaveChannel();
//       engine.release();
//     }
//     navigation.goBack();
//   };

//   if (error) {
//     return (
//       <View
//         style={{
//           flex: 1,
//           justifyContent: 'center',
//           alignItems: 'center',
//           backgroundColor: 'black',
//         }}
//       >
//         <Text style={{ color: 'white', fontSize: 16 }}>{error}</Text>
//         <TouchableOpacity
//           onPress={endCall}
//           style={{
//             marginTop: 16,
//             padding: 12,
//             backgroundColor: 'red',
//             borderRadius: 6,
//           }}
//         >
//           <Text style={{ color: 'white' }}>Go Back</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={{ flex: 1, backgroundColor: 'black' }}>
//       {!joined ? (
//         <View
//           style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
//         >
//           <ActivityIndicator size="large" color="#fff" />
//           <Text style={{ color: 'white', marginTop: 8 }}>Joining call...</Text>
//         </View>
//       ) : remoteUid !== null ? (
//         <RtcSurfaceView style={{ flex: 1 }} canvas={{ uid: remoteUid }} />
//       ) : (
//         <View
//           style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
//         >
//           <Text style={{ color: 'white', fontSize: 18 }}>
//             Waiting for remote user...
//           </Text>
//         </View>
//       )}

//       {/* Local video preview */}
//       {joined && (
//         <RtcSurfaceView
//           style={{
//             width: 120,
//             height: 160,
//             position: 'absolute',
//             top: 40,
//             right: 20,
//             borderRadius: 10,
//             overflow: 'hidden',
//           }}
//           canvas={{ uid: uid ?? 0 }}
//         />
//       )}

//       {/* End call button */}
//       <View
//         style={{
//           position: 'absolute',
//           bottom: 20,
//           left: 0,
//           right: 0,
//           alignItems: 'center',
//         }}
//       >
//         <TouchableOpacity
//           onPress={endCall}
//           style={{
//             backgroundColor: 'red',
//             padding: 12,
//             borderRadius: 24,
//           }}
//         >
//           <Ionicons name="call" size={28} color="#fff" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// src/screens/VideoCall.tsx
import Ionicons from '@react-native-vector-icons/ionicons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

type VideoCallRouteParams = {
  channel: string;
  token?: string;
  uid?: number;
};

type VideoCallRoute = RouteProp<
  { VideoCall: VideoCallRouteParams },
  'VideoCall'
>;
type VideoCallNav = NativeStackNavigationProp<any, 'VideoCall'>;

export default function VideoCall() {
  const route = useRoute<VideoCallRoute>();
  const navigation = useNavigation<VideoCallNav>();
  const { channel, token, uid } = route.params;

  const engineRef = useRef<IRtcEngine | null>(null);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      const grantedAll = Object.values(granted).every(
        v => v === PermissionsAndroid.RESULTS.GRANTED,
      );
      if (!grantedAll) {
        Alert.alert(
          'Permission required',
          'Camera and Microphone permission are required for video call.',
        );
      }
      return grantedAll;
    }
    return true; // iOS handled via Info.plist
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const ok = await requestPermissions();
      if (!ok) {
        setError('Permissions not granted');
        return;
      }

      if (engineRef.current) {
        console.warn('Engine already initialized, skipping join.');
        return;
      }

      try {
        const rtcEngine = createAgoraRtcEngine();
        engineRef.current = rtcEngine;

        rtcEngine.initialize({
          appId: APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });
        rtcEngine.enableVideo();

        rtcEngine.registerEventHandler({
          onJoinChannelSuccess: (_, elapsed) => {
            console.log('✅ Joined channel', channel, 'elapsed:', elapsed);
            if (isMounted) setJoined(true);
          },
          onUserJoined: (_, remoteUid) => {
            console.log('👥 Remote user joined', remoteUid);
            if (isMounted) setRemoteUid(remoteUid);
          },
          onUserOffline: (_, remoteUid) => {
            console.log('🚪 Remote user left', remoteUid);
            if (isMounted) setRemoteUid(null);
          },
          onError: (err, msg) => {
            console.error('Agora error', err, msg);
            if (isMounted) setError(`Error ${err}: ${msg}`);
          },
        });

        rtcEngine.startPreview();

        if (!token || uid === undefined) {
          setError('Cannot join call: UID or token missing');
          return;
        }

        rtcEngine.joinChannel(token, channel, uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        });
      } catch (err) {
        console.error('Failed to init Agora engine', err);
        if (isMounted) setError('Failed to start video call');
      }
    };

    init();

    return () => {
      isMounted = false;
      const engine = engineRef.current;
      if (engine) {
        try {
          engine.leaveChannel();
          engine.release();
        } catch (err) {
          console.warn('Failed to leave/release engine', err);
        }
        engineRef.current = null;
      }
    };
  }, []);

  const endCall = () => {
    const engine = engineRef.current;
    if (engine) {
      try {
        engine.leaveChannel();
        engine.release();
      } catch (err) {
        console.warn('Failed to end call', err);
      }
      engineRef.current = null;
    }
    navigation.goBack();
  };

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'black',
        }}
      >
        <Text style={{ color: 'white', fontSize: 16 }}>{error}</Text>
        <TouchableOpacity
          onPress={endCall}
          style={{
            marginTop: 16,
            padding: 12,
            backgroundColor: 'red',
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'white' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      {!joined ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: 'white', marginTop: 8 }}>Joining call...</Text>
        </View>
      ) : remoteUid !== null ? (
        <RtcSurfaceView style={{ flex: 1 }} canvas={{ uid: remoteUid }} />
      ) : (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>
            Waiting for remote user...
          </Text>
        </View>
      )}

      {joined && (
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
          canvas={{ uid: uid ?? 0 }}
        />
      )}

      <View
        style={{
          position: 'absolute',
          bottom: 20,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          onPress={endCall}
          style={{
            backgroundColor: 'red',
            padding: 12,
            borderRadius: 24,
          }}
        >
          <Ionicons name="call" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
