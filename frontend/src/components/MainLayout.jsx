import React from 'react'
import { Outlet } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'

function MainLayout() {
  return (
    <div className="flex h-screen">
      <LeftSidebar />
      <div className="ml-[16%] flex-grow">
        <Outlet />
      </div>
    </div>
  )
}

export default MainLayout
