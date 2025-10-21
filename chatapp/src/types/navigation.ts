// types/navigation.ts
// export type RootStackParamList = {
//   Home: undefined;
//   Login: undefined;
//   Register: undefined;
//   Profile: { userId: string } | undefined;
//   ChatScreen: { user: any }; // already exists
//   VideoCall: { channel: string };
// };

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  ConfirmationCode: undefined;
  FeedScreen: undefined;
  FriendsList: undefined;
  ChatScreen: { user: any };
  Profile: { userId: string } | undefined;
  EditProfile: undefined;
  AppUsers: undefined;
  Settings: undefined;
  VideoCall: { channel: string; token: string }; // add token here
};
