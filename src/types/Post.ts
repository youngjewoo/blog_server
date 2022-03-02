import { User, ProfileLinks } from './User';

export type Post = {
  id: string;
  title: string;
  body: string;
  thumbnail: string;
  is_markdown: boolean;
  is_temp: boolean;
  user: any;
  url_slug: string;
  likes: number;
  meta: any;
  views: number;
  is_private: boolean;
  released_at: string;
  created_at: string;
  updated_at: string;
  short_description: string;
  comments: Comment[];
  tags: string[];
  comments_count: number;
};

export interface Comment {
  id: string;
  user: {
    id: string;
    username: string;
    profile: {
      id: string;
      thumbnail: string | null;
    };
  } | null;
  text: string | null;
  replies_count: number;
  replies?: Comment[];
  created_at: string;
  deleted: boolean;
  level: number;
}

// Post Type for PostList
export type PartialPost = {
  id: string;
  title: string;
  short_description: string;
  thumbnail: string;
  user: User;
  url_slug: string;
  is_private: boolean;
  released_at: string;
  updated_at: string;
  tags: string[];
  comments_count: number;
  likes: number;
};

// Generated by https://quicktype.io
export type SeriesPost = {
  id: string;
  post: {
    id: string;
    title: string;
    url_slug: string;
    user: {
      id: string;
      username: string;
    };
  };
};

export interface LinkedPosts {
  previous: LinkedPost | null;
  next: LinkedPost | null;
}

export interface LinkedPost {
  id: string;
  title: string;
  url_slug: string;
  user: {
    id: string;
    username: string;
  };
}

export interface SinglePost {
  [key: string]: any; // index signature
  id: string;
  title: string;
  released_at: string;
  updated_at: string;
  tags: string[];
  body: string;
  short_description: string;
  is_markdown: boolean;
  is_private: boolean;
  temp_post_id: string;
  thumbnail: string | null;
  url_slug: string;
  user: {
    id: string;
    username: string;
    profile: {
      id: string;
      display_name: string;
      thumbnail: string;
      short_bio: string;
      profile_links: ProfileLinks;
    };
    velog_config: {
      title: string;
    };
  };
  comments: Comment[];
  comments_count: number;
  series: {
    id: string;
    name: string;
    url_slug: string;
    series_posts: SeriesPost[];
  } | null;
  liked: boolean;
  likes: number;
  linked_posts: LinkedPosts;
}

export interface CommentWithReplies {
  id: string;
  replies: Comment[];
}

export interface Stats {
  total: number;
  count_by_day: {
    count: number;
    day: string;
  }[];
}