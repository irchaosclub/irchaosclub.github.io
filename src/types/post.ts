import { Post as ContentlayerPost } from "contentlayer/generated";

// Extended Post type with all optional fields from contentlayer config
export interface ExtendedPost extends ContentlayerPost {
  authors?: string[];
  tags?: string[];
  description?: string;
  readingTime?: number;
  external?: string;
  spotifyTrack?: string;
  corporate?: boolean;
}

// Type guard to check if a post is external
export function isExternalPost(
  post: ExtendedPost
): post is ExtendedPost & { external: string } {
  return Boolean(post.external);
}

// Helper to get post type
export function getPostType(post: ExtendedPost): "internal" | "external" {
  return post.external ? "external" : "internal";
}
