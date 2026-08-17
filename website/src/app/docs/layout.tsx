import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default function DocsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex-1 flex flex-col w-full min-w-0">
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          <div className="flex items-center gap-2 flex-1">
            <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
            <div className="hidden md:flex items-center space-x-4 text-sm font-medium text-muted-foreground">
              <span className="text-foreground transition-colors font-semibold">Documentation</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto scroll-smooth">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
