import { ConvexError, v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

/**
 * 指定されたClerk IDに基づいてユーザーを取得します。
 * @param {Object} args - クエリの引数
 * @param {string} args.clerkId - ユーザーのClerk ID
 * @returns {Promise<Object>} - ユーザーオブジェクト
 * @throws {ConvexError} - ユーザーが見つからない場合
 */
export const getUserById = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    return user;
  },
});

/**
 * ポッドキャスト数に基づいてトップユーザーを取得します。
 * @returns {Promise<Array<Object>>} - トップユーザーのリスト
 */
export const getTopUserByPodcastCount = query({
  args: {},
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").collect();

    const userData = await Promise.all(
      user.map(async (u) => {
        const podcasts = await ctx.db
          .query("podcasts")
          .filter((q) => q.eq(q.field("authorId"), u.clerkId))
          .collect();

        const sortedPodcasts = podcasts.sort((a, b) => b.views - a.views);

        return {
          ...u,
          totalPodcasts: podcasts.length,
          podcast: sortedPodcasts.map((p) => ({
            podcastTitle: p.podcastTitle,
            pocastId: p._id,
          })),
        };
      })
    );

    return userData.sort((a, b) => b.totalPodcasts - a.totalPodcasts);
  },
});

/**
 * 新しいユーザーを作成します。
 * @param {Object} args - ミューテーションの引数
 * @param {string} args.clerkId - ユーザーのClerk ID
 * @param {string} args.email - ユーザーのメールアドレス
 * @param {string} args.name - ユーザーの名前
 * @param {string} args.imageUrl - ユーザーの画像URL
 */
export const createUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      imageUrl: args.imageUrl,
    });
  },
});

/**
 * 既存のユーザーを更新します。
 * @param {Object} args - ミューテーションの引数
 * @param {string} args.clerkId - ユーザーのClerk ID
 * @param {string} args.imageUrl - ユーザーの新しい画像URL
 * @param {string} args.email - ユーザーの新しいメールアドレス
 * @throws {ConvexError} - ユーザーが見つからない場合
 */
export const updateUser = internalMutation({
  args: {
    clerkId: v.string(),
    imageUrl: v.string(),
    email: v.string(),
  },
  async handler(ctx, args) {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(user._id, {
      imageUrl: args.imageUrl,
      email: args.email,
    });

    const podcast = await ctx.db
      .query("podcasts")
      .filter((q) => q.eq(q.field("authorId"), args.clerkId))
      .collect();

    await Promise.all(
      podcast.map(async (p) => {
        await ctx.db.patch(p._id, {
          authorImageUrl: args.imageUrl,
        });
      })
    );
  },
});

/**
 * ユーザーを削除します。
 * @param {Object} args - ミューテーションの引数
 * @param {string} args.clerkId - ユーザーのClerk ID
 * @throws {ConvexError} - ユーザーが見つからない場合
 */
export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), args.clerkId))
      .unique();

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.delete(user._id);
  },
});
