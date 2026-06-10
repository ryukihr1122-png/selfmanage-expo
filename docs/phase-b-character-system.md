# Phase B: キャラクター育成システム設計書 v2

## コンセプト

「習慣ジャンルを選ぶと仲間キャラクターが現れ、タスク達成でそのキャラを育てる」

ユーザー本人のレベルが上がるほど仲間の数やタスク枠が増える **解放ループ** が中毒性を生む。

---

## 1. コアゲームループ

```
┌─────────────────────────────────────────────────────┐
│  1. キャラを選ぶ（＝ジャンルを選ぶ）                    │
│     最初は1体だけ                                     │
│                                                      │
│  2. そのキャラ用のタスクを選ぶ                           │
│     10個のプリセットから3つ（初期枠）                    │
│     → これが毎日の習慣になる                            │
│                                                      │
│  3. 毎日タスクをこなす                                  │
│     → キャラにEXPが入る → キャラが成長（進化）           │
│     → 本人にもEXPが入る → 本人レベルが上がる            │
│                                                      │
│  4. 本人レベルUPで機能解放                              │
│     → 仲間枠+1（新キャラ追加可能に）                    │
│     → タスク枠+1（1キャラあたりのタスク数増加）          │
│     → もっとやりたくなる！                              │
│                                                      │
│  5. タスク難易度UP                                     │
│     → 十分な完了回数＋EXP → タスクをレベルアップ可能     │
│     → 腕立て10回 → 20回（ハードル上がる）               │
│     → もらえるEXPも増える                              │
│     → さらにレベルが上がりやすくなる                     │
│                                                      │
│  → 1に戻る（新キャラ追加）                              │
└─────────────────────────────────────────────────────┘
```

---

## 2. 解放条件テーブル

### 2.1 本人レベルによる解放

| 本人Lv | 仲間枠 | タスク枠/キャラ | 解放される機能 |
|--------|-------|--------------|-------------|
| 1 | 1体 | 3個 | ゲーム開始 |
| 5 | 2体 | 3個 | 2体目の仲間解放 |
| 10 | 2体 | 4個 | タスク枠+1 |
| 15 | 3体 | 4個 | 3体目の仲間解放 |
| 20 | 3体 | 5個 | タスク枠+1 |
| 30 | 4体 | 5個 | 4体目の仲間解放 |
| 40 | 4体 | 6個 | タスク枠+1 |
| 50 | 5体 | 6個 | 5体目（将来課金枠） |
| 60 | 5体 | 7個 | タスク枠+1 |
| 75 | 6体 | 7個 | 全ジャンル解放 |

> 将来的に5体目以降を課金にする場合は、Lv.50以降の枠を「課金で即解放 or レベルで無料解放」の選択肢にする。

### 2.2 タスク難易度UP条件

| タスクLv | 名称 | EXP倍率 | 解放条件 |
|---------|------|---------|---------|
| 1 | 入門 | ×1.0 (10 EXP) | 初期 |
| 2 | 初級 | ×1.5 (15 EXP) | そのタスクを30回完了 |
| 3 | 中級 | ×2.0 (20 EXP) | そのタスクを100回完了 |
| 4 | 上級 | ×3.0 (30 EXP) | そのタスクを300回完了 |
| 5 | 達人 | ×5.0 (50 EXP) | そのタスクを1000回完了 |

> 例: 「腕立て伏せ」
> - Lv.1: 毎日10回（10 EXP）
> - Lv.2: 毎日20回（15 EXP）→ 30日こなすと解放
> - Lv.3: 毎日30回（20 EXP）→ 100日こなすと解放
> - Lv.4: 毎日50回（30 EXP）
> - Lv.5: 毎日100回（50 EXP）

---

## 3. ジャンル & キャラクター

### 3.1 初期6ジャンル

| ID | ジャンル | キャラ名（仮） | 属性 | テーマカラー |
|----|---------|-------------|------|-----------|
| `fitness` | 運動・健康 | フレイム | 🔥 炎 | #E85D3A |
| `learning` | 学習・読書 | ウィズダム | 📚 知 | #4A7FC1 |
| `mindful` | マインドフルネス | セレーナ | 🧘 静 | #7B68C1 |
| `productivity` | 仕事効率 | スウィフト | ⚡ 雷 | #D4A020 |
| `creative` | クリエイティブ | パレット | 🎨 彩 | #E06090 |
| `social` | 人間関係 | ハーモニー | 💚 絆 | #3A9A5A |

