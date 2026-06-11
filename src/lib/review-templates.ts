import type { AxisTemplate, WorkCategory } from "./types";

/**
 * カテゴリ別デフォルトの評価軸テンプレート。
 * review_axis_templates / review_axis_template_items に対応する。
 * ユーザーは軸名を自由に書き換え、自分のテンプレートとして保存できる。
 */
export const DEFAULT_TEMPLATES: AxisTemplate[] = [
  { id: "tpl-film", name: "映画の基本軸", category: "film", axes: ["映像", "脚本", "演技", "音楽", "余韻"] },
  { id: "tpl-music", name: "音楽の基本軸", category: "music", axes: ["メロディ", "歌詞", "音像", "革新性", "中毒性"] },
  { id: "tpl-literature", name: "文学の基本軸", category: "literature", axes: ["文体", "構成", "思想", "人物", "余白"] },
  { id: "tpl-fashion", name: "ファッションの基本軸", category: "fashion", axes: ["造形", "素材", "色彩", "着用性", "批評性"] },
  { id: "tpl-art", name: "美術の基本軸", category: "art", axes: ["着想", "技法", "構図", "強度", "余韻"] },
  { id: "tpl-exhibition", name: "展示の基本軸", category: "exhibition", axes: ["企画", "空間", "作品", "解説", "余韻"] },
  { id: "tpl-stage", name: "舞台の基本軸", category: "stage", axes: ["演出", "戯曲", "演技", "美術", "熱量"] },
  { id: "tpl-game", name: "ゲームの基本軸", category: "game", axes: ["物語", "操作", "映像", "音楽", "没入"] },
  { id: "tpl-other", name: "汎用軸", category: "other", axes: ["着想", "構成", "表現", "完成度", "余韻"] },
];

/** ユーザーが保存した自作テンプレート(モック) */
export const USER_TEMPLATES: AxisTemplate[] = [
  { id: "utpl-1", name: "深夜映画用", category: "custom", axes: ["孤独", "光", "沈黙", "都市", "夢"] },
  { id: "utpl-2", name: "再読に堪えるか", category: "custom", axes: ["初読の衝撃", "再読の発見", "引用したさ", "構造", "毒"] },
];

export function defaultTemplateFor(category: WorkCategory): AxisTemplate {
  return DEFAULT_TEMPLATES.find((t) => t.category === category) ?? DEFAULT_TEMPLATES[DEFAULT_TEMPLATES.length - 1];
}
