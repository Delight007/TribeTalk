// import RNFS from 'react-native-fs';

// export const downloadVoiceFile = async (
//   remoteUrl: string,
// ): Promise<string | null> => {
//   try {
//     const fileName = `voice_${Date.now()}.m4a`;
//     const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

//     const result = await RNFS.downloadFile({
//       fromUrl: remoteUrl,
//       toFile: localPath,
//     }).promise;

//     if (result.statusCode === 200) {
//       return localPath;
//     }

//     console.warn('Voice download status not 200:', result.statusCode);
//     return null;
//   } catch (error) {
//     console.warn('Voice download error:', error);
//     return null;
//   }
// };

import RNFS from 'react-native-fs';

export const downloadVoiceFile = async (url: string) => {
  try {
    const fileName = `voice_${Date.now()}.m4a`;
    const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: localPath,
    }).promise;

    if (result.statusCode === 200) {
      return 'file://' + localPath; // ✅ VERY IMPORTANT
    }

    return null;
  } catch (err) {
    console.log('Download error:', err);
    return null;
  }
};
