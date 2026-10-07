import { isCompleteTagValue } from "@/utils/tag-grammar";

/**
 * Campus lost-and-found vocabulary and content builders.
 *
 * The campus feature extends memos through primitives that already exist rather
 * than by widening the API or the schema. A post's type and status ride on the
 * tag system — the backend extracts `#tags` from memo content and indexes them
 * for both filtering and search — and the place rides on a namespaced place tag
 * plus a human-readable line in the body.
 *
 * Keeping the stored data model untouched is what keeps this fork cheap to
 * merge with upstream, and it means a campus post is still an ordinary memo:
 * it exports, imports, and shares like any other.
 */

export type CampusPostType = "LOST" | "FOUND";
export type CampusPostStatus = "PENDING" | "RETURNED";
export type CampusIdentity = "REAL" | "ANONYMOUS";

/** Marks a memo as a lost-and-found post, so the feed can recognise one. */
export const CAMPUS_NAMESPACE_TAG = "失物招领";

/** Emitted per post type: a search notice versus a found-item notice. */
export const CAMPUS_TYPE_TAG: Record<CampusPostType, string> = {
  LOST: "寻物启事",
  FOUND: "招领启事",
};

/** Emitted per status, so an item's lifecycle is a filterable facet. */
export const CAMPUS_STATUS_TAG: Record<CampusPostStatus, string> = {
  PENDING: "待认领",
  RETURNED: "已归还",
};

/**
 * Opts a post out of carrying the poster's contact details in the body. See
 * CAMPUS.md for why this is a convention and not a real identity guarantee.
 */
export const CAMPUS_ANONYMOUS_TAG = "匿名";

/** Namespace for place tags such as `地点/三教一楼`. */
export const CAMPUS_PLACE_TAG_PREFIX = "地点";

/** Every tag this module can emit. */
export const CAMPUS_ALL_TAGS: readonly string[] = [
  CAMPUS_NAMESPACE_TAG,
  ...Object.values(CAMPUS_TYPE_TAG),
  ...Object.values(CAMPUS_STATUS_TAG),
  CAMPUS_ANONYMOUS_TAG,
];

export interface CampusPostDraft {
  type: CampusPostType;
  identity: CampusIdentity;
  status: CampusPostStatus;
  /** What was lost or found, e.g. 「黑色长柄雨伞」. */
  title: string;
  /** Optional longer description of the item. */
  detail: string;
  /** Where it happened, e.g. 「三教一楼大厅」. */
  place: string;
  /** When it happened, as free text, e.g. 「10 月 7 日傍晚」. */
  occurredAt: string;
  /** Optional way to reach the poster. Left blank, contact happens in comments. */
  contact: string;
}

export function createEmptyCampusDraft(): CampusPostDraft {
  return {
    type: "LOST",
    identity: "REAL",
    status: "PENDING",
    title: "",
    detail: "",
    place: "",
    occurredAt: "",
    contact: "",
  };
}

/**
 * Normalizes a place into a tag-safe identifier.
 *
 * Whitespace is stripped because the tag grammar rejects it; anything else that
 * would not scan as one complete tag makes the place fall back to body text
 * alone, so a malformed place never silently becomes a wrong tag.
 */
export function buildCampusPlaceTag(place: string): string | undefined {
  const normalized = place.replace(/\s+/g, "");
  if (!normalized) return undefined;
  const tag = `${CAMPUS_PLACE_TAG_PREFIX}/${normalized}`;
  return isCompleteTagValue(tag) ? tag : undefined;
}

/** Tags a draft publishes with. */
export function buildCampusTags(draft: CampusPostDraft): string[] {
  const tags = [CAMPUS_NAMESPACE_TAG, CAMPUS_TYPE_TAG[draft.type], CAMPUS_STATUS_TAG[draft.status]];
  if (draft.identity === "ANONYMOUS") {
    tags.push(CAMPUS_ANONYMOUS_TAG);
  }
  const placeTag = buildCampusPlaceTag(draft.place);
  if (placeTag) {
    tags.push(placeTag);
  }
  return tags;
}

/**
 * The memo body for a draft.
 *
 * The trailing tag line is not decoration: it is the input the backend parses
 * into filterable tags, which is why the tags are always emitted even when the
 * reader never sees them as text.
 */
export function buildCampusContent(draft: CampusPostDraft): string {
  const label = draft.type === "LOST" ? "寻物" : "招领";
  const lines: string[] = [`## 【${label}】${draft.title.trim()}`, ""];

  if (draft.detail.trim()) {
    lines.push(draft.detail.trim(), "");
  }

  const facts: string[] = [];
  if (draft.place.trim()) {
    facts.push(`- 地点：${draft.place.trim()}`);
  }
  if (draft.occurredAt.trim()) {
    facts.push(`- 时间：${draft.occurredAt.trim()}`);
  }
  facts.push(`- 当前状态：${CAMPUS_STATUS_TAG[draft.status]}`);
  if (draft.identity === "REAL" && draft.contact.trim()) {
    facts.push(`- 联系方式：${draft.contact.trim()}`);
  }
  lines.push(...facts, "");

  if (draft.identity === "ANONYMOUS") {
    lines.push("本帖为匿名发布，未公开张贴联系方式，请通过评论区联系。", "");
  }

  lines.push(
    buildCampusTags(draft)
      .map((tag) => `#${tag}`)
      .join(" "),
  );

  return lines.join("\n");
}

/** Whether a memo's tags mark it as a lost-and-found post. */
export function isCampusMemo(tags: readonly string[]): boolean {
  return tags.includes(CAMPUS_NAMESPACE_TAG);
}

/** The post type a memo declares, if any. */
export function detectCampusPostType(tags: readonly string[]): CampusPostType | undefined {
  const entry = (Object.entries(CAMPUS_TYPE_TAG) as [CampusPostType, string][]).find(([, tag]) => tags.includes(tag));
  return entry?.[0];
}

/** The post status a memo declares, if any. */
export function detectCampusPostStatus(tags: readonly string[]): CampusPostStatus | undefined {
  const entry = (Object.entries(CAMPUS_STATUS_TAG) as [CampusPostStatus, string][]).find(([, tag]) => tags.includes(tag));
  return entry?.[0];
}

/** The place a memo was filed under, read back from its place tag. */
export function detectCampusPlace(tags: readonly string[]): string | undefined {
  const prefix = `${CAMPUS_PLACE_TAG_PREFIX}/`;
  const tag = tags.find((candidate) => candidate.startsWith(prefix));
  return tag?.slice(prefix.length);
}

/** A draft is only publishable once it says what the item is and where it went missing. */
export function isCampusDraftPublishable(draft: CampusPostDraft): boolean {
  return draft.title.trim().length > 0 && draft.place.trim().length > 0;
}
