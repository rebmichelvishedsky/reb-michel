// api/send-notification.js
// This Vercel serverless function sends email notifications via Resend

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, submitter, cloudinaryUrl, fileSize } = req.body;

    // Get Resend API key from environment variable
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rebmichelvishedsky@gmail.com';

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Send email via Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Memorial Site <notifications@yourdomain.com>', // Change this to your verified domain
        to: [ADMIN_EMAIL],
        subject: `New Video Upload: ${title}`,
        html: `
          <h2>New Video Memory Uploaded</h2>
          <p><strong>Title:</strong> ${title}</p>
          <p><strong>Description:</strong> ${description || 'No description provided'}</p>
          <p><strong>Submitted by:</strong> ${submitter}</p>
          <p><strong>File Size:</strong> ${fileSize}</p>
          
          <h3>Next Steps:</h3>
          <ol>
            <li><a href="${cloudinaryUrl}" target="_blank">Download video from Cloudinary</a></li>
            <li>Upload to YouTube manually</li>
            <li>Update Airtable:
              <ul>
                <li>Change Type to "youtube"</li>
                <li>Add YouTube URL</li>
                <li>Change Status to "Approved"</li>
              </ul>
            </li>
            <li>Delete from Cloudinary (optional - saves space)</li>
          </ol>
          
          <p><a href="${cloudinaryUrl}" style="display: inline-block; padding: 10px 20px; background-color: #a68b3b; color: white; text-decoration: none; border-radius: 5px;">Download Video</a></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`);
    }

    const result = await emailResponse.json();
    
    return res.status(200).json({ 
      success: true,
      messageId: result.id 
    });

  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ 
      error: 'Failed to send notification',
      details: error.message 
    });
  }
}
