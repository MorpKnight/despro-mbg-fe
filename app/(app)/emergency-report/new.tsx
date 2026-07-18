import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { z } from "zod";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import TextInput from "../../../components/ui/TextInput";
import { useOffline } from "../../../hooks/useOffline";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { api } from "../../../services/api";

const EmergencyReportSchema = z.object({
    title: z.string().min(5, "Judul laporan minimal 5 karakter"),
    description: z.string().optional(),
    students_affected_count: z.number().nullable().optional(),
    students_affected_description: z.string().optional(),
    gejala: z.string().optional(),
});

type EmergencyReportFormValues = z.infer<typeof EmergencyReportSchema>;

export default function CreateEmergencyReport() {
    const router = useRouter();
    const { isOnline } = useOffline();
    const { showSnackbar } = useSnackbar();
    const [submitting, setSubmitting] = useState(false);

    const {
        control,
        handleSubmit,
        reset, // ← Tambahkan reset
        formState: { errors, isValid },
    } = useForm<EmergencyReportFormValues>({
        resolver: zodResolver(EmergencyReportSchema),
        defaultValues: {
            title: "",
            description: "",
            students_affected_count: 0,
            students_affected_description: "",
            gejala: "",
        },
        mode: "onChange",
    });
    const submit = handleSubmit(async (values) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            await api("emergency/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: values.title,
                    description: values.description,
                    students_affected_count: values.students_affected_count,
                    students_affected_description: values.students_affected_description,
                    gejala: values.gejala,
                }),
            });

            showSnackbar({
                message: "Laporan darurat berhasil dikirim.",
                variant: "success",
            });

            // Reset form before navigating
            reset({
                title: "",
                description: "",
                students_affected_count: 0,
                students_affected_description: "",
                gejala: "",
            });

            router.replace("/(app)/emergency-report");
        } catch (error) {
            console.error("Failed to submit emergency report", error);
            showSnackbar({
                message: "Gagal mengirim laporan. Silakan coba lagi.",
                variant: "error",
            });
        } finally {
            setSubmitting(false);
        }
    });

    return (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <Card>
                <View className="flex-row items-center gap-3 mb-2">
                    <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                        <Ionicons name="warning" size={24} color="#DC2626" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900">
                            Buat Laporan Darurat
                        </Text>
                        <Text className="text-sm text-gray-500">
                            Laporkan insiden kesehatan atau keamanan segera.
                        </Text>
                    </View>
                </View>
            </Card>

            <Card>
                <View className="gap-4">
                    <View>
                        <Text className="mb-1 text-gray-800 font-medium">
                            Judul Laporan <Text className="text-red-500">*</Text>
                        </Text>
                        <Controller
                            control={control}
                            name="title"
                            render={({ field: { value, onChange, onBlur } }) => (
                                <TextInput
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    placeholder="Contoh: Keracunan Makanan Kelas 5A"
                                />
                            )}
                        />
                        {errors.title ? (
                            <Text className="text-xs text-red-500 mt-1">
                                {errors.title.message}
                            </Text>
                        ) : null}
                    </View>

                    <View>
                        <Text className="mb-1 text-gray-800 font-medium">
                            Deskripsi Kejadian
                        </Text>
                        <Controller
                            control={control}
                            name="description"
                            render={({ field: { value, onChange, onBlur } }) => (
                                <TextInput
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    placeholder="Ceritakan kronologi kejadian secara singkat..."
                                    multiline
                                    numberOfLines={4}
                                />
                            )}
                        />
                    </View>

                    <View className="flex-row gap-4">
                        <View className="flex-1">
                            <Text className="mb-1 text-gray-800 font-medium">
                                Jumlah Siswa Terdampak
                            </Text>
                            <Controller
                                control={control}
                                name="students_affected_count"
                                render={({ field: { value, onChange, onBlur } }) => (
                                    <TextInput
                                        value={value?.toString()}
                                        onChangeText={(text) => {
                                            // Konversi string ke number, atau null jika kosong
                                            const numValue = text.trim() === "" ? null : Number(text);
                                            // Hanya update jika valid number atau null
                                            if (text.trim() === "" || !isNaN(numValue as number)) {
                                                onChange(numValue);
                                            }
                                        }}
                                        onBlur={onBlur}
                                        placeholder="0"
                                        keyboardType="numeric"
                                    />
                                )}
                            />
                        </View>
                    </View>

                    <View>
                        <Text className="mb-1 text-gray-800 font-medium">
                            Daftar Siswa / Keterangan Korban
                        </Text>
                        <Controller
                            control={control}
                            name="students_affected_description"
                            render={({ field: { value, onChange, onBlur } }) => (
                                <TextInput
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    placeholder="Sebutkan nama siswa atau kelas yang terdampak..."
                                    multiline
                                    numberOfLines={2}
                                />
                            )}
                        />
                    </View>

                    <View>
                        <Text className="mb-1 text-gray-800 font-medium">
                            Gejala yang Dialami
                        </Text>
                        <Controller
                            control={control}
                            name="gejala"
                            render={({ field: { value, onChange, onBlur } }) => (
                                <TextInput
                                    value={value}
                                    onChangeText={onChange}
                                    onBlur={onBlur}
                                    placeholder="Mual, pusing, muntah, dll."
                                />
                            )}
                        />
                    </View>
                </View>
            </Card>

            <Button
                title={submitting ? "Mengirim..." : "Kirim Laporan"}
                onPress={submit}
                loading={submitting}
                disabled={!isValid || submitting || !isOnline}
                variant="primary"
                className={!isOnline ? "opacity-50" : ""}
            />
            {!isOnline && (
                <Text className="text-center text-xs text-amber-600">
                    Anda sedang offline. Laporan darurat hanya dapat dikirim saat online.
                </Text>
            )}
        </ScrollView>
    );
}
