// get_refresh_token.js  (run: node get_refresh_token.js)
require('dotenv').config();
const readline = require('readline');
const {google} = require('googleapis');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Set CLIENT_ID and CLIENT_SECRET in .env before running.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const scopes = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',  // important to get refresh token
  prompt: 'consent',       // important the first time to ensure refresh_token returns
  scope: scopes
});

console.log('1) Open this URL in your browser:\n\n', authUrl);
console.log('\n2) After authorizing, you will be redirected to your REDIRECT_URI with ?code=XYZ');
console.log('Paste that code here (just the code part from the URL):');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Enter code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\nTokens:\n', tokens);
    console.log('\nSave this refresh token value in your environment (REFRESH_TOKEN):\n');
    console.log(tokens.refresh_token || '(no refresh_token returned)');
    console.log('\nIf no refresh_token was returned, re-run with prompt=consent and ensure you used the channel owner account.');
  } catch (err) {
    console.error('Error getting token:', err);
  } finally {
    rl.close();
  }
});
