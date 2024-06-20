import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * ポッドキャストを作成するミューテーション。
 *
 * @param audioStorageId - オーディオファイルのストレージID。
 * @param podcastTitle - ポッドキャストのタイトル。
 * @param podcastDescription - ポッドキャストの説明。
 * @param audioUrl - オーディオファイルのURL。
 * @param imageUrl - ポッドキャストの画像URL。
 * @param imageStorageId - 画像ファイルのストレージID。
 * @param voicePrompt - 音声プロンプト。
 * @param imagePrompt - 画像プロンプト。
 * @param voiceType - 音声の種類。
 * @param views - ポッドキャストの視聴回数。
 * @param audioDuration - オーディオの再生時間。
 * @returns 作成されたポッドキャストのドキュメントID。
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
    // 認証されたユーザーを取得します。
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("User not authenticated");
    }

    // ユーザーがデータベースに存在することを確認します。
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .collect();
    if (user.length === 0) {
      throw new ConvexError("User not found");
    }

    // ポッドキャストをデータベースに挿入します。
    return await ctx.db.insert("podcasts", {
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
 * ストレージIDからファイルのURLを取得するミューテーション。
 *
 * @param storageId - ファイルのストレージID。
 * @returns ファイルのURL。
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
 * 音声の種類でポッドキャストを取得するクエリ。
 *
 * @param podcastId - ポッドキャストID。
 * @returns 指定された音声の種類を持つポッドキャストの配列。
 */
export const getPodcastByVoiceType = query({
  args: {
    podcastId: v.id("podcasts"),
  },
  handler: async (ctx, args) => {
    const podcast = await ctx.db.get(args.podcastId);

    return await ctx.db
      .query("podcasts")
      .filter((q) =>
        q.and(
          q.eq(q.field("voiceType"), podcast?.voiceType),
          q.neq(q.field("_id"), args.podcastId)
        )
      )
      .collect();
  },
});

/**
 * すべてのポッドキャストを取得するクエリ。
 *
 * @returns すべてのポッドキャストの配列。
 */
export const getAllPodcasts = query({
  handler: async (ctx) => {
    return await ctx.db.query("podcasts").order("desc").collect();
  },
});

/**
 * IDでポッドキャストを取得するクエリ。
 *
 * @param podcastId - ポッドキャストID。
 * @returns 指定されたIDのポッドキャスト。
 */
export const getPodcastById = query({
  args: {
    podcastId: v.id("podcasts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.podcastId);
  },
});

/**
 * トレンドのポッドキャストを取得するクエリ。
 *
 * @returns トレンドのポッドキャストの配列。
 */
export const getTrendingPodcasts = query({
  handler: async (ctx) => {
    const podcast = await ctx.db.query("podcasts").collect();

    return podcast.sort((a, b) => b.views - a.views).slice(0, 8);
  },
});

/**
 * 作者IDでポッドキャストを取得するクエリ。
 *
 * @param authorId - 作者ID。
 * @returns 指定された作者のポッドキャストの配列と、総リスナー数。
 */
export const getPodcastByAuthorId = query({
  args: {
    authorId: v.string(),
  },
  handler: async (ctx, args) => {
    const podcasts = await ctx.db
      .query("podcasts")
      .filter((q) => q.eq(q.field("authorId"), args.authorId))
      .collect();

    const totalListeners = podcasts.reduce(
      (sum, podcast) => sum + podcast.views,
      0
    );

    return { podcasts, listeners: totalListeners };
  },
});

/**
 * 検索語でポッドキャストを検索するクエリ。
 *
 * @param search - 検索語。
 * @returns 検索結果のポッドキャストの配列。
 */
export const getPodcastBySearch = query({
  args: {
    search: v.string(),
  },
  handler: async (ctx, args) => {
    if (args.search === "") {
      return await ctx.db.query("podcasts").order("desc").collect();
    }

    // まず、作者名で検索します。
    const authorSearch = await ctx.db
      .query("podcasts")
      .withSearchIndex("search_author", (q) => q.search("author", args.search))
      .take(10);

    if (authorSearch.length > 0) {
      return authorSearch;
    }

    // 次に、ポッドキャストのタイトルで検索します。
    const titleSearch = await ctx.db
      .query("podcasts")
      .withSearchIndex("search_title", (q) =>
        q.search("podcastTitle", args.search)
      )
      .take(10);

    if (titleSearch.length > 0) {
      return titleSearch;
    }

    // 最後に、ポッドキャストの説明で検索します。
    return await ctx.db
      .query("podcasts")
      .withSearchIndex("search_body", (q) =>
        q.search("podcastDescription" || "podcastTitle", args.search)
      )
      .take(10);
  },
});

/**
 * ポッドキャストの視聴回数を更新するミューテーション。
 *
 * @param podcastId - ポッドキャストID。
 */
export const updatePodcastViews = mutation({
  args: {
    podcastId: v.id("podcasts"),
  },
  handler: async (ctx, args) => {
    const podcast = await ctx.db.get(args.podcastId);

    if (!podcast) {
      throw new ConvexError("Podcast not found");
    }

    return await ctx.db.patch(args.podcastId, {
      views: podcast.views + 1,
    });
  },
});

/**
 * ポッドキャストを削除するミューテーション。
 *
 * @param podcastId - ポッドキャストID。
 * @param imageStorageId - 画像ファイルのストレージID。
 * @param audioStorageId - オーディオファイルのストレージID。
 */
export const deletePodcast = mutation({
  args: {
    podcastId: v.id("podcasts"),
    imageStorageId: v.id("_storage"),
    audioStorageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const podcast = await ctx.db.get(args.podcastId);

    if (!podcast) {
      throw new ConvexError("Podcast not found");
    }

    await ctx.storage.delete(args.imageStorageId);
    await ctx.storage.delete(args.audioStorageId);
    return await ctx.db.delete(args.podcastId);
  },
});
