import { Facebook, Instagram } from "lucide-react";

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { name: "Facebook", href: "https://www.facebook.com/startupreviewguy", Icon: Facebook },
  { name: "Instagram", href: "https://www.instagram.com/startupreviewguy", Icon: Instagram },
  { name: "X", href: "https://x.com/startuprevguy", Icon: XIcon },
];

export function SocialLinks({
  className = "flex items-center gap-4",
  iconClassName = "w-5 h-5",
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div className={className}>
      {SOCIAL_LINKS.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={name}
          className="text-foreground hover:text-primary transition-colors"
        >
          <Icon className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
