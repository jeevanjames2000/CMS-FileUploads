const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const express = require("express");
const app = express();
app.use(cors());

require("dotenv").config();
const KEY_FILE_PATH = path.join(
  __dirname,
  "../config/cms-app-450416-f79230fc0ee9.json"
);
const SCOPES = [
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/drive.file",
];
const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE_PATH,
  scopes: SCOPES,
});
const drive = google.drive({ version: "v3", auth });
const uploadFileToDrive = async (file, folderId) => {
  console.log("folderId: ", folderId);
  try {
    const response = await drive.files.create({
      requestBody: {
        name: `image_${Date.now()}`,
        mimeType: file.mimetype,
        parents: [folderId],
      },
      media: {
        mimeType: file.mimetype,
        body: require("stream").Readable.from(file.buffer),
      },
    });
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
    const fileLink = `https://drive.google.com/uc?id=${response.data.id}`;
    return fileLink;
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error);
    throw error;
  }
};
const listFilesFromDrive = async (folderId, mimeType) => {
  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains '${mimeType}'`,
      fields: "files(id, name)",
    });

    return response.data.files.map((file) => ({
      name: file.name,
      url: `https://lh3.googleusercontent.com/d/${file.id}`,
    }));
  } catch (error) {
    console.error("Error fetching files from Google Drive:", error);
    throw error;
  }
};

module.exports = { uploadFileToDrive, listFilesFromDrive };
