// app/(app)/notifications/broadcast.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { z } from "zod";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import TextInput from "../../../components/ui/TextInput";
import { useAuth } from "../../../hooks/useAuth";
import { useSnackbar } from "../../../hooks/useSnackbar";
import { api } from "../../../services/api";
import PageHeader from "../../../components/ui/PageHeader";


const BroadcastSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter"),
  message: z.string().min(5, "Pesan minimal 5 karakter"),
  level: z.enum(["info", "warning", "danger"]),
  target_role: z.string().optional(),
});

type BroadcastFormValues = z.infer<typeof BroadcastSchema>;

const ROLES = [
  { label: "Semua Pengguna", value: "" },
  { label: "Siswa", value: "siswa" },
  { label: "Admin Sekolah", value: "admin_sekolah" },
  { label: "Admin Katering", value: "admin_catering" },
  { label: "Admin Dinkes", value: "admin_dinkes" },
];

const LEVELS = [
  { label: "Info", value: "info", color: "#3B82F6", bg: "#EFF6FF" },
  { label: "Peringatan", value: "warning", color: "#F59E0B", bg: "#FFFBEB" },
  { label: "Bahaya", value: "danger", color: "#EF4444", bg: "#FEF2F2" },
];

export default function BroadcastPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const { returnTo } = useLocalSearchParams<{ returnTo: string }>();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<BroadcastFormValues>({
    resolver: zodResolver(BroadcastSchema),
    defaultValues: {
      title: "",
      message: "",
      level: "info",
      target_role: "",
    },
    mode: "onChange",
  });

  const currentLevel = watch("level");

  // Fungsi Submit Asli (Ke Backend)
  const submit = handleSubmit(async (values) => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await api("notifications/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          message: values.message,
          level: values.level,
          target_role: values.target_role || null,
        }),
      });
      showSnackbar({
        message: "Notifikasi berhasil disiarkan.",
        variant: "success",
      });
      router.back();
    } catch (error) {
      console.error("Failed to broadcast", error);
      showSnackbar({ message: "Gagal mengirim notifikasi.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  });

  if (user?.role === "siswa") {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-gray-500">
          Anda tidak memiliki akses ke halaman ini.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <PageHeader
        title="Siarkan Notifikasi"
        subtitle="Kirim pesan ke pengguna aplikasi."
        backPath={returnTo}
      />

      <Card>
        <View className="gap-4">
          {/* Form Input (Sama seperti sebelumnya) */}
          <View>
            <Text className="mb-1 text-gray-800 font-medium">
              Judul <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Contoh: Pengumuman Penting"
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
              Pesan <Text className="text-red-500">*</Text>
            </Text>
            <Controller
              control={control}
              name="message"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Tulis pesan notifikasi di sini..."
                  multiline
                  numberOfLines={4}
                />
              )}
            />
            {errors.message ? (
              <Text className="text-xs text-red-500 mt-1">
                {errors.message.message}
              </Text>
            ) : null}
          </View>

          <View>
            <Text className="mb-2 text-gray-800 font-medium">
              Tingkat Urgensi
            </Text>
            <View className="flex-row gap-2">
              {LEVELS.map((lvl) => {
                const isActive = currentLevel === lvl.value;

                return (
                  <Button
                    key={lvl.value}
                    title={lvl.label}
                    onPress={() => setValue("level", lvl.value)}
                    
                  />
                );
              })}
            </View>
          </View>

          <View>
            <Text className="mb-2 text-gray-800 font-medium">
              Target Penerima
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ROLES.map((role) => {
                const isSelected = watch("target_role") === role.value;
                return (
                  <Button
                    key={role.label}
                    title={role.label}
                    onPress={() => setValue("target_role", role.value)}
                    variant={isSelected ? "primary" : "outline"}
                    size="sm"
                    className="mb-1"
                  />
                );
              })}
            </View>
          </View>
        </View>
      </Card>

      <View className="gap-3">
        <Button
          title={submitting ? "Menyiarkan..." : "Siarkan ke Semua User"}
          onPress={submit}
          loading={submitting}
          disabled={!isValid || submitting}
          variant="primary"
        />
      </View>
    </ScrollView>
  );
}
