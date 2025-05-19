function ProfileHeader({ currentTime, emotionTemp }) {
  const getEmotionTextAndColor = (temp) => {
    if (temp <= 35) return { text: "차가운 느낌", color: "text-blue-400" };
    if (temp <= 45) return { text: "따스한 느낌", color: "text-yellow-400" };
    if (temp <= 70) return { text: "약간 불편해용!", color: "text-orange-500" };
    return { text: "뜨거운 느낌", color: "text-red-500" };
  };

  const { text: emotionText, color: emotionColor } =
    getEmotionTextAndColor(emotionTemp);

  return (
    <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2 z-20">
      <p className="text-5xl font-bold text-white drop-shadow-lg">
        {currentTime}
      </p>
      <p className={`text-3xl font-semibold drop-shadow-lg ${emotionColor}`}>
        {emotionTemp}°C
      </p>
      <p className={`text-2xl font-semibold drop-shadow-lg ${emotionColor}`}>
        {emotionText}
      </p>
    </div>
  );
}

export default ProfileHeader;
