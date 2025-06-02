'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'mdui/components/navigation-rail.js';
import 'mdui/components/navigation-rail-item.js';
import 'mdui/components/fab.js';
import 'mdui/components/icon.js';

const NavigationRail: React.FC = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Ensure MDUI components are initialized
    const initMDUI = async () => {
      await Promise.all([
        import('mdui/components/navigation-rail.js'),
        import('mdui/components/navigation-rail-item.js'),
        import('mdui/components/fab.js'),
        import('mdui/components/icon.js')
      ]);
      setIsClient(true);
    };
    
    initMDUI();
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <mdui-navigation-rail contained placement="left" alignment="start" value="home" className="py-4">
      <mdui-fab icon="add--outlined" name="add" slot="top" variant="primary"></mdui-fab>
      
      <mdui-navigation-rail-item icon="home--outlined" active-icon="home" value="home">Home</mdui-navigation-rail-item>
      <mdui-navigation-rail-item icon="notifications--outlined" active-icon="notifications--filled" value="notifications">Notifications</mdui-navigation-rail-item>
      <mdui-navigation-rail-item icon="bookmark_border" active-icon="bookmark--filled" value="saved">Saved</mdui-navigation-rail-item>
      <mdui-navigation-rail-item icon="folder--outlined" active-icon="folder" value="feeds">My Feeds</mdui-navigation-rail-item>
    </mdui-navigation-rail>
  );
};

export default dynamic(() => Promise.resolve(NavigationRail), { ssr: false });
