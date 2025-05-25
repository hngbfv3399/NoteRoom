import { useState, useEffect } from "react";

function useCurrentTime() {
  const [currentTime, setCurrentTime] = useState("");

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

  return currentTime;
}

export default useCurrentTime;