### 3.2 キャラクター成長段階

| Stage | 名称 | 必要レベル | ビジュアル変化 |
|-------|------|----------|-------------|
| 0 | タマゴ | Lv.0（初期） | 属性色のタマゴ |
| 1 | 幼体 | Lv.1（最初のタスク完了で孵化） | 小さい姿 |
| 2 | 成長体 | Lv.10 | 一回り大きく |
| 3 | 成体 | Lv.25 | 完全体 |
| 4 | 覚醒体 | Lv.50 | 光を纏う最終形態 |

### 3.3 プリセットタスク（各ジャンル10個）

#### fitness（運動・健康）
| タスク | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|--------|------|------|------|------|------|
| 腕立て伏せ | 10回 | 20回 | 30回 | 50回 | 100回 |
| スクワット | 10回 | 20回 | 30回 | 50回 | 100回 |
| ウォーキング | 15分 | 30分 | 45分 | 60分 | 90分 |
| ストレッチ | 5分 | 10分 | 15分 | 20分 | 30分 |
| プランク | 30秒 | 1分 | 2分 | 3分 | 5分 |
| 水を飲む | 1L | 1.5L | 2L | 2.5L | 3L |
| 7時間睡眠 | 記録 | 7h達成 | 7.5h達成 | 8h達成 | 睡眠スコア90+ |
| ランニング | 1km | 2km | 3km | 5km | 10km |
| ヨガ | 10分 | 15分 | 20分 | 30分 | 45分 |
| 健康的な食事 | 1食 | 2食 | 3食 | 自炊3食 | 完全自炊+記録 |

#### learning（学習・読書）
| タスク | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|--------|------|------|------|------|------|
| 読書 | 10分 | 20分 | 30分 | 45分 | 60分 |
| オンライン講座 | 1レッスン | 2レッスン | 3レッスン | 1章完了 | 1コース完了 |
| 英語学習 | 10分 | 15分 | 20分 | 30分 | 45分 |
| 記事を読む | 1本 | 2本 | 3本 | 5本 | 要約つき5本 |
| ノートまとめ | 1ページ | 2ページ | 3ページ | マインドマップ | 記事化 |
| ポッドキャスト | 1エピソード | 15分 | 30分 | 45分 | 60分 |
| 新技術の調査 | 10分 | 20分 | 30分 | ハンズオン | ブログ投稿 |
| 資格勉強 | 15分 | 30分 | 45分 | 60分 | 90分 |
| アウトプット | 1ツイート | 短文 | 500字 | 1000字 | ブログ1記事 |
| 動画講座 | 15分 | 30分 | 45分 | 60分 | 90分 |

#### mindful（マインドフルネス）
| タスク | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|--------|------|------|------|------|------|
| 瞑想 | 3分 | 5分 | 10分 | 15分 | 20分 |
| 感謝日記 | 1つ | 3つ | 5つ | 詳細に3つ | エッセイ風 |
| 深呼吸エクサ | 1分 | 3分 | 5分 | 10分 | 15分 |
| ジャーナリング | 5分 | 10分 | 15分 | 20分 | 30分 |
| デジタルデトックス | 30分 | 1時間 | 2時間 | 半日 | 1日 |
| 自然の中で過ごす | 10分 | 15分 | 20分 | 30分 | 60分 |
| お風呂に浸かる | 10分 | 15分 | 20分 | アロマ付き | 瞑想つき |
| 1日の振り返り | 箇条書き | 3分 | 5分 | 10分 | 詳細レポート |
| 好きな音楽を聴く | 1曲 | 15分 | 30分 | アルバム1枚 | プレイリスト作成 |
| セルフケア | 1つ | 2つ | スキンケア | フルルーティン | スパデー |

