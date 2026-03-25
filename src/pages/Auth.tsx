import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Zap, Check, X, Loader2, AtSign } from "lucide-react";
import avatarMale from "@/assets/avatar-male.png";
import avatarFemale from "@/assets/avatar-female.png";

const USERNAME_REGEX = /^[a-zA-Z0-9._]{3,20}$/;
const USERNAME_CHAR_REGEX = /^[a-zA-Z0-9._]*$/;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [gender, setGender] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const [appName, setAppName] = useState("QuizLearn");

  useEffect(() => {
    supabase
      .from("ai_config" as any)
      .select("logo_url, app_name")
      .limit(1)
      .single()
      .then(({ data }: any) => {
        if (data?.logo_url) setLogoUrl(data.logo_url);
        if (data?.app_name) setAppName(data.app_name);
      });
  }, []);

  // Real-time username availability check
  const checkUsername = useCallback(async (value: string) => {
    if (value.length < 3) {
      setUsernameStatus("invalid");
      return;
    }
    if (!USERNAME_REGEX.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
    setUsernameStatus("checking");
    const { data, error } = await supabase.rpc("check_username_available", {
      p_username: value,
    });
    if (error) {
      setUsernameStatus("idle");
      return;
    }
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

  const LogoDisplay = () =>
    logoUrl ? (
      <img src={logoUrl} alt="Logo" className="mx-auto h-16 object-contain" />
    ) : (
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
        <Zap className="h-7 w-7 text-primary-foreground" />
      </div>
    );

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setIsForgot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else {
        navigate("/");
      }
    } else {
      if (!gender) {
        toast({ title: "Campo obrigatório", description: "Selecione seu sexo para continuar.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (!username || !USERNAME_REGEX.test(username)) {
        toast({ title: "Nome de usuário inválido", description: "Use 3-20 caracteres: letras, números, ponto ou underline.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (usernameStatus === "taken") {
        toast({ title: "Nome indisponível", description: "Esse nome de usuário já está em uso.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName || email.split("@")[0], gender } },
      });
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else {
        if (data.user) {
          await supabase.from("profiles").update({ gender, username } as any).eq("user_id", data.user.id);
        }
        toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  const UsernameStatusIcon = () => {
    switch (usernameStatus) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case "available":
        return <Check className="h-4 w-4 text-green-500" />;
      case "taken":
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  if (isForgot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md glass-card animate-slide-up">
          <CardHeader className="text-center space-y-2">
            <LogoDisplay />
            <CardTitle className="text-2xl font-display">Esqueci minha senha</CardTitle>
            <CardDescription>Digite seu e-mail para receber o link de redefinição</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsForgot(false)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Voltar ao login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md glass-card animate-slide-up">
        <CardHeader className="text-center space-y-2">
          <LogoDisplay />
          <CardTitle className="text-2xl font-display">
            {isLogin ? "Bem-vindo de volta!" : "Crie sua conta"}
          </CardTitle>
          <CardDescription>
            {isLogin ? "Entre para continuar aprendendo" : "Comece sua jornada de aprendizado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Avatar preview */}
                {gender && (
                  <div className="flex justify-center">
                    <div className="relative">
                      <img
                        src={gender === "masculino" ? avatarMale : avatarFemale}
                        alt={`Avatar ${gender}`}
                        className="w-24 h-24 rounded-full border-4 border-primary/30 object-cover bg-muted shadow-lg transition-all duration-300"
                        width={96}
                        height={96}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                        ✓
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>

                {/* Username field */}
                <div className="space-y-2">
                  <Label htmlFor="username">Nome de usuário</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <AtSign className="h-4 w-4" />
                    </div>
                    <Input
                      id="username"
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="seu_usuario"
                      className="pl-9 pr-9"
                      required
                      minLength={3}
                      maxLength={20}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <UsernameStatusIcon />
                    </div>
                  </div>
                  {usernameStatus === "available" && (
                    <p className="text-xs text-green-500">Nome de usuário disponível</p>
                  )}
                  {usernameStatus === "taken" && (
                    <p className="text-xs text-destructive">Esse nome de usuário já está em uso</p>
                  )}
                  {usernameStatus === "invalid" && username.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      3-20 caracteres: letras, números, ponto ou underline
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGender("masculino")}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                        gender === "masculino"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="text-lg">♂️</span>
                      Masculino
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender("feminino")}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
                        gender === "feminino"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="text-lg">♀️</span>
                      Feminino
                    </button>
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setIsForgot(true)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
