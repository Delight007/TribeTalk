import { RtcRole, RtcTokenBuilder } from "agora-access-token";

export function generateAgoraToken(channelName: string, uid: number | string) {
  const appId = process.env.AGORA_APP_ID!;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
  const role = RtcRole.PUBLISHER; // or SUBSCRIBER
  const expirationTimeInSeconds = 3600;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    typeof uid === "number" ? uid : 0,
    role,
    privilegeExpiredTs
  );

  return token;
}
