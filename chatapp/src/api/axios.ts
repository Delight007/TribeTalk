import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add async interceptor
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  console.log('Interceptor found token:', token);
  // console.log('Request URL:', config.url);
  // console.log('Request Headers before:', config.headers);

  if (token && config.headers) {
    // ✅ Correct way using AxiosHeaders API
    config.headers.Authorization = `Bearer ${token}`;
  }

  console.log('Request Headers after:', config.headers);
  return config;
});
export default api;
