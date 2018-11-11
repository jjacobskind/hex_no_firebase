import {push} from 'react-router-redux'
import ActionTypes from 'hex-island/client/redux/actions/action_types'
import * as AuthApi from 'hex-island/client/api/auth'

export const setUser = (user) => ({
  type: SET_USER,
  payload: user
});

export const clearUser = () => {
  return { type: CLEAR_USER }
}

export const authInputChanged = (attributeName, value) => ({
  type: ActionTypes.AUTH_INPUT_CHANGED,
  attributeName,
  value,
})

export const loginFormSubmitted = () => (
  async (dispatch, getState) => {
    const authState = getState().get("auth")
    const email = authState.get("email")
    const password = authState.get("password")
    // dispatch(loginStarted())

    try {
      const response = await AuthApi.login(email, password)

      // dispatch(loginSucceeded())
    } catch (error) {
      // dispatch(loginFailed())
    }

    // dispatch(loginCompleted())
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
