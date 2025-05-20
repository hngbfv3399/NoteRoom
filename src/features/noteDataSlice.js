import { createSlice } from "@reduxjs/toolkit";

const initialnoteData = [
    {
      id: 0,
      title: "아침 산책 기록",
      content: "맑은 하늘 아래서 느낀 상쾌함과 새소리. 오늘 하루도 잘 시작했어요.",
      likes: 12,
      commentCount: 3,
      comment: [],
      views: 45,
      category: "일상",
      date: "2025년 05월 15일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: 1,
      title: "정보 공유: 효율적인 공부법",
      content: "포모도로 기법과 집중 환경 조성에 관한 팁을 공유합니다.",
      likes: 30,
      commentCount: 5,
      comment: [],
      views: 120,
      category: "정보",
      date: "2025년 05월 13일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: 2,
      title: "감성 일기: 비 오는 날의 생각",
      content: "빗소리를 들으며 문득 지나간 추억들이 떠올랐다.",
      likes: 22,
      commentCount: 4,
      comment: [],
      views: 88,
      category: "감성",
      date: "2025년 05월 12일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: 3,
      title: "가을 시 한 편",
      content: "낙엽이 떨어지는 소리에 내 마음도 물들어 가네.",
      likes: 18,
      commentCount: 2,
      comment: [],
      views: 70,
      category: "시",
      date: "2025년 05월 10일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: 4,
      title: "여행 사진: 제주 바다",
      content: "맑고 푸른 제주 바다에서의 하루를 담았다.",
      likes: 40,
      commentCount: 7,
      comment: [],
      views: 150,
      category: "사진",
      date: "2025년 05월 09일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: 5,
      title: "가족과 함께 본 영화",
      content: "주말에 가족과 본 따뜻한 감동 영화 후기입니다.",
      likes: 25,
      commentCount: 6,
      comment: [],
      views: 95,
      category: "동영상",
      date: "2025년 05월 08일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: 6,
      title: "감성 가득한 카페에서",
      content: "따뜻한 커피 한잔과 조용한 음악, 힐링 그 자체였다.",
      likes: 20,
      commentCount: 3,
      comment: [],
      views: 80,
      category: "감성",
      date: "2025년 05월 07일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: 7,
      title: "정보: 자바스크립트 팁",
      content: "코딩할 때 자주 쓰는 유용한 JS 함수 모음입니다.",
      likes: 35,
      commentCount: 8,
      comment: [],
      views: 140,
      category: "정보",
      date: "2025년 05월 05일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
    {
      id: 8,
      title: "일상 속 작은 행복",
      content: "좋아하는 책을 읽으며 느낀 소소한 기쁨을 기록해요.",
      likes: 15,
      commentCount: 2,
      comment: [],
      views: 60,
      category: "일상",
      date: "2025년 05월 01일",
      image:
        "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  ];
  const initialState = {
    noteData: [...initialnoteData],
    filterCategory: null,
  };

  const noteDataSlice = createSlice({
    name: "noteData",
    initialState,
    reducers: {
      sortNewNote: (state) => {
        state.noteData.sort((a, b) => {
          const dateA = new Date(a.date.replace(/년|월/g, '-').replace(/일/, '').trim());
          const dateB = new Date(b.date.replace(/년|월/g, '-').replace(/일/, '').trim());
          return dateB - dateA; // 최신 날짜가 앞으로 오도록 내림차순 정렬
        });
      },
      sortHotNote: (state) => {
        state.noteData.sort((a, b) => b.likes - a.likes);  // 좋아요 많은 순 내림차순 정렬
      },
      setCategoryFilter:(state,action)=>{
        state.filterCategory = action.payload;
      },
      setCategoryFilterReset:(state)=>{
        state.filterCategory = null;
      }
    },
  });
  
  
  export const { sortHotNote,sortNewNote,setCategoryFilter,setCategoryFilterReset } = noteDataSlice.actions;
  export default noteDataSlice.reducer;