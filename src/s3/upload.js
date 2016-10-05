/**
 * multipart S3 upload
 */

import fs from 'mz/fs';
import { s3setup } from '../';
import sign from './sign';
import fetch from 'node-fetch';
import path from 'path';
import { DOMParser } from 'xmldom';
import qs from 'qs';

const debug = require('debug')('flowplayer:drive:s3');

const CHUNK_SIZE = 5 * 1024 * 1024;

export default function upload(authcode, filePath) {
  return s3setup(authcode).then(s3conf => {
    debug('s3 configuration', s3conf);
    let timestamp = (new Date()).getTime()
      , randomString = (Math.random().toString(36) + '00000000000000000').slice(2, 10)
      , ext = path.extname(filePath)
      , uploadKey = `${timestamp}-${randomString}${ext}`;
    return startMultipartUpload(authcode, s3conf, uploadKey).then(uploadId => {
      debug('multipart upload started', uploadId);
      return fs.stat(filePath).then(stat => {
        let chunks = Array.apply(null, { length: Math.ceil(stat.size / CHUNK_SIZE) }).map((a, i) => {
          return {
            idx: i,
            chunk: {
              start: i * CHUNK_SIZE,
              end: Math.min((i+1) * CHUNK_SIZE, stat.size)
            }
          };
        });
        debug(`will upload in ${chunks.length} parts`);
        return fs.open(filePath, 'r').then(fd => {
          debug('file descriptor opened', fd);
          return Promise.all(chunks.splice(0, 5).map(chunk => uploadChunk(uploadId, fd, chunk.idx, chunk.chunk, chunks)));
        }).then(() => {
          return `${s3conf.keyPrefix}/${uploadKey}`;
        });
      });
    });
    function uploadChunk(uploadId, fd, partId, chunk, chunkQueue, retry = 0) {
      debug('starting upload of part', partId);
      if (retry > 0) throw new Error('Max retry treshold achieved for partId ' + partId);
      let bf = new Buffer(chunk.end-chunk.start);
      return fs.read(fd, bf, 0, chunk.end-chunk.start, chunk.start).then(() => {
        debug(`uploading part ${partId} of length ${bf.length}`);
        return uploadPart(authcode, s3conf, uploadKey, uploadId, bf, partId);
      }).then(() => {
        debug('upload complete for part', partId);
        let nextChunk = chunkQueue.splice(0, 1)[0];
        if (!nextChunk) {
          debug('No more parts to upload');
          return;
        }
        return uploadChunk(uploadId, fd, nextChunk.idx, nextChunk.chunk, chunkQueue);
      }, err => {
        console.warn('Failed to upload chunk, retrying', err);
        return uploadChunk(uploadId, fd, partId, chunk, chunkQueue, retry + 1);
      });
    }
  });
}

function startMultipartUpload(authcode, s3conf, key) {
  return s3Request(authcode, s3conf, `${key}?uploads`).then(({data}) => {
    return parseXmlKey(data, 'UploadId');
  });
}

function s3Request(authcode, s3conf, key, method = 'POST', body = null) {
  return sign(authcode, s3conf, key, method, body).then(({ hostname, path, headers }) => {
    debug('Signature value', headers);
    if (body) headers['Content-Length'] = body.length;
    return fetch(`https://${hostname}${path}`, {
      method,
      headers,
      body
    }).then(resp => {
      if (!resp.ok) return resp.text().then(txt => {
        throw new Error(`S3 request fail [${resp.status}]: ${txt}`);
      });
      if (/application\/json/.test(resp.headers.get('Content-Type'))) return resp.json();
      return resp.text().then(data => {
        return {
          etag: resp.headers.get('ETag'),
          data
        };
      });
    });
  });
}

function uploadPart(authcode, s3conf, key, uploadId, bf, partId) {
  let partNumber = partId + 1
    , query = qs.stringify({partNumber, uploadId})
    , path = `${key}?${query}`;
  return s3Request(authcode, s3conf, path, 'PUT', bf);
}

function parseXmlKey(xmlStr, key) {
  let parser = new DOMParser()
    , doc = parser.parseFromString(xmlStr, 'application/xml');
  let node = doc.getElementsByTagName(key)[0];
  return node && node.textContent;
}
