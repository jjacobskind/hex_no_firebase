import React from 'react'
import Helmet from 'react-helmet'

export default class MenuApp extends React.Component {
  render() {
    const { playerName } = this.props;

    (<Helmet>
      <link rel='stylesheet' href='//maxcdn.bootstrapcdn.com/bootstrap/3.3.1/css/bootstrap.min.css' />
      <link rel='stylesheet' href='app/normalise.css' />
      <link rel='stylesheet' href='app/main/main.css' />
      <link rel='stylesheet' href='app.css' />
      <link rel='stylesheet' href='app/test.css' />
      <link href='//fonts.googleapis.com/css?family=Muli:400,300' rel='stylesheet' type='text/css' />
    </Helmet>)

    return (
      <div className='MenuApp'>
        <div className ='site-wrapper-inner'>
          <div className='inner cover'>
            <h1 className='cover-heading gameTitle'>Hex Island</h1>
            { playerName && <h3>Welcome to Hex Island, { playerName }</h3> }
          </div>
        </div>
      </div>
    )
  }
}
