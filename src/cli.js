#!/usr/bin/env node

/* eslint no-console: "" */

import {
  login
} from './index';

import minimist from 'minimist';
import prompt from 'cli-prompt';
import osenv from 'osenv';
import fs from 'mz/fs';
import path from 'path';

const argv = minimist(process.argv.slice(2));

const confFile = path.join(osenv.home(), '.flowplayerrc');

function loginFlow() {
  prompt.multi([{
    key: 'username',
    label: 'Username / E-mail'
  }, {
    key: 'password',
    label: 'Password'
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