#### productivity（仕事効率）
| タスク | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|--------|------|------|------|------|------|
| 朝イチで重要タスク | 1つ着手 | 1つ完了 | 2つ完了 | 3つ完了 | 最重要を朝に |
| ポモドーロ | 1セット | 2セット | 3セット | 4セット | 6セット |
| メール処理 | 受信箱確認 | 全返信 | Inbox Zero | 15分以内 | 自動化 |
| タスク整理 | リスト作成 | 優先順位 | 時間見積もり | GTD | ウィークリーレビュー |
| デスク整理 | 片付け | 整頓 | 最適配置 | ミニマル | 写真記録 |
| 15分集中作業 | 15分 | 25分 | 45分 | 60分 | 90分 |
| 1つ断る | 意識する | 1つ断る | 優先順位で判断 | 即判断 | 仕組み化 |
| 週次レビュー | 振り返り | 計画 | KPI確認 | 改善策 | 完全レビュー |
| メモを取る | 1メモ | 3メモ | 構造化 | Zettelkasten | ナレッジベース |
| 朝のルーティン | 起床時刻固定 | 3項目 | 5項目 | 60分ルーティン | 完全最適化 |

#### creative（クリエイティブ）
| タスク | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|--------|------|------|------|------|------|
| スケッチ | 1枚 | 3枚 | 5枚 | テーマ付き | 作品化 |
| 写真を撮る | 1枚 | 3枚 | テーマ撮影 | 編集つき | SNS投稿 |
| 文章を書く | 100字 | 300字 | 500字 | 1000字 | 1記事 |
| 音楽を作る/演奏 | 10分 | 15分 | 20分 | 30分 | 1曲完成 |
| 動画を作る | 素材撮影 | 編集10分 | ショート1本 | 5分動画 | フル動画 |
| DIY/工作 | 10分 | 20分 | 30分 | 1作品 | 作品集 |
| 料理で新しいレシピ | 1品 | アレンジ | 創作 | コース | レシピ記録 |
| デザイン練習 | 模写1つ | 模写3つ | オリジナル | ポートフォリオ | クライアントワーク |
| アイデア出し | 3つ | 5つ | 10つ | マインドマップ | 企画書 |
| SNS投稿 | 1投稿 | 画像つき | ストーリー | リール | シリーズ化 |

#### social（人間関係）
| タスク | Lv.1 | Lv.2 | Lv.3 | Lv.4 | Lv.5 |
|--------|------|------|------|------|------|
| 家族に声をかける | 挨拶 | 会話5分 | 一緒に食事 | 感謝を伝える | 手紙を書く |
| 友人に連絡 | 1人にメッセ | 電話5分 | 会う約束 | 実際に会う | イベント企画 |
| 感謝を伝える | 心の中で | 1人に伝える | 3人に伝える | 手書き | サプライズ |
| 新しい人と話す | 挨拶 | 自己紹介 | 会話5分 | 連絡先交換 | 食事に誘う |
| 人の話を聞く | 意識する | 5分集中 | 質問する | アクティブリスニング | メンタリング |
| 褒める | 1人 | 3人 | 具体的に | 手紙 | 公の場で |
| コミュニティ参加 | 閲覧 | コメント | 投稿 | 企画参加 | 運営 |
| 助けを求める | 意識する | 1つ頼む | 素直に依頼 | 定期的に | チーム化 |
| ボランティア | 情報収集 | 1回参加 | 月1回 | 週1回 | リーダー |
| パートナーとの時間 | 15分 | 30分 | デート | サプライズ | 定期イベント |

---

## 4. データベース設計（v2マイグレーション）

### 4.1 新規テーブル

