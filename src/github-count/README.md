# github-count

simple interface for retrieving the counts of comments and commits

## Installation
* include github-count before your scripts.
* you must call `setAccessToken(token)` first to initialize the gitHub Api

## Usage
* `setAccessToken(token);` — `String` returns null
* `getCommentCount(args);` — `Object` returns named Array containing user => count pairs
* `getContribCount(args)` — `Object` returns named Array containing user => count pairs
  * does not do days back, returns a count of all contributors
* `args` object contains 3 properties
  * `repo` — string containing the `owner/repo` path to fetch
  * `daysBack` — (optional) int indicating the number of days to limit the count, default is all days
  * `type` — type of comments to count, can be `repo`, `issue`, or `pull`

Node.js:

```javascript
const gitHub = require('./github-count');
gitHub.setAccessToken('0123456789abcdefghijklmnopqrstuvwxyz');
let args = { repo: 'auth0/node-jsonwebtoken', daysBack: '20', type: 'issue'}
const comments = gitHub.getCommentCount(args);
const contribs = gitHub.contribCount(args);
```

## License

[The MIT License](https://raw.githubusercontent.com/paulmillr/mit/master/README.md)
