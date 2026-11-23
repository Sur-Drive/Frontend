import type { ComponentType } from 'react';

type IconComponent = ComponentType<{ className?: string }>;

type ShowcaseFeatureItemProps = {
  icon: IconComponent;
  label: string;
};

export function ShowcaseFeatureItem({ icon: Icon, label }: ShowcaseFeatureItemProps) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/5 text-white">
        <Icon className="h-4 w-4" />
      </span>
      <span className="text-[13px] font-medium text-white/95">{label}</span>
    </li>
  );
}