```sql
-- ジャンルマスター（アプリ内蔵）
CREATE TABLE genres (
  id          TEXT PRIMARY KEY,          -- 'fitness', 'learning', ...
  name        TEXT NOT NULL,             -- '運動・健康'
  description TEXT,
  icon_emoji  TEXT NOT NULL,
  theme_color TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- キャラクターマスター（アプリ内蔵）
CREATE TABLE characters (
  id          TEXT PRIMARY KEY,          -- 'fitness_flame', 'learning_wisdom', ...
  genre_id    TEXT NOT NULL REFERENCES genres(id),
  name        TEXT NOT NULL,             -- 'フレイム'
  description TEXT,
  is_default  INTEGER NOT NULL DEFAULT 1, -- 1=デフォルト, 0=スキン/DLC
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ユーザーが所持（解放済み）のキャラクター
CREATE TABLE user_characters (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  character_id  TEXT NOT NULL REFERENCES characters(id),
  genre_id      TEXT NOT NULL REFERENCES genres(id),
  nickname      TEXT,                    -- ユーザーがつけた愛称（任意）
  current_xp    INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 0,  -- 0=タマゴ
  stage         INTEGER NOT NULL DEFAULT 0,  -- 0-4
  skin_id       TEXT,                    -- 適用中のスキンID（将来）
  is_active     INTEGER NOT NULL DEFAULT 1,
  unlocked_at   TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE(character_id)
);

-- キャラ成長段階マスター
CREATE TABLE character_stages (
  stage         INTEGER PRIMARY KEY,     -- 0-4
  min_level     INTEGER NOT NULL,
  stage_name    TEXT NOT NULL            -- 'タマゴ', '幼体', ...
);

-- ジャンル別プリセットタスク
CREATE TABLE genre_tasks (
  id          TEXT PRIMARY KEY,          -- 'fitness_pushup'
  genre_id    TEXT NOT NULL REFERENCES genres(id),
  title       TEXT NOT NULL,             -- '腕立て伏せ'
  description TEXT,                      -- 全体説明
  base_xp     INTEGER NOT NULL DEFAULT 10,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- タスク難易度レベル定義
CREATE TABLE task_levels (
  id          TEXT PRIMARY KEY,          -- 'fitness_pushup_lv1'
  genre_task_id TEXT NOT NULL REFERENCES genre_tasks(id),
  level       INTEGER NOT NULL DEFAULT 1,  -- 1-5
  label       TEXT NOT NULL,             -- '10回'
  description TEXT,                      -- '毎日腕立て伏せ10回'
  xp_multiplier REAL NOT NULL DEFAULT 1.0, -- EXP倍率
  required_completions INTEGER NOT NULL DEFAULT 0, -- 解放に必要な完了回数
  UNIQUE(genre_task_id, level)
);

-- プレイヤーレベル解放条件マスター
CREATE TABLE player_unlocks (
  player_level  INTEGER PRIMARY KEY,
  max_characters INTEGER NOT NULL,       -- そのレベルでの仲間枠上限
  max_tasks_per_char INTEGER NOT NULL,   -- 1キャラあたりのタスク枠上限
  unlock_label  TEXT                     -- '2体目の仲間解放！'
);

-- ユーザーが選んだタスク（キャラに紐づく日課）
CREATE TABLE user_tasks (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_character_id TEXT NOT NULL REFERENCES user_characters(id),
  genre_task_id   TEXT NOT NULL REFERENCES genre_tasks(id),
  current_level   INTEGER NOT NULL DEFAULT 1,
  total_completions INTEGER NOT NULL DEFAULT 0,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE(user_character_id, genre_task_id)
);

-- デイリータスクインスタンス（毎日生成）
CREATE TABLE daily_tasks (
  id              TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_task_id    TEXT NOT NULL REFERENCES user_tasks(id),
  user_character_id TEXT NOT NULL REFERENCES user_characters(id),
  task_date       TEXT NOT NULL,
  title           TEXT NOT NULL,
  level_label     TEXT NOT NULL,         -- '20回' など
  reward_xp       INTEGER NOT NULL DEFAULT 10,
  is_completed    INTEGER NOT NULL DEFAULT 0,
  completed_at    TEXT,
  source          TEXT NOT NULL DEFAULT 'routine', -- 'routine' | 'ad_reward' | 'custom'
  created_at      TEXT NOT NULL DEFAULT (datetime('now','localtime')),
  UNIQUE(user_task_id, task_date)
);
```

### 4.2 変更が必要な既存テーブル

```sql
-- profile: 既存のまま使用（本人レベル管理）
-- total_xp, level, points, streak_days はそのまま

-- items: スキンアイテムを追加（将来）
-- ALTER TABLE items ADD COLUMN target_character_id TEXT;

-- 以下は新スキーマに統合されるため廃止:
-- recurring_tasks → user_tasks + genre_tasks に置換
-- onboarding → user_characters に置換
-- task_events → daily_tasks + user_tasks.total_completions に簡素化
-- daily_challenges → 将来再設計
```

