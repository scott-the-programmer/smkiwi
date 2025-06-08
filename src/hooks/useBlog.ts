import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PostsApi } from "../lib/blog-api-client/src";
import type { ModelsBlogPostMeta, ModelsBlogPost } from "../lib/blog-api-client/src";

const postsApi = new PostsApi();

// Hook for fetching all blog posts
export const useBlogPosts = () => {
    return useQuery({
        queryKey: ["blogPosts"],
        queryFn: async () => {
            const response = await postsApi.postsGet();
            return response.posts || [];
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
};

// Hook for fetching a single blog post
export const useBlogPost = (slug: string) => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ["blogPost", slug],
        queryFn: async () => {
            return await postsApi.postsSlugGet({ slug });
        },
        enabled: !!slug, // Only run if slug is provided
        staleTime: 10 * 60 * 1000, // 10 minutes for individual posts
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Try to get initial data from the posts list cache
        initialData: () => {
            const posts = queryClient.getQueryData<ModelsBlogPostMeta[]>(["blogPosts"]);
            const postMeta = posts?.find(p => p.slug === slug);
            if (postMeta) {
                // Return a partial post object with metadata
                return {
                    ...postMeta,
                    content: undefined, // Will be fetched
                } as ModelsBlogPost;
            }
            return undefined;
        },
        initialDataUpdatedAt: () => queryClient.getQueryState(["blogPosts"])?.dataUpdatedAt,
    });
};

// Utility hook for prefetching a blog post (useful for hover/focus events)
export const usePrefetchBlogPost = () => {
    const queryClient = useQueryClient();

    return (slug: string) => {
        queryClient.prefetchQuery({
            queryKey: ["blogPost", slug],
            queryFn: async () => {
                return await postsApi.postsSlugGet({ slug });
            },
            staleTime: 10 * 60 * 1000,
        });
    };
};
