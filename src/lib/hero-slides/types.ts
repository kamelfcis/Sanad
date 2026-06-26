export interface HeroSlide {
  id: string;
  image_url: string;
  title_ar: string;
  subtitle_ar: string;
  icon_key: string | null;
  service_category_slug: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface HeroSlideDisplay {
  id: string;
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  iconKey: string | null;
  rotate: number;
}
