export const listingSubmissionsCookieName = "oto-burada-listing-submissions";

export const listingSubmissionsCookieOptions = {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
