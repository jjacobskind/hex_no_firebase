import React from 'react'
// import PropTypes from 'prop-types'
// import ImmutablePropTypes from 'react-immutable-proptypes'
// import withRedux from 'next-redux-wrapper'
import Head from 'next/head'
import Router from 'next/router'
import styles from 'hex-island/layouts/with_menu_layout/with_menu_layout.css'

const withMenuLayout = (PageComponent) => {
  return (props) => (
    <div className={ styles.component }>
      <Head>
        <title>Hex Island</title>
        <link key='admin-stylesheet' rel='stylesheet' type='text/css' href={ 'static/application.bundle.css'/*_static('admin.bundle.css')*/ } />
      </Head>
      <PageComponent { ...props }/>
    </div>
  )
}

export default withMenuLayout
