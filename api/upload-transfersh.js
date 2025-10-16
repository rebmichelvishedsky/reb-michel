export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get file from request body
    const fileBuffer = Buffer.from(req.body.file, 'base64');
    const fileName = req.body.fileName;

    if (!fileBuffer || !fileName) {
      return res.status(400).json({ error: 'Missing file or fileName' });
    }

    console.log(`Uploading file: ${fileName}, size: ${fileBuffer.length} bytes`);

    // Upload to Transfer.sh using PUT request (server-to-server, no CORS issues)
    const uploadResponse = await fetch(`https://transfer.sh/${encodeURIComponent(fileName)}`, {
      method: 'PUT',
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream',
        'User-Agent': 'Memorial-Site/1.0'
      }
    });

    if (!uploadResponse.ok) {
      console.error('Transfer.sh error:', uploadResponse.status, uploadResponse.statusText);
      return res.status(400).json({ 
        error: `Transfer.sh error: ${uploadResponse.status}`,
        details: uploadResponse.statusText
      });
    }

    // Get the download URL from response
    const downloadUrl = await uploadResponse.text();
    console.log('Upload successful. URL:', downloadUrl);

    return res.status(200).json({
      status: 'ok',
      url: downloadUrl.trim(),
      fileName: fileName,
      fileSize: fileBuffer.length
    });

  } catch (error) {
    console.error('Backend upload error:', error);
    return res.status(500).json({ 
      error: error.message || 'Upload failed',
      type: error.name
    });
  }
}
