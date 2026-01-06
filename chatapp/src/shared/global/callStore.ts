// import { create } from 'zustand';

// export interface IncomingCallData {
//   from: string;
//   fromName: string;
//   channel: string;
//   token: string;
//   uid: number;
// }

// export interface ActiveCallData {
//   channel: string;
//   token: string;
//   uid: number;
//   isInitiator: boolean;
//   withUserId: string;
//   withUserName: string;
// }

// interface CallState {
//   incomingCall:
//     | (IncomingCallData & {
//         isActive: boolean;
//         timestamp: number;
//       })
//     | null;
//   activeCall: ActiveCallData | null;

//   setIncomingCall: (data: IncomingCallData | null) => void;
//   setActiveCall: (data: ActiveCallData | null) => void;
//   clearIncomingCall: () => void;
//   clearActiveCall: () => void;
// }

// export const useCallStore = create<CallState>(set => ({
//   incomingCall: null,
//   activeCall: null,

//   setIncomingCall: data =>
//     set({
//       incomingCall: data
//         ? {
//             ...data,
//             isActive: true,
//             timestamp: Date.now(),
//           }
//         : null,
//     }),

//   setActiveCall: data => set({ activeCall: data }),

//   clearIncomingCall: () =>
//     set(state => ({
//       incomingCall: state.incomingCall
//         ? { ...state.incomingCall, isActive: false }
//         : null,
//     })),

//   clearActiveCall: () => set({ activeCall: null }),
// }));

import { create } from 'zustand';

interface CallStoreState {
  incomingCall: {
    isActive: boolean;
    from: string;
    fromName: string;
    channel: string;
    token: string;
    uid: number;
    timestamp: number;
  } | null;

  activeCall: {
    channel: string;
    token: string;
    uid: number;
    isInitiator: boolean;
    withUserId: string; // Changed from withUser to withUserId
    withUserName: string;
  } | null;

  setIncomingCall: (
    data: {
      from: string;
      fromName: string;
      channel: string;
      token: string;
      uid: number;
    } | null,
  ) => void;

  setActiveCall: (
    data: {
      channel: string;
      token: string;
      uid: number;
      isInitiator: boolean;
      withUserId: string; // Changed from withUser to withUserId
      withUserName: string;
    } | null,
  ) => void;

  clearIncomingCall: () => void;
  clearActiveCall: () => void;
}

export const useCallStore = create<CallStoreState>(set => ({
  incomingCall: null,
  activeCall: null,

  setIncomingCall: data =>
    set({
      incomingCall: data
        ? {
            ...data,
            isActive: true,
            timestamp: Date.now(),
          }
        : null,
    }),

  setActiveCall: data => set({ activeCall: data }),

  clearIncomingCall: () =>
    set(state => ({
      incomingCall: state.incomingCall
        ? {
            ...state.incomingCall,
            isActive: false,
          }
        : null,
    })),

  clearActiveCall: () => set({ activeCall: null }),
}));
