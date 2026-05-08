export function supabaseImageUrl(
  path: string | null,
  width?: number,
  height?: number,
  quality?: number
): string {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return "";

  let url = `${supabaseUrl}/storage/v1/object/public/${path}`;

  const params = new URLSearchParams();
  if (width) params.set("w", width.toString());
  if (height) params.set("h", height.toString());
  if (quality) params.set("q", quality.toString());

  const queryString = params.toString();
  if (queryString) {
    url += `?${queryString}`;
  }

  return url;
}