### 4.3 EXP計算ロジック

```
タスク完了時:
  1. task_level = task_levels WHERE genre_task_id AND level = user_tasks.current_level
  2. earned_xp = genre_tasks.base_xp × task_level.xp_multiplier
  
  3. キャラEXP:
     user_characters.current_xp += earned_xp
     user_characters.level = floor(current_xp / 100)
     user_characters.stage = MAX(character_stages.stage) WHERE min_level <= level
  
  4. 本人EXP:
     profile.total_xp += earned_xp
     profile.level = floor(total_xp / 100)
     → player_unlocks テーブルで解放チェック
  
  5. タスク完了カウント:
     user_tasks.total_completions += 1
     → task_levels.required_completions と比較 → 次レベル解放可能か判定
  
  6. Pt:
     profile.points += floor(earned_xp × 0.5)
```

### 4.4 タスク難易度UP判定

```
canUpgradeTask(user_task):
  next_level = user_tasks.current_level + 1
  next_def = task_levels WHERE genre_task_id AND level = next_level
  IF next_def is NULL → false（最大レベル）
  IF user_tasks.total_completions >= next_def.required_completions → true
  ELSE → false
```

---

## 5. 画面設計

### 5.1 タブ構成

| タブ | アイコン | 画面 | 内容 |
|------|---------|------|------|
| ホーム | 🏠 | home | キャラ一覧 + 今日の進捗 + エネルギーバー |
| タスク | ✅ | quest | 今日のタスク（キャラ別グループ）+ 広告 |
| キャラ | 📊 | characters | キャラ詳細・成長・タスク管理 |
| ショップ | 🛍️ | shop | アイテム・スキン購入 |

### 5.2 ホーム画面

```
┌────────────────────────────────────┐
│  🌱 SelfManage          Lv.8 ⚙️  │
│                                    │
│  ┌─ エネルギーバー ──────────────┐  │
│  │ ⚡ 今日 2/6 完了              │  │
│  │ ████████████░░░░░░░░  33%     │  │
│  └──────────────────────────────┘  │
│                                    │
│  ── 仲間たち ──────────────────    │
│                                    │
│  ┌────────────┐ ┌────────────┐    │
│  │   [🔥画像]  │ │  [📚画像]  │    │
│  │  フレイム   │ │ ウィズダム  │    │
│  │  Lv.12     │ │  Lv.8      │    │
│  │  ████░░    │ │  ██░░░░    │    │
│  │  残り2タスク │ │  残り1タスク │    │
│  └────────────┘ └────────────┘    │
│                                    │
│  ┌────────────┐ ┌────────────┐    │
│  │   🔒       │ │   🔒       │    │
│  │  Lv.15で   │ │  Lv.30で   │    │
│  │  解放      │ │  解放       │    │
│  └────────────┘ └────────────┘    │
│                                    │
│  ── 次のタスク ──────────────────   │
│  🔥 腕立て伏せ 20回        +15 EXP │
│  📚 読書 20分             +15 EXP │
│                                    │
│  💰 128 Pt    🔥 12日連続         │
└────────────────────────────────────┘
```

### 5.3 オンボーディング

```
Step 1:「冒険者名を決めよう」
  → 名前入力

Step 2:「最初の仲間を選ぼう」
  → 6ジャンルのキャラカードが並ぶ
  → 1体だけ選択（タップでカード反転 → キャラ紹介）
  → 「この仲間と冒険に出る！」

Step 3:「仲間を育てるタスクを選ぼう」
  → 選んだジャンルの10プリセットタスクが表示
  → 3つ選択（チェックボックス）
  → 各タスクはLv.1の内容が表示される

Step 4:「タマゴが現れた！」
  → 演出（タマゴ出現アニメーション）
  → 「最初のタスクを完了すると孵化します」
  → 「冒険を始める！」
```

### 5.4 キャラ詳細画面

