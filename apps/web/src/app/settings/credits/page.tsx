import { ExternalLinkIcon } from "lucide-react";

type Credit = {
  name: string;
  description: string;
  license: string;
  href: string;
};

const frontend: Credit[] = [
  { name: "Next.js", description: "React framework", license: "MIT", href: "https://github.com/vercel/next.js" },
  { name: "React", description: "UI library", license: "MIT", href: "https://github.com/facebook/react" },
  { name: "TanStack Query", description: "Async state management", license: "MIT", href: "https://github.com/TanStack/query" },
  { name: "Zustand", description: "State management", license: "MIT", href: "https://github.com/pmndrs/zustand" },
  { name: "Motion", description: "Animation library", license: "MIT", href: "https://github.com/motiondivision/motion" },
  { name: "shadcn/ui", description: "Component primitives", license: "MIT", href: "https://github.com/shadcn-ui/ui" },
  { name: "Base UI", description: "Headless component primitives", license: "MIT", href: "https://github.com/mui/base-ui" },
  { name: "Radix UI", description: "Accessible primitives (via shadcn)", license: "MIT", href: "https://github.com/radix-ui/primitives" },
  { name: "Tailwind CSS", description: "Utility-first CSS framework", license: "MIT", href: "https://github.com/tailwindlabs/tailwindcss" },
  { name: "tw-animate-css", description: "Animation utilities", license: "MIT", href: "https://github.com/Wombosvideo/tw-animate-css" },
  { name: "Lucide", description: "Icon set", license: "ISC", href: "https://github.com/lucide-icons/lucide" },
  { name: "React Hook Form", description: "Form state", license: "MIT", href: "https://github.com/react-hook-form/react-hook-form" },
  { name: "Zod", description: "Schema validation", license: "MIT", href: "https://github.com/colinhacks/zod" },
  { name: "dnd kit", description: "Drag and drop toolkit", license: "MIT", href: "https://github.com/clauderic/dnd-kit" },
  { name: "cmdk", description: "Command menu", license: "MIT", href: "https://github.com/pacocoursey/cmdk" },
  { name: "next-themes", description: "Theme switching", license: "MIT", href: "https://github.com/pacocoursey/next-themes" },
  { name: "clsx", description: "Class name utility", license: "MIT", href: "https://github.com/lukeed/clsx" },
  { name: "tailwind-merge", description: "Tailwind class merging", license: "MIT", href: "https://github.com/dcastil/tailwind-merge" },
  { name: "class-variance-authority", description: "Variant API", license: "Apache-2.0", href: "https://github.com/joe-bell/cva" },
  { name: "orval", description: "OpenAPI → typed React Query hook codegen", license: "MIT", href: "https://github.com/orval-labs/orval" },
];

const inspiration: Credit[] = [
  { name: "Spotlight Storage", description: "LED-lit storage organizer that inspired this project", license: "GPL-3.0", href: "https://github.com/FireMarshmellow/Spotlight_Storage" },
];

const backend: Credit[] = [
  { name: "FastAPI", description: "Web framework", license: "MIT", href: "https://github.com/fastapi/fastapi" },
  { name: "SQLAlchemy", description: "ORM", license: "MIT", href: "https://github.com/sqlalchemy/sqlalchemy" },
  { name: "Pydantic", description: "Data validation", license: "MIT", href: "https://github.com/pydantic/pydantic" },
  { name: "Alembic", description: "Database migrations", license: "MIT", href: "https://github.com/sqlalchemy/alembic" },
  { name: "Pillow", description: "Image processing", license: "MIT-CMU", href: "https://github.com/python-pillow/Pillow" },
  { name: "aiosqlite", description: "Async SQLite driver", license: "MIT", href: "https://github.com/omnilib/aiosqlite" },
  { name: "WLED", description: "LED control firmware (HTTP/WARLS protocol)", license: "MIT", href: "https://github.com/Aircoookie/WLED" },
];

function CreditSection({ title, items }: { title: string; items: Credit[] }) {
  return (
    <section className="flex flex-col min-h-0 space-y-3">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="rounded-xl border border-border bg-card overflow-y-auto max-h-[60vh]">
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground rounded bg-muted px-1.5 py-0.5">
                      {item.license}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                </div>
                <ExternalLinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default function CreditsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Credits & Licenses</h1>
        <p className="text-sm text-muted-foreground">
          Storganizer is built on the work of these open source projects. Thank you!
        </p>
        
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CreditSection title="Frontend" items={frontend} />
        <CreditSection title="Backend" items={backend} />
      </div>
    </div>
  );
}
