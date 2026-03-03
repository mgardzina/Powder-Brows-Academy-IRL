"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Clock } from "lucide-react";

export default function SessionTimeout() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (
      status !== "authenticated" ||
      !session?.expires ||
      pathname === "/admin/login"
    ) {
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const expires = new Date(session.expires).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        clearInterval(intervalId);
        signOut({ callbackUrl: "/admin/login" });
        return;
      }

      // Format HH:MM:SS
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const formatted = `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;

      setTimeLeft(formatted);
      setIsCritical(diff < 5 * 60 * 1000); // Red color if less than 5 min
    }, 1000);

    return () => clearInterval(intervalId);
  }, [session, status, pathname]);

  if (status !== "authenticated" || pathname === "/admin/login" || !timeLeft) {
    return null;
  }

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] px-4 py-2 rounded-full shadow-lg border backdrop-blur-md flex items-center gap-2 font-mono text-sm transition-colors ${
        isCritical
          ? "bg-red-500/90 border-red-600 text-white animate-pulse"
          : "bg-white/80 border-[#d4cec4] text-[#4a4540]"
      }`}
      title="Czas do automatycznego wylogowania"
    >
      <Clock className="w-4 h-4" />
      <span>{timeLeft}</span>
    </div>
  );
}
