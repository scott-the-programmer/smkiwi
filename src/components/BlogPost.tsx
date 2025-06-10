import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBlogPost } from "../hooks/useBlog";
import type { ModelsBlogPost } from "../lib/blog-api-client/src";
import Markdown from "react-markdown";

interface BlogPostProps {
  slug: string;
  onBack: () => void;
}

const BlogPost: React.FC<BlogPostProps> = ({ slug, onBack }) => {
  const navigate = useNavigate();
  const { data: post, isLoading: loading, error, refetch } = useBlogPost(slug);

  // Update document title when post loads
  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} | Blog`;
    }
    return () => {
      document.title = "Scott Murray"; // Reset to default
    };
  }, [post?.title]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  console.log(post);

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate("/blog")}
          className="mb-6 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md"
        >
          ← Back to Blogs
        </button>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading post...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Error Loading Post
              </h3>
              <p className="text-red-700">
                {error?.message || "Failed to load post"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : post ? (
          <article className="bg-secondary rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {post.title}
              </h1>

              <div className="flex items-center text-sm text-gray-500 mb-6">
                <time dateTime={post.publishDate}>
                  {formatDate(post.publishDate)}
                </time>
                {post.tags && post.tags.length > 0 && (
                  <>
                    <span className="mx-2">•</span>
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {post.excerpt && (
                <p className="text-lg text-gray-600 mb-6 italic border-l-4 border-blue-200 pl-4">
                  {post.excerpt}
                </p>
              )}

              <div className="prose prose-li:text-base prose-p:text-base prose-lg max-w-none prose-headings:text-lg prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
                {post.content ? (
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {post.content}
                  </Markdown>
                ) : (
                  <p className="text-gray-600">No content available.</p>
                )}
              </div>
            </div>
          </article>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Post not found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPost;
