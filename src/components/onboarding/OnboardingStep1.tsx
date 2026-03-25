import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, AtSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import avatarMale from "@/assets/avatar-male.png";
import avatarFemale from "@/assets/avatar-female.png";

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;
const USERNAME_CHAR_REGEX = /^[a-zA-Z0-9._]*$/;

interface OnboardingStep1Props {
  displayName: string;
  setDisplayName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  selectedModules: string[];
  setSelectedModules: (v: string[]) => void;
  onNext: () => void;
  loading: boolean;
}

export default function OnboardingStep1({
  displayName, setDisplayName,
  username, setUsername,
  email, setEmail,
  password, setPassword,
  gender, setGender,
  selectedModules, setSelectedModules,
  onNext, loading,
}: OnboardingStep1Props) {
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase
      .from("onboarding_modules")
      .select("id, name")
      .eq("active", true)
      .then(({ data }) => {
        if (data) setModules(data);
      });
  }, []);

  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3 || !USERNAME_REGEX.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const { data } = await supabase.rpc("check_username_available", { p_username: value });
    setUsernameStatus(data ? "available" : "taken");
  }, []);

  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameStatus(username.length > 0 ? "invalid" : "idle");
      return;
    }
    if (!USERNAME_CHAR_REGEX.test(username)) {
      setUsernameStatus("invalid");
      return;
    }
    const timeout = setTimeout(() => checkUsername(username), 400);
    return () => clearTimeout(timeout);
  }, [username, checkUsername]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "");
    if (val.length <= 20) setUsername(val);
  };

  const toggleModule = (id: string) => {
    setSelectedModules(
      selectedModules.includes(id)
        ? selectedModules.filter((m) => m !== id)
        : [...selectedModules, id]
    );
  };

  const UsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking": return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "available": return <Check className="h-4 w-4 text-green-500" />;
      case "taken": return <X className="h-4 w-4 text-destructive" />;
      default: return null;
    }
  };

  const canProceed =
    displayName.trim() &&
    username.length >= 3 &&
    usernameStatus === "available" &&
    email.trim() &&
    password.length >= 6 &&
    gender;

  return (
    <div className="space-y-4">
      {/* Avatar preview */}
      {gender && (
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={gender === "masculino" ? avatarMale : avatarFemale}
              alt={`Avatar ${gender}`}
              className="w-24 h-24 rounded-full border-4 border-primary/30 object-cover bg-muted shadow-lg transition-all duration-300"
              width={96} height={96}
            />
            <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">✓</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Nome de usuário</Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><AtSign className="h-4 w-4" /></div>
          <Input id="username" value={username} onChange={handleUsernameChange} placeholder="seu_usuario" className="pl-9 pr-9" required minLength={3} maxLength={20} />
          <div className="absolute right-3 top-1/2 -translate-y-1/2"><UsernameStatusIcon /></div>
        </div>
        {usernameStatus === "available" && <p className="text-xs text-green-500">Nome de usuário disponível</p>}
        {usernameStatus === "taken" && <p className="text-xs text-destructive">Esse nome de usuário não está disponível</p>}
        {usernameStatus === "invalid" && username.length > 0 && <p className="text-xs text-muted-foreground">3-20 caracteres: letras, números, ponto ou underline</p>}
      </div>

      <div className="space-y-2">
        <Label>Sexo</Label>
        <div className="grid grid-cols-2 gap-3">
          {[{ value: "masculino", icon: "♂️", label: "Masculino" }, { value: "feminino", icon: "♀️", label: "Feminino" }].map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => setGender(g.value)}
              className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                gender === g.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50"
              }`}
            >
              <span className="text-lg">{g.icon}</span>{g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
      </div>

      {modules.length > 0 && (
        <div className="space-y-2">
          <Label>Módulos de interesse</Label>
          <div className="flex flex-wrap gap-2">
            {modules.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleModule(m.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium border-2 transition-all ${
                  selectedModules.includes(m.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:border-primary/50"
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button type="button" className="w-full" size="lg" disabled={!canProceed || loading} onClick={onNext}>
        {loading ? "Carregando..." : "Continuar"}
      </Button>
    </div>
  );
}
