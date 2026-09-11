// hooks/useVoiceMessage.ts

import { useCallback, useState } from 'react';

import { useChatStore } from '../shared/global/chatStore';
import { downloadVoiceFile } from '../utils/voice/voiceCache';

interface UseVoiceMessageParams {
  roomId: string;
  messageId: string;
  remoteUri: string;
  localUri?: string | null;
}

export function useVoiceMessage({
  roomId,
  messageId,
  remoteUri,
  localUri,
}: UseVoiceMessageParams) {
  const { updateLocalUri } = useChatStore();

  const [isDownloading, setIsDownloading] = useState(false);

  const getPlayableUri = useCallback(async () => {
    // Already cached
    if (localUri) {
      return localUri;
    }

    setIsDownloading(true);

    try {
      const downloadedUri = await downloadVoiceFile(remoteUri);

      if (!downloadedUri) {
        return null;
      }

      updateLocalUri(roomId, messageId, downloadedUri);

      return downloadedUri;
    } catch (error) {
      console.error('[useVoiceMessage] Failed to download voice file:', error);
      return null;
    } finally {
      setIsDownloading(false);
    }
  }, [localUri, remoteUri, roomId, messageId, updateLocalUri]);

  return {
    isDownloading,
    getPlayableUri,
  };
}
