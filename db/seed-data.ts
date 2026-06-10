/**
 * マスターデータ定義（v2 キャラクター育成システム）
 *
 * genres, characters, character_stages, player_unlocks,
 * genre_tasks, task_levels のシードデータ。
 */

// ─── ジャンル ───────────────────────────────────────────────────

export const GENRES = [
  { id: "fitness", name: "運動・健康", description: "体を動かし、健康を維持する習慣", icon_emoji: "🔥", theme_color: "#E85D3A", sort_order: 1 },
  { id: "learning", name: "学習・読書", description: "知識を広げ、スキルを磨く習慣", icon_emoji: "📚", theme_color: "#4A7FC1", sort_order: 2 },
  { id: "mindful", name: "マインドフルネス", description: "心を整え、内面を豊かにする習慣", icon_emoji: "🧘", theme_color: "#7B68C1", sort_order: 3 },
  { id: "productivity", name: "仕事効率", description: "生産性を高め、成果を出す習慣", icon_emoji: "⚡", theme_color: "#D4A020", sort_order: 4 },
  { id: "creative", name: "クリエイティブ", description: "創造性を発揮し、表現する習慣", icon_emoji: "🎨", theme_color: "#E06090", sort_order: 5 },
  { id: "social", name: "人間関係", description: "人とのつながりを深める習慣", icon_emoji: "💚", theme_color: "#3A9A5A", sort_order: 6 },
] as const;

// ─── キャラクター ───────────────────────────────────────────────

export const CHARACTERS = [
  { id: "fitness_flame", genre_id: "fitness", name: "フレイム", description: "燃える闘志を持つ炎の精霊。体を鍛えるほど力強く成長する。", is_default: 1, sort_order: 1 },
  { id: "learning_wisdom", genre_id: "learning", name: "ウィズダム", description: "知識の結晶から生まれた賢者。学ぶほどに輝きを増す。", is_default: 1, sort_order: 1 },
  { id: "mindful_serena", genre_id: "mindful", name: "セレーナ", description: "静寂の森に住む月の精霊。心が穏やかなほど美しく咲く。", is_default: 1, sort_order: 1 },
  { id: "productivity_swift", genre_id: "productivity", name: "スウィフト", description: "稲妻のように素早い雷獣。集中するほどスピードが増す。", is_default: 1, sort_order: 1 },
  { id: "creative_palette", genre_id: "creative", name: "パレット", description: "虹色に輝く創造の妖精。作り出すほど色彩が豊かになる。", is_default: 1, sort_order: 1 },
  { id: "social_harmony", genre_id: "social", name: "ハーモニー", description: "絆の力で輝く守護精霊。人とのつながりが力の源。", is_default: 1, sort_order: 1 },
] as const;

// ─── 成長段階 ───────────────────────────────────────────────────

export const CHARACTER_STAGES = [
  { stage: 0, min_level: 0, stage_name: "タマゴ" },
  { stage: 1, min_level: 1, stage_name: "幼体" },
  { stage: 2, min_level: 10, stage_name: "成長体" },
  { stage: 3, min_level: 25, stage_name: "成体" },
  { stage: 4, min_level: 50, stage_name: "覚醒体" },
] as const;

// ─── プレイヤーレベル解放条件 ────────────────────────────────────

export const PLAYER_UNLOCKS = [
  { player_level: 1, max_characters: 1, max_tasks_per_char: 3, unlock_label: null },
  { player_level: 5, max_characters: 2, max_tasks_per_char: 3, unlock_label: "2体目の仲間解放！" },
  { player_level: 10, max_characters: 2, max_tasks_per_char: 4, unlock_label: "タスク枠+1！" },
  { player_level: 15, max_characters: 3, max_tasks_per_char: 4, unlock_label: "3体目の仲間解放！" },
  { player_level: 20, max_characters: 3, max_tasks_per_char: 5, unlock_label: "タスク枠+1！" },
  { player_level: 30, max_characters: 4, max_tasks_per_char: 5, unlock_label: "4体目の仲間解放！" },
  { player_level: 40, max_characters: 4, max_tasks_per_char: 6, unlock_label: "タスク枠+1！" },
  { player_level: 50, max_characters: 5, max_tasks_per_char: 6, unlock_label: "5体目の仲間解放！" },
  { player_level: 60, max_characters: 5, max_tasks_per_char: 7, unlock_label: "タスク枠+1！" },
  { player_level: 75, max_characters: 6, max_tasks_per_char: 7, unlock_label: "全ジャンル解放！" },
] as const;

// ─── タスク難易度テーブル ────────────────────────────────────────

