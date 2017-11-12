# Command Help

### help
*Available to all permissions*
Shows this help message
**Example**
```
/help
```
---
### ping
*Available to all permissions*
Pong!
**Example**
```
/ping
```
---
### grant (userId, permission)
*Available to permission "admin" only*
Grant someone a specific permission of either
- *moderator*
- *admin*

**Example**
```
/grant 122143660027412480 admin
```
---
### revoke (userId, permission)
*Available to permission "admin" only*
Revoke someone's permissions
**Example**
```
/revoke 122143660027412480
```
---
### set (key, value)
*Available to permission "admin" only*
Assign a specific value to a key, which may be one of the following:
- *voiceChannel* - Set the default voice channel to connect to
- *onlyListenIn* - Set the channel to accept commands from exclusively
- *maxVolume* - Set the max volume allowed to be used
- *maxLength* - Set the max media length allowed. Capped to 1 hour to prevent cluttering cache with long videos

**Example**
```
/set voiceChannel 369768568931221508
/set onlyListenIn 369768568931221506
/set maxVolume 100
/set maxLength 900
```
---
### play (subject)
*Available to all permissions*
Play something according to the subject of either
- *YouTube Link*
- *Soundcloud Link*
- *Generic search term to be lookup up on YouTube*

**Example**
```
/play https://www.youtube.com/watch?v=DLzxrzFCyOs
/play https://soundcloud.com/rick-astley-official/never-gonna-give-you-up
/play never gonna give you up
```
---
### pause
*Available to all permissions*
Pause playback of  current song
**Example**
```
/pause
```
---
### resume
*Available to all permissions*
Resume playback of  current song
**Example**
```
/resume
```
---
### skip
*Available to all permissions, requires vote under permission "moderator"*
Skip playback of  current song
**Example**
```
/skip
```
---
### clear
*Available to all permissions, requires vote under permission "moderator"*
Clear the playlist
**Example**
```
/clear
```
---
### vol
*Available to all permissions*
Sets current playback volume, defaults to 20. Limited to **100**
**Example**
```
/vol 30
```
---
### queue
*Available to all permissions*
Shows current playlist.
**Example**
```
/queue
```
---
---
### np
*Available to all permissions*
Shows currently playing song.
**Example**
```
/np
```
---
