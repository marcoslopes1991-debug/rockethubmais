import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Zap } from "lucide-react";
import OnboardingStep1 from "@/components/onboarding/OnboardingStep1";
import OnboardingStep2 from "@/components/onboarding/OnboardingStep2";
import OnboardingStep3 from "@/components/onboarding/OnboardingStep3";
import OnboardingProgress from "@/components/onboarding/OnboardingProgress";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [appName, setAppName] = useState("QuizLearn");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Onboarding state
  const [step, setStep] = useState(1);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [trabalhaSap, setTrabalhaSap] = useState<boolean | null>(null);
  const [perfilSap, setPerfilSap] = useState("");
  const [tempoSap, setTempoSap] = useState("");
  const [cursosRockethub, setCursosRockethub] = useState<string[]>([]);

  useEffect(() => {
    if (user && !isOnboarding) navigate("/");
  }, [user, navigate, isOnboarding]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    // Check user status
    if (signInData.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("user_id", signInData.user.id)
        .single();
      const status = (profile as any)?.status;
      if (status === "blocked" || status === "deactivated") {
        await supabase.auth.signOut();
        const msg = status === "blocked"
          ? "Sua conta está bloqueada. Entre em contato com o suporte."
          : "Sua conta foi desativada. Entre em contato com o suporte.";
        toast({ title: "Acesso negado", description: msg, variant: "destructive" });
        setLoading(false);
        return;
      }
    }
    navigate("/");
    setLoading(false);
  };

  // Step 1 → create account (or update if already created), then go to step 2
  const handleStep1Next = async () => {
    if (!gender) {
      toast({ title: "Campo obrigatório", description: "Selecione seu sexo para continuar.", variant: "destructive" });
      return;
    }
    setLoading(true);

    // If already onboarding (came back from step 2), just update profile
    if (isOnboarding) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        await supabase
          .from("profiles")
          .update({
            gender,
            username,
            modulos_interesse: selectedModules,
          } as any)
          .eq("user_id", currentUser.id);
      }
      setLoading(false);
      setStep(2);
      return;
    }

    setIsOnboarding(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName || email.split("@")[0], gender } },
    });
    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      setIsOnboarding(false);
      setLoading(false);
      return;
    }
    if (data.user) {
      await supabase
        .from("profiles")
        .update({
          gender,
          username,
          modulos_interesse: selectedModules,
        } as any)
        .eq("user_id", data.user.id);
    }
    setLoading(false);
    setStep(2);
  };

  // Step 2 → save SAP answers, go to step 3
  const handleStep2Next = async () => {
    setLoading(true);
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      await supabase
        .from("profiles")
        .update({
          trabalha_com_sap: trabalhaSap,
          perfil_sap: trabalhaSap ? perfilSap : null,
          tempo_experiencia_sap: trabalhaSap ? tempoSap : null,
          cursos_rockethub: !trabalhaSap ? cursosRockethub : [],
        } as any)
        .eq("user_id", currentUser.id);
    }
    setLoading(false);
    setStep(3);
  };

  const handleFinish = () => {
    navigate("/");
  };

  // Forgot password screen
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
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Enviando..." : "Enviar link"}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsForgot(false)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                Voltar ao login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Signup onboarding flow
  if (!isLogin) {
    const totalSteps = 2;
    const titles = ["Crie sua conta", "Sobre você", "Bem-vindo!"];
    const descriptions = ["Comece sua jornada de aprendizado", "Nos conte um pouco mais sobre você", ""];

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
        <Card className="w-full max-w-md glass-card animate-slide-up">
          <CardHeader className="text-center space-y-2">
            <LogoDisplay />
            <CardTitle className="text-2xl font-display">{titles[step - 1]}</CardTitle>
            {descriptions[step - 1] && <CardDescription>{descriptions[step - 1]}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {step < 3 && <OnboardingProgress currentStep={step} totalSteps={totalSteps} />}

            {step === 1 && (
              <OnboardingStep1
                displayName={displayName} setDisplayName={setDisplayName}
                username={username} setUsername={setUsername}
                email={email} setEmail={setEmail}
                password={password} setPassword={setPassword}
                gender={gender} setGender={setGender}
                selectedModules={selectedModules} setSelectedModules={setSelectedModules}
                onNext={handleStep1Next} loading={loading}
                accountCreated={isOnboarding}
              />
            )}

            {step === 2 && (
              <OnboardingStep2
                trabalhaSap={trabalhaSap} setTrabalhaSap={setTrabalhaSap}
                perfilSap={perfilSap} setPerfilSap={setPerfilSap}
                tempoSap={tempoSap} setTempoSap={setTempoSap}
                cursosRockethub={cursosRockethub} setCursosRockethub={setCursosRockethub}
                onNext={handleStep2Next} onBack={() => setStep(1)}
                loading={loading}
              />
            )}

            {step === 3 && (
              <OnboardingStep3 displayName={displayName} onFinish={handleFinish} />
            )}

            {step === 1 && (
              <div className="text-center">
                <button type="button" onClick={() => setIsLogin(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Já tem conta? Faça login
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Login screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md glass-card animate-slide-up">
        <CardHeader className="text-center space-y-2">
          <LogoDisplay />
          <CardTitle className="text-2xl font-display">Bem-vindo de volta!</CardTitle>
          <CardDescription>Entre para continuar aprendendo</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">E-mail</Label>
              <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Senha</Label>
              <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <div className="text-right">
              <button type="button" onClick={() => setIsForgot(true)} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Esqueci minha senha
              </button>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Carregando..." : "Entrar"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button type="button" onClick={() => setIsLogin(false)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Não tem conta? Cadastre-se
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
