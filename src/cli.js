#!/usr/bin/env node

/* eslint-disable no-console */

import {
  login,
  uploadVideo,
} from './index';

import minimist from 'minimist';
import prompt from 'cli-prompt';
import osenv from 'osenv';
import fs from 'mz/fs';
import path from 'path';

const argv = minimist(process.argv.slice(2));

const confFile = path.join(osenv.home(), '.flowplayerrc');

function readConfiguration() {
  return fs.exists(confFile).then(exists => {
    if (!exists) return {};
    return fs.readFile(confFile).then(str => JSON.parse(str));
  });
}

function nologin() {
  console.log('No cached credentials. Please login first.');
}

function uploadFlow(files = []) {
  if (!files.length) return usageFlow();
  readConfiguration().then(({authcode}) => {
    if (!authcode) return nologin();
    return files.reduce((p, file) => {
      return p.then(() =>{
        console.log(`Uploading ${file}`);
        return uploadVideo(authcode, fs.createReadStream(file), {
          title: path.basename(file)
        }).then(resp => {
          console.log(`Upload complete, video id ${resp.id}`);
        });
      });
    }, Promise.resolve());
  }).catch(e => {
    console.error('Unable to upload', e);
  });
}

function usageFlow() {
  console.log('Usage: flowplayer <command>');
  console.log('Commands:');
  console.log('  login                  | prompts for login credentials and saves authentication token to $HOME/.flowplayerrc');
  console.log('  upload <file1> <file2> | upload files to be encoded by Flowplayer Drive');
}

function loginFlow() {
  prompt.multi([{
    key: 'username',
    label: 'Username / E-mail'
  }, {
    key: 'password',
    label: 'Password',
    type: 'password'
  }], ({username, password}) => {
    login(username, password).then(user => {
      return fs.writeFile(confFile, JSON.stringify({authcode: user.authcode})).then(() => {
        console.log(`Logged in as ${user.email}`);
      }).catch(err => {
        console.error(`Unable to write to ${confFile}`, err);
      });
    }).catch(() => console.log('Login failed'));
  });

}

(() => {
  let {
    _: [command, ...args]
  } = argv;
  if (!command) return usageFlow();
  if (command === 'login') return loginFlow();
  if (command === 'upload') return uploadFlow(args, argv);
})();
