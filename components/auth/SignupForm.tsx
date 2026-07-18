import Dropdown from "@/components/ui/Dropdown";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Button from "../../components/ui/Button";
import TextInput from "../../components/ui/TextInput";
import { api } from "../../services/api";

export const SignupForm = () => {
    const router = useRouter();
    const roleOptions = [
        { label: "Siswa", value: "siswa" },
    ];

    const [role, setRole] = useState("Select a Role");
    const [username, setUsername] = useState("");
    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [schools, setSchools] = useState([]);
    const [schoolId, setSchoolId] = useState("");
    const [error, setError] = useState<string | null>(null);

    const onRoleSelect = async (selectedRole: string) => {
        setRole(selectedRole);
        try {
            if (["admin_sekolah", "siswa"].includes(selectedRole)) {
                const res = await api("public/sekolah");
                setSchools(res);
                setSchoolId("");
            } else {
                setSchools([]);
                setSchoolId("");
            }

        } catch (err) {
            console.error("Failed to fetch data:", err);
        }
    };

    const handleSignUp = async () => {
        if (!username || !fullName || !password || !confirmPassword) {
            setError("Mohon lengkapi semua kolom.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Konfirmasi password tidak cocok.");
            return;
        }
        if (password.length < 8) {
            setError("Password minimal 8 karakter.");
            return;
        }
        if (!role || role === "Select a Role") {
            setError("Mohon pilih role.");
            return;
        }

        setError(null);
        setLoading(true);
        try {
            const res = await api("auth/register", {
                method: "POST",
                body: JSON.stringify({
                    username,
                    full_name: fullName,
                    password,
                    role,
                    school_id: ["admin_sekolah", "siswa"].includes(role)
                        ? schoolId
                        : undefined,
                }),
            });
            if (!res || res === undefined) {
                throw new Error("API response was invalid or incomplete.");
            }

            router.replace("/");
        } catch (err: any) {
            console.error(err);
            setError(err?.data?.detail || err?.message || "Gagal membuat akun.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View>
            <View className="mb-8">
                <Text className="text-4xl font-extrabold text-gray-900 mb-3">
                    Buat Akun
                </Text>
                <Text className="text-gray-600 text-base leading-relaxed">
                    Lengkapi data diri Anda untuk memulai
                </Text>
            </View>

            <View className="gap-6">
                {/* FULL NAME */}
                <View>
                    <Text className="text-sm font-bold text-gray-700 mb-2.5">Nama Lengkap</Text>
                    <TextInput
                        className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 text-base focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all"
                        placeholder="Masukkan nama lengkap Anda"
                        value={fullName}
                        onChangeText={setFullName}
                    />
                </View>

                {/* USERNAME */}
                <View>
                    <Text className="text-sm font-bold text-gray-700 mb-2.5">Username</Text>
                    <TextInput
                        className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 text-base focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all"
                        placeholder="Masukkan username Anda"
                        autoCapitalize="none"
                        value={username}
                        onChangeText={setUsername}
                    />
                </View>

                <Dropdown
                    label="Role"
                    options={roleOptions}
                    value={role}
                    onValueChange={(value) => {
                        setRole(value);
                        onRoleSelect(value);
                    }}
                    placeholder="Pilih Role..."
                    className="mt-1"
                />

                {["admin_sekolah", "siswa"].includes(role) && (
                    <Dropdown
                        label="Sekolah"
                        options={schools.map((s: any) => ({
                            label: s.name,
                            value: s.id,
                        }))}
                        value={schoolId}
                        onValueChange={setSchoolId}
                    />
                )}


                {/* PASSWORD */}
                <View>
                    <Text className="text-sm font-bold text-gray-700 mb-2.5">Password</Text>
                    <View className="relative">
                        <TextInput
                            className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 text-base focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all pr-14"
                            placeholder="Minimal 8 karakter"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            className="absolute right-0 top-0 h-14 w-14 items-center justify-center"
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={22}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CONFIRM PASSWORD */}
                <View>
                    <Text className="text-sm font-bold text-gray-700 mb-2.5">Konfirmasi Password</Text>
                    <View className="relative">
                        <TextInput
                            className="h-14 bg-gray-50 border-2 border-gray-200 rounded-xl px-4 text-base focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100 transition-all pr-14"
                            placeholder="Ulangi password"
                            secureTextEntry={!showPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                            className="absolute right-0 top-0 h-14 w-14 items-center justify-center"
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off-outline" : "eye-outline"}
                                size={22}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {error && (
                    <Animated.View entering={FadeInDown} className="bg-red-50 p-4 rounded-2xl border-2 border-red-200 flex-row items-center gap-3 shadow-sm">
                        <Ionicons name="alert-circle" size={22} color="#DC2626" />
                        <Text className="text-red-700 font-semibold flex-1">{error}</Text>
                    </Animated.View>
                )}

                {/* SUBMIT */}
                <Button
                    title="Daftar"
                    onPress={handleSignUp}
                    loading={loading}
                    className="mt-4 h-14 shadow-xl shadow-emerald-600/25 rounded-xl"
                    size="lg"
                />

                {/* LOGIN LINK */}
                <View className="items-center mt-6">
                    <Text className="text-gray-600 text-base">
                        Sudah punya akun?{" "}
                        <Text
                            className="text-emerald-600 font-bold hover:underline cursor-pointer"
                            onPress={() => router.push("/(auth)")}
                        >
                            Masuk
                        </Text>
                    </Text>
                </View>
            </View>
        </View>
    );
};
