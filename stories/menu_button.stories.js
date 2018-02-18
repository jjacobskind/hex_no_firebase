import React from 'react'
import MenuButton from '../components/menu_button'
import { storiesOf } from '@storybook/react';

const containerStyles = {
  backgroundColor: 'orange',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '300px',
}

storiesOf('MenuButton')
  .add('default', () => (
    <div style={ containerStyles }>
      <MenuButton text='Submit' />
    </div>
  ))
