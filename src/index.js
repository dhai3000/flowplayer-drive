import fetch from 'node-fetch';
import upload from './s3/upload';

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

export function uploadVideo(authcode, file, params = {}) {
  return upload(authcode, file).then(data => {
    return fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: {
        'flowplayer-authcode': authcode,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...params, s3Key: data })
    }).then(handleResponse).then(json => json.job);
  });
}

export function videos(authcode) {
  return fetch(`${API_URL}/videos`, {
    headers: {
      'flowplayer-authcode': authcode
    }
  }).then(handleResponse).then(json => json.videos);
}

export function s3setup(authcode) {
  return fetch(`${API_URL}/s3`, {
    headers: {
      'flowplayer-authcode': authcode
    }
  }).then(handleResponse).then(json => json.s3);
}

export function sign(authcode, data) {
  return fetch(`${API_URL}/s3/sign`, {
    headers: {
      'flowplayer-authcode': authcode,
      'Content-Type': 'application/json'
    },
    method: 'POST',
    body: JSON.stringify(data)
  }).then(handleResponse);
}

function handleResponse(resp) {
  if (!resp.ok) return resp.text().then(str => {
    throw new RequestError('Upload unsuccessfull', resp.status, str);
  });
  return resp.json();
}

class RequestError extends Error {
  constructor(msg, status, responseText) {
    super(msg);
    this.status = status;
    this.responseText = responseText;
  }
}
