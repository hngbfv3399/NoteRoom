import React, { useEffect, useState } from "react";

function UserProfile() {
  const [currentTime, setCurrentTime] = useState("");
  const [emotionTemp, setEmotionTemp] = useState(36.5);

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    }

    updateTime();
    const timer = setInterval(updateTime, 60 * 1000);

    return () => clearInterval(timer);
  }, []);

  const getEmotionTextAndColor = (temp) => {
    if (temp <= 35) return { text: "차가운 느낌", color: "text-blue-400" };
    if (temp <= 45) return { text: "따스한 느낌", color: "text-yellow-400" };
    if (temp <= 70) return { text: "약간 불편해용!", color: "text-orange-500" };
    return { text: "뜨거운 느낌", color: "text-red-500" };
  };

  const { text: emotionText, color: emotionColor } =
    getEmotionTextAndColor(emotionTemp);
  return (
    <div className="h-screen bg-white text-gray-900 overflow-hidden">
      {/* 스냅 스크롤 영역 */}
      <div className="h-full overflow-y-auto snap-y snap-mandatory scroll-smooth">
        {/* 상단 배경 영역 */}
        <section className="relative h-screen snap-start flex-shrink-0 px-6 py-10">
          <img
            src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="배경"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              clipPath: `path('M0,0 H100% V85% C80% 95%, 60% 75%, 0 90% Z')`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          {/* 시간 + 감정 온도 맨 위 */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 z-20">
            {/* 시간 - 항상 하얀색 */}
            <p className="text-5xl font-bold text-white drop-shadow-lg">
              {currentTime}
            </p>

            {/* 감정 온도 텍스트 - 온도별 색상 */}
            <p
              className={`text-2xl font-semibold drop-shadow-lg ${emotionColor}`}
            >
              {emotionText}
            </p>
          </div>

          {/* 프로필 내용 - 아래쪽에서 살짝 위로 */}
          <div className="absolute bottom-26 left-1/2 transform -translate-x-1/2 max-w-xl w-full bg-black/10 backdrop-blur-sm rounded-xl p-7 text-white shadow-lg z-10">
            <h1 className="text-4xl font-extrabold mb-4 drop-shadow-lg">
              김지호
            </h1>

            <div className="mb-6 space-y-2">
              <p className="text-lg font-medium drop-shadow">
                🎂 생년월일: 2003년 4월 23일
              </p>
              <p className="text-lg font-medium drop-shadow">
                ❤️ 좋아하는 것: 발라드, JPOP, 리제로 렘
              </p>
              <p className="text-lg font-medium drop-shadow">
                😊 기분 상태: 평온함
              </p>
              <p className="text-lg font-medium drop-shadow">
                🌡️ 감정 온도: 36.5°C (따뜻한 느낌)
              </p>
            </div>

            <div className="flex gap-4 items-center text-sm italic opacity-80 drop-shadow flex-wrap">
              <p>✨ 좋아하는 명언: "후회 없는 선택을 하자"</p>
              <p>🌱 취미: 감성 노트 쓰기, 음악 감상</p>
            </div>

            <p className="mt-6 text-sm animate-pulse select-none text-center">
              ↓ 스크롤을 해 메모를 확인해보세요. ↓
            </p>
          </div>
        </section>

        {/* 카드 목록 영역 */}
        <section className="min-h-screen snap-start px-4 py-6 bg-white">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-gray-200 h-40 rounded-xl shadow-sm"
              ></div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default UserProfile;
