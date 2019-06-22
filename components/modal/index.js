import React from 'react'
import styles from './styles.css'
import classnames from 'classnames'

export default ({ children, visible }) => (
  <div className={ classnames(styles.component, visible && styles.visible) }>
    { children }
  </div>
)
