import { Home, Trophy, MapIcon, Backpack, Award, Rss, User, Shield, LogOut, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/hooks/useAuth";
import SoundToggle from "@/components/SoundToggle";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
];

const SidebarNavItem = ({ item, collapsed, isActive }: { item: { title: string; url: string; icon: React.ComponentType<any> }; collapsed: boolean; isActive: boolean }) => (
  <SidebarMenuItem>
    <Tooltip>
      <TooltipTrigger asChild>
        <SidebarMenuButton asChild className="bg-transparent border-none shadow-none">
          <NavLink
            to={item.url}
            end={item.url === "/"}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors bg-transparent",
              "hover:bg-muted/50",
              collapsed && "justify-center px-0"
            )}
            activeClassName="bg-muted text-primary font-medium"
          >
            <item.icon className={cn("h-5 w-5 shrink-0", collapsed && "mr-0")} />
            {!collapsed && <span className="whitespace-nowrap">{item.title}</span>}
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
);

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin } = useAdmin();
  const { signOut } = useAuth();
  const { appName, logoUrl: brandLogoUrl } = useAppBranding();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="hidden lg:flex border-r border-border/40">
      <SidebarContent className="bg-transparent">
        {/* Logo */}
        <div className={cn("flex items-center gap-2 py-4", collapsed ? "justify-center px-2" : "px-4")}>
          {brandLogoUrl ? (
            <img src={brandLogoUrl} alt={appName} className="h-8 w-8 rounded-lg object-contain shrink-0" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shrink-0">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <span className="font-display font-bold text-base truncate">
              {appName}
            </span>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {mainItems.map((item) => (
                <SidebarNavItem
                  key={item.title}
                  item={item}
                  collapsed={collapsed}
                  isActive={isActive(item.url)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={cn("border-t border-border/40 p-2", collapsed ? "items-center" : "")}>
        {/* Perfil */}
        <SidebarMenu className="gap-1">
          <SidebarNavItem
            item={{ title: "Perfil", url: "/profile", icon: User }}
            collapsed={collapsed}
            isActive={isActive("/profile")}
          />
          {isAdmin && (
            <SidebarNavItem
              item={{ title: "Admin", url: "/admin", icon: Shield }}
              collapsed={collapsed}
              isActive={isActive("/admin")}
            />
          )}
        </SidebarMenu>

        {/* Som + Sair */}
        <div className={cn("flex items-center gap-2 mt-1", collapsed ? "justify-center" : "px-3")}>
          <SoundToggle />
          {!collapsed && <span className="text-xs text-muted-foreground">Som</span>}
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton
                  onClick={signOut}
                  className={cn(
                    "bg-transparent border-none shadow-none text-destructive hover:bg-destructive/10",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <LogOut className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="whitespace-nowrap">Sair</span>}
                </SidebarMenuButton>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  Sair
                </TooltipContent>
              )}
            </Tooltip>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
