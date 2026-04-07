import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseStorageEnv, hasSupabaseStorageEnv } from "@/lib/supabase/env";
import { rateLimitProfiles } from "@/lib/utils/rate-limit";
import { enforceRateLimit, getRateLimitKey, getUserRateLimitKey } from "@/lib/utils/rate-limit-middleware";
import {
  buildListingImageStoragePath,
  validateListingImageFile,
} from "@/services/listings/listing-images";

function userOwnsStoragePath(userId: string, storagePath: string) {
  return storagePath.startsWith(`listings/${userId}/`);
}

export async function POST(request: Request) {
  const ipRateLimit = enforceRateLimit(
    getRateLimitKey(request, "api:images:upload"),
    rateLimitProfiles.general,
  );

  if (ipRateLimit) {
    return ipRateLimit.response;
  }

  if (!hasSupabaseStorageEnv()) {
    return NextResponse.json(
      {
        message:
          "Supabase Storage ortam degiskenleri eksik. Yukleme icin .env.local dosyasini tamamlamalisin.",
      },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { message: "Oturum dogrulanamadi. Lutfen tekrar giris yap." },
      { status: 401 },
    );
  }

  const userRateLimit = enforceRateLimit(
    getUserRateLimitKey(user.id, "images:upload"),
    rateLimitProfiles.imageUpload,
  );

  if (userRateLimit) {
    return userRateLimit.response;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { message: "Yuklenecek fotograf bulunamadi." },
      { status: 400 },
    );
  }

  const validationError = validateListingImageFile(file);

  if (validationError) {
    return NextResponse.json({ message: validationError }, { status: 400 });
  }

  const { listingsBucket } = getSupabaseStorageEnv();
  const adminClient = createSupabaseAdminClient();
  const storagePath = buildListingImageStoragePath(user.id, file.name);
  const uploadResult = await adminClient.storage.from(listingsBucket).upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (uploadResult.error) {
    return NextResponse.json(
      { message: "Fotograf yuklenemedi. Lutfen tekrar dene." },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = adminClient.storage.from(listingsBucket).getPublicUrl(storagePath);

  return NextResponse.json({
    image: {
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      storagePath,
      url: publicUrl,
    },
    message: "Fotograf yuklendi.",
  });
}

export async function DELETE(request: Request) {
  if (!hasSupabaseStorageEnv()) {
    return NextResponse.json(
      {
        message:
          "Supabase Storage ortam degiskenleri eksik. Fotograf silmek icin .env.local dosyasini tamamlamalisin.",
      },
      { status: 503 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { message: "Oturum dogrulanamadi. Lutfen tekrar giris yap." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Silme istegi okunamadi." }, { status: 400 });
  }

  const storagePath =
    typeof body === "object" && body !== null && "storagePath" in body
      ? String(body.storagePath ?? "")
      : "";

  if (!storagePath || !userOwnsStoragePath(user.id, storagePath)) {
    return NextResponse.json(
      { message: "Fotograf yolu gecersiz." },
      { status: 400 },
    );
  }

  const { listingsBucket } = getSupabaseStorageEnv();
  const adminClient = createSupabaseAdminClient();
  const removeResult = await adminClient.storage.from(listingsBucket).remove([storagePath]);

  if (removeResult.error) {
    return NextResponse.json(
      { message: "Fotograf silinemedi. Lutfen tekrar dene." },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Fotograf kaldirildi." });
}
