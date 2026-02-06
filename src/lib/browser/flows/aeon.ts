import type { BookingFlowStep } from "./toho";

export const aeonFlow: BookingFlowStep[] = [
  {
    id: "login",
    name: "ログイン",
    description: "イオンシネマのワタシアタープラスアカウントにログインします。会員番号（またはメールアドレス）とパスワードを入力してログインしてください。",
    url: "https://www.aeoncinema.com/login/",
  },
  {
    id: "select-theater",
    name: "劇場選択",
    description: "e席リザーブのページで、指定された劇場を選択してください。",
    url: "https://www.aeoncinema.com/cinema/",
  },
  {
    id: "select-movie",
    name: "映画選択",
    description: "指定された映画タイトルを見つけ、上映スケジュールから指定された日時の回を選択してください。",
  },
  {
    id: "select-seats",
    name: "座席選択",
    description: "座席マップから希望の座席を選択してください。選択後、次へ進むボタンをクリックしてください。",
  },
  {
    id: "select-ticket-type",
    name: "券種選択",
    description: "チケットの券種を選択してください。ワタシアター会員割引が適用される場合があります。",
  },
  {
    id: "payment",
    name: "支払い",
    description: "ここで停止してください。支払い情報の入力画面に到達しました。ユーザーに支払い操作を引き継ぎます。",
    isPaymentStep: true,
  },
];

export const AEON_BASE_URL = "https://www.aeoncinema.com";
