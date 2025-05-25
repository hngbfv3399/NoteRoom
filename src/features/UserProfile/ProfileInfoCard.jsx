function ProfileInfoCard({ userData }) {
  return (
    <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 max-w-xl w-full text-white z-10">
      <div className="bg-black/10 backdrop-blur-sm rounded-xl p-7 shadow-lg mb-6">
        <h1 className="text-4xl font-extrabold mb-4 drop-shadow-lg">{userData.displayName || "이름 없음"}</h1>

        <div className="mb-6 space-y-2">
          <p className="text-lg font-medium drop-shadow">🎂 생년월일: {userData.birthDate || "정보 없음"}</p>
          <p className="text-lg font-medium drop-shadow">❤️ 좋아하는 것: {userData.favorites || "정보 없음"}</p>
          <p className="text-lg font-medium drop-shadow">😊 기분 상태: {userData.mood || "정보 없음"}</p>
          <p className="text-lg font-medium drop-shadow">🌡️ 감정 온도: {userData.emotionalTemperature || "정보 없음"}°C</p>
        </div>

        <div className="flex gap-4 items-center text-sm italic opacity-80 drop-shadow flex-wrap">
          <p>✨ 좋아하는 명언: {userData.favoriteQuote || "정보 없음"}</p>
          <p>🌱 취미: {userData.hobbies || "정보 없음"}</p>
        </div>
      </div>

      <p className="text-lg animate-pulse select-none text-center drop-shadow-lg font-medium">↓ 스크롤을 해 메모를 확인해보세요. ↓</p>
    </div>
  );
}

export default ProfileInfoCard;
