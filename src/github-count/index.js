const apiBase = 'https://api.github.com'
const axios = require('axios')
let http

exports.setAccessToken = setAccessToken
exports.commentCount = getCommentCount
exports.contribCount = getContribCount

function setAccessToken(token) {
  // must be called first to establish the http request function
  http = axios.create({
    baseURL: apiBase,
    headers: {
      Authorization: `token ${token}`,
    },
  })
}

async function getCommentCount(args) {
  // ensure token has been set
  if (typeof http === 'undefined') {
    showError('Must call setAccessToken first')
  }
  try {
    // get date object for back day
    if (typeof args.daysBack === 'number') {
      args.backDate = getBackDate(args.daysBack)
    }

    // call the api
    const url = buildURL(args)
    const response = await http.get(url)
    // return extracted counts
    return processCountResponse(response, args)
  } catch (err) {
    showError(err)
  }
}
function processCountResponse(response, args) {
  let userCounts = {}

  // repo type does not have a param for days back so we have to find the date manually
  const manualStop = args.type === 'repo' && typeof args.daysBack === 'number'

  for (let i = 0; i < response.data.length; i++) {
    if (manualStop) {
      const thisDate = new Date(response.data[i].created_at)
      if (args.backDate - thisDate < 0) {
        break // once we hit the manual threshold we are done
      }
    }
    // add the current user counts into the object
    incrementUser(userCounts, response.data[i].user.login)
  }
  return userCounts
}

async function getContribCount(args) {
  // ensure token has been set
  if (typeof http === 'undefined') {
    showError('Must call setAccessToken first')
  }
  try {
    // not doing days back, just get total
    const response = await http.get(buildURL(args))
    // return extracted counts
    return processContribResponse(response, args)
  } catch (err) {
    showError(err)
  }
}
function processContribResponse(response, args) {
  let userCounts = {}

  for (let i = 0; i < response.data.length; i++) {
    const user = response.data[i].author.login
    // add the current user counts into the object
    incrementUser(userCounts, user, response.data[i].total)
  }
  return userCounts
}

function incrementUser(obj, user, count = 1) {
  // if the user exists add to the count, if not then create it
  if (typeof obj[user] === 'undefined') {
    obj[user] = 0
  }
  obj[user] += count
}

function getBackDate(daysBack) {
  // use the number of days back to create a date object
  let backDate = new Date()
  backDate.setDate(backDate.getDate() - daysBack)
  return backDate
}

function buildURL(args) {
  // create the url to fetch based on the type of item we are fetching
  switch (args.type) {
    case 'repo':
      return '/repos/' + args.repo + '/comments'

    case 'issue':
      return '/repos/' + args.repo + '/issues/comments' + since(args)

    case 'pull':
      return '/repos/' + args.repo + '/pulls/comments' + since(args)

    case 'contrib':
      return '/repos/' + args.repo + '/stats/contributors'

    default:
      return ''
  }
}

function since(args) {
  try {
    if (typeof args.backDate === 'object') {
      return '?since=' + args.backDate.toISOString()
    }
  } catch (err) {
    return ''
  }
  return ''
}

function showError(err) {
  // if we have an error display it and then kill the script
  if (!err) {
    return
  }
  console.error('\n' + err)
  process.exit(1)
}
