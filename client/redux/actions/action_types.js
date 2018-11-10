const actions = [
  'AUTH_INPUT_CHANGED',
]

let actionBlob = {}

actions.forEach(action => {
  actionBlob[action] = action
})

export default actionBlob
