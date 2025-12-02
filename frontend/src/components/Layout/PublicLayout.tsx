import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;
