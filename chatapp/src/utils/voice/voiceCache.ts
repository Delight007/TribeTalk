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
