# flowplayer-drive
NPM module and CLI tool for managing videos on Flowplayer Drive

## Installation

`npm install flowplayer-drive`

If you want to use it as a command line tool use the global switch (might need sudo depending on your environment).

`npm install -g flowplayer-drive`

## Usage

### Node library

```
var drive = require('flowplayer-drive');
drive.login('john.doe@gmail.com', 's3cr3t').then(function(user) {
  console.log('Logged in as ' + user.email);
  return drive.uploadFile(user.authcode, '/path/to/file.mp4', { title: 'My cool video' });
}).then(function(err) {
  console.error('Something went wrong', err);
});
```

#### Methods

 - `login(user, pass)` - Calls the login endpoint, returns user information along with an authentication token [doc](https://flowplayer.org/docs/drive-api.html#authentication)
 - `uploadFile(authcode, file, params)` - Uploads a file to Drive [doc](https://flowplayer.org/docs/drive-api.html#uploading)

### Command line tool

 - `flowplayer` - prints the usage information
 - `flowplayer login` - prompts for login credentials and caches them for later use
 - `flowplayer upload <file1> [<file2> <file3>]` - Upload one ore more videos to the service
