import ThemedButton from "../ui/ThemedButton";

function EtcSettings() {
  return (
    <div>
      <div className="space-y-2">
        <ThemedButton className="mr-4">데이터 초기화</ThemedButton>
        <ThemedButton>로그아웃</ThemedButton>
      </div>
      <p className="text-gray-500 text-sm mt-2">버전 1.0.0</p>
    </div>
  );
}

export default EtcSettings;
