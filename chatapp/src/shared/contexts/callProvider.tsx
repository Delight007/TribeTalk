import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import { IncomingCallScreen } from '../../domains/main/screens/incomingCall';
import { navigationRef } from '../../utils/rootNavigation';
import { useCallStore } from '../global/callStore';
import { useUserStore } from '../global/userStore';

interface CallContextType {
  handleIncomingCall: (data: {
    from: string;
    fromName: string;
    channel: string;
    token: string;
    uid: number;
  }) => void;
  handleAcceptCall: () => void;
  handleRejectCall: () => void;
  handleEndCall: () => void;
  handleCallUnavailable: () => void;
  handleCallEnded: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

export const CallProvider: React.FC<{
  children: React.ReactNode;
  socket: any;
}> = ({ children, socket }) => {
  const {
    incomingCall,
    activeCall,
    setIncomingCall,
    setActiveCall,
    clearIncomingCall,
    clearActiveCall,
  } = useCallStore();
  const currentUser = useUserStore(state => state.currentUser);
  const appState = useRef(AppState.currentState);

  // Handle incoming call
  const handleIncomingCall = useCallback(
    (data: {
      from: string;
      fromName: string;
      channel: string;
      token: string;
      uid: number;
    }) => {
      console.log('📱 Incoming call from:', data.fromName);
      setIncomingCall(data);
    },
    [setIncomingCall],
  );

  // Accept call
  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall || !socket) return;

    console.log('✅ Accepting call from:', incomingCall.fromName);

    // Emit acceptance to server
    socket.emit('acceptCall', {
      channel: incomingCall.channel,
      to: incomingCall.from,
      uid: incomingCall.uid,
    });

    // Navigate to call screen - This matches your route params exactly
    if (navigationRef.isReady()) {
      navigationRef.navigate('VideoCall', {
        channel: incomingCall.channel,
        token: incomingCall.token,
        uid: incomingCall.uid,
        isInitiator: false,
        withUserId: incomingCall.from, // Changed from withUser to withUserId
        withUserName: incomingCall.fromName,
      });
    }

    // Set as active call - Now this matches the callStore interface
    setActiveCall({
      channel: incomingCall.channel,
      token: incomingCall.token,
      uid: incomingCall.uid,
      isInitiator: false,
      withUserId: incomingCall.from, // Changed from withUser to withUserId
      withUserName: incomingCall.fromName,
    });

    // Clear incoming call
    clearIncomingCall();
  }, [incomingCall, socket, setActiveCall, clearIncomingCall]);

  // Reject call
  const handleRejectCall = useCallback(() => {
    if (!incomingCall || !socket) return;

    console.log('❌ Rejecting call from:', incomingCall.fromName);
    socket.emit('rejectCall', { to: incomingCall.from });
    clearIncomingCall();
  }, [incomingCall, socket, clearIncomingCall]);

  // End active call - Need to update this to use withUserId
  const handleEndCall = useCallback(() => {
    if (!activeCall || !socket) return;

    console.log('📞 Ending call');
    socket.emit('endCall', {
      channel: activeCall.channel,
      to: activeCall.withUserId, // Changed from withUser to withUserId
    });

    clearActiveCall();

    // Navigate back if on call screen
    if (navigationRef.isReady()) {
      navigationRef.goBack();
    }
  }, [activeCall, socket, clearActiveCall]);

  // Handle call unavailable
  const handleCallUnavailable = useCallback(() => {
    console.log('📵 Call unavailable');
    clearIncomingCall();
  }, [clearIncomingCall]);

  // Handle call ended by other party
  const handleCallEnded = useCallback(() => {
    console.log('📞 Call ended by other party');
    clearActiveCall();
    clearIncomingCall();

    if (navigationRef.isReady()) {
      navigationRef.goBack();
    }
  }, [clearActiveCall, clearIncomingCall]);

  // Handle app state changes for calls
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/background/) && nextState === 'active') {
        // App came to foreground
        if (incomingCall?.isActive) {
          // Check if call is still valid (e.g., within 30 seconds)
          const callAge = Date.now() - incomingCall.timestamp;
          if (callAge > 30000) {
            clearIncomingCall();
          }
        }
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [incomingCall, clearIncomingCall]);

  // Auto-reject if app is in background for too long
  useEffect(() => {
    let timeout: any;

    if (incomingCall?.isActive) {
      timeout = setTimeout(() => {
        handleRejectCall();
      }, 45000);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [incomingCall, handleRejectCall]);

  // Setup socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('incomingCall', handleIncomingCall);
    socket.on('callRejected', handleCallUnavailable);
    socket.on('callUnavailable', handleCallUnavailable);
    socket.on('callEnded', handleCallEnded);

    return () => {
      socket.off('incomingCall', handleIncomingCall);
      socket.off('callRejected', handleCallUnavailable);
      socket.off('callUnavailable', handleCallUnavailable);
      socket.off('callEnded', handleCallEnded);
    };
  }, [socket, handleIncomingCall, handleCallUnavailable, handleCallEnded]);

  const value = {
    handleIncomingCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    handleCallUnavailable,
    handleCallEnded,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      <IncomingCallScreen />
    </CallContext.Provider>
  );
};
