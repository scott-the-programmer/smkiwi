import { useNavigate } from "react-router-dom";
import { useBlogPosts, usePrefetchBlogPost } from "../hooks/useBlog";
import { Rss } from "lucide-react";
import PlantPot from "./PlantPot";

const BlogList = () => {
  const navigate = useNavigate();
  const prefetchBlogPost = usePrefetchBlogPost();
  const {
    data: posts = [],
    isLoading: loading,
    error,
    refetch,
  } = useBlogPosts();

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

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-xl text-gray-600">
              Thoughts, insights, and updates from my journey
            </h1>

            <a
              href="https://blog-api.murray.kiwi/rss"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              title="Subscribe to RSS feed"
            >
              <Rss className="w-4 h-4" />
              RSS
            </a>
          </div>
          <h2 className="text-xs text-gray-600">
            * Obligatory disclaimer of these thoughts being my own yada yada
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading posts...</p>
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
                Error Loading Posts
              </h3>
              <p className="text-red-700">
                {error?.message || "Failed to load posts"}
              </p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-blue-800 mb-2">
                No Posts Yet
              </h3>
              <p className="text-blue-700">Check back soon for new content!</p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            {posts.map((post, index) => (
              <>
                <article
                  key={post.slug || index}
                  className="bg-post rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                  onClick={() => post.slug && navigate(`/blog/${post.slug}`)}
                  onMouseEnter={() => post.slug && prefetchBlogPost(post.slug)}
                >
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                          {post.title || "Untitled Post"}
                        </h2>

                        {post.excerpt && (
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 sm:min-w-0 sm:flex-shrink-0">
                        <time
                          dateTime={post.publishDate}
                          className="text-sm text-gray-500"
                        >
                          {formatDate(post.publishDate)}
                        </time>

                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 sm:justify-end">
                            {post.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{post.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Read more
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </article>
                <div className="stem w-1 h-4 bg-gray-600 my-2 mx-auto opacity-60"></div>
              </>
            ))}
          </div>
        )}
      </div>
      <PlantPot />
    </div>
  );
};

export default BlogList;
