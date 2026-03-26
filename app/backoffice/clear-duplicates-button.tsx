"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ClearDuplicatesButtonProps = {
  disabled?: boolean;
};

export default function ClearDuplicatesButton({
  disabled = false
}: ClearDuplicatesButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDeleteAll() {
    if (loading || disabled) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/backoffice/searchs/duplicates", {
        method: "DELETE"
      });

      if (!response.ok) {
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      className="button admin-delete-button"
      type="button"
      onClick={handleDeleteAll}
      disabled={loading || disabled}
    >
      {loading ? "Removendo..." : "Remover todas as duplicidades"}
    </button>
  );
}
