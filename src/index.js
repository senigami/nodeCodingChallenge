const config = require('./config')
const ArgumentParser = require('argparse').ArgumentParser
const _ = require('lodash')
const ProgressBar = require('progress')
const asyncEach = require('async-each')
const gitHub = require('./github-count')

let userCounts = {}
let contribs = []

const args = initArgs()
gitHub.setAccessToken(config.GITHUB_PERSONAL_ACCESS_TOKEN)
getGitCommentCounts(args)

function initArgs() {
  // set up command line helps and argument parsing
  const parser = new ArgumentParser({
    addHelp: true,
    description: 'usage example: --repo twbs/bootstrap --period 20d',
  })
  parser.addArgument(['--repo'], {
    help: 'owner/repo i.e. twbs/bootstrap',
    required: true,
  })
  parser.addArgument(['--period'], { help: 'optional days back to scan' })

  return parser.parseArgs()
}

function getGitCommentCounts(req) {
  // type array contains the different areas we will get counts from
  const type = ['repo', 'issue', 'pull', 'contrib']

  // arg for this contains a letter but since it is only days we can clear it
  req.daysBack = parseInt(req.period, 10)

  // display output, if limiting days then add in that info as well
  const since = req.daysBack ? ' for past ' + req.daysBack + ' days' : ''
  console.info('Fetching comments' + since + ' for "' + req.repo + '"...\n')

  // display the progress bar info
  const bar = new ProgressBar('  fetching data [:bar]', {
    complete: '=',
    incomplete: ' ',
    width: 20,
    total: type.length,
    clear: true,
  })
  bar.render()

  // get all info at the same time, increment the progress bar each time we get one
  asyncEach(type, loadCounts, function(error, contents) {
    if (error) {
      console.error(error)
    }
    if (bar.complete) {
      addCommits()
      // replace the progress bar with completion message
      console.log('  complete, presenting results:\n')
      formatOutput(userCounts)
    }
  })

  async function loadCounts(type, markThisDoneCallback) {
    // get the data for this type using args
    let thisRequest = _.clone(args)
    thisRequest.type = type
    if (type === 'contrib') {
      // contrib counts will be combined on completion, just get them for now
      contribs = await gitHub.contribCount(thisRequest)
    } else {
      // combine all comment counts into a single object
      const counts = await gitHub.commentCount(thisRequest)
      addComments(counts)
    }
    // increment the progress bar
    bar.tick()
    markThisDoneCallback() // callback to mark this item complete
  }
}

function formatOutput(obj) {
  // displays the individual comments, commits info
  _.forEach(obj, function(data, name) {
    const line =
      _.padStart(data.comments, 4, ' ') +
      ' comments, ' +
      name +
      ' (' +
      data.commits +
      ' commits)'
    console.info(line)
  })
}

function addComments(obj) {
  // combine the comment counts for this type into the main count container
  _.forEach(obj, function(num, user) {
    if (typeof userCounts[user] === 'undefined') {
      userCounts[user] = {
        comments: 0,
        commits: 0,
      }
    }
    userCounts[user].comments += num
  })
}

function addCommits() {
  // we only need the counts for the comments we already have, ignore the rest
  // this gets called after all data has been fetched and comment counts complete
  _.forEach(userCounts, function(data, user) {
    if (typeof contribs[user] !== 'undefined') {
      userCounts[user].commits = contribs[user]
    }
  })
}
