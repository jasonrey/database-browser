class Server {
  constructor(data) {
    this.data = {}

    this.update(data)
  }

  update(data) {
    Server.dataKeys.map(key => this.data[key] = data[key])

    return this
  }
}

Server.dataKeys = [
  'name',
  'host',
  'username',
  'password',
  'database',
  'port',
  'useSSH',
  'sshhost',
  'sshusername',
  'sshpassword',
  'sshport',
  'status',
  'color'
]

export default Server
