import SettingSection from "../components/SettingLayout/SettingSection";
import ThemeSelector from "../components/SettingLayout/ThemeSelector";
import NotificationToggle from "../components/SettingLayout/NotificationToggle";
import ProfileActions from "../components/SettingLayout/ProfileActions";
import EtcSettings from "../components/SettingLayout/EtcSettings";

function SettingPage() {
  return (
    <div className="max-w-xl mx-auto space-y-8">
      <header className="text-2xl font-bold mb-4">설정</header>

      <SettingSection title="테마 설정">
        <ThemeSelector />
      </SettingSection>

      <SettingSection title="알림 설정">
        <NotificationToggle />
      </SettingSection>

      <SettingSection title="프로필 설정">
        <ProfileActions />
      </SettingSection>

      <SettingSection title="기타 설정">
        <EtcSettings />
      </SettingSection>
    </div>
  );
}

export default SettingPage;
