import { create } from "@bufbuild/protobuf";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { memoServiceClient } from "@/connect";
import { memoKeys } from "@/hooks/useMemoQueries";
import {
  buildCampusContent,
  type CampusIdentity,
  type CampusPostDraft,
  type CampusPostStatus,
  createEmptyCampusDraft,
  isCampusDraftPublishable,
} from "@/lib/campus";
import { cn } from "@/lib/utils";
import { MemoSchema, Visibility } from "@/types/proto/api/v1/memo_service_pb";
import { useTranslate } from "@/utils/i18n";

interface CampusPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Receives the created memo's name so a host can scroll to it or open it. */
  onPublished?: (memoName: string) => void;
}

const FIELD_CLASSES = "flex flex-col gap-1.5";

/**
 * A campus-shaped composer.
 *
 * memos' own editor is deliberately title-less and folder-less, which is the
 * right shape for a personal timeline and the wrong shape for a lost-and-found
 * notice: a poster needs to state what the item is, where it went missing, and
 * whether it has been claimed. This dialog collects exactly those fields and
 * hands the result to the ordinary memo API.
 */
const CampusPublishDialog = ({ open, onOpenChange, onPublished }: CampusPublishDialogProps) => {
  const t = useTranslate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(createEmptyCampusDraft);
  const [publishing, setPublishing] = useState(false);

  const patch = (next: Partial<CampusPostDraft>) => setDraft((prev) => ({ ...prev, ...next }));
  const publishable = isCampusDraftPublishable(draft);
  // `items` is what lets the bare <SelectValue /> render a label instead of the
  // raw enum value, so the options double as both the menu and the trigger text.
  const statusOptions = [
    { value: "PENDING", label: t("campus.status-pending") },
    { value: "RETURNED", label: t("campus.status-returned") },
  ];
  const identityOptions = [
    { value: "REAL", label: t("campus.identity-real") },
    { value: "ANONYMOUS", label: t("campus.identity-anonymous") },
  ];

  const handleSubmit = async () => {
    if (!publishable || publishing) return;
    setPublishing(true);
    try {
      const memo = await memoServiceClient.createMemo({
        memo: create(MemoSchema, {
          content: buildCampusContent(draft),
          // A notice nobody can read is not a notice. Campus posts default to the
          // audience the instance exposes to every signed-in member.
          visibility: Visibility.PUBLIC,
        }),
      });
      await queryClient.invalidateQueries({ queryKey: memoKeys.lists() });
      toast.success(t("campus.published"));
      setDraft(createEmptyCampusDraft());
      onOpenChange(false);
      onPublished?.(memo.name);
    } catch {
      toast.error(t("campus.publish-failed"));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t("campus.publish-title")}</DialogTitle>
          <DialogDescription>{t("campus.publish-description")}</DialogDescription>
        </DialogHeader>

        <div className={FIELD_CLASSES}>
          <Label>{t("campus.field-kind")}</Label>
          <div className="flex flex-row gap-2">
            <Button
              type="button"
              variant={draft.type === "LOST" ? "default" : "outline"}
              size="sm"
              onClick={() => patch({ type: "LOST" })}
            >
              {t("campus.type-lost")}
            </Button>
            <Button
              type="button"
              variant={draft.type === "FOUND" ? "default" : "outline"}
              size="sm"
              onClick={() => patch({ type: "FOUND" })}
            >
              {t("campus.type-found")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">{draft.type === "LOST" ? t("campus.type-lost-hint") : t("campus.type-found-hint")}</p>
        </div>

        <div className={FIELD_CLASSES}>
          <Label htmlFor="campus-publish-title">{t("campus.field-item")}</Label>
          <Input
            id="campus-publish-title"
            value={draft.title}
            placeholder={t("campus.field-item-placeholder")}
            onChange={(event) => patch({ title: event.target.value })}
          />
        </div>

        <div className={FIELD_CLASSES}>
          <Label htmlFor="campus-publish-place">{t("campus.field-place")}</Label>
          <Input
            id="campus-publish-place"
            value={draft.place}
            placeholder={t("campus.field-place-placeholder")}
            onChange={(event) => patch({ place: event.target.value })}
          />
          <p className="text-xs text-muted-foreground">{t("campus.field-place-hint")}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={FIELD_CLASSES}>
            <Label htmlFor="campus-publish-time">{t("campus.field-time")}</Label>
            <Input
              id="campus-publish-time"
              value={draft.occurredAt}
              placeholder={t("campus.field-time-placeholder")}
              onChange={(event) => patch({ occurredAt: event.target.value })}
            />
          </div>

          <div className={FIELD_CLASSES}>
            <Label>{t("campus.field-status")}</Label>
            <Select value={draft.status} items={statusOptions} onValueChange={(value) => patch({ status: value as CampusPostStatus })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className={FIELD_CLASSES}>
          <Label htmlFor="campus-publish-detail">{t("campus.field-detail")}</Label>
          <Textarea
            id="campus-publish-detail"
            value={draft.detail}
            placeholder={t("campus.field-detail-placeholder")}
            onChange={(event) => patch({ detail: event.target.value })}
          />
        </div>

        <div className={cn(FIELD_CLASSES, "rounded-md border border-border p-3")}>
          <Label>{t("campus.field-identity")}</Label>
          <Select value={draft.identity} items={identityOptions} onValueChange={(value) => patch({ identity: value as CampusIdentity })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {identityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {draft.identity === "REAL" ? (
            <div className={cn(FIELD_CLASSES, "mt-1")}>
              <Label htmlFor="campus-publish-contact">{t("campus.field-contact")}</Label>
              <Input
                id="campus-publish-contact"
                value={draft.contact}
                placeholder={t("campus.field-contact-placeholder")}
                onChange={(event) => patch({ contact: event.target.value })}
              />
              <p className="text-xs text-muted-foreground">{t("campus.field-contact-hint")}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("campus.identity-anonymous-hint")}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="quiet" size="sm" onClick={() => onOpenChange(false)} disabled={publishing}>
            {t("common.cancel")}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={!publishable || publishing}>
            {publishing ? t("campus.publishing") : t("campus.publish-action")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

CampusPublishDialog.displayName = "CampusPublishDialog";

export default CampusPublishDialog;
