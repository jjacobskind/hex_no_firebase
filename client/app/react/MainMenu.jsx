import React from 'react'

export default class MainMenu extends React.Component {
  render() {
    return (
      <div>
        <p class="spaced">
        	<a className="loginBtn" href="">CREATE A NEW GAME</a>
        </p>
        <p class="spaced">
        	<a className="loginBtn" href="">LOAD AN OLDER GAME</a>
        </p>
        <p class="spaced">
        	<a className="loginBtn" href="">JOIN ANOTHER GAME</a>
        </p>
      </div>
    )
  }
}
