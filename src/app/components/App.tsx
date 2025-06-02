'use client';

import React from 'react';
import 'mdui';
import '../globals.css';
import '../styles/homePanel.css';

export default function App() {
  return (
    <div className="home-panel flex m-0 p-0 justify-center items-center h-full bg-white">
      <mdui-button variant="filled" name="button" type="button">Button</mdui-button>
    </div>
  );
} 