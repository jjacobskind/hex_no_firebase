import React from 'react'
import MenuButton from 'hex-island/components/menu_button'
import styles from 'hex-island/components/homepage/styles.css'

class Homepage extends React.Component {
  render() {
    return (
      <div className={ styles.component }>
        <h1 className={ styles.gameTitle }>Hex Island</h1>
        <MenuButton
          text="Login With Facebook"
        />
        <div className={ styles.footer }>
          By Team Hex:&nbsp;
          <a href="http://github.com/jjacobskind" target="blank">Jeremy Jacobskind</a>,&nbsp;
          <a href="http://www.steveromain.com/" target="blank">Steve Romain</a>,
          & <a href="http://github.com/lokeam" target="blank">Ahn Ming Loke</a>.
        </div>
      </div>
    )
  }
}

export default Homepage
