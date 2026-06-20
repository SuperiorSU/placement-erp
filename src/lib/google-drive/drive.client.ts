import { google } from "googleapis";
import { Readable } from "stream";

const FOLDER_IDS = {
  offerLetters: process.env.GDRIVE_OFFER_LETTERS_FOLDER ?? "",
  consentForms: process.env.GDRIVE_CONSENT_FORMS_FOLDER ?? "",
};

function getDriveClient() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return null;
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

export const DriveClient = {
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: keyof typeof FOLDER_IDS
  ): Promise<{ fileId: string; webViewLink: string }> {
    const drive = getDriveClient();
    if (!drive) return { fileId: "", webViewLink: "" };

    const stream = Readable.from(buffer);
    const res = await drive.files.create({
      requestBody: { name: fileName, parents: [FOLDER_IDS[folder]] },
      media: { mimeType, body: stream },
      fields: "id,webViewLink",
    });
    return { fileId: res.data.id!, webViewLink: res.data.webViewLink! };
  },

  getDownloadUrl(fileId: string): string {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  },

  async deleteFile(fileId: string): Promise<void> {
    const drive = getDriveClient();
    if (!drive || !fileId) return;
    await drive.files.delete({ fileId });
  },
};
