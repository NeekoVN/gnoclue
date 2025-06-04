"use client";

import React from "react";
import dynamic from "next/dynamic";

const Post: React.FC = () => {
  return <div>Post</div>;
};

export default dynamic(() => Promise.resolve(Post), { ssr: false });
