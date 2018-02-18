import React from 'react';
import styles from './menu_button.css'

const MenuButton = ({ onClick, text }) => (
  <button className={ styles.component } onClick={ onClick }>
    { text }
  </button>
)

export default MenuButton

// const React = require('react');
// const styles = require('./menu_button.css')
//
// const MenuButton = function() {
//   return (
//     <button className={ styles.component } onClick={ this.props.onClick }>
//       { this.props.text }
//     </button>
//   )
// }
//
// module.exports = MenuButton
