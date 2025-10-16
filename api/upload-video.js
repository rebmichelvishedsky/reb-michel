export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Step 1: Get GoFile server
    const serverResponse = await fetch('https://api.gofile.io/getServer');
    const serverData = await serverResponse.json();

    if (serverData.status !== 'ok') {
      return res.status(400).json({ error: 'Failed to get upload server' });
    }

    const server = serverData.data.server;

    // Step 2: The request body contains the file (from frontend)
    // For this to work, we need to handle the multipart form data
    // Vercel's default body parser doesn't handle file uploads well
    // So we'll return the server info and let frontend handle the upload
    
    return res.status(200).json({
      status: 'ok',
      server: server,
      uploadUrl: `https://${server}.gofile.io/uploadFile`
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
