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

    updateTime(); // TODO: 컴포넌트가 처음 마운트될 때 현재 시간을 즉시 보여주기 위해 실행 중. 리팩터링 시 분리 고려.
    
    const timer = setInterval(updateTime, 60000); // TODO: 초 단위까지 표시하려면 주기를 1000ms로 변경하고 상태값도 조정해야 함.
    
    // FIXME: 사용자가 시스템 시간을 변경하면 setInterval만으로는 정확한 갱신이 어려울 수 있음. 성능보다 정확도를 우선한다면 requestAnimationFrame + 시간 비교 방식 고려.

    return () => clearInterval(timer); // TODO: 언마운트 시 타이머 해제하여 메모리 누수 방지.
  }, []);

  return currentTime;
}

export default useCurrentTime;
