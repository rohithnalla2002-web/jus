import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import {
  COMPANY_ADDRESS_FULL,
  COMPANY_CIN,
  COMPANY_LEGAL_NAME,
  COMPANY_PHONE_DISPLAY,
  COMPANY_PHONE_E164,
  GOLDMIND_APP_NAME,
} from "@/lib/company";
import { GoldMindLogoMark } from "@/components/shared/GoldMindBrandLogo";

export default function ShopFooter() {
  return (
    <footer className="border-t border-amber-200/70 bg-white/90 text-zinc-600 shadow-[0_-4px_24px_-8px_rgba(180,83,9,0.08)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2 text-zinc-900">
              <GoldMindLogoMark size="sm" />
              <span className="font-serif text-lg font-semibold">{GOLDMIND_APP_NAME}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600">
              Jewellery retail and workshop operations — inventory, karigar workflow, and billing in one place.
            </p>
            <div className="mt-4 flex gap-3">
              {[Instagram, Facebook, Twitter, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-200 text-zinc-500 transition-all hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800"
                  aria-label="Social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Quick links</p>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <ul className="space-y-2 text-sm">
                {[
                  ["/#home", "Home"],
                  ["/#visual-analytics", "Visual Analytics"],
                  ["/#ai-integration", "AI Integration"],
                  ["/#why-us", "Why Us"],
                  ["/#core-features", "Core Features"],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="text-zinc-600 hover:text-amber-800 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-2 text-sm">
                {[
                  ["/#testimonials", "Testimonials"],
                  ["/#pricing", "Pricing"],
                  ["/#faqs", "FAQs"],
                  ["/#contact", "Contact"],
                ].map(([to, label]) => (
                  <li key={to}>
                    <Link to={to} className="text-zinc-600 hover:text-amber-800 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Visit</p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              {COMPANY_ADDRESS_FULL}
              <br />
              <a href={`tel:${COMPANY_PHONE_E164}`} className="font-medium text-amber-800 hover:underline">
                {COMPANY_PHONE_DISPLAY}
              </a>
              <br />
              <span className="text-xs text-zinc-500">CIN {COMPANY_CIN}</span>
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-amber-200/60 pt-8 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} {COMPANY_LEGAL_NAME}. {GOLDMIND_APP_NAME}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
