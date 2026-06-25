// import {
//   CLOUDINARY_IMAGE_UPLOAD_URL,
//   CLOUDINARY_UPLOAD_PRESET,
//   CLOUDINARY_VIDEO_UPLOAD_URL,
// } from '@env';

// export const uploadMediaToCloudinary = async (
//   uri: string,
//   isVideo: boolean,
// ) => {
//   const formData = new FormData();

//   formData.append('file', {
//     uri,
//     type: isVideo ? 'video/mp4' : 'image/jpeg',
//     name: isVideo ? 'upload.mp4' : 'upload.jpg',
//   } as any);

//   formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

//   const uploadUrl = isVideo
//     ? CLOUDINARY_VIDEO_UPLOAD_URL
//     : CLOUDINARY_IMAGE_UPLOAD_URL;

//   const response = await fetch(uploadUrl, {
//     method: 'POST',
//     body: formData,
//   });

//   const data = await response.json();

//   if (!response.ok) {
//     throw new Error(data?.error?.message || 'Cloudinary upload failed');
//   }
//   return data.secure_url as string;

// };

import {
  CLOUDINARY_IMAGE_UPLOAD_URL,
  CLOUDINARY_UPLOAD_PRESET,
  CLOUDINARY_VIDEO_UPLOAD_URL,
} from '@env';

// export const uploadMediaToCloudinary = async (
//   uri: string,
//   isVideo: boolean,
//   isAudio = false,
// ) => {
//   console.log('Cloudinary env vars:', {
//     CLOUDINARY_IMAGE_UPLOAD_URL,
//     CLOUDINARY_VIDEO_UPLOAD_URL,
//     CLOUDINARY_UPLOAD_PRESET,
//   });

//   const formData = new FormData();

//   // Correct MIME type
//   const type = isAudio ? 'audio/mp3' : isVideo ? 'video/mp4' : 'image/jpeg';

//   // Give a matching filename
//   const name = isAudio ? 'voice.mp3' : isVideo ? 'upload.mp4' : 'upload.jpg';

//   formData.append('file', {
//     uri,
//     type,
//     name,
//   } as any);

//   formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

//   // If audio, upload like video (Cloudinary handles audio as video type),
//   // or you can use an "auto" endpoint if you want full detection.
//   const uploadUrl = isAudio
//     ? CLOUDINARY_VIDEO_UPLOAD_URL
//     : isVideo
//       ? CLOUDINARY_VIDEO_UPLOAD_URL
//       : CLOUDINARY_IMAGE_UPLOAD_URL;

//   console.log('Uploading to Cloudinary URL:', uploadUrl);
//   console.log('Upload preset:', CLOUDINARY_UPLOAD_PRESET);

//   const response = await fetch(uploadUrl, {
//     method: 'POST',
//     body: formData,
//   });

//   const data = await response.json();
//   console.log('Cloudinary response:', data);

//   if (!response.ok) {
//     throw new Error(data?.error?.message || 'Cloudinary upload failed');
//   }

//   return data.secure_url as string;
// };

interface CloudinaryUploadOptions {
  isVideo?: boolean;
  isAudio?: boolean;
  onProgress?: (progressEvent: { loaded: number; total: number }) => void;
}

export const uploadMediaToCloudinary = async (
  uri: string,
  options: CloudinaryUploadOptions = {},
) => {
  const { isVideo = false, isAudio = false, onProgress } = options;

  const formData = new FormData();
  const type = isAudio ? 'audio/mp3' : isVideo ? 'video/mp4' : 'image/jpeg';
  const name = isAudio ? 'voice.mp3' : isVideo ? 'upload.mp4' : 'upload.jpg';

  formData.append('file', { uri, type, name } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const uploadUrl = isAudio
    ? CLOUDINARY_VIDEO_UPLOAD_URL
    : isVideo
      ? CLOUDINARY_VIDEO_UPLOAD_URL
      : CLOUDINARY_IMAGE_UPLOAD_URL;

  console.log('Uploading to Cloudinary URL:', uploadUrl);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  console.log('Cloudinary response:', data);

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Cloudinary upload failed');
  }

  return data.secure_url as string;
};