```
┌────────────────────────────────────┐
│  ← フレイム                        │
│                                    │
│       [🔥 キャラ画像（大）]         │
│       成長体                       │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  Lv.12    1,240 / 1,300 EXP │  │
│  │  ████████████████░░░░        │  │
│  │  次の進化: Lv.25（成体）      │  │
│  └──────────────────────────────┘  │
│                                    │
│  ── タスク一覧 ──────────────────   │
│                                    │
│  腕立て伏せ                        │
│  現在: Lv.2「毎日20回」  +15 EXP   │
│  完了: 45/100回  ██░░ → Lv.3解放   │
│  [レベルUP可能！]                   │
│                                    │
│  ウォーキング                       │
│  現在: Lv.1「毎日15分」  +10 EXP   │
│  完了: 12/30回  █░░░ → Lv.2解放    │
│                                    │
│  ストレッチ                         │
│  現在: Lv.2「毎日10分」  +15 EXP   │
│  完了: 38/100回  █░░░ → Lv.3解放   │
│                                    │
│  [+ タスクを追加]（枠が空いてれば）  │
└────────────────────────────────────┘
```

---

## 6. 画像アセット

### 6.1 AI生成イラスト

6キャラ × 5段階 = **30画像**

```
assets/characters/
├── fitness/
│   ├── egg.png        (256×256)
│   ├── stage1.png     (256×256)  幼体
│   ├── stage2.png     (256×256)  成長体
│   ├── stage3.png     (256×256)  成体
│   └── stage4.png     (256×256)  覚醒体
├── learning/
│   └── ...
├── mindful/
│   └── ...
├── productivity/
│   └── ...
├── creative/
│   └── ...
└── social/
    └── ...
```

### 6.2 画像スタイル方針
- 統一されたアートスタイル（アニメ/ゲーム風イラスト）
- 背景透過PNG
- キャラは属性に対応した動物 or 精霊 or ファンタジー生物
- 成長段階で明確にサイズ・オーラ・ディテールが変わる

---

## 7. 実装計画

### Phase B-1: データ層（2-3日）
- [ ] schema.ts v2 マイグレーション（新テーブル作成）
- [ ] ジャンル・キャラ・ステージ・プリセットタスクのシードデータ
- [ ] player_unlocks シードデータ
- [ ] task_levels シードデータ（全60タスク × 5レベル = 300行）
- [ ] repository.ts 大幅改修
  - キャラCRUD
  - タスク完了 → キャラEXP + 本人EXP + タスク完了カウント
  - 解放判定ロジック
  - タスク難易度UP

### Phase B-2: オンボーディング刷新（1-2日）
- [ ] Step 1: 名前入力
- [ ] Step 2: ジャンル（キャラ）選択
- [ ] Step 3: タスク選択（10個から3つ）
- [ ] Step 4: タマゴ出現演出

### Phase B-3: ホーム画面リデザイン（1-2日）
- [ ] キャラカード一覧（成長段階でビジュアル変化）
- [ ] エネルギーバー
- [ ] 解放枠（ロック表示）
- [ ] 次のタスク・Pt・ストリーク

### Phase B-4: タスク画面リデザイン（1日）
- [ ] キャラ別グループ表示
- [ ] タスク完了 → EXPアニメーション
- [ ] 広告タスク

### Phase B-5: キャラ詳細画面（1日）
- [ ] 成長グラフ
- [ ] タスク一覧 + 難易度UP
- [ ] タスク追加/削除

### Phase B-6: キャラクター画像（並行作業）
- [ ] AI生成で30画像
- [ ] アセット配置・表示コンポーネント

---

## 8. 旧データ移行

### マッピング
| 旧 WAKP カテゴリ | 新ジャンル |
|-----------------|----------|
| wellness | fitness |
| action | productivity |
| knowledge | learning |
| purpose | mindful |

### 移行手順
1. `onboarding.answers_json` を読む
2. 選択されていたカテゴリ → 対応ジャンルの `user_characters` を作成
3. 既存の `recurring_tasks` → カテゴリから `genre_id` を推定 → `user_tasks` に変換
4. `profile` はそのまま維持
5. 旧 `daily_tasks`, `task_events` は参照用に残すが新システムでは使わない
