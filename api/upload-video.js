export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Step 1: Get a guest account (creates one automatically)
    console.log('Step 1: Creating guest account...');
    
    const accountResponse = await fetch('https://api.gofile.io/accounts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!accountResponse.ok) {
      console.error('Account creation failed:', accountResponse.status);
      throw new Error(`Account creation failed: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();
    console.log('Account response:', accountData);

    if (accountData.status !== 'ok' || !accountData.data) {
      throw new Error('Invalid account response');
    }

    const token = accountData.data.token;
    
    if (!token) {
      throw new Error('No token received from GoFile');
    }

    console.log('Got token:', token.substring(0, 10) + '...');

    // Step 2: Get the root folder ID
    console.log('Step 2: Getting root folder...');
    
    const folderResponse = await fetch(`https://api.gofile.io/accounts/${token}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      body: JSON.stringify({
        parentFolderId: 'root'
      })
    });

    let folderId = 'root';
    
    if (folderResponse.ok) {
      const folderData = await folderResponse.json();
      console.log('Folder response:', folderData);
      if (folderData.status === 'ok' && folderData.data && folderData.data.id) {
        folderId = folderData.data.id;
      }
    }

    console.log('Using folder ID:', folderId);

    // Step 3: Get an upload server
    console.log('Step 3: Getting upload server...');
    
    const serverResponse = await fetch('https://api.gofile.io/servers', {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });

    if (!serverResponse.ok) {
      throw new Error(`Server request failed: ${serverResponse.status}`);
    }

    const serverData = await serverResponse.json();
    console.log('Server response:', serverData);

    if (serverData.status !== 'ok' || !serverData.data || !serverData.data.servers || serverData.data.servers.length === 0) {
      throw new Error('No upload servers available');
    }

    const uploadServer = serverData.data.servers[0].name;
    console.log('Got upload server:', uploadServer);

    // Return the upload configuration
    return res.status(200).json({
      status: 'ok',
      token: token,
      folderId: folderId,
      uploadServer: uploadServer,
      uploadUrl: `https://${uploadServer}.gofile.io/contents/uploadfile`,
      uploadConfig: {
        token: token,
        folderId: folderId
      }
    });

  } catch (error) {
    console.error('Backend error:', error);
    return res.status(500).json({ 
      error: error.message || 'Unknown error',
      type: error.name
    });
  }
}
