import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const AppLayout = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) setOpen(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile]);

  return (
    <SidebarProvider open={isMobile ? undefined : open} onOpenChange={isMobile ? undefined : setOpen}>
      <div className="min-h-screen flex w-full">
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
