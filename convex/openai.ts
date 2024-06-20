/**
 * このファイルは、OpenAI APIを使用して音声生成とサムネイル生成を行うアクションを提供します。
 * 主な仕様:
 * - generateAudioAction: テキスト入力と音声タイプを受け取り、音声ファイルを生成します。
 * - generateThumbnailAction: プロンプトを受け取り、画像のサムネイルを生成します。
 * 制限事項:
 * - OpenAI APIキーが必要です。
 * - 生成される音声と画像の形式は固定です。
 */

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";
import { SpeechCreateParams } from "openai/resources/audio/speech.mjs";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * テキスト入力と音声タイプを受け取り、音声ファイルを生成するアクション。
 * @param input - 音声に変換するテキスト。
 * @param voice - 使用する音声タイプ。
 * @returns 生成された音声ファイルのバッファ。
 */
export const generateAudioAction = action({
  args: {
    input: v.string(),
    voice: v.string(),
  },
  handler: async (_, { input, voice }) => {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      input,
      voice: voice as SpeechCreateParams["voice"],
    });

    const buffer = await mp3.arrayBuffer();
    return buffer;
  },
});

/**
 * プロンプトを受け取り、画像のサムネイルを生成するアクション。
 * @param prompt - 画像生成のためのプロンプト。
 * @returns 生成された画像のバッファ。
 * @throws 画像が生成されなかった場合にエラーをスローします。
 */
export const generateThumbnailAction = action({
  args: {
    prompt: v.string(),
  },
  handler: async (_, { prompt }) => {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
    });

    const url = response.data[0].url;

    if (!url) {
      throw new Error("No image generated");
    }

    const imageResponse = await fetch(url);
    const buffer = await imageResponse.arrayBuffer();
    return buffer;
  },
});
