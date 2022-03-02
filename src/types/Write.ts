export type BriefTempSaveInfo = {
  id: string;
  created_at: string;
  title: string;
};

export type Category = {
  id: string;
  order: number;
  parent: string;
  private: boolean;
  name: string;
  urlSlug: string;
  active: boolean;
  temp?: boolean;
  edit?: boolean;
  hide?: boolean;
  edited?: boolean;
};
export type Categories = Category[];
export type SubmitBox = {
  open?: boolean;
  tags?: string[];
  categories?: Categories;
  additional?: boolean;
  url_slug?: string;
  is_private?: boolean;
  series?: {
    id?: string;
    name?: string;
  };
};
export type CategoryModal = {
  open: boolean;
  categories: Categories;
  ordered: boolean;
};

export type Meta = {
  code_theme?: string;
  short_description?: string;
};

export type PostData = {
  id?: string;
  title?: string;
  body?: string;
  thumbnail?: string;
  is_markdown?: boolean;
  is_temp?: boolean;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
  categories?: { id: string; name: string }[];
  url_slug?: string;
  meta?: Meta;
  is_private?: boolean;
  series?: {
    id?: string;
    name?: string;
  };
};

export type Upload = {
  mask: boolean;
  uploading: boolean;
  progress: number;
  uploadUrl: string;
  id: string;
  imagePath: string;
};

export type LayoutMode = 'editor' | 'both' | 'preview';

export type WriteExtra = {
  visible: boolean;
  layoutMode: LayoutMode;
};

export type SeriesItemData = {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  url_slug: string;
  created_at: string;
  updated_at: string;
  user: {
    username: string;
    thumbnail: string;
  };
};

export type SeriesModal = {
  visible: boolean;
  list: SeriesItemData[];
};

export type Write = {
  body?: string;
  title?: string;
  thumbnail?: string;
  // meta: Meta;
  submitBox?: SubmitBox;
  postData?: PostData;
  // categoryModal: CategoryModal;
  // upload: Upload;
  // insertText: string;
  // writeExtra: WriteExtra;
  // tempSaves: BriefTempSaveInfo[];
  // changed: boolean;
  // seriesModal: SeriesModal;
};
