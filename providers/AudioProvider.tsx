"use client";

import { AudioContextType, AudioProps } from "@/types";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

/**
 * オーディオコンテキストの型定義
 * @type {AudioContextType}
 */
const AudioContext = createContext<AudioContextType | undefined>(undefined);

/**
 * オーディオプロバイダーコンポーネント
 * @param {React.ReactNode} children - 子コンポーネント
 * @returns {JSX.Element} - オーディオコンテキストを提供するコンポーネント
 */
const AudioProvider = ({ children }: { children: React.ReactNode }) => {
  /**
   * オーディオの状態を管理するステート
   * @type {AudioProps | undefined}
   */
  const [audio, setAudio] = useState<AudioProps | undefined>();
  /**
   * 現在のパスネームを取得する
   * @type {string | undefined}
   */
  const pathname = usePathname();

  /**
   * パスネームが `/create-podcast` の場合、オーディオの状態をリセットする
   * @param {undefined}
   * @returns {undefined}
   */
  useEffect(() => {
    if (pathname === "/create-podcast") {
      setAudio(undefined);
    }
  }, [pathname]);

  return (
    <AudioContext.Provider value={{ audio, setAudio }}>
      {children}
    </AudioContext.Provider>
  );
};

/**
 * オーディオコンテキストにアクセスするためのカスタムフック
 * @returns {AudioContextType} - オーディオコンテキスト
 */
export const useAudio = () => {
  /**
   * オーディオコンテキストを取得する
   * @type {AudioContextType | undefined}
   */
  const context = useContext(AudioContext);

  /**
   * オーディオコンテキストが存在しない場合、エラーをスローする
   * @throws {Error} - オーディオコンテキストが存在しない場合にスローされるエラー
   */
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }

  return context;
};

export default AudioProvider;
