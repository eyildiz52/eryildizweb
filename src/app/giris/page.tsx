import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth-panel";

export const metadata: Metadata = {
  title: "Giris | ER YILDIZ YAZILIM",
};

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12 md:px-10">
      <AuthPanel />
    </main>
  );
}
