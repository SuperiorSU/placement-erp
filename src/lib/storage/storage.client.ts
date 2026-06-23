import { createClient } from "@supabase/supabase-js";

const BUCKETS = {
  offerLetters: process.env.SUPABASE_STORAGE_OFFER_LETTERS_BUCKET ?? "offer-letters",
  consentForms: process.env.SUPABASE_STORAGE_CONSENT_FORMS_BUCKET ?? "consent-forms",
};

function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const StorageClient = {
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: keyof typeof BUCKETS
  ): Promise<{ fileId: string; webViewLink: string }> {
    const client = getStorageClient();
    if (!client) return { fileId: "", webViewLink: "" };

    const bucket = BUCKETS[folder];
    const path = `${Date.now()}-${fileName}`;

    const { error } = await client.storage.from(bucket).upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (error) throw error;

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return { fileId: `${bucket}/${path}`, webViewLink: data.publicUrl };
  },

  getDownloadUrl(fileId: string): string {
    const client = getStorageClient();
    if (!client || !fileId) return "";

    const slashIdx = fileId.indexOf("/");
    const bucket = fileId.substring(0, slashIdx);
    const path = fileId.substring(slashIdx + 1);

    const { data } = client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async deleteFile(fileId: string): Promise<void> {
    const client = getStorageClient();
    if (!client || !fileId) return;

    const slashIdx = fileId.indexOf("/");
    const bucket = fileId.substring(0, slashIdx);
    const path = fileId.substring(slashIdx + 1);

    await client.storage.from(bucket).remove([path]);
  },
};
