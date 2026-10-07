import { MapPinIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { type FilterFactor, type MemoFilter, useMemoFilterContext } from "@/contexts/MemoFilterContext";
import useCurrentUser from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { type Translations, useTranslate } from "@/utils/i18n";
import CampusPublishDialog from "./CampusPublishDialog";

/** The facets a campus reader reaches for first, in the order they narrow a list. */
const QUICK_FILTERS = [
  { factor: "campus.type", value: "LOST", label: "campus.type-lost" },
  { factor: "campus.type", value: "FOUND", label: "campus.type-found" },
  { factor: "campus.status", value: "PENDING", label: "campus.status-pending" },
  { factor: "campus.status", value: "RETURNED", label: "campus.status-returned" },
] as const satisfies readonly { factor: FilterFactor; value: string; label: Translations }[];

/**
 * The campus entry strip: one place to file a notice and the four ways a reader
 * narrows the board.
 *
 * The chips are ordinary memo filters, so they compose with the tag, day and
 * search filters already in the app rather than replacing them — a reader can
 * stack 「寻物启事」on top of a building tag and a date.
 */
const CampusBar = ({ className }: { className?: string }) => {
  const t = useTranslate();
  const user = useCurrentUser();
  const { filters, addFilter, removeFilter } = useMemoFilterContext();
  const [publishOpen, setPublishOpen] = useState(false);

  const isActive = (candidate: Pick<MemoFilter, "factor" | "value">) =>
    filters.some((filter) => filter.factor === candidate.factor && filter.value === candidate.value);

  const toggle = (candidate: Pick<MemoFilter, "factor" | "value">) => {
    if (isActive(candidate)) {
      removeFilter((filter) => filter.factor === candidate.factor && filter.value === candidate.value);
    } else {
      addFilter({ factor: candidate.factor, value: candidate.value });
    }
  };

  return (
    <div
      className={cn(
        "flex flex-row flex-wrap items-center gap-2 border-b border-border/60 px-3 py-2",
        className,
      )}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground">
        <MapPinIcon className="size-4 text-muted-foreground" />
        {t("campus.bar-title")}
      </span>

      <div className="flex min-w-0 flex-1 flex-row flex-wrap items-center gap-1.5">
        {QUICK_FILTERS.map((filter) => (
          <Button
            key={`${filter.factor}:${filter.value}`}
            variant="quiet"
            size="sm"
            aria-pressed={isActive(filter)}
            onClick={() => toggle(filter)}
          >
            {t(filter.label)}
          </Button>
        ))}
      </div>

      {user && (
        <Button size="sm" onClick={() => setPublishOpen(true)}>
          <PlusIcon className="size-4" />
          {t("campus.publish-action")}
        </Button>
      )}

      <CampusPublishDialog open={publishOpen} onOpenChange={setPublishOpen} />
    </div>
  );
};

CampusBar.displayName = "CampusBar";

export default CampusBar;
