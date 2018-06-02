import Router from 'next/router'

export default (cb) => {
  const width = 400, height = 500;
  const left = screen.width/2 - width/2;
  const top = screen.height/2 - height/2;

  const options = {
    scrollbars: 'no',
    menubar: 'no',
    toolbar: 'no',
    location: 'no',
    status: 'no',
    width,
    height,
    left,
    top,
  }

  let optionsArr = [];
  for(let key in options) {
    optionsArr.push(`${key}=${options[key]}`);
  }

  window.login = cb
  window.open('/auth/facebook', '', optionsArr.join());
}
