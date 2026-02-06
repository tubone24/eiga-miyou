import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserBookings } from "@/lib/db/bookings";
import { AppHeader } from "@/components/app-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "処理中", variant: "secondary" },
  seats_selected: { label: "座席選択済", variant: "secondary" },
  payment_ready: { label: "支払い待ち", variant: "default" },
  completed: { label: "完了", variant: "outline" },
  cancelled: { label: "キャンセル", variant: "destructive" },
  failed: { label: "失敗", variant: "destructive" },
};

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const bookings = getUserBookings(session.user.id);

  return (
    <div className="flex flex-col h-screen">
      <AppHeader user={session.user} />
      <main className="flex-1 overflow-auto p-4 bg-neutral-50">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-neutral-900 mb-4">予約履歴</h1>
          {bookings.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-12">
              まだ予約はありません
            </p>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => {
                const status = statusLabels[booking.status] ?? {
                  label: booking.status,
                  variant: "secondary" as const,
                };
                return (
                  <Card key={booking.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-sm">
                            {booking.movieTitle}
                          </h3>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {booking.theaterName}
                          </p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-600 mt-2">
                        <span>{booking.showDate}</span>
                        <span>{booking.showTime}</span>
                        <span>座席: {JSON.parse(booking.seats).join(", ")}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
