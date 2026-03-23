import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import AdminGuard from "@/components/AdminGuard";

const AdminLayout = () => {
  return (
    <AdminGuard>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 flex items-center border-b border-border bg-card/50 backdrop-blur-sm px-4">
              <SidebarTrigger className="mr-4" />
              <span className="font-display font-bold text-lg">Painel Administrativo</span>
            </header>
            <main className="flex-1 p-6 bg-background overflow-auto">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AdminGuard>
  );
};

export default AdminLayout;
