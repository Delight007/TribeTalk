import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add async interceptor
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token && config.headers) {
    config.headers.set?.('Authorization', `Bearer ${token}`); // ✅ correct way
  }
  return config;
});
