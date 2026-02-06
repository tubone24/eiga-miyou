# eiga-miyou (映画見よう！)

映画鑑賞プランナーAIエージェント。観たい映画を伝えるだけで、近くの映画館検索・上映スケジュール取得・Googleカレンダー連携・レストラン提案・予約自動化までを一気通貫で行います。

![demo](docs/images/demo.gif)

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フロントエンド | Next.js 16 (App Router) + React 19 + Tailwind CSS v4 |
| UI | shadcn/ui |
| AIフレームワーク | Mastra (@mastra/core) |
| LLM | Claude Sonnet 4.5 (@ai-sdk/anthropic) |
| 認証 | Auth.js v5 + Google OAuth |
| DB | SQLite (better-sqlite3) |
| ブラウザ自動化 | agent-browser (Vercel Labs) |

---

## セットアップ

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. agent-browser のグローバルインストール

```bash
npm install -g agent-browser
```

### 3. 環境変数の設定

`.env.local` を編集し、以下の各キーを設定してください。

---

## 環境変数の取得方法

### AUTH_SECRET / CREDENTIAL_ENCRYPTION_KEY（ローカル生成）

この2つはコマンドで即座に生成できます。最初にこれを済ませましょう。

```bash
# AUTH_SECRET（Auth.jsのセッション暗号化用）
openssl rand -base64 32

# CREDENTIAL_ENCRYPTION_KEY（映画館認証情報のAES-256-GCM暗号化用）
openssl rand -hex 32
```

それぞれの出力を `.env.local` の対応する行にコピーしてください。

---

### ANTHROPIC_API_KEY

Claude API のキーです。

**取得手順（所要時間: 約5分）**

1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. アカウントを作成（メール or Google認証）
3. Settings > Billing でクレジットカードを登録
   - 新規アカウントには **$5の無料クレジット** が付与されます
4. 左サイドバーの **「API Keys」** をクリック
5. **「Create Key」** をクリックし、名前を付けて作成
6. 表示されたキー（`sk-ant-...`）をコピー

> キーは作成時に一度しか表示されません。必ずその場でコピーしてください。

**参考料金（Claude Sonnet 4.5）**: 入力 $3 / 出力 $15（100万トークンあたり）

---

### GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET

Google OAuth 認証用のクライアントIDです。ユーザーログインとGoogle Calendar APIのアクセスに使います。

**取得手順（所要時間: 約20-30分）**

#### Step 1: Google Cloud プロジェクト作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 上部のプロジェクトセレクターから **「新しいプロジェクト」** をクリック
3. プロジェクト名を入力（例: `eiga-miyou`）して作成

#### Step 2: Calendar API を有効化

1. 左メニュー **「APIとサービス」>「ライブラリ」** に移動
2. **「Google Calendar API」** を検索してクリック
3. **「有効にする」** をクリック

> これを有効にしないとカレンダー連携が動きません。忘れがちなので注意。

#### Step 3: Google Auth platform の設定（OAuth同意画面）

> **注意**: 2025年のUI刷新により、OAuth同意画面の設定場所が変わっています。
> 旧: 「APIとサービス > OAuth同意画面」
> 新: **「Google Auth platform」**（左メニューの独立したセクション）

1. 左メニューの **「Google Auth platform」** をクリック
2. 初めての場合は「**Get Started**」ボタンが表示されるのでクリック
3. **App Information（アプリ情報）** を入力:
   - アプリ名: `eiga-miyou`
   - ユーザーサポートメール: 自分のメールアドレス
   - 「Next」をクリック
4. **Audience（オーディエンス）** でユーザータイプを選択:
   - **External（外部）** を選択（個人Gmailアカウントの場合はこれのみ選択可能）
   - 「Internal（内部）」はGoogle Workspace組織でのみ選択可能
   - 「Next」をクリック
5. **Contact Information（連絡先情報）** に通知用メールアドレスを入力して「Next」
6. **利用規約** に同意して「Create」をクリック

#### Step 3b: スコープとテストユーザーの設定

設定完了後、**Google Auth platform** のサブメニューが表示されます:

1. **「Data Access」** セクションに移動し、以下のスコープを追加:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `.../auth/calendar.events`
   - `.../auth/calendar.readonly`
2. **「Audience」** セクションに移動し、テストユーザーに自分のGmailアドレスを追加

> Testing モードでは最大100名のテストユーザーまで。アクセストークンは14日で期限切れになります。

#### Step 4: OAuth クライアントID の作成

