export default async function handler(req, res) {
// Autoriser les requêtes (CORS)
res.setHeader('Access-Control-Allow-Credentials', true);
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
res.setHeader(
'Access-Control-Allow-Headers',
'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, xi-api-key'
);

if (req.method === 'OPTIONS') {
return res.status(200).end();
}

const path = req.url;
let targetUrl = '';
let headers = { ...req.headers };

delete headers.host;
delete headers.connection;

// 1. Si c'est pour ElevenLabs (la voix)
if (path.startsWith('/elevenlabs')) {
const elevenLabsPath = path.replace('/elevenlabs', '');
targetUrl = `https://api.elevenlabs.io/v1${elevenLabsPath}`;
headers['xi-api-key'] = process.env.ELEVEN_API_KEY;
delete headers['authorization'];
}
// 2. Si c'est pour vérifier l'état d'une vidéo (Polling)
else if (path.startsWith('/agnesapi')) {
targetUrl = `https://apihub.agnes-ai.com${path}`;
headers['authorization'] = `Bearer ${process.env.AGNES_KEY}`;
}
// 3. Sinon, c'est une génération avec Agnes
else {
targetUrl = `https://apihub.agnes-ai.com/v1${path}`;
headers['authorization'] = `Bearer ${process.env.AGNES_KEY}`;
}

// Ruse pour faire croire qu'on est un vrai navigateur
headers['user-agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

try {
const response = await fetch(targetUrl, {
method: req.method,
headers: headers,
body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
});

const data = await response.text();
res.status(response.status).send(data);
} catch (error) {
res.status(500).json({ error: 'Proxy Error', details: error.message });
}
}
