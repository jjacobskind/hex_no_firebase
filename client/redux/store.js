import { createStore, applyMiddleware } from 'redux'
import { combineReducers } from 'redux-immutable'
import thunk from 'redux-thunk'
import { routerReducer as router } from 'react-router-redux'
import { fromJS, List, Map } from 'immutable'

const createReducer = (additionalReducerMap) => {
  const defaultReducerOject = new Map({ router })
  return combineReducers(defaultReducerOject.merge(additionalReducerMap).toJS())
}

export default (reducerMap = new Map(), middleware = new List()) => {
  return (initialState) => {
    return createStore(
      createReducer(reducerMap),
      fromJS(initialState),
      applyMiddleware(thunk, ...middleware.toJS())
    )
  }
}
