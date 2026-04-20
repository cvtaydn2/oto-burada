import { google } from "googleapis";

/**
 * ── PILL: Issue 8 - Google Indexing API Automation ────────────────
 * Notifies Google immediately when a new listing is published.
 * Ensures the car appears in Google Search in minutes, not days.
 */
export async function notifyGoogleOfListingChange(
  url: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED"
) {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!credentialsJson) {
    console.warn("[GoogleIndexing] GOOGLE_APPLICATION_CREDENTIALS_JSON missing. Skipping.");
    return;
  }

  try {
    const credentials = JSON.parse(credentialsJson);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth = new (google.auth.JWT as any)(
      credentials.client_email,
      undefined,
      credentials.private_key,
      ["https://www.googleapis.com/auth/indexing"],
      undefined
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const indexing = google.indexing({ version: "v1", auth } as any);

    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url,
        type,
      },
    });

    console.log(`[GoogleIndexing] Successfully notified Google for ${url}:`, res.data);
    return res.data;
  } catch (error) {
    console.error(`[GoogleIndexing] Failed to notify Google for ${url}:`, error);
    // Don't throw - this is a non-critical background enhancement
  }
}
