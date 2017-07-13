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

    store.commit('log/action', {
      action: 'createConnection',
      ...this.data
    })
  }

  get logdata() {
    return {
      host: this.host,
      username: this.username,
      port: this.port
    }
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.db.connect(err => {
        if (err) {
          store.commit('log/error', {
            action: 'connect',
            err,
            connection: this.logdata
          })

          return reject(err)
        }

        this.id = this.db.threadId

        store.commit('log/action', {
          action: 'connect',
          id: this.id,
          connection: this.logdata
        })

        resolve(this)
      })
    })
  }

  query(query, values) {
    return new Promise((resolve, reject) => {
      this.db.query(query, values, (err, result, fields) => {
        if (err) {
          store.commit('log/error', {
            action: 'query',
            query,
            values,
            err,
            connection: this.logdata
          })

          return reject(err)
        }

        store.commit('log/query', {
          query,
          values,
          err,
          result,
          fields,
          connection: this.logdata
        })

        resolve([result, fields])
      })
    })
  }

  end() {
    store.commit('log/action', {
      action: 'end',
      connection: this.logdata
    })

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
