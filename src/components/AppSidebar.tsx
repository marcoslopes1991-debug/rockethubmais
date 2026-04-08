import { Home, Trophy, MapIcon, Backpack, Award, Rss, Bell, User, Shield, LogOut, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import SoundToggle from "@/components/SoundToggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppBranding } from "@/hooks/useAppBranding";
import { Zap } from "lucide-react";

const mainItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Mapa", url: "/evolution-map", icon: MapIcon },
  { title: "Itens", url: "/items", icon: Backpack },
  { title: "Conquistas", url: "/achievements", icon: Award },
  { title: "Feed", url: "/feed", icon: Rss },
  { title: "Jornada", url: "/journey", icon: Star },
  { title: "Perfil", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin } = useAdmin();
  const { signOut } = useAuth();
  const { appName, logoUrl: brandLogoUrl } = useAppBranding();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="hidden lg:flex">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4">
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt={appName} className="h-8 w-8 rounded-lg object-contain shrink-0" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          <span
            className={cn(
              "font-display font-bold text-base truncate transition-opacity duration-200",
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}
          >
            {appName}
          </span>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="hover:bg-muted/50"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4 shrink-0" />
                          <span className={cn(
                            "transition-opacity duration-200 whitespace-nowrap",
                            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                          )}>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.title}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              ))}
              {isAdmin && (
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to="/admin"
                          className="hover:bg-muted/50"
                          activeClassName="bg-muted text-primary font-medium"
                        >
                          <Shield className="mr-2 h-4 w-4 shrink-0" />
                          <span className={cn(
                            "transition-opacity duration-200 whitespace-nowrap",
                            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                          )}>Admin</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="font-medium">
                        Admin
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="flex items-center gap-2 px-2">
          <SoundToggle />
          <span className={cn(
            "text-xs text-muted-foreground transition-opacity duration-200 whitespace-nowrap",
            collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
          )}>Som</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="text-destructive hover:bg-destructive/10">
              <LogOut className="mr-2 h-4 w-4 shrink-0" />
              <span className={cn(
                "transition-opacity duration-200 whitespace-nowrap",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
              )}>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
