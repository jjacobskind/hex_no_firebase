import React from 'react'
import MenuButton from 'hex-island/components/menu_button'
import LoginModal from 'hex-island/components/modal/login'
import openLoginPopup from 'hex-island/helpers/openLoginPopup'
import styles from 'hex-island/components/homepage/styles.css'

class Homepage extends React.Component {

  constructor(props) {
    super(props)
    this.state = { loginModalVisible: false }
  }

  _signInUser = (user) => {
    console.log(user)
  }

  render() {
    const { loginModalVisible } = this.state
    const { inputChanged, loginFormSubmitted } = this.props

    return (
      <div className={ styles.component }>
        <h1 className={ styles.gameTitle }>Hex Island</h1>
        <MenuButton
          onClick={ () => { this.setState({ loginModalVisible: true }) } }
        >
          Sign In
        </MenuButton>
        <div className={ styles.footer }>
          By Team Hex:&nbsp;
          <a href='http://github.com/jjacobskind' target='blank'>Jeremy Jacobskind</a>,&nbsp;
          <a href='http://www.steveromain.com/' target='blank'>Steve Romain</a>,
          & <a href='http://github.com/lokeam' target='blank'>Ahn Ming Loke</a>.
        </div>

        <LoginModal
          inputChanged={ inputChanged }
          onClose={ () => { this.setState({ loginModalVisible: false }) } }
          onSubmit={ loginFormSubmitted }
          visible={ loginModalVisible }
        />
      </div>
    )
  }
}

export default Homepage
