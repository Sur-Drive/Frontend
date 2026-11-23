import { PageHeader } from '@/components/admin/dashboard/PageHeader';
import { SettingsView } from '@/components/admin/settings/SettingsView';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile Settings"
        subtitle="Update your account details, manage your password, and control security preferences."
      />

      <SettingsView />
    </div>
  );
}