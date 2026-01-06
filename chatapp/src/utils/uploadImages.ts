// src/utils/uploadImages.ts

import { CLOUDINARY_UPLOAD_PRESET, CLOUDINARY_UPLOAD_URL } from '@env';

export const uploadImageToCloudinary = async (
  imageUri: string,
  isVideo: boolean,
) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    type: isVideo ? 'video/mp4' : 'image/jpeg',
    name: isVideo ? 'upload.mp4' : 'upload.jpg',
  } as any);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url as string;
};
