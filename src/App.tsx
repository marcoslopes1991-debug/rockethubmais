import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { useAppBranding } from "@/hooks/useAppBranding";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Quiz from "./pages/Quiz";
import Ranking from "./pages/Ranking";
import Items from "./pages/Items";
import NotFound from "./pages/NotFound";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminQuestions from "./pages/admin/AdminQuestions";
import AdminItems from "./pages/admin/AdminItems";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminImportQuestions from "./pages/admin/AdminImportQuestions";
import AdminAchievements from "./pages/admin/AdminAchievements";
import AdminLevels from "./pages/admin/AdminLevels";
import AdminAiConfig from "./pages/admin/AdminAiConfig";
import AdminGeneralSettings from "./pages/admin/AdminGeneralSettings";
import AdminReservedUsernames from "./pages/admin/AdminReservedUsernames";
import AdminOnboarding from "./pages/admin/AdminOnboarding";
import Journey from "./pages/Journey";
import EvolutionMap from "./pages/EvolutionMap";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Chat from "./pages/Chat";
import RockZAssistant from "./components/RockZAssistant";

const queryClient = new QueryClient();

const AppContent = () => {
  useAppBranding();
  return (
    <>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/journey" element={<Journey />} />
              <Route path="/evolution-map" element={<EvolutionMap />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/items" element={<Items />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="questions" element={<AdminQuestions />} />
                <Route path="items" element={<AdminItems />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="import" element={<AdminImportQuestions />} />
                <Route path="levels" element={<AdminLevels />} />
                <Route path="achievements" element={<AdminAchievements />} />
                <Route path="ai-config" element={<AdminAiConfig />} />
                <Route path="settings" element={<AdminGeneralSettings />} />
                <Route path="reserved-usernames" element={<AdminReservedUsernames />} />
                <Route path="onboarding" element={<AdminOnboarding />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
            <RockZAssistant />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
