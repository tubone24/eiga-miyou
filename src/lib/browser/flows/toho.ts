export interface BookingFlowStep {
  id: string;
  name: string;
  description: string;
  url?: string;
  isPaymentStep?: boolean;
}

export const tohoFlow: BookingFlowStep[] = [
  {
    id: "login",
    name: "ログイン",
    description: "TOHOシネマズのアカウントにログインします。メールアドレスとパスワードを入力してログインボタンをクリックしてください。",
    url: "https://hlo.tohotheater.jp/net/login/",
  },
  {
    id: "select-theater",
    name: "劇場選択",
    description: "指定された劇場を選択してください。劇場名のリンクをクリックします。",
    url: "https://hlo.tohotheater.jp/net/schedule/",
  },
  {
    id: "select-showtime",
    name: "上映回選択",
    description: "指定された映画タイトルを見つけ、指定された日付と時間の上映回を選択してください。",
  },
  {
    id: "select-seats",
    name: "座席選択",
    description: "座席マップから希望の座席を選択してください。空席は選択可能な状態で表示されます。選択後、次へ進むボタンをクリックしてください。",
  },
  {
    id: "select-ticket-type",
    name: "券種選択",
    description: "チケットの券種（一般、大学生、高校生等）を選択してください。",
  },
  {
    id: "payment",
    name: "支払い",
    description: "ここで停止してください。支払い情報の入力画面に到達しました。ユーザーに支払い操作を引き継ぎます。",
    isPaymentStep: true,
  },
];

export const TOHO_BASE_URL = "https://hlo.tohotheater.jp";
