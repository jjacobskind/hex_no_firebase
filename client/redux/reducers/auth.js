import { fromJS } from 'immutable'
import ActionTypes from 'client/redux/actions/action_types'

const initialState = fromJS({
  email: '',
  firstName: '',
  formEnteredPassword: '',
  lastName: '',
})

export default (state = initialState, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER:
      return action.payload
    case ActionTypes.CLEAR_USER:
      return null;
    case ActionTypes.AUTH_INPUT_CHANGED:
      return state.set(action.attributeName, action.value)
    default:
      return state;
  }
}
