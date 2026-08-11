"use client";

import { useState, useEffect } from "react";

export function useAppTitle() {
  const [title, setTitle] = useState("Capsulex Auth Admin");

  useEffect(() => {
    // Initial load
    const storedTitle = localStorage.getItem("app_title");
    if (storedTitle) {
      setTitle(storedTitle);
      document.title = storedTitle;
    }

    // Listener for cross-component sync
    const handleTitleChange = (e: CustomEvent) => {
      setTitle(e.detail);
      document.title = e.detail;
    };

    window.addEventListener("app-title-change", handleTitleChange as EventListener);
    return () => window.removeEventListener("app-title-change", handleTitleChange as EventListener);
  }, []);

  const updateTitle = (newTitle: string) => {
    localStorage.setItem("app_title", newTitle);
    window.dispatchEvent(new CustomEvent("app-title-change", { detail: newTitle }));
  };

  return { title, updateTitle };
}
