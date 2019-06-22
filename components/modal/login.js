import React from 'react'
import Modal from 'hex-island/components/modal'
import MenuButton from 'hex-island/components/menu_button'
import styles from './styles.css'

export default ({ inputChanged, onClose, onSubmit, visible }) => {

  return (
    <Modal onClose = { onClose } visible = { visible }>
      <form>
        <div className={ styles.row }>
          <div className={ styles.leftCol }>
            Email:
          </div>
          <div className={ styles.rightCol }>
            <input type='text' name='email' onChange={ (e) => { inputChanged('email', e.target.value) } } />
          </div>
        </div>
        <div className={ styles.row }>
          <div className={ styles.leftCol }>
            Password:
          </div>
          <div className={ styles.rightCol }>
            <input type='password' name='password' onChange={ (e) => { inputChanged('password', e.target.value) } } />
          </div>
        </div>
        <div className={ styles.row }>
          <MenuButton onClick={ onSubmit }>Sign In</MenuButton>
        </div>
      </form>
    </Modal>
  )
}
