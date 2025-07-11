import ChatMain from "@/components/chat/chat.main";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";


export default async function Page() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
   <>
    <ChatMain userId={data.user.id} />
   </>
  );
}
