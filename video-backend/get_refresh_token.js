// get_refresh_token.js
// Usage: node get_refresh_token.js
require('dotenv').config();
const readline = require('readline');
const {google} = require('googleapis');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Scopes: need youtube.upload (and optionally other youtube scopes).
const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // <-- important to get refresh token
  prompt: 'consent',      // <-- ensures refresh token is returned on first auth
  scope: scopes
});

console.log('1) Visit this URL in your browser:\n\n', authUrl);
console.log('\n2) After authorizing, you will be redirected to your redirect URI with ?code=XYZ');
console.log('Paste that code here:');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Enter code from URL: ', async (code) => {
  try {
    const {tokens} = await oauth2Client.getToken(code.trim());
    console.log('\nTokens received:\n', tokens);
    console.log('\nSave the following refresh_token in your .env file as REFRESH_TOKEN:');
    console.log(tokens.refresh_token);
  } catch (err) {
    console.error('Error getting tokens:', err);
  } finally {
    rl.close();
  }
});
