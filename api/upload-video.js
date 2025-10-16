export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get GoFile server with better error handling
    const serverResponse = await fetch('https://api.gofile.io/getServer', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!serverResponse.ok) {
      console.error('GoFile API error:', serverResponse.status, serverResponse.statusText);
      return res.status(400).json({ 
        error: `GoFile API error: ${serverResponse.status}`,
        details: serverResponse.statusText
      });
    }

    const serverData = await serverResponse.json();
    
    console.log('GoFile response:', serverData);

    if (serverData.status !== 'ok') {
      console.error('GoFile status not ok:', serverData);
      return res.status(400).json({ 
        error: 'GoFile returned error',
        details: serverData
      });
    }

    const server = serverData.data.server;

    return res.status(200).json({
      status: 'ok',
      server: server,
      uploadUrl: `https://${server}.gofile.io/uploadFile`
    });

  } catch (error) {
    console.error('Backend error:', error);
    return res.status(500).json({ 
      error: error.message,
      type: error.name
    });
  }
}
