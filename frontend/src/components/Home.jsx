import React from "react";
import Feed from "./Feed";
import RightSidebar from "./RightSidebar";
import { Outlet } from "react-router-dom";
import useGetAllPost from "@/hooks/useGetAllPost";
import useGetSuggestedUsers from "@/hooks/useGetSuggestedUsers";

const Home = () => {
  useGetAllPost();
  useGetSuggestedUsers();
  return (
    <div className="flex h-screen">
      <div className="flex-grow pr-4">
        <Feed />
        <Outlet />
      </div>
      <div className="w-[25%]">
        <RightSidebar />
      </div>
    </div>
  );
};

export default Home;
