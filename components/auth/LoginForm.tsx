import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Button from "../../components/ui/Button";
import Icon from "../../components/ui/Icon";
import TextInput from "../../components/ui/TextInput";
import { useAuth } from "../../hooks/useAuth";
import { Platform } from "react-native";
import { api } from "@/services/api";
import { registerForPushNotificationsAsync } from "@/services/notifications";
interface LoginFormProps {
    onShowSettings: () => void;
}

export const LoginForm = ({ onShowSettings }: LoginFormProps) => {
    const { loading, signIn } = useAuth();
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loginType, setLoginType] = useState<'staff' | 'student'>('staff');

    const handleLogin = async () => {
        try {
            setError(null);
            if (!username.trim()) {
                setUsernameError("Username wajib diisi");
                return;
            }
            if (!password) {
                setPasswordError("Password wajib diisi");
                return;
            }
            await signIn(username.trim(), password, loginType === 'student' ? 'auth/login/student' : 'auth/login');
            if (Platform.OS === "ios" || Platform.OS === "android") {
                try {
                    const expoPushToken = await registerForPushNotificationsAsync();
                    if (expoPushToken) {
                        await api("profile/push-token", {
                            method: "PATCH",
                            body: JSON.stringify({ token: expoPushToken }),
                        });
                    }
                } catch (err) {
                    console.warn("Failed to register push notifications");
                }
            }
        } catch (e: any) {
            setError(e?.message || "Gagal masuk");
        }
    };

    return (
        
         <KeyboardAvoidingView
           behavior={Platform.OS === "android" ? "padding" : "height"}
          className="flex-1 justify-center p-6"
        >
            <View className="mb-8">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-4xl font-extrabold text-gray-900">
                        Selamat Datang
                    </Text>
                    <TouchableOpacity onPress={onShowSettings} className="p-2.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                        <Icon name="settings-outline" size={22} color="#374151" />
                    </TouchableOpacity>
                </View>
                <Text className="text-gray-600 text-base leading-relaxed">
                    Silakan masuk ke akun Anda untuk melanjutkan
                </Text>
            </View>

            {/* Login Type Toggle */}
            <View className="flex-row mb-8 bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                <TouchableOpacity
                    className={`flex-1 py-3.5 rounded-xl items-center transition-all ${loginType === 'staff' ? 'bg-white shadow-md' : ''}`}
                    onPress={() => setLoginType('staff')}
                >
                    <Text className={`font-semibold text-base ${loginType === 'staff' ? 'text-blue-600' : 'text-gray-500'}`}>Staf / Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity
             className={`flex-1 py-2.5 rounded-lg items-center ${loginType === "student" ? "bg-blue-200" : ""}`}
  onPress={() => setLoginType("student")}
                >
                    <Text className={`font-semibold text-base ${loginType === 'student' ? 'text-blue-600' : 'text-gray-500'}`}>Siswa</Text>
                </TouchableOpacity>
            </View>

            {error ? (
                <Animated.View entering={FadeInDown} className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex-row items-center gap-3 shadow-sm">
                    <Icon name="alert-circle" size={22} color="#DC2626" />
                    <Text className="text-red-700 font-semibold flex-1">{error}</Text>
                </Animated.View>
            ) : null}

            <View className="gap-6">
                <View>
                    <Text className="text-sm font-bold text-gray-700 mb-2.5">Username</Text>
                    <TextInput
                        placeholder="Masukkan username Anda"
                        value={username}
                        onChangeText={(t) => {
                            setUsername(t);
                            if (usernameError) setUsernameError(null);
                        }}
                        autoCapitalize="none"
                        className="h-14 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-base rounded-xl px-4"
                    />
                    {usernameError ? (
                        <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                            {usernameError}
                        </Text>
                    ) : null}
                </View>

                <View>
                    <Text className="text-sm font-bold text-gray-700 mb-2.5">Password</Text>
                    <View className="relative">
                        <TextInput
                            placeholder="Masukkan password Anda"
                            value={password}
                            onChangeText={(t) => {
                                setPassword(t);
                                if (passwordError) setPasswordError(null);
                            }}
                            secureTextEntry={!showPassword}
                            className="h-14 bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-base rounded-xl px-4 pr-14"
                        />
                        <TouchableOpacity
                            className="absolute right-0 top-0 h-14 w-14 items-center justify-center"
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                    {passwordError ? (
                        <Text className="text-red-600 text-sm mt-2 ml-1 font-medium">
                            {passwordError}
                        </Text>
                    ) : null}
                </View>

                <Button
                    className="w-full h-14 mt-2 shadow-xl shadow-blue-600/25 rounded-xl"
                    title={loading ? "Memproses..." : "Masuk"}
                    onPress={handleLogin}
                    disabled={loading}
                />
            </View>

            <View className="items-center mt-10">
                <Text className="text-gray-600 text-base">
                    Belum punya akun?{" "}
                    <Text
                        className="text-blue-600 font-bold hover:underline cursor-pointer"
                        onPress={() => router.push("/(auth)/signup")}
                    >
                        Daftar Sekarang
                    </Text>
                </Text>
            </View>
        </KeyboardAvoidingView>
    );
};
