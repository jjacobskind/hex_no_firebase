import React from 'react';
import styles from './styles.css'

const MenuButton = ({ onClick, children }) => (
  <button className={ styles.component } onClick={ (e) => { e.preventDefault(); onClick() } }>
    { children }
  </button>
)

export default MenuButton
