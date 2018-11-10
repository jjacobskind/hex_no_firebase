import React from 'react'
import { connect } from 'react-redux'
import Homepage from 'hex-island/components/homepage'
import {
  authInputChanged,
  authSignupSubmitted,
  loginFormSubmitted,
} from 'client/redux/actions/auth'

const mapStateToProps = (state) => {
  return {
    authenticationToken: state.getIn(['auth', 'authenticationToken']),
    email: state.getIn(['auth', 'email']),
    firstName: state.getIn(['auth', 'firstName']),
    lastName: state.getIn(['auth', 'lastName']),
    password: state.getIn(['auth', 'password'])
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    loginFormSubmitted: () => {
      dispatch(loginFormSubmitted())
    },
    inputChanged: (attributeName, value) => {
      dispatch(authInputChanged(attributeName, value))
    },
  }
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Homepage)
