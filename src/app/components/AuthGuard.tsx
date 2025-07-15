import { useAuth } from "../contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_PATHS = ["/signin", "/signup"];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) {
        router.replace("/signin");
      }
      if (isAuthenticated && PUBLIC_PATHS.includes(pathname)) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, loading, pathname, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated && !PUBLIC_PATHS.includes(pathname)) return null;
  if (isAuthenticated && PUBLIC_PATHS.includes(pathname)) return null;

  return <>{children}</>;
}
