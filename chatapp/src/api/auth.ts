import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './axios';

// ----------------------
// TYPES
// ----------------------
interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

// ----------------------
// REGISTER USER
// ----------------------
export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
  });
};

// ----------------------
// LOGIN USER
// ----------------------
export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await api.post('/auth/login', data);
      return response.data;
    },
  });
};

// ----------------------
// VERIFY USER CODE
// ----------------------
export const verifyUserCode = async (data: { email: string; code: string }) => {
  const response = await api.post('/auth/verify', data);
  return response.data;
};

// ----------------------
// GET CURRENT USER
// ----------------------
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get('/auth/me'); // ✅ Token auto-injected by interceptor
      return response.data;
    },
  });
};

// ----------------------
// UPDATE USER PROFILE
// ----------------------
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put('/auth/update-profile', data); // ✅ Token auto-injected
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });
};

// ----------------------
// GET ALL USERS
// ----------------------
export const useAllUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users'); // ✅ Token auto-injected
      return res.data;
    },
  });
};

// ----------------------
// FOLLOW USER
// ----------------------
export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/users/${userId}/follow`); // ✅ Token auto-injected
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

// ----------------------
// UNFOLLOW USER
// ----------------------
export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/users/${userId}/unfollow`); // ✅ Token auto-injected
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
};

// 🟩 Get all chats for a specific user
export const useUserChats = (userId?: string) => {
  return useQuery({
    queryKey: ['chats', userId],
    queryFn: async () => {
      const { data } = await api.get(`/chats/${userId}`);
      return data;
    },
    enabled: !!userId, // only run when userId is defined
  });
};

// 🟦 Get all messages for a chat
export const useChatMessages = (chatId?: string) => {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/${chatId}`);
      return data;
    },
    enabled: !!chatId,
  });
};

// 🟨 Send a new message
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      senderId: string;
      receiverId: string;
      text: string;
    }) => {
      const { data } = await api.post('/messages', payload);
      return data;
    },
    onSuccess: newMessage => {
      // Refresh messages after sending
      queryClient.invalidateQueries({
        queryKey: ['messages', newMessage.chat],
      });
    },
  });
};

export const useFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await api.get('/friends/friends'); // ✅ Correct endpoint
      return res.data;
    },
  });
};

// Agora Token Fetcher
// export const getAgoraToken = async (channelName: string) => {
//   const res = await api.get('/agora/token', {
//     params: { channelName },
//   });
//   return res.data; // { token: string }
// };

// export const useChatMessages = () => {
//   return useQuery({
//     queryKey: ['messages'],
//     queryFn: async () => {
//       const res = await api.get('/messages');
//       return res.data;
//     },
//   });
// }
