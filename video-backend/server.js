require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const {google} = require('googleapis');

const PORT = process.env.PORT || 3000;
const uploadDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadDir);

// Multer config: store temp files on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, safe);
  }
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } }); // 2GB limit (adjust)

// Google OAuth2 client configured with refresh token
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN });

const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

const app = express();
app.use(cors());
app.use(express.json());

// Simple health
app.get('/alive', (req, res) => res.send({ok:true}));

// Upload endpoint
// Accepts form-data: file (video), title, description, tags (comma-separated)
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' });

  const { title = req.file.originalname, description = '', tags = '' } = req.body;
  const filePath = req.file.path;

  try {
    // create read stream
    const fileSize = (await fs.stat(filePath)).size;
    const stream = fs.createReadStream(filePath);

    // Call youtube.videos.insert with resumable upload (googleapis handles resumable automatically)
    const resUpload = await youtube.videos.insert({
      part: ['snippet','status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
          categoryId: '22' // People can change category; 22 is 'People & Blogs' — change as needed
        },
        status: {
          privacyStatus: 'unlisted', // recommended initially for moderation
          embeddable: true,
          publicStatsViewable: false
        }
      },
      media: {
        body: stream
      }
    }, {
      // optional: onUploadProgress for progress feedback in logs
      onUploadProgress: evt => {
        const progress = Math.round((evt.bytesRead / fileSize) * 100);
        console.log(`Upload progress: ${progress}%`);
      }
    });

    const videoId = resUpload.data.id;
    // Save metadata to your DB here (example: JSON file; replace with Mongo/Postgres etc.)
    // Example store:
    const dbEntry = {
      videoId,
      title,
      description,
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      createdAt: new Date().toISOString(),
      status: 'unlisted', // moderation status you maintain
    };
    await fs.appendFile(path.join(__dirname, 'uploaded_videos.json'), JSON.stringify(dbEntry) + '\n');

    // Remove temp file
    await fs.remove(filePath);

    // Return embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return res.json({ ok: true, videoId, embedUrl });
  } catch (err) {
    console.error('Upload error', err);
    // cleanup
    try { await fs.remove(filePath); } catch(e){}
    return res.status(500).json({ error: 'upload_failed', details: err.message });
  }
});

app.listen(PORT, () => console.log(`Server started on ${PORT}`));
