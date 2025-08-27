"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./contexts/AuthContext";
import App from "./components/app";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/signin");
    }
  }, [router, isAuthenticated, loading]);

  if (loading && !isAuthenticated) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <App />;
}
