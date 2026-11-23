import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ComingSoon } from "@/components/admin/ComingSoon";
import { EXTRA_PAGES, NAV_GROUPS } from "@/lib/nav";
import type { NavItem } from "@/lib/nav";

const ALL_ITEMS: NavItem[] = [
  ...NAV_GROUPS.flatMap((group) => group.items),
  ...EXTRA_PAGES,
];

function findSection(slug: string): NavItem | undefined {
  return ALL_ITEMS.find((item) => item.slug === slug);
}

interface SectionPageProps {
  params: Promise<{ section: string }>;
}

export async function generateMetadata({
  params,
}: SectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const item = findSection(section);
  if (!item) return { title: "Not found | SUR-DRIVEHT Admin" };
  return { title: `${item.label} | SUR-DRIVEHT Admin` };
}

export default async function SectionPage({ params }: SectionPageProps) {
  const { section } = await params;
  const item = findSection(section);
  if (!item) notFound();
  return <ComingSoon icon={item.icon} title={item.label} />;
}
