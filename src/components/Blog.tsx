import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BlogList from "./BlogList";
import BlogPost from "./BlogPost";

const Blog = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [selectedPostSlug, setSelectedPostSlug] = useState<string | null>(null);

  // Sync URL params with local state
  useEffect(() => {
    setSelectedPostSlug(slug || null);
  }, [slug]);

  const handlePostSelect = (postSlug: string) => {
    navigate(`/blog/${postSlug}`);
  };

  const handleBackToList = () => {
    navigate("/blog");
  };

  if (selectedPostSlug) {
    return <BlogPost slug={selectedPostSlug} onBack={handleBackToList} />;
  }

  return <BlogList />;
};

export default Blog;
