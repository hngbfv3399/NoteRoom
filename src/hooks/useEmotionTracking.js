import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collection, query, where, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/services/firebase";

export function useEmotionEntries(dateRange = 30) {
  const currentUser = auth.currentUser;
  
  return useQuery({
    queryKey: ["emotionEntries", currentUser?.uid, dateRange],
    queryFn: async () => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      
      
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      
      const emotionsQuery = query(
        collection(db, "emotions"),
        where("userId", "==", currentUser.uid),
        where("createdAt", ">=", startDate),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(emotionsQuery);
      const emotions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      
      
      return emotions;
    },
    staleTime: 1000 * 60 * 5, // 5분
    enabled: !!currentUser
  });
}

export function useEmotionStats() {
  const currentUser = auth.currentUser;
  
  return useQuery({
    queryKey: ["emotionStats", currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      
      
      
      // 최근 30일 데이터
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const emotionsQuery = query(
        collection(db, "emotions"),
        where("userId", "==", currentUser.uid),
        where("createdAt", ">=", startDate),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(emotionsQuery);
      const emotions = snapshot.docs.map(doc => doc.data());
      
      // 통계 계산
      const stats = {
        totalEntries: emotions.length,
        averageMood: emotions.length > 0 
          ? emotions.reduce((sum, emotion) => sum + (emotion.mood || 5), 0) / emotions.length 
          : 5,
        mostFrequentEmotion: getMostFrequent(emotions.map(e => e.emotion)),
        weeklyTrend: getWeeklyTrend(emotions),
        emotionDistribution: getEmotionDistribution(emotions)
      };
      
      
      
      return stats;
    },
    staleTime: 1000 * 60 * 10, // 10분
    enabled: !!currentUser
  });
}

export function useAddEmotion() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  return useMutation({
    mutationFn: async (emotionData) => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      
      
      
      const emotionPayload = {
        ...emotionData,
        userId: currentUser.uid,
        createdAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, "emotions"), emotionPayload);
      return { id: docRef.id, ...emotionPayload };
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["emotionEntries", currentUser?.uid] });
      queryClient.invalidateQueries({ queryKey: ["emotionStats", currentUser?.uid] });
      
      
    }
  });
}

export function useUpdateEmotion() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  return useMutation({
    mutationFn: async ({ emotionId, emotionData }) => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      
      
      
      await updateDoc(doc(db, "emotions", emotionId), {
        ...emotionData,
        updatedAt: new Date()
      });
      
      return { id: emotionId, ...emotionData };
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["emotionEntries", currentUser?.uid] });
      queryClient.invalidateQueries({ queryKey: ["emotionStats", currentUser?.uid] });
      
      
    }
  });
}

export function useDeleteEmotion() {
  const queryClient = useQueryClient();
  const currentUser = auth.currentUser;
  
  return useMutation({
    mutationFn: async (emotionId) => {
      if (!currentUser) throw new Error("로그인이 필요합니다.");
      
      
      
      await deleteDoc(doc(db, "emotions", emotionId));
      return emotionId;
    },
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ["emotionEntries", currentUser?.uid] });
      queryClient.invalidateQueries({ queryKey: ["emotionStats", currentUser?.uid] });
      
      
    }
  });
}

// 유틸리티 함수들
function getMostFrequent(arr) {
  if (arr.length === 0) return null;
  
  const frequency = {};
  arr.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
  });
  
  return Object.keys(frequency).reduce((a, b) => 
    frequency[a] > frequency[b] ? a : b
  );
}

function getWeeklyTrend(emotions) {
  const weeks = {};
  
  emotions.forEach(emotion => {
    const date = emotion.createdAt.toDate ? emotion.createdAt.toDate() : new Date(emotion.createdAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeks[weekKey]) {
      weeks[weekKey] = { total: 0, count: 0 };
    }
    
    weeks[weekKey].total += emotion.mood || 5;
    weeks[weekKey].count += 1;
  });
  
  return Object.entries(weeks).map(([week, data]) => ({
    week,
    averageMood: data.total / data.count
  })).sort((a, b) => new Date(a.week) - new Date(b.week));
}

function getEmotionDistribution(emotions) {
  const distribution = {};
  
  emotions.forEach(emotion => {
    const emotionType = emotion.emotion || 'unknown';
    distribution[emotionType] = (distribution[emotionType] || 0) + 1;
  });
  
  return Object.entries(distribution).map(([emotion, count]) => ({
    emotion,
    count,
    percentage: (count / emotions.length) * 100
  })).sort((a, b) => b.count - a.count);
} 