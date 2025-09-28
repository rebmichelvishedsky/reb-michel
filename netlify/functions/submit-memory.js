// netlify/functions/submit-memory.js
const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse form data
    const formData = JSON.parse(event.body);
    const {
      type,
      title,
      description,
      youtube,
      submitter,
      email,
      file
    } = formData;

    // Basic validation
    if (!type || !title || !description) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // IMPORTANT: These must be set as environment variables in Netlify dashboard
    // NEVER hardcode actual passwords here
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.error('Gmail credentials not configured in environment variables');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Email configuration missing' }),
      };
    }

    // Email configuration (using environment variables ONLY)
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.GMAIL_USER,    // Set in Netlify dashboard
        pass: process.env.GMAIL_PASS,    // Set in Netlify dashboard
      },
    });

    // Prepare email content
    const emailContent = `
New Memory Submission for Reb Michel Vishedsky Memorial

Type: ${type}
Title: ${title}
Description: ${description}
${youtube ? `YouTube URL: ${youtube}` : ''}
Submitter: ${submitter || 'Anonymous'}
Contact Email: ${email || 'Not provided'}

Submitted on: ${new Date().toLocaleString()}
    `;

    // Send notification email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'rebmichelvishedsky@gmail.com',
      subject: `New Memory Submission: ${title}`,
      text: emailContent,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Memory submitted successfully'
      }),
    };

  } catch (error) {
    console.error('Error processing submission:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process submission',
        message: error.message 
      }),
    };
  }
};
