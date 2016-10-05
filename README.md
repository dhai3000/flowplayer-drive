# flowplayer-drive
NPM module and CLI tool for managing videos on Flowplayer Drive

## Installation

`npm install flowplayer-drive`

If you want to use it as a command line tool use the global switch (might need sudo depending on your environment).

`npm install -g flowplayer-drive`

## Usage

### Node library

```js
var drive = require('flowplayer-drive');
drive.login('john.doe@gmail.com', 's3cr3t').then(function(user) {
  console.log('Logged in as ' + user.email);
  return drive.uploadVideo(user.authcode, '/path/to/file.mp4'), { title: 'My cool video' });
}).catch(function(err) {
  console.error('Something went wrong', err);
});
```

#### Methods

 - `login(user, pass)` - Calls the login endpoint, returns user information along with an authentication token [doc](https://flowplayer.org/docs/drive-api.html#authentication)
 - `uploadVideo(authcode, file, params)` - Uploads a file to Drive [doc](https://flowplayer.org/docs/drive-api.html#uploading)
 - `videos(authcode)` - List all videos [doc](https://flowplayer.org/docs/drive-api.html#list)

### Command line tool

Examples:

Upload a video file

```
flowplayer upload videos/my-video.mp4
```

Upload all MP4 files from a directory

```
flowplayer upload videos/*.mp4
```

List videos from Drive API as JSON

```
flowplayer list
```

####  Commands

 - `flowplayer` - prints the usage information
 - `flowplayer login` - prompts for login credentials and caches them for later use
 - `flowplayer upload <file1> [<file2> <file3>]` - Upload one ore more videos to the service
 - `flowplayer list` - List all videos

Tip: combine the command line tool with [jq](https://stedolan.github.io/jq/) to process and analyze data:

```
$ flowplayer list | jq -c 'sort_by(.viewCount) | reverse | .[] | {title: .title, viewCount: .viewCount}'
{"title":"Hero_video.mpeg","viewCount":67982}
{"title":"2013-05-25 10.29.08.mp4","viewCount":184}
...
```
