import React, { useState } from "react";
import { Text, View } from "react-native";
import { Button, ErrorText, Input, Screen } from "@/components/ui";
import { useAuth } from "@/lib/auth";

export default function SignIn() {
  const { signIn, signUp } = useAuth();
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
        <Text className="mb-1 text-center text-3xl font-bold text-foreground">StockPilot</Text>
        <Text className="mb-8 text-center text-muted-foreground">Inventory management</Text>

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
        <View className="mt-4">
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
