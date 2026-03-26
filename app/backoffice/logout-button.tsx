"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/backoffice/logout", { method: "POST" });
    router.push("/backoffice/login");
    router.refresh();
  }

  return (
    <button className="button outline" type="button" onClick={handleLogout}>
      Sair
    </button>
  );
}
