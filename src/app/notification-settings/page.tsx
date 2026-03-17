import NotificationSettings from '@/components/NotificationSettings';

export default function NotificationSettingsPage() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">
          🔔 Notification Settings
        </h1>
        <NotificationSettings />
      </div>
    </div>
  );
}
