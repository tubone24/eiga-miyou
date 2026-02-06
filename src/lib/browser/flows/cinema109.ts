import type { BookingFlowStep } from "./toho";

export const cinema109Flow: BookingFlowStep[] = [
  {
    id: "login",
    name: "ログイン",
    description: "109シネマズのアカウントにログインします。メールアドレスとパスワードを入力してログインしてください。",
    url: "https://109cinemas.net/auth/login/",
  },
  {
    id: "select-theater",
    name: "劇場・日付選択",
    description: "指定された劇場を選択し、日付を選択してください。",
    url: "https://109cinemas.net/schedules/",
  },
  {
    id: "select-showtime",
    name: "映画・上映回選択",
    description: "指定された映画タイトルと上映時間の回を選択してください。",
  },
  {
    id: "select-ticket-count",
    name: "人数・券種選択",
    description: "鑑賞人数と券種（一般、大学生等）を選択してください。",
  },
  {
    id: "select-seats",
    name: "座席選択",
    description: "座席マップから希望の座席を選択してください。選択後、確認画面に進んでください。",
  },
  {
    id: "payment",
    name: "支払い",
    description: "ここで停止してください。支払い情報の入力画面に到達しました。ユーザーに支払い操作を引き継ぎます。",
    isPaymentStep: true,
  },
];

export const CINEMA109_BASE_URL = "https://109cinemas.net";
