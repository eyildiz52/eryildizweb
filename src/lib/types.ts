export type PackageType = "demo" | "paid";

export type SoftwarePackage = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  long_description: string | null;
  package_type: PackageType;
  price: number;
  currency: string;
  storage_bucket: string;
  storage_path: string;
  demo_url: string | null;
  thumbnail_url: string | null;
  is_active: boolean;
};

export type PlatformVideo = {
  id: string;
  title: string;
  summary: string;
  video_url: string;
  cover_url: string | null;
  is_published: boolean;
};

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
};
