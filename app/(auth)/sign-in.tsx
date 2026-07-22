import { Boxes } from "lucide-react-native";
import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, ErrorText, Input, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useThemeColors } from "@/lib/theme";

export default function SignIn() {
  const { signIn, signUp } = useAuth();
  const colors = useThemeColors();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res =
      mode === "signin" ? await signIn(email.trim(), password) : await signUp(email.trim(), password, fullName.trim());
    if (res.error) setError(res.error);
    setBusy(false);
  };

  return (
    <Screen scroll={false}>
      <View className="flex-1 justify-center">
        <View className="mb-8 items-center">
          <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-primary/12">
            <Boxes color={colors.primary} size={28} />
          </View>
          <Text className="text-2xl font-bold text-foreground">StockPilot</Text>
          <Text className="mt-1 text-muted-foreground">Inventory for wholesale & retail</Text>
        </View>

        <Card className="w-full max-w-sm self-center">
          <Text className="mb-4 text-lg font-semibold text-foreground">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </Text>

          {mode === "signup" && (
            <Input label="Full name" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          )}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <ErrorText message={error} />
          <Button title={mode === "signin" ? "Sign in" : "Create account"} onPress={submit} loading={busy} />
        </Card>

        <View className="mt-4 items-center">
          <Button
            title={mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
            variant="ghost"
            onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          />
        </View>
      </View>
    </Screen>
  );
}
