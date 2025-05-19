import React, { useEffect, useState } from "react";
import ProfileHeader from "../components/UserProfileLayout/ProfileHeader";
import ProfileInfoCard from "../components/UserProfileLayout/ProfileInfoCard";
import NoteGrid from "../components/UserProfileLayout/NoteGrid";

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
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-full overflow-hidden">
      <div className="h-full overflow-y-auto snap-y snap-mandatory">
        <section className="relative h-full snap-start flex-shrink-0 px-6 py-10">
          <img
            src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200"
            alt="배경"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

          <ProfileHeader currentTime={currentTime} emotionTemp={emotionTemp} />
          <ProfileInfoCard />
        </section>

        <NoteGrid />
      </div>
    </div>
  );
}

export default UserProfile;
