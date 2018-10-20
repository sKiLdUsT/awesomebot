# Command Help

### help [core]
*Available to all permissions*
Shows this help message
**Example**
```
/help
```
---
### ping [debug]
*Available to all permissions*
Pong!
**Example**
```
/ping
```
---
### grant (@User, permission) [core]
*Available to permission "core.admin" only*
Grant someone a specific permission in the form of *module*.*permission*
**Example**
```
/grant @sKiL#6093 core.admin
```
---
### revoke (@User, permission) [core]
*Available to permission "core.admin" only*
Revoke someone's permission
**Example**
```
/revoke @sKiL#6093 core.admin
```
---
### addModule (userId, permission) [core]
*Available to permission "core.admin" only*
Add a module to the server
**Example**
```
More details soon...
```
---
### removeModule (userId, permission) [core]
*Available to permission "core.admin" only*
Remove a module from the server
**Example**
```
More details soon...
```
---
### set (key, value) [core]
*Available to permission "core.admin" only*
Assign a specific value to a key, which may be one of the following:
- *voiceChannel* - Set the default voice channel to connect to
- *onlyListenIn* - Set the channel to accept commands from exclusively
- *maxVolume* - Set the max volume allowed to be used
- *maxLength* - Set the max media length allowed. Capped to 1 hour to prevent cluttering cache with long videos
- *listLimit* - Set the max count of videos to process from playlists. Capped to 50 to prevent cluttering cache with too much videos

**Example**
```
/set voiceChannel 369768568931221508
/set onlyListenIn 369768568931221506
/set maxVolume 100
/set maxLength 900
/set listLimit 10
```
---
### play (subject) [media]
*Available to media.dj, core.moderator and core.admin*
Play something off YouTube according to the subject of either
- *YouTube Link/Playlist*
- *Generic search term to be looked up on YouTube*

**Example**
```
/play https://www.youtube.com/watch?v=DLzxrzFCyOs
/play never gonna give you up
```
---
### pause [media]
*Available to media.dj, core.moderator and core.admin*
Pause playback of  current song
**Example**
```
/pause
```
---
### resume [media]
*Available to media.dj, core.moderator and core.admin*
Resume playback of  current song
**Example**
```
/resume
```
---
### skip [media]
*Available to all permissions, requires vote under permission "core.moderator"*
Skip playback of  current song
**Example**
```
/skip
```
---
### clear [media]
*Available to all permissions, requires vote under permission "core.moderator"*
Clear the playlist
**Example**
```
/clear
```
---
### vol [media]
*Available to all permissions*
Sets current playback volume, defaults to 20. Limited to **100**
**Example**
```
/vol 30
```
---
### queue [media]
*Available to all permissions*
Shows current playlist.
**Example**
```
/queue
```
---
---
### np [media]
*Available to all permissions*
Shows currently playing song.
**Example**
```
/np
```
---
