const mysql = require('mysql')

class Connection {
  constructor(data) {
    this.db = mysql.createConnection({
      host: data.host,
      user: data.user || data.username,
      password: data.password,
      port: data.port || 3306
    })

    Connection.dataKeys.map(key => this[key] = data[key])
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db.connect(err => {
        if (err) {
          return reject(err)
        }

        this.id = this.db.threadId

        resolve(this)
      })
    })
  }

  query(sql, values) {
    return new Promise((resolve, reject) => {
      this.db.query(sql, values, (err, result, fields) => {
        if (err) {
          return reject(err)
        }

        resolve([result, fields])
      })
    })
  }

  end() {
    return this.db.end()
  }
}

Connection.dataKeys = [
  'name',
  'host',
  'username',
  'password',
  'port',
  'useSSH',
  'sshhost',
  'sshusername',
  'sshpassword',
  'sshport',
  'status'
]

export default Connection
