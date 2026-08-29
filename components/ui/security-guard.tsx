"use client";

import { useEffect } from "react";

export default function SecurityGuard() {
  useEffect(() => {
    // 1. Chặn click chuột phải (Context Menu)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Chặn Copy / Cut
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    // 2. Chặn các phím bộ công cụ Developer Tools
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chặn F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Chặn Ctrl+Shift+I / Cmd+Option+I (DevTools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "i" || e.keyCode === 73)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Chặn Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "J" || e.key === "j" || e.keyCode === 74)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Chặn Ctrl+Shift+C / Cmd+Option+C (Element Inspector)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "C" || e.key === "c" || e.keyCode === 67)) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Chặn Ctrl+U / Cmd+U (View Source Code)
      if ((e.ctrlKey || e.metaKey) && (e.key === "U" || e.key === "u" || e.keyCode === 85)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 3. Chặn thao tác Drag & Drop mọi thứ
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // 4. In cảnh báo Console để răn đe
    const runConsoleWarning = () => {
      console.clear();
      console.log(
        "%cDừng lại!",
        "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;"
      );
      console.log(
        "%cĐây là tính năng dành cho nhà phát triển. Nếu ai đó bảo bạn sao chép đoạn mã vào đây để 'bật một tính năng' hoặc 'hack' truy cập, thì đó RẤT CÓ THỂ LÀ LỪA ĐẢO và sẽ khiến bạn bị mất tài khoản hoặc lộ thông tin.",
        "font-size: 16px;"
      );
    };

    runConsoleWarning();

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("cut", handleCopy);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("cut", handleCopy);
    };
  }, []);

  return null;
}
