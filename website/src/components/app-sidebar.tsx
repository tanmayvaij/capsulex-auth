"use client";

import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Getting Started",
    links: [
      { title: "Introduction", url: "/" },
      { title: "Installation", url: "/docs/installation" },
    ]
  },
  {
    title: "Client SDKs",
    links: [
      { title: "React Hooks SDK", url: "/docs/react-sdk" },
    ]
  },
  {
    title: "REST API",
    links: [
      { title: "API Reference", url: "/docs/api" },
    ]
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center mr-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-lg tracking-tight">Capsulex</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4 py-6 gap-8">
        {items.map((group) => (
          <SidebarGroup key={group.title} className="px-0">
            <SidebarGroupLabel className="text-sm font-semibold text-foreground mb-2 px-2">
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.links.map((link) => {
                  const isActive = pathname === link.url;
                  return (
                    <SidebarMenuItem key={link.title}>
                      <SidebarMenuButton 
                        isActive={isActive} 
                        className={isActive ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"} 
                        render={<a href={link.url} />}
                      >
                        {link.title}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
