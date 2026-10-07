import { describe, expect, it } from "vitest";
import {
  buildCampusContent,
  buildCampusPlaceTag,
  buildCampusTags,
  CAMPUS_ANONYMOUS_TAG,
  CAMPUS_NAMESPACE_TAG,
  createEmptyCampusDraft,
  detectCampusPlace,
  detectCampusPostStatus,
  detectCampusPostType,
  isCampusDraftPublishable,
  isCampusMemo,
} from "@/lib/campus";

const draft = () => ({ ...createEmptyCampusDraft(), title: "黑色长柄雨伞", place: "三教一楼大厅" });

describe("buildCampusTags", () => {
  it("always carries the namespace, the type and the status", () => {
    expect(buildCampusTags({ ...draft(), type: "LOST", status: "PENDING" })).toEqual([
      CAMPUS_NAMESPACE_TAG,
      "寻物启事",
      "待认领",
      "地点/三教一楼大厅",
    ]);
  });

  it("swaps the type and status tags with the selection", () => {
    const tags = buildCampusTags({ ...draft(), type: "FOUND", status: "RETURNED" });
    expect(tags).toContain("招领启事");
    expect(tags).toContain("已归还");
    expect(tags).not.toContain("寻物启事");
  });

  it("adds the anonymous tag only for anonymous drafts", () => {
    expect(buildCampusTags({ ...draft(), identity: "ANONYMOUS" })).toContain(CAMPUS_ANONYMOUS_TAG);
    expect(buildCampusTags({ ...draft(), identity: "REAL" })).not.toContain(CAMPUS_ANONYMOUS_TAG);
  });

  it("omits the place tag when no place is given", () => {
    expect(buildCampusTags({ ...draft(), place: "  " })).not.toContain("地点/三教一楼大厅");
  });
});

describe("buildCampusPlaceTag", () => {
  it("strips the whitespace the tag grammar rejects", () => {
    expect(buildCampusPlaceTag("三教 一楼 大厅")).toBe("地点/三教一楼大厅");
  });

  it("returns undefined for an empty place", () => {
    expect(buildCampusPlaceTag("   ")).toBeUndefined();
  });
});

describe("buildCampusContent", () => {
  it("writes a heading, the facts and the trailing tag line", () => {
    const content = buildCampusContent({ ...draft(), occurredAt: "10 月 7 日傍晚", detail: "伞骨有一处破损" });
    expect(content).toContain("## 【寻物】黑色长柄雨伞");
    expect(content).toContain("伞骨有一处破损");
    expect(content).toContain("- 地点：三教一楼大厅");
    expect(content).toContain("- 时间：10 月 7 日傍晚");
    expect(content).toContain("- 当前状态：待认领");
    expect(content.trimEnd().endsWith("#失物招领 #寻物启事 #待认领 #地点/三教一楼大厅")).toBe(true);
  });

  it("withholds the contact line for anonymous drafts", () => {
    const content = buildCampusContent({ ...draft(), identity: "ANONYMOUS", contact: "微信 abc123" });
    expect(content).not.toContain("微信 abc123");
    expect(content).toContain("匿名发布");
  });

  it("keeps the contact line for real-name drafts", () => {
    expect(buildCampusContent({ ...draft(), identity: "REAL", contact: "微信 abc123" })).toContain("- 联系方式：微信 abc123");
  });
});

describe("detection round-trips", () => {
  it("reads the type, status and place back out of the emitted tags", () => {
    const tags = buildCampusTags({ ...draft(), type: "FOUND", status: "RETURNED" });
    expect(isCampusMemo(tags)).toBe(true);
    expect(detectCampusPostType(tags)).toBe("FOUND");
    expect(detectCampusPostStatus(tags)).toBe("RETURNED");
    expect(detectCampusPlace(tags)).toBe("三教一楼大厅");
  });

  it("reports nothing for a memo that is not a campus post", () => {
    expect(isCampusMemo(["日记"])).toBe(false);
    expect(detectCampusPostType(["日记"])).toBeUndefined();
    expect(detectCampusPostStatus(["日记"])).toBeUndefined();
    expect(detectCampusPlace(["日记"])).toBeUndefined();
  });
});

describe("isCampusDraftPublishable", () => {
  it("requires both an item and a place", () => {
    expect(isCampusDraftPublishable(draft())).toBe(true);
    expect(isCampusDraftPublishable({ ...draft(), title: "  " })).toBe(false);
    expect(isCampusDraftPublishable({ ...draft(), place: "" })).toBe(false);
  });
});
