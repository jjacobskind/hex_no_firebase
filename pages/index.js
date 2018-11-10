import React from 'react'
import withRedux from 'next-redux-wrapper'
import { Map } from 'immutable'

import withMenuLayout from 'hex-island/layouts/with_menu_layout'
import HomepageContainer from 'hex-island/containers/homepage'

import createStore from 'hex-island/client/redux/store'
import auth from 'hex-island/client/redux/reducers/auth'

const store = createStore(Map({ auth }))

export default withRedux(store)(withMenuLayout(HomepageContainer))
