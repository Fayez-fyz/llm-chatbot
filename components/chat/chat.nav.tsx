import { FC } from "react";
import { SidebarTrigger } from "../ui/sidebar";

interface ChatNavProps {}

const ChatNav: FC<ChatNavProps> = ({}) => {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
      <SidebarTrigger className="-ml-1" />
    </header>
  );
};

export default ChatNav;
