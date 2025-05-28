import React from 'react';

function TitleInput({ title, setTitle }) {
  return (
    <div className="mb-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="멋진 제목을 입력해보세요..."
        className="w-full p-4 font-bold rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-4 placeholder-opacity-50"
        maxLength={100}
      />
      <div className="flex justify-between items-center mt-2">
        <p className="opacity-60">
          제목은 독자의 첫인상을 결정합니다
        </p>
        <span className="opacity-50">
          {title.length}/100
        </span>
      </div>
    </div>
  );
}

export default TitleInput; 