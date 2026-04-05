import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const demoPassword = process.env.SUPABASE_DEMO_USER_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

if (!demoPassword) {
  console.error("SUPABASE_DEMO_USER_PASSWORD is required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const demoUsers = [
  {
    avatarUrl: null,
    city: "Istanbul",
    email: "admin@otoburada.demo",
    fullName: "Mert Aydin",
    phone: "+905321112233",
    role: "admin",
  },
  {
    avatarUrl: null,
    city: "Istanbul",
    email: "emre@otoburada.demo",
    fullName: "Emre Yilmaz",
    phone: "+905321234567",
    role: "user",
  },
  {
    avatarUrl: null,
    city: "Ankara",
    email: "ayse@otoburada.demo",
    fullName: "Ayse Demir",
    phone: "+905339876543",
    role: "user",
  },
  {
    avatarUrl: null,
    city: "Izmir",
    email: "burak@otoburada.demo",
    fullName: "Burak Kaya",
    phone: "+905359998877",
    role: "user",
  },
];

const demoListings = [
  {
    brand: "Volkswagen",
    city: "Istanbul",
    createdAt: "2026-04-04T09:30:00Z",
    description:
      "Family-owned Golf with regular maintenance history, clean interior, and ready-to-drive condition.",
    district: "Kadikoy",
    featured: true,
    fuelType: "dizel",
    id: "2f240bf5-7e85-4dd7-9df6-2b8bbf3d6dc1",
    mileage: 118000,
    model: "Golf",
    price: 875000,
    publishedAt: "2026-04-04T09:30:00Z",
    sellerEmail: "emre@otoburada.demo",
    slug: "2018-volkswagen-golf-1-6-tdi-comfortline",
    status: "approved",
    title: "2018 Volkswagen Golf 1.6 TDI Comfortline",
    transmission: "manuel",
    updatedAt: "2026-04-05T08:45:00Z",
    whatsappPhone: "+905321234567",
    year: 2018,
  },
  {
    brand: "Renault",
    city: "Ankara",
    createdAt: "2026-04-03T13:10:00Z",
    description:
      "Low-mileage Clio with efficient petrol engine, clean history, and easy city-driving manners.",
    district: "Cankaya",
    featured: true,
    fuelType: "benzin",
    id: "ff43d0df-4f47-4338-b2e9-7f9cb944d80d",
    mileage: 64000,
    model: "Clio",
    price: 825000,
    publishedAt: "2026-04-03T13:10:00Z",
    sellerEmail: "ayse@otoburada.demo",
    slug: "2020-renault-clio-1-0-tce-touch",
    status: "approved",
    title: "2020 Renault Clio 1.0 TCe Touch",
    transmission: "manuel",
    updatedAt: "2026-04-05T08:10:00Z",
    whatsappPhone: "+905339876543",
    year: 2020,
  },
  {
    brand: "BMW",
    city: "Izmir",
    createdAt: "2026-03-31T11:00:00Z",
    description:
      "Well-kept 320i with automatic transmission, strong driving feel, and recent maintenance records.",
    district: "Bornova",
    featured: true,
    fuelType: "benzin",
    id: "8e85f7fc-bbff-4058-8ae1-a95357c67bd4",
    mileage: 132000,
    model: "320i",
    price: 1495000,
    publishedAt: "2026-03-31T11:00:00Z",
    sellerEmail: "burak@otoburada.demo",
    slug: "2016-bmw-320i-ed-luxury-line",
    status: "approved",
    title: "2016 BMW 320i ED Luxury Line",
    transmission: "otomatik",
    updatedAt: "2026-04-05T06:00:00Z",
    whatsappPhone: "+905359998877",
    year: 2016,
  },
];

const demoListingImages = [
  {
    id: "bc4eb856-e42f-4fd1-976c-bc4032b9e6e2",
    isCover: true,
    listingId: "2f240bf5-7e85-4dd7-9df6-2b8bbf3d6dc1",
    publicUrl:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 0,
    storagePath: "seed/listings/2018-volkswagen-golf-1-6-tdi-comfortline-1.jpg",
  },
  {
    id: "676bcfac-8515-44ea-bcec-ae4806d6fc27",
    isCover: false,
    listingId: "2f240bf5-7e85-4dd7-9df6-2b8bbf3d6dc1",
    publicUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 1,
    storagePath: "seed/listings/2018-volkswagen-golf-1-6-tdi-comfortline-2.jpg",
  },
  {
    id: "ee8c3515-7cf3-44b5-b203-9dd287ad66ba",
    isCover: false,
    listingId: "2f240bf5-7e85-4dd7-9df6-2b8bbf3d6dc1",
    publicUrl:
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 2,
    storagePath: "seed/listings/2018-volkswagen-golf-1-6-tdi-comfortline-3.jpg",
  },
  {
    id: "96380d52-ff7a-438a-8bbd-4bfa62259954",
    isCover: true,
    listingId: "ff43d0df-4f47-4338-b2e9-7f9cb944d80d",
    publicUrl:
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 0,
    storagePath: "seed/listings/2020-renault-clio-1-0-tce-touch-1.jpg",
  },
  {
    id: "a0fc765d-a5d0-4ca1-bd21-ad4f213843b7",
    isCover: false,
    listingId: "ff43d0df-4f47-4338-b2e9-7f9cb944d80d",
    publicUrl:
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 1,
    storagePath: "seed/listings/2020-renault-clio-1-0-tce-touch-2.jpg",
  },
  {
    id: "19015fb3-e0a2-42f0-b188-3d8d7c442897",
    isCover: false,
    listingId: "ff43d0df-4f47-4338-b2e9-7f9cb944d80d",
    publicUrl:
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 2,
    storagePath: "seed/listings/2020-renault-clio-1-0-tce-touch-3.jpg",
  },
  {
    id: "9c754301-9500-487c-bd18-932f75d7eb9b",
    isCover: true,
    listingId: "8e85f7fc-bbff-4058-8ae1-a95357c67bd4",
    publicUrl:
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 0,
    storagePath: "seed/listings/2016-bmw-320i-ed-luxury-line-1.jpg",
  },
  {
    id: "d338af17-d6ec-4861-a124-bf4a990df84b",
    isCover: false,
    listingId: "8e85f7fc-bbff-4058-8ae1-a95357c67bd4",
    publicUrl:
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 1,
    storagePath: "seed/listings/2016-bmw-320i-ed-luxury-line-2.jpg",
  },
  {
    id: "422657cf-1f0d-43fc-9c8e-d1fe4b0d407d",
    isCover: false,
    listingId: "8e85f7fc-bbff-4058-8ae1-a95357c67bd4",
    publicUrl:
      "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 2,
    storagePath: "seed/listings/2016-bmw-320i-ed-luxury-line-3.jpg",
  },
];

const demoFavorites = [
  {
    created_at: "2026-04-05T10:00:00Z",
    listing_id: "2f240bf5-7e85-4dd7-9df6-2b8bbf3d6dc1",
    user_email: "ayse@otoburada.demo",
  },
];

const demoReports = [
  {
    created_at: "2026-04-05T11:00:00Z",
    description: "Listing needs another moderation pass for ownership proof.",
    id: "cf59d9b8-d6fd-493d-830d-a25d66bc1553",
    listing_id: "8e85f7fc-bbff-4058-8ae1-a95357c67bd4",
    reason: "wrong_info",
    reporter_email: "emre@otoburada.demo",
    status: "open",
    updated_at: "2026-04-05T11:00:00Z",
  },
];

const demoAdminActions = [
  {
    action: "review",
    admin_email: "admin@otoburada.demo",
    created_at: "2026-04-05T11:10:00Z",
    id: "7916d3fb-41f7-47cc-b8f9-eb26b9f12027",
    note: "Seeded moderation event for demo purposes.",
    target_id: "cf59d9b8-d6fd-493d-830d-a25d66bc1553",
    target_type: "report",
  },
];

async function listAllUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const batch = data?.users ?? [];
    users.push(...batch);

    if (batch.length < 200) {
      return users;
    }

    page += 1;
  }
}

