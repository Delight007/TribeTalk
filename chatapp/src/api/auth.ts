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

export interface ChatType {
  _id: string;
  participants: string[]; // e.g. array of user IDs
  isGroup: boolean;
  name?: string; // optional if one‑to‑one
  avatarUrl?: string; // optional
  lastMessage?: string; // optional (preview)
  lastMessageSender?: string;
  lastMessageCreatedAt?: string | Date;
  updatedAt?: string | Date;
  chatId?: string; // <--- add this
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

export type Activity = {
  _id: string;
  type: 'like' | 'comment' | 'request' | 'mention';
  actorName: string;
  actorAvatar?: string;
  message: string;
  postImage?: string;
  read: boolean;
  createdAt: string;
};

export const useActivities = () =>
  useQuery<Activity[], Error>({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data } = await api.get('/activities');
      return data.activities ?? [];
    },
    refetchOnReconnect: true,
  });

export const markActivitiesRead = async () => {
  await api.post('/activities/read');
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
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
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

// // 🟩 Get all chats for a specific user
// export const useUserChats = (userId?: string) => {
//   return useQuery({
//     queryKey: ['chats', userId],
//     queryFn: async () => {
//       const { data } = await api.get(`/chats/${userId}`);
//       return data;
//     },
//     enabled: !!userId, // only run when userId is defined
//   });
// };

// 🟦 Get all messages for a chat
export const useChatMessages = (
  chatId?: string,
  limit: number = 50,
  offset: number = 0,
) => {
  return useQuery({
    queryKey: ['messages', chatId, limit, offset],
    queryFn: async () => {
      const { data } = await api.get(
        `/chatMessages/${chatId}?limit=${limit}&offset=${offset}`,
      );
      return data;
    },
    enabled: !!chatId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

type SendMessagePayload = {
  sender: string;
  receiver: string;
  type: 'text' | 'image' | 'video' | 'document' | 'voice';
  text?: string; // for text
  mediaUrl?: string; // for all media types
  fileName?: string; // for document
  fileSize?: number; // for document
  duration?: number; // for voice
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const {
        sender,
        receiver,
        type,
        text,
        mediaUrl,
        fileName,
        fileSize,
        duration,
      } = payload;

      const { data } = await api.post('/messages', {
        sender,
        receiver,
        type,
        text,
        mediaUrl,
        fileName,
        fileSize,
        duration,
      });

      return data;
    },
    onSuccess: newMessage => {
      queryClient.invalidateQueries({
        queryKey: ['messages', newMessage.chat],
      });
    },
  });
};

// 🟩 Get all unread messages for a user (across all chats)
export const useUnreadMessages = (userId?: string) => {
  return useQuery({
    queryKey: ['unreadMessages', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await api.get(`/messages/unread/user/${userId}`);
      return data;
    },
    enabled: !!userId, // only fetch if userId exists
    refetchOnWindowFocus: true, // Refetch when app gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};

export const useFriends = () => {
  return useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await api.get('/friends/friends'); // ✅ Correct endpoint
      return res.data;
    },
    refetchOnWindowFocus: true, // Refetch when app gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};

// ----------------------
// GET OR CREATE CHAT
// ----------------------

export const useGetOrCreateChat = () => {
  return useMutation({
    mutationFn: async (payload: { otherUserId: string }) => {
      const response = await api.post<{ success: boolean; data: ChatType }>(
        '/chats/one-to-one',
        payload,
      );
      return response.data;
    },
    onError: error => {
      console.error('Failed to get/create chat:', error);
      // Optionally show user feedback
    },
  });
};

// e.g. in api/chats.ts (or in your existing file)

export const useUserChats = (userId?: string) => {
  return useQuery({
    queryKey: ['userChats', userId], // Include userId in query key so it refetches when user changes
    queryFn: async () => {
      const { data } = await api.get('/chats'); // because your route is GET /api/chats
      // depending on backend response shape; assume response is { success: true, data: ChatType[] }
      return data.data;
    },
    enabled: !!userId, // Only fetch when userId is available
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
};

type MediaType = 'image' | 'video';

// Body of the post request
export type PostRequestBody = {
  type: 'feed' | 'story' | 'reel';
  media: { url: string; type: MediaType }[];
  caption?: string;
  tags?: string[];
};

// What the backend returns
type PostResponse = {
  _id: string;
  author: string;
  media: { url: string; type: string }[];
  caption: string;
  tags: string[];
  createdAt: string;
  // other fields…
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData: PostRequestBody) =>
      api.post<PostResponse>('/posts', postData),

    onSuccess: (response, variables) => {
      const type = variables.type;

      queryClient.invalidateQueries({ queryKey: ['posts', { type }] });

      queryClient.setQueryData<PostType[]>(['posts', { type }], oldData => [
        response.data as unknown as PostType,
        ...(oldData ?? []),
      ]);
    },
    onError: (err: Error) => {
      console.error('Create post error', err.message);
    },
  });
};

// export const usePosts = () =>
//   useQuery({
//     queryKey: ['posts', { type: 'feed' }],
//     queryFn: async () => {
//       const res = await api.get('/posts?type=feed');
//       return res.data.posts; // ensure this matches your backend
//     },
//     staleTime: 1000 * 60, // optional: 1 min cache
//   });

type PostType = {
  _id: string;
  author?: string | { _id?: string; id?: string; $oid?: string };
  name: string;
  username: string;
  avatar?: string;
  media: {
    url: string;
    type: 'image' | 'video';
  }[];
  caption?: string;
  tags?: string[];
  likes: any[];
  bookmarks?: any[];
  commentsCount: number;
};

export type FeedPost = PostType;

export const usePosts = () =>
  useQuery<PostType[], Error>({
    queryKey: ['posts', { type: 'feed' }],
    queryFn: async () => {
      const res = await api.get('/posts?type=feed');
      return Array.isArray(res.data) ? res.data : (res.data?.posts ?? []);
    },
    select: data =>
      Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.posts)
          ? (data as any).posts
          : [],
    staleTime: 1000 * 60,
  });

export const useUserPosts = (userId?: string) =>
  useQuery<PostType[], Error>({
    queryKey: ['posts', { type: 'feed', author: userId }],
    queryFn: async () => {
      const res = await api.get(`/posts?type=feed&author=${userId}`);
      return Array.isArray(res.data) ? res.data : (res.data?.posts ?? []);
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60,
  });

export const useStories = () =>
  useQuery<FeedPost[], Error>({
    queryKey: ['posts', { type: 'story' }],
    queryFn: async () => {
      const res = await api.get('/posts?type=story&limit=50');
      return Array.isArray(res.data) ? res.data : (res.data?.posts ?? []);
    },
    select: data =>
      Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.posts)
          ? (data as any).posts
          : [],
    staleTime: 1000 * 60,
  });

export type PostComment = {
  _id: string;
  author: string;
  name: string;
  username?: string;
  avatar?: string;
  text: string;
  createdAt: string;
};

export const useTogglePostLike = () =>
  useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post(`/posts/${postId}/like`);
      return data as { liked: boolean; likesCount: number };
    },
  });

export const useTogglePostBookmark = () =>
  useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post(`/posts/${postId}/bookmark`);
      return data as { bookmarked: boolean };
    },
  });

export const usePostComments = (postId: string, enabled = true) =>
  useQuery<PostComment[]>({
    queryKey: ['postComments', postId],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${postId}/comments`);
      return data.comments;
    },
    enabled,
  });

export const useAddPostComment = (postId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      const { data } = await api.post(`/posts/${postId}/comments`, { text });
      return data.comment as PostComment;
    },
    onSuccess: comment => {
      queryClient.setQueryData<PostComment[]>(
        ['postComments', postId],
        comments => [...(comments ?? []), comment],
      );
    },
  });
};