export const TASK_LEVEL_DEFS = [
  { level: 1, xp_multiplier: 1.0, required_completions: 0 },
  { level: 2, xp_multiplier: 1.5, required_completions: 30 },
  { level: 3, xp_multiplier: 2.0, required_completions: 100 },
  { level: 4, xp_multiplier: 3.0, required_completions: 300 },
  { level: 5, xp_multiplier: 5.0, required_completions: 1000 },
] as const;

// ─── ジャンル別プリセットタスク（各10個 × 5レベル） ──────────────

export interface GenreTaskDef {
  id: string;
  genre_id: string;
  title: string;
  description: string;
  base_xp: number;
  sort_order: number;
  levels: { level: number; label: string; description: string }[];
}

export const GENRE_TASKS: GenreTaskDef[] = [
  // ── fitness ──
  { id: "fitness_pushup", genre_id: "fitness", title: "腕立て伏せ", description: "上半身の筋力を鍛える", base_xp: 10, sort_order: 1,
    levels: [
      { level: 1, label: "10回", description: "毎日腕立て伏せ10回" },
      { level: 2, label: "20回", description: "毎日腕立て伏せ20回" },
      { level: 3, label: "30回", description: "毎日腕立て伏せ30回" },
      { level: 4, label: "50回", description: "毎日腕立て伏せ50回" },
      { level: 5, label: "100回", description: "毎日腕立て伏せ100回" },
    ] },
  { id: "fitness_squat", genre_id: "fitness", title: "スクワット", description: "下半身を強化する", base_xp: 10, sort_order: 2,
    levels: [
      { level: 1, label: "10回", description: "毎日スクワット10回" },
      { level: 2, label: "20回", description: "毎日スクワット20回" },
      { level: 3, label: "30回", description: "毎日スクワット30回" },
      { level: 4, label: "50回", description: "毎日スクワット50回" },
      { level: 5, label: "100回", description: "毎日スクワット100回" },
    ] },
  { id: "fitness_walk", genre_id: "fitness", title: "ウォーキング", description: "歩いて体を動かす", base_xp: 10, sort_order: 3,
    levels: [
      { level: 1, label: "15分", description: "毎日15分ウォーキング" },
      { level: 2, label: "30分", description: "毎日30分ウォーキング" },
      { level: 3, label: "45分", description: "毎日45分ウォーキング" },
      { level: 4, label: "60分", description: "毎日60分ウォーキング" },
      { level: 5, label: "90分", description: "毎日90分ウォーキング" },
    ] },
  { id: "fitness_stretch", genre_id: "fitness", title: "ストレッチ", description: "柔軟性を高める", base_xp: 10, sort_order: 4,
    levels: [
      { level: 1, label: "5分", description: "毎日5分ストレッチ" },
      { level: 2, label: "10分", description: "毎日10分ストレッチ" },
      { level: 3, label: "15分", description: "毎日15分ストレッチ" },
      { level: 4, label: "20分", description: "毎日20分ストレッチ" },
      { level: 5, label: "30分", description: "毎日30分ストレッチ" },
    ] },
  { id: "fitness_plank", genre_id: "fitness", title: "プランク", description: "体幹を鍛える", base_xp: 10, sort_order: 5,
    levels: [
      { level: 1, label: "30秒", description: "毎日プランク30秒" },
      { level: 2, label: "1分", description: "毎日プランク1分" },
      { level: 3, label: "2分", description: "毎日プランク2分" },
      { level: 4, label: "3分", description: "毎日プランク3分" },
      { level: 5, label: "5分", description: "毎日プランク5分" },
    ] },
  { id: "fitness_water", genre_id: "fitness", title: "水を飲む", description: "水分をしっかり摂る", base_xp: 10, sort_order: 6,
    levels: [
      { level: 1, label: "1L", description: "毎日水を1L飲む" },
      { level: 2, label: "1.5L", description: "毎日水を1.5L飲む" },
      { level: 3, label: "2L", description: "毎日水を2L飲む" },
      { level: 4, label: "2.5L", description: "毎日水を2.5L飲む" },
      { level: 5, label: "3L", description: "毎日水を3L飲む" },
    ] },
  { id: "fitness_sleep", genre_id: "fitness", title: "7時間睡眠", description: "十分な睡眠を確保する", base_xp: 10, sort_order: 7,
    levels: [
      { level: 1, label: "記録する", description: "睡眠時間を記録する" },
      { level: 2, label: "7h達成", description: "7時間以上の睡眠を達成" },
      { level: 3, label: "7.5h達成", description: "7.5時間以上の睡眠を達成" },
      { level: 4, label: "8h達成", description: "8時間以上の睡眠を達成" },
      { level: 5, label: "睡眠スコア90+", description: "睡眠の質スコア90以上" },
    ] },
  { id: "fitness_run", genre_id: "fitness", title: "ランニング", description: "走って心肺機能を強化", base_xp: 10, sort_order: 8,
    levels: [
      { level: 1, label: "1km", description: "毎日1kmランニング" },
      { level: 2, label: "2km", description: "毎日2kmランニング" },
      { level: 3, label: "3km", description: "毎日3kmランニング" },
      { level: 4, label: "5km", description: "毎日5kmランニング" },
      { level: 5, label: "10km", description: "毎日10kmランニング" },
    ] },
  { id: "fitness_yoga", genre_id: "fitness", title: "ヨガ", description: "心身のバランスを整える", base_xp: 10, sort_order: 9,
    levels: [
      { level: 1, label: "10分", description: "毎日10分ヨガ" },
      { level: 2, label: "15分", description: "毎日15分ヨガ" },
      { level: 3, label: "20分", description: "毎日20分ヨガ" },
      { level: 4, label: "30分", description: "毎日30分ヨガ" },
      { level: 5, label: "45分", description: "毎日45分ヨガ" },
    ] },
  { id: "fitness_meal", genre_id: "fitness", title: "健康的な食事", description: "栄養バランスの良い食事", base_xp: 10, sort_order: 10,
    levels: [
      { level: 1, label: "1食", description: "1日1食は健康的に" },
      { level: 2, label: "2食", description: "1日2食は健康的に" },
      { level: 3, label: "3食", description: "3食すべて健康的に" },
      { level: 4, label: "自炊3食", description: "3食自炊で健康的に" },
      { level: 5, label: "完全自炊+記録", description: "完全自炊＋栄養記録" },
    ] },

  // ── learning ──
  { id: "learning_read", genre_id: "learning", title: "読書", description: "本を読んで知識を深める", base_xp: 10, sort_order: 1,
    levels: [
      { level: 1, label: "10分", description: "毎日10分読書" },
      { level: 2, label: "20分", description: "毎日20分読書" },
      { level: 3, label: "30分", description: "毎日30分読書" },
      { level: 4, label: "45分", description: "毎日45分読書" },
      { level: 5, label: "60分", description: "毎日60分読書" },
    ] },
  { id: "learning_course", genre_id: "learning", title: "オンライン講座", description: "講座で体系的に学ぶ", base_xp: 10, sort_order: 2,
    levels: [
      { level: 1, label: "1レッスン", description: "1レッスン受講する" },
      { level: 2, label: "2レッスン", description: "2レッスン受講する" },
      { level: 3, label: "3レッスン", description: "3レッスン受講する" },
      { level: 4, label: "1章完了", description: "1章を完了する" },
      { level: 5, label: "1コース完了", description: "1コースを完了する" },
    ] },
  { id: "learning_english", genre_id: "learning", title: "英語学習", description: "英語力を伸ばす", base_xp: 10, sort_order: 3,
    levels: [
      { level: 1, label: "10分", description: "毎日10分英語学習" },
      { level: 2, label: "15分", description: "毎日15分英語学習" },
      { level: 3, label: "20分", description: "毎日20分英語学習" },
      { level: 4, label: "30分", description: "毎日30分英語学習" },
      { level: 5, label: "45分", description: "毎日45分英語学習" },
    ] },
  { id: "learning_article", genre_id: "learning", title: "記事を読む", description: "最新情報をキャッチアップ", base_xp: 10, sort_order: 4,
    levels: [
      { level: 1, label: "1本", description: "記事を1本読む" },
      { level: 2, label: "2本", description: "記事を2本読む" },
      { level: 3, label: "3本", description: "記事を3本読む" },
      { level: 4, label: "5本", description: "記事を5本読む" },
      { level: 5, label: "要約つき5本", description: "5本読んで要約を書く" },
    ] },
  { id: "learning_note", genre_id: "learning", title: "ノートまとめ", description: "学んだことを整理する", base_xp: 10, sort_order: 5,
    levels: [
      { level: 1, label: "1ページ", description: "ノート1ページまとめる" },
      { level: 2, label: "2ページ", description: "ノート2ページまとめる" },
      { level: 3, label: "3ページ", description: "ノート3ページまとめる" },
      { level: 4, label: "マインドマップ", description: "マインドマップを作成" },
      { level: 5, label: "記事化", description: "学びを記事にまとめる" },
    ] },
  { id: "learning_podcast", genre_id: "learning", title: "ポッドキャスト", description: "音声で学ぶ", base_xp: 10, sort_order: 6,
    levels: [
      { level: 1, label: "1エピソード", description: "1エピソード聴く" },
      { level: 2, label: "15分", description: "15分聴く" },
      { level: 3, label: "30分", description: "30分聴く" },
      { level: 4, label: "45分", description: "45分聴く" },
      { level: 5, label: "60分", description: "60分聴く" },
    ] },
  { id: "learning_tech", genre_id: "learning", title: "新技術の調査", description: "技術トレンドを追う", base_xp: 10, sort_order: 7,
    levels: [
      { level: 1, label: "10分", description: "10分調べる" },
      { level: 2, label: "20分", description: "20分調べる" },
      { level: 3, label: "30分", description: "30分調べる" },
      { level: 4, label: "ハンズオン", description: "手を動かして試す" },
      { level: 5, label: "ブログ投稿", description: "学びをブログにする" },
    ] },
  { id: "learning_cert", genre_id: "learning", title: "資格勉強", description: "資格取得に向けて学ぶ", base_xp: 10, sort_order: 8,
    levels: [
      { level: 1, label: "15分", description: "毎日15分勉強" },
      { level: 2, label: "30分", description: "毎日30分勉強" },
      { level: 3, label: "45分", description: "毎日45分勉強" },
      { level: 4, label: "60分", description: "毎日60分勉強" },
      { level: 5, label: "90分", description: "毎日90分勉強" },
    ] },
  { id: "learning_output", genre_id: "learning", title: "アウトプット", description: "学びを発信する", base_xp: 10, sort_order: 9,
    levels: [
      { level: 1, label: "1ツイート", description: "学びを1ツイート" },
      { level: 2, label: "短文", description: "短文でまとめる" },
      { level: 3, label: "500字", description: "500字で書く" },
      { level: 4, label: "1000字", description: "1000字で書く" },
      { level: 5, label: "ブログ1記事", description: "ブログ記事を書く" },
    ] },
  { id: "learning_video", genre_id: "learning", title: "動画講座", description: "動画で学ぶ", base_xp: 10, sort_order: 10,
    levels: [
      { level: 1, label: "15分", description: "動画講座を15分視聴" },
      { level: 2, label: "30分", description: "動画講座を30分視聴" },
      { level: 3, label: "45分", description: "動画講座を45分視聴" },
      { level: 4, label: "60分", description: "動画講座を60分視聴" },
      { level: 5, label: "90分", description: "動画講座を90分視聴" },
    ] },

  // ── mindful ──
  { id: "mindful_meditate", genre_id: "mindful", title: "瞑想", description: "静かに心を落ち着ける", base_xp: 10, sort_order: 1,
    levels: [
      { level: 1, label: "3分", description: "毎日3分瞑想" },
      { level: 2, label: "5分", description: "毎日5分瞑想" },
      { level: 3, label: "10分", description: "毎日10分瞑想" },
      { level: 4, label: "15分", description: "毎日15分瞑想" },
      { level: 5, label: "20分", description: "毎日20分瞑想" },
    ] },
  { id: "mindful_gratitude", genre_id: "mindful", title: "感謝日記", description: "感謝の気持ちを書き留める", base_xp: 10, sort_order: 2,
    levels: [
      { level: 1, label: "1つ", description: "感謝を1つ書く" },
      { level: 2, label: "3つ", description: "感謝を3つ書く" },
      { level: 3, label: "5つ", description: "感謝を5つ書く" },
      { level: 4, label: "詳細に3つ", description: "3つを詳細に書く" },
      { level: 5, label: "エッセイ風", description: "エッセイ風に書く" },
    ] },
  { id: "mindful_breath", genre_id: "mindful", title: "深呼吸エクサ", description: "呼吸で自律神経を整える", base_xp: 10, sort_order: 3,
    levels: [
      { level: 1, label: "1分", description: "深呼吸1分" },
      { level: 2, label: "3分", description: "深呼吸3分" },
      { level: 3, label: "5分", description: "深呼吸5分" },
      { level: 4, label: "10分", description: "深呼吸10分" },
      { level: 5, label: "15分", description: "深呼吸15分" },
    ] },
  { id: "mindful_journal", genre_id: "mindful", title: "ジャーナリング", description: "心の中を書き出す", base_xp: 10, sort_order: 4,
    levels: [
      { level: 1, label: "5分", description: "5分自由に書く" },
      { level: 2, label: "10分", description: "10分自由に書く" },
      { level: 3, label: "15分", description: "15分自由に書く" },
      { level: 4, label: "20分", description: "20分テーマ付きで" },
      { level: 5, label: "30分", description: "30分深堀りジャーナル" },
    ] },
  { id: "mindful_detox", genre_id: "mindful", title: "デジタルデトックス", description: "スマホから離れる時間", base_xp: 10, sort_order: 5,
    levels: [
      { level: 1, label: "30分", description: "30分スマホ断ち" },
      { level: 2, label: "1時間", description: "1時間スマホ断ち" },
      { level: 3, label: "2時間", description: "2時間スマホ断ち" },
      { level: 4, label: "半日", description: "半日スマホ断ち" },
      { level: 5, label: "1日", description: "1日スマホ断ち" },
    ] },
  { id: "mindful_nature", genre_id: "mindful", title: "自然の中で過ごす", description: "自然に触れてリフレッシュ", base_xp: 10, sort_order: 6,
    levels: [
      { level: 1, label: "10分", description: "10分自然の中で過ごす" },
      { level: 2, label: "15分", description: "15分自然の中で過ごす" },
      { level: 3, label: "20分", description: "20分自然の中で過ごす" },
      { level: 4, label: "30分", description: "30分自然の中で過ごす" },
      { level: 5, label: "60分", description: "60分自然の中で過ごす" },
    ] },
  { id: "mindful_bath", genre_id: "mindful", title: "お風呂に浸かる", description: "入浴でリラックス", base_xp: 10, sort_order: 7,
    levels: [
      { level: 1, label: "10分", description: "10分湯船に浸かる" },
      { level: 2, label: "15分", description: "15分湯船に浸かる" },
      { level: 3, label: "20分", description: "20分湯船に浸かる" },
      { level: 4, label: "アロマ付き", description: "アロマ入浴20分" },
      { level: 5, label: "瞑想つき", description: "入浴瞑想20分" },
    ] },
  { id: "mindful_review", genre_id: "mindful", title: "1日の振り返り", description: "1日を振り返って学ぶ", base_xp: 10, sort_order: 8,
    levels: [
      { level: 1, label: "箇条書き", description: "箇条書きで振り返り" },
      { level: 2, label: "3分", description: "3分で振り返り" },
      { level: 3, label: "5分", description: "5分で振り返り" },
      { level: 4, label: "10分", description: "10分で詳細に振り返り" },
      { level: 5, label: "詳細レポート", description: "詳細レポートを作成" },
    ] },
  { id: "mindful_music", genre_id: "mindful", title: "好きな音楽を聴く", description: "音楽で心を癒す", base_xp: 10, sort_order: 9,
    levels: [
      { level: 1, label: "1曲", description: "好きな曲を1曲聴く" },
      { level: 2, label: "15分", description: "15分音楽を聴く" },
      { level: 3, label: "30分", description: "30分音楽を聴く" },
      { level: 4, label: "アルバム1枚", description: "アルバムを通して聴く" },
      { level: 5, label: "プレイリスト作成", description: "テーマ別PL作成" },
    ] },
  { id: "mindful_selfcare", genre_id: "mindful", title: "セルフケア", description: "自分を大切にする時間", base_xp: 10, sort_order: 10,
    levels: [
      { level: 1, label: "1つ", description: "セルフケアを1つ" },
      { level: 2, label: "2つ", description: "セルフケアを2つ" },
      { level: 3, label: "スキンケア", description: "丁寧なスキンケア" },
      { level: 4, label: "フルルーティン", description: "フルルーティン実施" },
      { level: 5, label: "スパデー", description: "自宅スパデーを楽しむ" },
    ] },

  // ── productivity ──
  { id: "prod_morning_task", genre_id: "productivity", title: "朝イチで重要タスク", description: "朝一番に最重要タスクに着手", base_xp: 10, sort_order: 1,
    levels: [
      { level: 1, label: "1つ着手", description: "重要タスク1つに着手" },
      { level: 2, label: "1つ完了", description: "重要タスク1つを完了" },
      { level: 3, label: "2つ完了", description: "重要タスク2つを完了" },
      { level: 4, label: "3つ完了", description: "重要タスク3つを完了" },
      { level: 5, label: "最重要を朝に", description: "最重要を朝に必ず完了" },
    ] },
  { id: "prod_pomodoro", genre_id: "productivity", title: "ポモドーロ", description: "集中と休憩のリズム", base_xp: 10, sort_order: 2,
    levels: [
      { level: 1, label: "1セット", description: "ポモドーロ1セット(25分)" },
      { level: 2, label: "2セット", description: "ポモドーロ2セット" },
      { level: 3, label: "3セット", description: "ポモドーロ3セット" },
      { level: 4, label: "4セット", description: "ポモドーロ4セット" },
      { level: 5, label: "6セット", description: "ポモドーロ6セット" },
    ] },
  { id: "prod_email", genre_id: "productivity", title: "メール処理", description: "メールを効率的にさばく", base_xp: 10, sort_order: 3,
    levels: [
      { level: 1, label: "受信箱確認", description: "受信箱を確認する" },
      { level: 2, label: "全返信", description: "未読メールに全返信" },
      { level: 3, label: "Inbox Zero", description: "Inbox Zeroを達成" },
      { level: 4, label: "15分以内", description: "15分以内に処理完了" },
      { level: 5, label: "自動化", description: "フィルタで自動化" },
    ] },
  { id: "prod_task_org", genre_id: "productivity", title: "タスク整理", description: "やることを整理する", base_xp: 10, sort_order: 4,
    levels: [
      { level: 1, label: "リスト作成", description: "タスクリストを作る" },
      { level: 2, label: "優先順位", description: "優先順位をつける" },
      { level: 3, label: "時間見積もり", description: "時間見積もりをする" },
      { level: 4, label: "GTD", description: "GTDで完全管理" },
      { level: 5, label: "ウィークリーレビュー", description: "週次レビュー実施" },
    ] },
  { id: "prod_desk", genre_id: "productivity", title: "デスク整理", description: "作業環境を整える", base_xp: 10, sort_order: 5,
    levels: [
      { level: 1, label: "片付け", description: "デスクを片付ける" },
      { level: 2, label: "整頓", description: "きれいに整頓する" },
      { level: 3, label: "最適配置", description: "最適な配置にする" },
      { level: 4, label: "ミニマル", description: "ミニマルデスクに" },
      { level: 5, label: "写真記録", description: "写真で記録して維持" },
    ] },
  { id: "prod_focus", genre_id: "productivity", title: "集中作業", description: "まとまった時間集中する", base_xp: 10, sort_order: 6,
    levels: [
      { level: 1, label: "15分", description: "15分集中作業" },
      { level: 2, label: "25分", description: "25分集中作業" },
      { level: 3, label: "45分", description: "45分集中作業" },
      { level: 4, label: "60分", description: "60分集中作業" },
      { level: 5, label: "90分", description: "90分ディープワーク" },
    ] },
  { id: "prod_decline", genre_id: "productivity", title: "1つ断る", description: "不要なことを断る練習", base_xp: 10, sort_order: 7,
    levels: [
      { level: 1, label: "意識する", description: "断れる場面を意識" },
      { level: 2, label: "1つ断る", description: "実際に1つ断る" },
      { level: 3, label: "優先順位で判断", description: "優先順位で判断して断る" },
      { level: 4, label: "即判断", description: "即座に判断する" },
      { level: 5, label: "仕組み化", description: "断るルールを仕組み化" },
    ] },
  { id: "prod_weekly", genre_id: "productivity", title: "週次レビュー", description: "1週間を振り返る", base_xp: 10, sort_order: 8,
    levels: [
      { level: 1, label: "振り返り", description: "1週間を振り返る" },
      { level: 2, label: "計画", description: "来週の計画を立てる" },
      { level: 3, label: "KPI確認", description: "KPIを確認する" },
      { level: 4, label: "改善策", description: "改善策を考える" },
      { level: 5, label: "完全レビュー", description: "完全な週次レビュー" },
    ] },
  { id: "prod_memo", genre_id: "productivity", title: "メモを取る", description: "気づきを記録する", base_xp: 10, sort_order: 9,
    levels: [
      { level: 1, label: "1メモ", description: "1つメモする" },
      { level: 2, label: "3メモ", description: "3つメモする" },
      { level: 3, label: "構造化", description: "構造化してメモ" },
      { level: 4, label: "Zettelkasten", description: "Zettelkasten式で管理" },
      { level: 5, label: "ナレッジベース", description: "ナレッジベースに蓄積" },
    ] },
  { id: "prod_routine", genre_id: "productivity", title: "朝のルーティン", description: "朝の習慣を固める", base_xp: 10, sort_order: 10,
    levels: [
      { level: 1, label: "起床時刻固定", description: "毎日同じ時間に起きる" },
      { level: 2, label: "3項目", description: "朝のルーティン3項目" },
      { level: 3, label: "5項目", description: "朝のルーティン5項目" },
      { level: 4, label: "60分ルーティン", description: "60分の朝ルーティン" },
      { level: 5, label: "完全最適化", description: "完全に最適化された朝" },
    ] },

  // ── creative ──
  { id: "creative_sketch", genre_id: "creative", title: "スケッチ", description: "絵を描いて表現する", base_xp: 10, sort_order: 1,
    levels: [
      { level: 1, label: "1枚", description: "1枚描く" },
      { level: 2, label: "3枚", description: "3枚描く" },
      { level: 3, label: "5枚", description: "5枚描く" },
      { level: 4, label: "テーマ付き", description: "テーマを決めて描く" },
      { level: 5, label: "作品化", description: "作品として仕上げる" },
    ] },
  { id: "creative_photo", genre_id: "creative", title: "写真を撮る", description: "写真で日常を切り取る", base_xp: 10, sort_order: 2,
    levels: [
      { level: 1, label: "1枚", description: "1枚撮る" },
      { level: 2, label: "3枚", description: "3枚撮る" },
      { level: 3, label: "テーマ撮影", description: "テーマを決めて撮る" },
      { level: 4, label: "編集つき", description: "撮影＋編集する" },
      { level: 5, label: "SNS投稿", description: "撮影→編集→投稿" },
    ] },
  { id: "creative_write", genre_id: "creative", title: "文章を書く", description: "言葉で表現する", base_xp: 10, sort_order: 3,
    levels: [
      { level: 1, label: "100字", description: "100字書く" },
      { level: 2, label: "300字", description: "300字書く" },
      { level: 3, label: "500字", description: "500字書く" },
      { level: 4, label: "1000字", description: "1000字書く" },
      { level: 5, label: "1記事", description: "1記事完成させる" },
    ] },
  { id: "creative_music", genre_id: "creative", title: "音楽を作る/演奏", description: "音楽で自分を表現", base_xp: 10, sort_order: 4,
    levels: [
      { level: 1, label: "10分", description: "10分演奏/制作する" },
      { level: 2, label: "15分", description: "15分演奏/制作する" },
      { level: 3, label: "20分", description: "20分演奏/制作する" },
      { level: 4, label: "30分", description: "30分演奏/制作する" },
      { level: 5, label: "1曲完成", description: "1曲を完成させる" },
    ] },
  { id: "creative_video", genre_id: "creative", title: "動画を作る", description: "映像で表現する", base_xp: 10, sort_order: 5,
    levels: [
      { level: 1, label: "素材撮影", description: "素材を撮影する" },
      { level: 2, label: "編集10分", description: "10分の編集作業" },
      { level: 3, label: "ショート1本", description: "ショート動画1本" },
      { level: 4, label: "5分動画", description: "5分動画を完成" },
      { level: 5, label: "フル動画", description: "フル動画を完成" },
    ] },
  { id: "creative_diy", genre_id: "creative", title: "DIY/工作", description: "手を動かして作る", base_xp: 10, sort_order: 6,
    levels: [
      { level: 1, label: "10分", description: "10分ものづくり" },
      { level: 2, label: "20分", description: "20分ものづくり" },
      { level: 3, label: "30分", description: "30分ものづくり" },
      { level: 4, label: "1作品", description: "1作品を完成" },
      { level: 5, label: "作品集", description: "作品集にまとめる" },
    ] },
  { id: "creative_recipe", genre_id: "creative", title: "料理で新しいレシピ", description: "新しい料理に挑戦", base_xp: 10, sort_order: 7,
    levels: [
      { level: 1, label: "1品", description: "新しいレシピ1品" },
      { level: 2, label: "アレンジ", description: "既存レシピをアレンジ" },
      { level: 3, label: "創作", description: "オリジナル料理を創作" },
      { level: 4, label: "コース", description: "コース料理に挑戦" },
      { level: 5, label: "レシピ記録", description: "レシピを記録して共有" },
    ] },
  { id: "creative_design", genre_id: "creative", title: "デザイン練習", description: "デザインスキルを磨く", base_xp: 10, sort_order: 8,
    levels: [
      { level: 1, label: "模写1つ", description: "デザインを1つ模写" },
      { level: 2, label: "模写3つ", description: "デザインを3つ模写" },
      { level: 3, label: "オリジナル", description: "オリジナルデザイン" },
      { level: 4, label: "ポートフォリオ", description: "ポートフォリオに追加" },
      { level: 5, label: "クライアントワーク", description: "実案件レベルの制作" },
    ] },
  { id: "creative_idea", genre_id: "creative", title: "アイデア出し", description: "発想力を鍛える", base_xp: 10, sort_order: 9,
    levels: [
      { level: 1, label: "3つ", description: "アイデアを3つ出す" },
      { level: 2, label: "5つ", description: "アイデアを5つ出す" },
      { level: 3, label: "10つ", description: "アイデアを10出す" },
      { level: 4, label: "マインドマップ", description: "マインドマップで展開" },
      { level: 5, label: "企画書", description: "企画書にまとめる" },
    ] },
  { id: "creative_sns", genre_id: "creative", title: "SNS投稿", description: "発信する習慣", base_xp: 10, sort_order: 10,
    levels: [
      { level: 1, label: "1投稿", description: "1投稿する" },
      { level: 2, label: "画像つき", description: "画像つきで投稿" },
      { level: 3, label: "ストーリー", description: "ストーリーを投稿" },
      { level: 4, label: "リール", description: "リール動画を投稿" },
      { level: 5, label: "シリーズ化", description: "シリーズ化して発信" },
    ] },

  // ── social ──
  { id: "social_family", genre_id: "social", title: "家族に声をかける", description: "家族との時間を大切に", base_xp: 10, sort_order: 1,
    levels: [
      { level: 1, label: "挨拶", description: "家族に挨拶する" },
      { level: 2, label: "会話5分", description: "5分会話する" },
      { level: 3, label: "一緒に食事", description: "一緒に食事する" },
      { level: 4, label: "感謝を伝える", description: "感謝を言葉で伝える" },
      { level: 5, label: "手紙を書く", description: "手紙を書いて渡す" },
    ] },
  { id: "social_friend", genre_id: "social", title: "友人に連絡", description: "友人とのつながりを保つ", base_xp: 10, sort_order: 2,
    levels: [
      { level: 1, label: "1人にメッセ", description: "1人にメッセージ" },
      { level: 2, label: "電話5分", description: "5分電話する" },
      { level: 3, label: "会う約束", description: "会う約束をする" },
      { level: 4, label: "実際に会う", description: "実際に会う" },
      { level: 5, label: "イベント企画", description: "みんなでイベント" },
    ] },
  { id: "social_thanks", genre_id: "social", title: "感謝を伝える", description: "ありがとうを伝える", base_xp: 10, sort_order: 3,
    levels: [
      { level: 1, label: "心の中で", description: "心の中で感謝する" },
      { level: 2, label: "1人に伝える", description: "1人に感謝を伝える" },
      { level: 3, label: "3人に伝える", description: "3人に感謝を伝える" },
      { level: 4, label: "手書き", description: "手書きで感謝を伝える" },
      { level: 5, label: "サプライズ", description: "サプライズで感謝" },
    ] },
  { id: "social_newpeople", genre_id: "social", title: "新しい人と話す", description: "出会いを増やす", base_xp: 10, sort_order: 4,
    levels: [
      { level: 1, label: "挨拶", description: "新しい人に挨拶" },
      { level: 2, label: "自己紹介", description: "自己紹介する" },
      { level: 3, label: "会話5分", description: "5分会話する" },
      { level: 4, label: "連絡先交換", description: "連絡先を交換する" },
      { level: 5, label: "食事に誘う", description: "食事に誘ってみる" },
    ] },
  { id: "social_listen", genre_id: "social", title: "人の話を聞く", description: "傾聴力を高める", base_xp: 10, sort_order: 5,
    levels: [
      { level: 1, label: "意識する", description: "聞くことを意識する" },
      { level: 2, label: "5分集中", description: "5分集中して聞く" },
      { level: 3, label: "質問する", description: "良い質問をする" },
      { level: 4, label: "アクティブリスニング", description: "アクティブリスニング" },
      { level: 5, label: "メンタリング", description: "メンタリングする" },
    ] },
  { id: "social_praise", genre_id: "social", title: "褒める", description: "人の良いところを褒める", base_xp: 10, sort_order: 6,
    levels: [
      { level: 1, label: "1人", description: "1人を褒める" },
      { level: 2, label: "3人", description: "3人を褒める" },
      { level: 3, label: "具体的に", description: "具体的に褒める" },
      { level: 4, label: "手紙", description: "手紙で褒める" },
      { level: 5, label: "公の場で", description: "公の場で称える" },
    ] },
  { id: "social_community", genre_id: "social", title: "コミュニティ参加", description: "コミュニティに貢献する", base_xp: 10, sort_order: 7,
    levels: [
      { level: 1, label: "閲覧", description: "コミュニティを閲覧" },
      { level: 2, label: "コメント", description: "コメントする" },
      { level: 3, label: "投稿", description: "投稿する" },
      { level: 4, label: "企画参加", description: "企画に参加する" },
      { level: 5, label: "運営", description: "運営に関わる" },
    ] },
  { id: "social_help", genre_id: "social", title: "助けを求める", description: "素直に助けを求める練習", base_xp: 10, sort_order: 8,
    levels: [
      { level: 1, label: "意識する", description: "助けが必要な場面を意識" },
      { level: 2, label: "1つ頼む", description: "1つ助けを求める" },
      { level: 3, label: "素直に依頼", description: "素直に依頼する" },
      { level: 4, label: "定期的に", description: "定期的に助けを求める" },
      { level: 5, label: "チーム化", description: "チームで助け合う" },
    ] },
  { id: "social_volunteer", genre_id: "social", title: "ボランティア", description: "社会に貢献する", base_xp: 10, sort_order: 9,
    levels: [
      { level: 1, label: "情報収集", description: "ボランティア情報を調べる" },
      { level: 2, label: "1回参加", description: "1回参加する" },
      { level: 3, label: "月1回", description: "月1回参加する" },
      { level: 4, label: "週1回", description: "週1回参加する" },
      { level: 5, label: "リーダー", description: "リーダーとして活動" },
    ] },
  { id: "social_partner", genre_id: "social", title: "パートナーとの時間", description: "大切な人との時間", base_xp: 10, sort_order: 10,
    levels: [
      { level: 1, label: "15分", description: "15分一緒に過ごす" },
      { level: 2, label: "30分", description: "30分一緒に過ごす" },
      { level: 3, label: "デート", description: "デートする" },
      { level: 4, label: "サプライズ", description: "サプライズを用意" },
      { level: 5, label: "定期イベント", description: "定期イベントを作る" },
    ] },
];
