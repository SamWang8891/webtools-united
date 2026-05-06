import type { Tool, Lang } from "../lib/types";
import { getToolStrings, t } from "../i18n";

interface Props {
  tool: Tool;
  lang: Lang;
}

export function Card({ tool, lang }: Props) {
  const { title, description } = getToolStrings(tool, lang);
  const isExternal = tool.type === "external";
  const href = isExternal ? tool.url! : tool.path!;
  const badge = isExternal ? "🔗" : "📦";
  const badgeLabel = isExternal ? t(lang, "card.external") : t(lang, "card.embedded");
  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group relative flex gap-4 rounded-lg border border-border bg-card p-4 hover:-translate-y-0.5 hover:shadow-md transition-transform"
    >
      <img
        src={`/favicons/${tool.slug}.png`}
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 rounded-md object-contain bg-bg flex-shrink-0"
        loading="lazy"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
        }}
      />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold truncate">{title}</h2>
        <p className="text-sm text-muted line-clamp-2">{description}</p>
      </div>
      <span
        title={badgeLabel}
        aria-label={badgeLabel}
        className="absolute right-3 top-3 text-xs"
      >
        {badge}
      </span>
    </a>
  );
}
