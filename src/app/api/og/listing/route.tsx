/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { getMarketplaceListingBySlug } from "@/services/listings/marketplace-listings";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return new Response("Missing slug", { status: 400 });
    }

    const listing = await getMarketplaceListingBySlug(slug);

    if (!listing) {
      return new Response("Listing not found", { status: 404 });
    }

    const brand = listing.brand;
    const model = listing.model;
    const year = listing.year;
    const price = new Intl.NumberFormat("tr-TR").format(listing.price);
    const coverImage = listing.images.find(img => img.isCover)?.url || listing.images[0]?.url;

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#fff",
            fontFamily: "sans-serif",
            position: "relative",
          }}
        >
          {/* Background Image with blur */}
          {coverImage && (
            <img
              src={coverImage}
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: "blur(20px) brightness(0.7)",
              }}
            />
          )}

          {/* Centered Card */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              width: "85%",
              height: "75%",
              borderRadius: "48px",
              padding: "48px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(0,0,0,0.1)",
              alignItems: "center",
              gap: "40px",
            }}
          >
            {/* Left: Car Image */}
            <div style={{ display: "flex", width: "450px", height: "350px", position: "relative" }}>
               <img
                  src={coverImage}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "32px",
                    objectFit: "cover",
                  }}
                />
            </div>

            {/* Right: Info */}
            <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
               <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                  <div style={{ padding: "4px 12px", backgroundColor: "#3b82f6", borderRadius: "100px", color: "white", fontSize: "14px", fontWeight: "900" }}>OTOBURADA</div>
                  <div style={{ fontSize: "16px", color: "#64748b", fontWeight: "700" }}>{year} Model • {listing.mileage.toLocaleString()} km</div>
               </div>
               
               <h1 style={{ fontSize: "56px", fontWeight: "900", color: "#0f172a", lineHeight: 1, marginBottom: "8px", textTransform: "uppercase", fontStyle: "italic" }}>
                  {brand} <span style={{ color: "#3b82f6" }}>{model}</span>
               </h1>
               
               <p style={{ fontSize: "20px", color: "#475569", fontWeight: "600", marginBottom: "32px", fontStyle: "italic" }}>
                  {listing.title}
               </p>

               <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: "16px", color: "#64748b", fontWeight: "800", textTransform: "uppercase", letterSpacing: "2px" }}>FİYAT</div>
                  <div style={{ fontSize: "64px", fontWeight: "900", color: "#0f172a" }}>₺{price}</div>
               </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Beklenmedik hata";
    console.log(message);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
