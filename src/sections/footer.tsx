import Link from "next/link";
import { Logo } from "@/components/logo";
import { FolderGit2, RadioTower, Bird } from "lucide-react";

const PRODUCT_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Solutions", href: "#why-orion" },
  { label: "Product", href: "#cta" },
];

const CONTACT_LINKS = [
  { label: "Support", href: "mailto:support@orion.app" },
  { label: "Sales", href: "mailto:sales@orion.app" },
  { label: "About", href: "#made-for" },
];

const SOCIAL_LINKS = [
  { icon: Bird, href: "#", label: "Twitter" },
  { icon: RadioTower, href: "#", label: "LinkedIn" },
  { icon: FolderGit2, href: "#", label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#030712] px-6 py-14">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-[#9CA3AF]">
              The AI-powered placement operating system for modern
              institutions.
            </p>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Contact" links={CONTACT_LINKS} />

          <div>
            <h4 className="text-sm font-semibold text-[#F9FAFB]">Follow</h4>
            <div className="mt-4 flex gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full border border-white/10 text-[#9CA3AF] transition-colors hover:border-[#00FF88]/40 hover:text-[#00FF88]"
                >
                  <social.icon className="size-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-[#9CA3AF]">
          © {new Date().getFullYear()} ORION. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#F9FAFB]">{title}</h4>
      <ul className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-sm text-[#9CA3AF] transition-colors hover:text-[#F9FAFB]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}