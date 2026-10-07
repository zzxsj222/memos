"""Insert the campus translation block into every locale file.

The web app's locale-resources test asserts that every locale carries the same
key set as en.json, so a new namespace has to land in all 47 files at once.
Existing files are edited textually (block inserted right after the opening
brace) rather than re-serialized, which keeps the diff minimal.
"""

import json
import pathlib

LOCALES = pathlib.Path(
    r"C:/Users/zz/WorkBuddy/2026-10-07-21-20-06/campus-lostfound/web/src/locales"
)

EN = {
    "bar-title": "Campus lost & found",
    "publish-action": "Post a notice",
    "publishing": "Posting…",
    "published": "Posted. It is on the timeline now.",
    "publish-failed": "Could not post the notice. Please try again.",
    "publish-title": "Post a lost & found notice",
    "publish-description": "Describe the item, where it happened and its current state. The notice is published as a tagged memo, so others can filter the board by kind and state.",
    "type-lost": "I lost something",
    "type-found": "I found something",
    "type-lost-hint": "Post a lost-item notice and wait for whoever picked it up to reach out.",
    "type-found-hint": "Post a found-item notice and wait for the owner to claim it.",
    "status-pending": "Unclaimed",
    "status-returned": "Returned",
    "field-kind": "Kind",
    "field-item": "Item",
    "field-item-placeholder": "e.g. Black long umbrella",
    "field-place": "Place",
    "field-place-placeholder": "e.g. Teaching Building 3, ground floor lobby",
    "field-place-hint": "Name the building and the exact spot. The place becomes a tag, so others can filter the board by location.",
    "field-time": "When",
    "field-time-placeholder": "e.g. Evening of Oct 7",
    "field-status": "Current state",
    "field-detail": "Details",
    "field-detail-placeholder": "Brand, colour, distinguishing marks, damage… the more specific, the easier to recognise.",
    "field-identity": "Post as",
    "field-contact": "Contact",
    "field-contact-placeholder": "e.g. WeChat / QQ / phone",
    "field-contact-hint": "Leave it blank to be safer — others can reach you in the comments.",
    "identity-real": "Real name",
    "identity-anonymous": "Anonymous",
    "identity-anonymous-hint": "Anonymous posts keep your contact details out of the body. Note that the platform still records the posting account, which instance admins can see.",
}

ZH_HANS = {
    "bar-title": "校园失物招领",
    "publish-action": "发布失物/招领",
    "publishing": "发布中…",
    "published": "已发布，现在可以在时间线里看到它了。",
    "publish-failed": "发布失败，请稍后重试。",
    "publish-title": "发布失物招领",
    "publish-description": "填写物品、地点和当前状态。发布后会生成一条带标签的备忘，其他人可以按类型和状态筛选到它。",
    "type-lost": "我丢了东西",
    "type-found": "我捡到东西",
    "type-lost-hint": "发一条寻物启事，等待拾获者联系你。",
    "type-found-hint": "发一条招领启事，等待失主来认领。",
    "status-pending": "待认领",
    "status-returned": "已归还",
    "field-kind": "类型",
    "field-item": "物品名称",
    "field-item-placeholder": "例如：黑色长柄雨伞",
    "field-place": "地点",
    "field-place-placeholder": "例如：三教一楼大厅",
    "field-place-hint": "写清楼栋和具体位置。地点会自动变成一个标签，方便别人按位置筛选。",
    "field-time": "时间",
    "field-time-placeholder": "例如：10 月 7 日傍晚",
    "field-status": "当前状态",
    "field-detail": "补充描述",
    "field-detail-placeholder": "品牌、颜色、有无特征物、有没有破损……写得越具体，越容易被认出来。",
    "field-identity": "发布身份",
    "field-contact": "联系方式",
    "field-contact-placeholder": "例如：微信 / QQ / 手机号",
    "field-contact-hint": "留空更安全，别人可以在评论区联系你。",
    "identity-real": "实名发布",
    "identity-anonymous": "匿名发布",
    "identity-anonymous-hint": "匿名发布不会在正文里公开你的联系方式。但请注意：平台仍会记录发帖账号，管理员可见。",
}

ZH_HANT = {
    "bar-title": "校園失物招領",
    "publish-action": "發布失物/招領",
    "publishing": "發布中…",
    "published": "已發布，現在可以在時間軸裡看到它了。",
    "publish-failed": "發布失敗，請稍後重試。",
    "publish-title": "發布失物招領",
    "publish-description": "填寫物品、地點和目前狀態。發布後會產生一則帶標籤的備忘，其他人可以依類型和狀態篩選到它。",
    "type-lost": "我丟了東西",
    "type-found": "我撿到東西",
    "type-lost-hint": "發一則尋物啟事，等待拾獲者聯繫你。",
    "type-found-hint": "發一則招領啟事，等待失主來認領。",
    "status-pending": "待認領",
    "status-returned": "已歸還",
    "field-kind": "類型",
    "field-item": "物品名稱",
    "field-item-placeholder": "例如：黑色長柄雨傘",
    "field-place": "地點",
    "field-place-placeholder": "例如：三教一樓大廳",
    "field-place-hint": "寫清樓棟和具體位置。地點會自動變成一個標籤，方便別人依位置篩選。",
    "field-time": "時間",
    "field-time-placeholder": "例如：10 月 7 日傍晚",
    "field-status": "目前狀態",
    "field-detail": "補充描述",
    "field-detail-placeholder": "品牌、顏色、有無特徵物、有沒有破損……寫得越具體，越容易被認出來。",
    "field-identity": "發布身分",
    "field-contact": "聯絡方式",
    "field-contact-placeholder": "例如：微信 / QQ / 手機號",
    "field-contact-hint": "留空更安全，別人可以在留言區聯絡你。",
    "identity-real": "實名發布",
    "identity-anonymous": "匿名發布",
    "identity-anonymous-hint": "匿名發布不會在正文裡公開你的聯絡方式。但請注意：平台仍會記錄發文帳號，管理員可見。",
}

BY_LOCALE = {"en.json": EN, "zh-Hans.json": ZH_HANS, "zh-Hant.json": ZH_HANT}

written = []
for path in sorted(LOCALES.glob("*.json")):
    text = path.read_text(encoding="utf-8")
    block = BY_LOCALE.get(path.name, EN)
    if '"campus"' in text:
        continue
    # Serialize the namespace on its own so the splice inherits the file's
    # two-space top-level depth, then cut the wrapper braces away: [2:-2] drops
    # the leading "{\n" and the trailing "\n}".
    body = json.dumps({"campus": block}, ensure_ascii=False, indent=2)[2:-2]
    insert_at = text.index("{") + 1
    updated = text[:insert_at] + "\n" + body + "," + text[insert_at:]
    # Parse before writing so a malformed splice never reaches disk.
    json.loads(updated)
    path.write_text(updated, encoding="utf-8")
    written.append(path.name)

print(f"updated {len(written)} locale files")
print(", ".join(written))