async function ensureUsers() {
  const existingUsers = new Map(
    (await listAllUsers())
      .filter((user) => typeof user.email === "string")
      .map((user) => [user.email, user]),
  );

  const ensuredUsers = new Map();

  for (const entry of demoUsers) {
    let user = existingUsers.get(entry.email);

    if (!user) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: entry.email,
        email_confirm: true,
        password: demoPassword,
        user_metadata: {
          full_name: entry.fullName,
          role: entry.role,
        },
      });

      if (error || !data.user) {
        throw error ?? new Error(`Could not create auth user for ${entry.email}`);
      }

      user = data.user;
      console.log(`Created auth user ${entry.email}`);
    } else {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true,
        password: demoPassword,
        user_metadata: {
          full_name: entry.fullName,
          role: entry.role,
        },
      });

      if (error) {
        throw error;
      }

      console.log(`Updated auth user ${entry.email}`);
    }

    ensuredUsers.set(entry.email, user);
  }

  return ensuredUsers;
}

async function upsertProfiles(usersByEmail) {
  const rows = demoUsers.map((entry) => {
    const user = usersByEmail.get(entry.email);

    if (!user) {
      throw new Error(`Missing user for ${entry.email}`);
    }

    return {
      avatar_url: entry.avatarUrl,
      city: entry.city,
      full_name: entry.fullName,
      id: user.id,
      phone: entry.phone,
      role: entry.role,
    };
  });

  const { error } = await supabase.from("profiles").upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

async function upsertListings(usersByEmail) {
  const rows = demoListings.map((entry) => {
    const seller = usersByEmail.get(entry.sellerEmail);

    if (!seller) {
      throw new Error(`Missing seller for ${entry.sellerEmail}`);
    }

    return {
      brand: entry.brand,
      city: entry.city,
      created_at: entry.createdAt,
      description: entry.description,
      district: entry.district,
      featured: entry.featured,
      fuel_type: entry.fuelType,
      id: entry.id,
      mileage: entry.mileage,
      model: entry.model,
      price: entry.price,
      published_at: entry.publishedAt,
      seller_id: seller.id,
      slug: entry.slug,
      status: entry.status,
      title: entry.title,
      transmission: entry.transmission,
      updated_at: entry.updatedAt,
      whatsapp_phone: entry.whatsappPhone,
      year: entry.year,
    };
  });

  const { error } = await supabase.from("listings").upsert(rows, {
    onConflict: "slug",
  });

  if (error) {
    throw error;
  }
}

async function upsertListingImages() {
  const rows = demoListingImages.map((entry) => ({
    id: entry.id,
    is_cover: entry.isCover,
    listing_id: entry.listingId,
    public_url: entry.publicUrl,
    sort_order: entry.sortOrder,
    storage_path: entry.storagePath,
  }));

  const { error } = await supabase.from("listing_images").upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

async function upsertFavorites(usersByEmail) {
  const rows = demoFavorites.map((entry) => {
    const user = usersByEmail.get(entry.user_email);

    if (!user) {
      throw new Error(`Missing favorite user for ${entry.user_email}`);
    }

    return {
      created_at: entry.created_at,
      listing_id: entry.listing_id,
      user_id: user.id,
    };
  });

  const { error } = await supabase.from("favorites").upsert(rows, {
    onConflict: "user_id,listing_id",
  });

  if (error) {
    throw error;
  }
}

async function upsertReports(usersByEmail) {
  const rows = demoReports.map((entry) => {
    const reporter = usersByEmail.get(entry.reporter_email);

    if (!reporter) {
      throw new Error(`Missing report user for ${entry.reporter_email}`);
    }

    return {
      created_at: entry.created_at,
      description: entry.description,
      id: entry.id,
      listing_id: entry.listing_id,
      reason: entry.reason,
      reporter_id: reporter.id,
      status: entry.status,
      updated_at: entry.updated_at,
    };
  });

  const { error } = await supabase.from("reports").upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

async function upsertAdminActions(usersByEmail) {
  const rows = demoAdminActions.map((entry) => {
    const admin = usersByEmail.get(entry.admin_email);

    if (!admin) {
      throw new Error(`Missing admin user for ${entry.admin_email}`);
    }

    return {
      action: entry.action,
      admin_user_id: admin.id,
      created_at: entry.created_at,
      id: entry.id,
      note: entry.note,
      target_id: entry.target_id,
      target_type: entry.target_type,
    };
  });

  const { error } = await supabase.from("admin_actions").upsert(rows, {
    onConflict: "id",
  });

  if (error) {
    throw error;
  }
}

async function main() {
  console.log("Seeding Supabase demo data...");

  const usersByEmail = await ensureUsers();

  await upsertProfiles(usersByEmail);
  await upsertListings(usersByEmail);
  await upsertListingImages();
  await upsertFavorites(usersByEmail);
  await upsertReports(usersByEmail);
  await upsertAdminActions(usersByEmail);

  console.log("Demo users, listings, favorites, reports, and admin actions are ready.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
