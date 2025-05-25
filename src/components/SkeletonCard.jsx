function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 w-full">
      <div className="animate-pulse space-y-4">
        {/* 제목 영역 */}
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        
        {/* 본문 영역 */}
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded"></div>
          <div className="h-3 bg-slate-200 rounded w-5/6"></div>
        </div>
        
        {/* 하단 메타 정보 */}
        <div className="flex justify-between items-center pt-4">
          <div className="h-3 bg-slate-200 rounded w-20"></div>
          <div className="h-3 bg-slate-200 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonCard; 