// types/navigation.ts
// export type RootStackParamList = {
//   Home: undefined;
//   Login: undefined;
//   Register: undefined;
//   Profile: { userId: string } | undefined;
//   ChatScreen: { user: any }; // already exists
//   VideoCall: { channel: string };
// };

export type Friend = {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
  username?: string;
  chatId?: string;
};

type MediaItem = {
  id: string;
  image: { uri: string };
  isVideo: boolean;
  thumbnail?: string;
  duration?: number;
  // etc
};
type MediaType = 'POST' | 'STORY' | 'REEL';

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ConfirmationCode: undefined;
  FeedScreen: undefined;
  ChatList: undefined;
  ChatScreen: {
    chatId?: string;
    friend: Friend;
  };
  Profile: { userId: string } | undefined;
  EditProfile: undefined;
  AppUsers: undefined;
  Settings: undefined;
  VideoCall: {
    channel: string;
    token: string;
    uid: number;
    isInitiator: boolean;
    withUserId: string;
    withUserName: string;
  };
  Friendlist: undefined;
  PostScreen: undefined;
  PreviewScreen: { selectedMedia: MediaItem[]; postType: MediaType }; // ← add this
};
