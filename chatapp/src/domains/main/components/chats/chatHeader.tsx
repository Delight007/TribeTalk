import Ionicons from "@react-native-vector-icons/ionicons"
import { Image, Text, TouchableOpacity, View } from "react-native"
import { FriendInfo } from "../../../../shared/global/chatStore"

interface ChatHeaderProps {
  friend: FriendInfo | null
  isDark: boolean
  isLoading: boolean
  onBack: () => void
  onStartCall: () => void
}
const ChatHeader: React.FC<ChatHeaderProps> = ({
 friend,
  isDark,
  isLoading,
  onBack,
  onStartCall,
}) => {
    return (
         <View
          className={`flex-row items-center px-4 py-3 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-300'
          }`}
        >
          <TouchableOpacity
           onPress={onBack} 
            className="mr-3"
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={isDark ? 'white' : '#1f2937'}
            />
          </TouchableOpacity>

         {/* Avatar */}
      {friend?.avatar ? (
  <Image
    source={{ uri: friend.avatar }}
    className="w-10 h-10 rounded-full mr-3"
  />
) : (
  <View className="w-10 h-10 rounded-full bg-gray-400 mr-3" />
)}
          <View className="ml-3 flex-1">
           <Text
  className={`font-semibold text-base ${
    isDark ? "text-white" : "text-black"
  }`}
>
  {friend?.name ?? "Unknown"}
</Text>
            <Text className="text-xs text-green-600">
              {isLoading ? 'Loading...' : 'Online'}
            </Text>
          </View>

          <TouchableOpacity
           onPress={onStartCall}
            className={`p-2 rounded-full ${
              isDark ? 'bg-gray-700' : 'bg-gray-100'
            } ml-2`}
          >
            <Ionicons
              name="videocam-outline"
              size={20}
              color={isDark ? 'white' : '#1f2937'}
            />
          </TouchableOpacity>
        </View>
    )
  
}
export default ChatHeader;