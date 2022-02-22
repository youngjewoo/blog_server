import { UserProfile } from './User';

export type Series = {
  id: string;
  url_slug: string;
  name: string;
  created_at: string;
};

export interface SeriesDetail {
  id: string;
  name: string;
  user: {
    id: string;
    username: string;
    profile: UserProfile;
  };
  series_posts: SeriesPostPreview[];
}

export interface SeriesPostPreview {
  id: string;
  post: {
    id: string;
    title: string;
    thumbnail: string;
    short_description: string;
    url_slug: string;
    released_at: string;
  };
}
