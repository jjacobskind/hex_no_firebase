import axios from 'axios'

const axiosInstance =  axios.create({
  headers: {},
  validateStatus: (code) => (code < 400)
})

class ApiClient {
  constructor(method, path) {
    this.axiosOptions = {
      method,
      data: {},
      headers: {},
      params: {},
      url: path
    }
  }

  body = (newBody) => {
    this.axiosOptions.data = newBody
    return this
  }

  headers = (newHeaders) => {
    this.axiosOptions.headers = newHeaders
    return this
  }

  params = (newParams) => {
    this.axiosOptions.params = newParams
    return this
  }

  send = () => {
    axiosInstance.request(this.axiosOptions)
  }
}

export default {
  get:  (path) => { return new ApiClient("get", path) },
  post: (path) => { return new ApiClient("post", path) },
  put:  (path) => { return new ApiClient("put", path) },
}
