declare module "react-scroll-to-bottom" {
  import * as React from "react";

  export interface ScrollToBottomProps {
    className?: string;
    children?: React.ReactNode;
    debug?: boolean;
    initialScrollBehavior?: "auto" | "smooth";
    mode?: "bottom" | "top" | "auto";
    followButtonClassName?: string;
    scrollViewClassName?: string;
  }

  const ScrollToBottom: React.FC<ScrollToBottomProps>;
  export default ScrollToBottom;
}


