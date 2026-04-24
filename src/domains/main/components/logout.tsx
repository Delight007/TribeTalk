// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { NavigationProp, useNavigation } from '@react-navigation/native';
// import { RootStackParamList } from '../../../types/navigation';
// // import type { RootStackParamList } from '../types/navigation'; // path may vary

// const Logout = () => {
//   const navigation = useNavigation<NavigationProp<RootStackParamList>>();

//   const logout = async () => {
//     try {
//       await AsyncStorage.removeItem('token');
//       await AsyncStorage.removeItem('user');

//       navigation.reset({
//         index: 0,
//         routes: [{ name: 'Login' }],
//       });

//       console.log('Logged out successfully');
//     } catch (error) {
//       console.error('Error logging out:', error);
//     }
//   };

//   return logout;
// };

// export default Logout;
