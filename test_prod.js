const http = require('http');
http.get('http://localhost:3000/projects/123/auction/display', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body.substring(0, 500)));
});
