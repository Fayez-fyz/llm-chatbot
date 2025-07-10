"use client";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { FC, useState } from "react";
import ChatNav from "./chat.nav";
interface ChatMainProps {
  // Define any props if needed
}

const ChatMain: FC<ChatMainProps> = ({}) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  return (
    <>
      <SidebarProvider
        className="flex h-screen w-full flex-col md:flex-row"
        defaultOpen={sidebarOpen}
        open={sidebarOpen}
        onOpenChange={(open) => setSidebarOpen(open)}
      >
        <AppSidebar
          className="hidden md:block"
          style={{
            width: "var(--sidebar-width)",
          }}
        />
        <SidebarInset
          className={cn(
            "flex-1 md:pl-[var(--sidebar-width)] md:pr-0 transition-all duration-300 ease-in-out",
            !sidebarOpen ? "md:pl-0" : ""
          )}
          style={{
            transitionDelay: sidebarOpen ? "0.3s" : "0s",
          }}
        >
          <ChatNav />
          <div className="max-w-screen-xl mx-auto flex h-full w-full flex-col gap-4 px-4 py-2 md:px-8">
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};

export default ChatMain;
