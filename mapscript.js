// server.js
// npm install express multer adm-zip

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

const app = express();
const upload = multer({ dest: "uploads/" });

const PORT = 3000;

// =========================
// HEX REPLACE LIST
// =========================

const replacements = [
  {
    find: "EFB1FF",
    replace: "B7CAEF",
    file: "UserLevelData_3.bytes"
  },
  {
    find: "EFB1FF",
    replace: "B6CAEF",
    file: "UserLevelData_3.bytes"
  },
  {
    find: "EFB1FF",
    replace: "B5CAEF",
    file: "UserLevelData_3.bytes"
  },
  {
    find: "EFB1FF",
    replace: "B4CAEF",
    file: "UserLevelData_3.bytes"
  },
  {
    find: "EFB1FF",
    replace: "B3CAEF",
    file: "UserLevelData_3.bytes"
  },
  {
    find: "EFB1FF",
    replace: "B2CAEF",
    file: "UserLevelData_3.bytes"
  },
  {
    find: "EFB1FF",
    replace: "B1CAEF",
    file: "UserLevelData_3.bytes"
  },
  {
    find: "EFB1",
    replace: "9892",
    file: "UserLevelData_3.bytes"
  },
  {
    find: "EFB1",
    replace: "8592",
    file: "UserLevelData_3.bytes"
  }
];

// =========================
// GET SIGNATURE
// =========================

function getMD5(buffer) {
  const crypto = require("crypto");
  return crypto.createHash("md5").update(buffer).digest("hex");
}

// =========================
// HEX REPLACE FUNCTION
// =========================

function replaceHex(buffer, searchHex, replaceHex) {
  const search = Buffer.from(searchHex, "hex");
  const replace = Buffer.from(replaceHex, "hex");

  let offset = buffer.indexOf(search);

  while (offset !== -1) {
    replace.copy(buffer, offset);
    offset = buffer.indexOf(search, offset + replace.length);
  }

  return buffer;
}

// =========================
// PROCESS ROUTE
// =========================

app.post("/process", upload.any(), async (req, res) => {
  try {
    let userFile = null;
    let metaFile = null;

    for (const file of req.files) {
      if (file.originalname === "UserLevelData_3.bytes") {
        userFile = file;
      }

      if (file.originalname === "ProjectData_slot_3.meta") {
        metaFile = file;
      }
    }

    if (!userFile || !metaFile) {
      return res.status(400).send("Required files missing.");
    }

    // =========================
    // READ FILES
    // =========================

    let userBuffer = fs.readFileSync(userFile.path);
    let metaBuffer = fs.readFileSync(metaFile.path);

    // =========================
    // GET OLD SIGNATURE
    // =========================

    const oldSignature = getMD5(userBuffer);

    // =========================
    // APPLY REPLACEMENTS
    // =========================

    for (const item of replacements) {
      userBuffer = replaceHex(
        userBuffer,
        item.find,
        item.replace
      );
    }

    // =========================
    // NEW SIGNATURE
    // =========================

    const newSignature = getMD5(userBuffer);

    // =========================
    // REPLACE SIGNATURE IN META
    // =========================

    const oldSigBuffer = Buffer.from(oldSignature, "utf8");
    const newSigBuffer = Buffer.from(newSignature, "utf8");

    let sigOffset = metaBuffer.indexOf(oldSigBuffer);

    if (sigOffset !== -1) {
      newSigBuffer.copy(metaBuffer, sigOffset);
    }

    // =========================
    // SAVE FILES
    // =========================

    const outputDir = path.join(__dirname, "output");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    const newUserFile = path.join(
      outputDir,
      "UserLevelData_3.bytes"
    );

    const newMetaFile = path.join(
      outputDir,
      "ProjectData_slot_3.meta"
    );

    fs.writeFileSync(newUserFile, userBuffer);
    fs.writeFileSync(newMetaFile, metaBuffer);

    // =========================
    // CREATE ZIP
    // =========================

    const zip = new AdmZip();

    zip.addLocalFile(newUserFile);
    zip.addLocalFile(newMetaFile);

    const zipPath = path.join(outputDir, "outfit.zip");

    zip.writeZip(zipPath);

    // =========================
    // CLEAN TEMP FILES
    // =========================

    fs.unlinkSync(userFile.path);
    fs.unlinkSync(metaFile.path);

    // =========================
    // DOWNLOAD ZIP
    // =========================

    res.download(zipPath, "outfit.zip");

  } catch (err) {
    console.log(err);
    res.status(500).send("Processing failed.");
  }
});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});