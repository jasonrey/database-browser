const mysql = require('mysql')

class Mysql {
  constructor(data) {
    this.db = null

    this.data = data
  }

  get connectioninfo() {
    return {
      host: this.data.host,
      username: this.data.username,
      port: this.data.port
    }
  }

  get connectionname() {
    return this.data.name || this.data.host
  }

  connect() {
    this.db = mysql.createConnection({
      host: this.data.host,
      user: this.data.user || this.data.username,
      password: this.data.password,
      port: this.data.port || 3306
    })

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

  query(query, values) {
    return new Promise((resolve, reject) => {
      this.db.query(query, values, (err, result, fields) => {
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

export default Mysql
