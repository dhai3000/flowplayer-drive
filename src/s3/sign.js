import {
  sign as apiSign
} from '../';
import crypto from 'crypto';

export default function sign(authcode, s3conf, path, method = 'POST', data = null) {
  let md5, sha256;
  if (data) {
    md5 = hash('md5', data, 'base64');
    sha256 = hash('sha256', data, 'hex');
  }
  let signData = {
    service: 's3',
    region: s3conf.region || 'us-west-2',
    method,
    bodyHash: sha256,
    path: `/${s3conf.bucket}/${s3conf.keyPrefix}/${path}`
  };
  if (md5) signData.headers = { 'Content-MD5': md5 };
  return apiSign(authcode, signData);
}

function hash(algo, body, output) {
  let hash = crypto.createHash(algo);
  hash.update(body);
  return hash.digest(output);
}
