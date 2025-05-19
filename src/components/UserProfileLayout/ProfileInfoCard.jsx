function ProfileInfoCard() {
  return (
    <div className="absolute bottom-26 left-1/2 transform -translate-x-1/2 max-w-xl w-full bg-black/10 backdrop-blur-sm rounded-xl p-7 text-white shadow-lg z-10">
      <h1 className="text-4xl font-extrabold mb-4 drop-shadow-lg">김지호</h1>

      <div className="mb-6 space-y-2">
        <p className="text-lg font-medium drop-shadow">
          🎂 생년월일: 2003년 4월 23일
        </p>
        <p className="text-lg font-medium drop-shadow">
          ❤️ 좋아하는 것: 발라드, JPOP, 리제로 렘
        </p>
        <p className="text-lg font-medium drop-shadow">😊 기분 상태: 평온함</p>
        <p className="text-lg font-medium drop-shadow">🌡️ 감정 온도: 36.5°C</p>
      </div>

      <div className="flex gap-4 items-center text-sm italic opacity-80 drop-shadow flex-wrap">
        <p>✨ 좋아하는 명언: "후회 없는 선택을 하자"</p>
        <p>🌱 취미: 감성 노트 쓰기, 음악 감상</p>
      </div>

      <p className="mt-6 text-sm animate-pulse select-none text-center">
        ↓ 스크롤을 해 메모를 확인해보세요. ↓
      </p>
    </div>
  );
}

export default ProfileInfoCard;
