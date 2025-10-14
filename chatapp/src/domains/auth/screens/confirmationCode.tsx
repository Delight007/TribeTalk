import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyUserCode } from '../../../api/auth';
import { useTheme } from '../../../shared/contexts/themeContext';

export default function ConfirmationCode({ navigation, route }: any) {
  const { theme, toggleTheme } = useTheme();
  const [code, setCode] = useState(['', '', '', '']);
  const inputsRef = useRef<(TextInput | null)[]>([]);

  const handleChange = (text: string, index: number) => {
    if (!/^\d*$/.test(text)) return; // Only digits
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Move focus
    if (text && index < 3) inputsRef.current[index + 1]?.focus();
    if (!text && index > 0) inputsRef.current[index - 1]?.focus();
  };

  const confirmCode = async () => {
    const enteredCode = code.join('');
    const email = route.params?.email; // pass email from signup screen
    console.log(email); // should print the user's email

    try {
      const res = await verifyUserCode({ email, code: enteredCode });
      console.log('Verification success:', res);
      navigation.navigate('Login'); // move to next screen
    } catch (err: any) {
      console.error('Verification failed:', err.response?.data || err.message);
    }
  };
  return (
    <LinearGradient
      colors={
        theme === 'dark'
          ? ['#0f3d2e', '#09261e', '#000000'] // 🌿 Dark mode gradient
          : ['#b8e1af', '#d3f9d8', '#ffffff'] // ☀️ Light mode gradient
      }
      locations={[0, 0.2, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 items-center justify-center px-6"
          >
            {/* Title */}
            <Text
              className={`text-2xl font-bold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}
            >
              Enter Confirmation Code
            </Text>

            <Text
              className={`text-base text-center mb-6 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              Please enter the 4-digit code sent to your name@gmail.com
            </Text>

            {/* Code Inputs */}
            <View className="flex-row gap-3 mb-6">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={ref => {
                    inputsRef.current[index] = ref;
                  }}
                  value={digit}
                  onChangeText={text => handleChange(text, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  className={`w-14 h-14 text-center text-xl rounded-lg border ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-[#1a2a22] text-white'
                      : 'border-gray-300 bg-zinc-100 text-black'
                  }`}
                />
              ))}
            </View>

            {/* Resend Code */}
            <TouchableOpacity className="mb-4">
              <Text className="text-green-600 font-semibold text-base">
                Resend Code
              </Text>
            </TouchableOpacity>

            {/* Confirm Button */}
            <TouchableOpacity
              onPress={confirmCode}
              disabled={code.some(digit => digit === '')}
              className={`py-3 px-10 rounded-full ${
                theme === 'dark' ? 'bg-green-600' : 'bg-green-600'
              }`}
            >
              <Text className="text-white text-base font-semibold">
                Continue
              </Text>
            </TouchableOpacity>

            {/* 🌗 Theme Toggle */}
            <TouchableOpacity onPress={toggleTheme} className="mt-8">
              <Text className="text-green-600">
                Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
}
