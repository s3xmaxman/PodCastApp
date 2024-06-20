import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * ポッドキャストのURLを取得するミューテーション
 * @param storageId ストレージID
 * @returns ポッドキャストのURL
 */
export const getUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

/**
 * ポッドキャストを作成するミューテーション
 * @param audioStorageId オーディオストレージID
 * @param podcastTitle ポッドキャストタイトル
 * @param podcastDescription ポッドキャストの説明
 * @param audioUrl オーディオURL
 * @param imageUrl イメージURL
 * @param imageStorageId イメージストレージID
 * @param voicePrompt 音声プロンプト
 * @param imagePrompt イメージプロンプト
 * @param voiceType 音声タイプ
 * @param views ビュー数
 * @param audioDuration オーディオの長さ
 * @returns 作成されたポッドキャストのID
 */
export const createPodcast = mutation({
  args: {
    audioStorageId: v.id("_storage"),
    podcastTitle: v.string(),
    podcastDescription: v.string(),
    audioUrl: v.string(),
    imageUrl: v.string(),
    imageStorageId: v.id("_storage"),
    voicePrompt: v.string(),
    imagePrompt: v.string(),
    voiceType: v.string(),
    views: v.number(),
    audioDuration: v.number(),
  },
  handler: async (ctx, args) => {
    // 認証済みユーザーの取得
    const identity = await ctx.auth.getUserIdentity();

    // 認証されていない場合はエラーをスロー
    if (!identity) {
      throw new ConvexError("User not authenticated");
    }

    // ユーザーの取得
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .collect();

    // ユーザーが見つからない場合はエラーをスロー
    if (user.length === 0) {
      throw new ConvexError("User not found");
    }

    // ポッドキャストの作成
    await ctx.db.insert("podcasts", {
      audioStorageId: args.audioStorageId,
      user: user[0]._id,
      podcastTitle: args.podcastTitle,
      podcastDescription: args.podcastDescription,
      audioUrl: args.audioUrl,
      imageUrl: args.imageUrl,
      imageStorageId: args.imageStorageId,
      author: user[0].name,
      authorId: user[0].clerkId,
      voicePrompt: args.voicePrompt,
      imagePrompt: args.imagePrompt,
      voiceType: args.voiceType,
      views: args.views,
      authorImageUrl: user[0].imageUrl,
      audioDuration: args.audioDuration,
    });
  },
});

/**
 * トレンドのポッドキャストを取得するクエリ
 * @returns トレンドのポッドキャストのリスト
 */
export const getTrendingPodcasts = query({
  handler: async (ctx) => {
    const podcasts = await ctx.db.query("podcasts").collect();
    return podcasts;
  },
});
