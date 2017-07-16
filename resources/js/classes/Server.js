class Server {
  constructor(data) {
    this.update(data)

    if (!this.id) {
      this.id = Date.now() + '.' + Math.random().toString().slice(2)
    }
  }

  update(data) {
    Server.dataKeys.map(key => this[key] = data[key])

    return this
  }
}

Server.dataKeys = [
  'id',
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
