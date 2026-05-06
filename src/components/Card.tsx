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
      className="group relative flex h-full gap-5 rounded-lg border border-border bg-card p-5 hover:-translate-y-0.5 hover:shadow-md transition-transform"
    >
      <img
        src={`/favicons/${tool.icon ?? `${tool.slug}.png`}`}
        alt=""
        width={48}
        height={48}
        className="h-12 w-12 rounded-md object-contain bg-bg flex-shrink-0"
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          if (img.dataset.fallback === "1") return;
          img.dataset.fallback = "1";
          img.src = "/favicon.svg";
        }}
      />
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold truncate text-lg">{title}</h2>
        <p className="text-base text-muted line-clamp-2">{description}</p>
      </div>
      <span
        title={badgeLabel}
        aria-label={badgeLabel}
        className="absolute right-3 top-3 text-sm"
      >
        {badge}
      </span>
    </a>
  );
}