1. 左メニュー **「APIとサービス」>「認証情報」** に移動
2. **「認証情報を作成」>「OAuth クライアント ID」** をクリック
3. アプリケーションの種類: **「ウェブ アプリケーション」**
4. 名前: `eiga-miyou-dev`
5. **承認済みのリダイレクト URI** に以下を追加:

```
http://localhost:3000/api/auth/callback/google
```

6. **「作成」** をクリック
7. 表示される **クライアントID** と **クライアントシークレット** をコピー

`.env.local` に設定:
```
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
```

---

### GOOGLE_MAPS_API_KEY

Google Maps の Places API と Directions API に使うAPIキーです。OAuth不要で、このキーだけで動きます。

#### Step 1: API の有効化

上で作った同じ Google Cloud プロジェクトで作業します。

1. 「APIとサービス」>「ライブラリ」に移動
2. 以下の2つのAPIを検索して、それぞれ **「有効にする」**:
   - **Places API (New)** ← 「Places API」ではなく「New」の方を選ぶこと
   - **Directions API**

#### Step 2: API キーの作成

1. 「APIとサービス」>「認証情報」に移動
2. **「認証情報を作成」>「API キー」** をクリック
3. キーが生成されるのでコピー

#### Step 3: キーの制限（推奨）

セキュリティのため、作成したキーに制限をかけましょう。

1. 作成したキーの名前をクリックして編集画面を開く
2. 「API の制限」で **「キーを制限」** を選択
3. **Places API (New)** と **Directions API** だけにチェックを入れる
4. 「保存」をクリック

**料金について**:
- Places API: 月5,000リクエストまで無料枠あり
- Directions API: $5 / 1,000リクエスト（月$200の無料クレジットが毎月付与）
- 開発段階では無料枠で十分です

---

### TMDB_API_KEY

TMDb (The Movie Database) の映画情報検索に使うAPIキーです。

1. [TMDb](https://www.themoviedb.org/) にアクセス
2. 右上の **「参加する」** からアカウントを作成（無料）
3. メール認証を完了
4. ログイン後、右上のアイコン > **「設定」** をクリック
5. 左メニューの **「API」** をクリック
6. **「APIキーをリクエスト」** をクリック
7. 利用目的（Developer / Personal など）を選択
8. アプリ情報を入力して送信
9. 表示された **API Key (v3 auth)** をコピー

```
TMDB_API_KEY=abc123def456...
```

> 非商用利用であれば **完全無料** です。TMDbのロゴ/クレジット表示が必要です。

---

## 最終的な .env.local の例

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx

# Google OAuth (Calendar + User Auth)
GOOGLE_CLIENT_ID=123456789-xxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxx

# Google Maps (API Key only)
GOOGLE_MAPS_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxx

# TMDb
TMDB_API_KEY=abcdef1234567890

# Auth.js
AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Encryption Key for theater credentials
CREDENTIAL_ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# SQLite
DATABASE_PATH=./data/eiga-miyou.db
```

---

## 設定の推奨順序

| 順番 | 項目 | 所要時間 |
|-----|------|---------|
| 1 | AUTH_SECRET / CREDENTIAL_ENCRYPTION_KEY | 1分 |
| 2 | Google Cloud プロジェクト作成 + OAuth + Calendar API 有効化 | 20-30分 |
| 3 | Google Maps API Key + Places/Directions 有効化 | 10分 |
| 4 | TMDb API Key | 5分 |
| 5 | Anthropic API Key | 5分 |

---

## DB の初期化

環境変数の設定が終わったら、データベースを初期化します:

```bash
npx tsx src/lib/db/migrate.ts
```

---

## 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) にアクセスしてください。Google ログイン画面が表示されれば成功です。

---

## トラブルシューティング

### "Redirect URI mismatch" エラー

Google Cloud Console の「承認済みのリダイレクト URI」が以下と完全一致しているか確認:
```
http://localhost:3000/api/auth/callback/google
```

### Calendar API が動かない

Google Cloud Console で **Google Calendar API** が有効化されているか確認してください。「Places API」等と別のAPIです。

### "Access Not Configured" エラー

使おうとしているAPIが Google Cloud プロジェクトで有効化されていません。「APIとサービス」>「ライブラリ」から該当APIを有効化してください。

### TMDb で映画が見つからない

日本語タイトルで検索しても結果が出ない場合は、英語の原題で試してください。TMDb APIは `language=ja-JP` パラメータで日本語結果を返しますが、検索クエリ自体は原題の方がヒットしやすい場合があります。
