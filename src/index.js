import fetch from 'node-fetch';

export function login(username, password) {
  return fetch('https://drive.api.dev.flowplayer.org/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({username, password})
  }).then(resp => {
    if (!resp.ok) throw new Error('Login unsuccessfull');
    return resp.json().then(json => json.user);
  });
}
