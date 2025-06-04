"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthCookie } from "./utils/auth";
import App from "./components/app";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    console.log("Home page: Component mounted");
    console.log("Home page: Checking authentication...");
    const authToken = getAuthCookie();
    console.log("Home page: Auth token:", authToken);

    if (!authToken) {
      console.log("Home page: No auth token, redirecting to signin");
      router.push("/signin");
    } else {
      console.log("Home page: Auth token found, showing news feed");
    }
  }, [router]);

  return <App />;
}
