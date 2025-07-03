"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import App from "./components/app";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    console.log("Home page: Component mounted");
    console.log("Home page: Checking authentication...");
    console.log("Home page: Auth loading:", loading);
    console.log("Home page: Is authenticated:", isAuthenticated);

    if (!loading && !isAuthenticated) {
      console.log("Home page: Not authenticated, redirecting to signin");
      router.push("/signin");
    } else if (!loading && isAuthenticated) {
      console.log("Home page: Authenticated, showing news feed");
    }
  }, [router, isAuthenticated, loading]);

  // Show loading only if we're not authenticated yet
  if (loading && !isAuthenticated) {
    return <div>Loading...</div>;
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <App />;
}
