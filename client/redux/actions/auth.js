import {push} from 'react-router-redux'
import ActionTypes from 'client/redux/actions/action_types'

export const setUser = (user) => ({
  type: SET_USER,
  payload: user
});

export const clearUser = () => {
  return { type: CLEAR_USER };
}

export const authInputChanged = (attributeName, value) => ({
  type: ActionTypes.AUTH_INPUT_CHANGED,
  attributeName,
  value,
})

export const loginFormSubmitted = () => (
  (dispatch, getStore) => {
    console.log("HEY")
    console.log(getStore().auth)
  }
)

export const authSignupSubmitted = () => {

}

export const logout = () => {
  return async (dispatch) => {
    return extendedFetch('/auth/logout', { method: 'POST' })
      .then(json => {
        dispatch(clearUser());
      });
  }
}
