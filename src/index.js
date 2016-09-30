import fetch from 'node-fetch';
import path from 'path';
import FormData from 'form-data';
import fs from 'mz/fs';

const API_URL = process.env.DRIVE_API_URL || 'https://drive.api.flowplayer.org';

export function login(username, password) {
  return fetch(`${API_URL}/login`, {
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

export function uploadFile(authcode, file, params = {}) {
  if (!params.title) params.title = path.basename(file);
  let fd = new FormData();
  Object.keys(params).map(k => fd.append(k, params[k]));
  fd.append('file', fs.createReadStream(file));
  return fetch(`${API_URL}/videos`, {
    method: 'POST',
    headers: {
      'flowplayer-authcode': authcode
    },
    body: fd
  }).then(resp => {
    if (!resp.ok) return resp.text().then(str => {
      throw new RequestError('Upload unsuccessfull', resp.status, str);
    });
    return resp.json().then(json => json.video);
  });
}

class RequestError extends Error {
  constructor(msg, status, responseText) {
    super(msg);
    this.status = status;
    this.responseText = responseText;
  }
}
