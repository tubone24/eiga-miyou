import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PlannerPage } from "@/components/movie-planner/planner-page";
import { AppHeader } from "@/components/app-header";

export default async function ChatPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-col h-screen bg-neutral-50">
      <AppHeader user={session.user} />
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <PlannerPage />
      </main>
    </div>
  );
}
