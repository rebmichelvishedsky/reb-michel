// api/send-notification.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, description, submitter, cloudinaryUrl, fileSize } = req.body;

    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'rebmichelvishedsky@gmail.com';

    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY not configured');
    }

    const emailResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: ADMIN_EMAIL }],
        }],
        from: {
          email: 'rebmichelvishedsky@gmail.com',
          name: 'Memorial Site'
        },
        subject: `New Video Upload: ${title}`,
        content: [{
          type: 'text/html',
          value: `
            <h2>New Video Memory Uploaded</h2>
            <p><strong>Title:</strong> ${title}</p>
            <p><strong>Description:</strong> ${description || 'No description provided'}</p>
            <p><strong>Submitted by:</strong> ${submitter}</p>
            <p><strong>File Size:</strong> ${fileSize}</p>
            
            <h3>Next Steps:</h3>
            <ol>
              <li><a href="${cloudinaryUrl}" target="_blank">Download video from Cloudinary</a></li>
              <li>Upload to YouTube manually</li>
              <li>Update Airtable (Type="youtube", add YouTube URL, Status="Approved")</li>
              <li>Delete from Cloudinary (optional - saves space)</li>
            </ol>
            
            <p><a href="${cloudinaryUrl}" style="display: inline-block; padding: 10px 20px; background-color: #a68b3b; color: white; text-decoration: none; border-radius: 5px;">Download Video</a></p>
          `
        }]
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`SendGrid API error: ${errorText}`);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ 
      error: 'Failed to send notification',
      details: error.message 
    });
  }
}
