import React from 'react';
import { Outlet } from 'react-router-dom';

function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          NoteRoom
        </h1>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout; 