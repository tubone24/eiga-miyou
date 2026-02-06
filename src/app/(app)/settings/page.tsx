import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="flex flex-col h-screen">
      <AppHeader user={session.user} />
      <main className="flex-1 overflow-auto p-4 bg-neutral-50">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-neutral-900 mb-4">設定</h1>
          <SettingsForm userId={session.user.id} />
        </div>
      </main>
    </div>
  );
}
