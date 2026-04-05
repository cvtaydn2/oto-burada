import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import {
  addDatabaseFavorite,
  getDatabaseFavoriteIds,
  removeDatabaseFavorite,
} from "@/services/favorites/favorite-records";
import { getAllKnownListings } from "@/services/listings/marketplace-listings";
import { ensureProfileRecord } from "@/services/profile/profile-records";

function getListingIdFromBody(body: unknown) {
  if (typeof body !== "object" || body === null || !("listingId" in body)) {
    return "";
  }

  return String(body.listingId ?? "");
}

async function getAuthenticatedUser() {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ favoriteIds: [] });
  }

  await ensureProfileRecord(user);
  const favoriteIds = (await getDatabaseFavoriteIds(user.id)) ?? [];

  return NextResponse.json({ favoriteIds });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ message: "Favori eklemek icin giris yapmalisin." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Favori istegi okunamadi." }, { status: 400 });
  }

  const listingId = getListingIdFromBody(body);

  if (!listingId) {
    return NextResponse.json({ message: "Gecerli bir ilan secmelisin." }, { status: 400 });
  }

  const listingExists = (await getAllKnownListings()).some((listing) => listing.id === listingId);

  if (!listingExists) {
    return NextResponse.json({ message: "Favoriye eklenecek ilan bulunamadi." }, { status: 404 });
  }

  await ensureProfileRecord(user);
  const favoriteIds = await addDatabaseFavorite(user.id, listingId);

  if (!favoriteIds) {
    return NextResponse.json({ message: "Favori eklenemedi." }, { status: 500 });
  }

  return NextResponse.json({ favoriteIds, message: "Ilan favorilere eklendi." });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ message: "Favori guncellemek icin giris yapmalisin." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Favori istegi okunamadi." }, { status: 400 });
  }

  const listingId = getListingIdFromBody(body);

  if (!listingId) {
    return NextResponse.json({ message: "Gecerli bir ilan secmelisin." }, { status: 400 });
  }

  await ensureProfileRecord(user);
  const favoriteIds = await removeDatabaseFavorite(user.id, listingId);

  if (!favoriteIds) {
    return NextResponse.json({ message: "Favori kaldirilamadi." }, { status: 500 });
  }

  return NextResponse.json({ favoriteIds, message: "Ilan favorilerden kaldirildi." });
}
