/* global store */
const tunnel = require('open-ssh-tunnel')
const getPort = require('get-port')
const fs = require('fs')

import mysql from '../adapters/mysql.js'

const adapters = {
  mysql
}

class Connection {
  constructor(data, adapter = 'mysql') {
    let filteredData = Connection.dataKeys.reduce((result, key) => {
      result[key] = data[key]
      return result
    }, {})

    this.adapter = new adapters[adapter](filteredData)

    this.server = filteredData

    store.commit('log/action', {
      action: 'createConnection',
      connection: this.adapter.connectioninfo
    })
  }

  get name() {
    return this.adapter.connectionname
  }

  async createTunnel() {
    const freeport = await getPort()

    return new Promise(async (resolve, reject) => {
      const options = {
        username: this.server.sshusername,
        host: this.server.sshhost,
        port: this.server.sshport,
        dstAddr: this.server.host,
        dstPort: this.server.port,
        localAddr: '127.0.0.1',
        localPort: freeport,
        srcAddr: '127.0.0.1',
        srcPort: freeport,
        readyTimeout: 5000,
        forwardTimeout: 5000
      }

      if (this.server.sshpassword) {
        options.password = this.server.sshpassword
      } else {
        try {
          options.privateKey = fs.readFileSync((this.server.sshprivatekey || '~/.ssh/id_rsa').replace('~', process.env.HOME))
        } catch (err) {
          return reject(err)
        }
      }

      try {
        this.tunnel = await tunnel(options)
      } catch (err) {
        return reject(err)
      }

      this.adapter.data.port = freeport

      resolve(this.tunnel)
    })
  }

  async connect() {
    try {
      if (this.server.useSSH) {
        await this.createTunnel()
      }

      await this.adapter.connect()

      store.commit('log/action', {
        action: 'connect',
        connection: this.adapter.connectioninfo,
        payload: {
          id: this.id
        }
      })
    } catch (err) {
      store.commit('log/error', {
        connection: this.adapter.connectioninfo,
        action: 'connect',
        err
      })

      throw err
    }
  }

  async query(query, values) {
    try {
      const [result, fields] = await this.adapter.query(query, values)

      store.commit('log/query', {
        connection: this.adapter.connectioninfo,
        query,
        values,
        result,
        fields
      })

      return [result, fields]
    } catch (err) {
      store.commit('log/error', {
        connection: this.adapter.connectioninfo,
        action: 'query',
        err,
        payload: {
          query,
          values
        }
      })

      throw err
    }
  }

  end() {
    store.commit('log/action', {
      action: 'end',
      connection: this.adapter.connectioninfo
    })

    if (this.server.useSSH) {
      this.tunnel.close()
    }

    return this.adapter.end()
  }

  async getDatabases() {
    const [result] = await this.query('show databases')

    return result
      .map(item => item.Database)
      .filter(item => [
        'performance_schema',
        'information_schema',
        'mysql',
        'sys'
      ].indexOf(item) === -1)
  }

  useDatabase(db) {
    return this.query('use ??', [db])
  }

  async getTables(db) {
    const [result] = await this.query('select table_name as name, table_rows as total from information_schema.tables where table_schema = ?', [db])

    return result
  }

  getResult(query) {
    return this.query(query)
  }

  async getColumns(db, table) {
    const [result] = await this.query('show full columns from ??.??', [db, table])

    return result.map(item => {
      const openBracketIndex = item.Type.indexOf('(')
      const closeBracketIndex = item.Type.indexOf(')')
      let type = item.Type
      let length = 0

      if (openBracketIndex >= 0) {
        type = item.Type.slice(0, openBracketIndex)
        length = item.Type.slice(openBracketIndex + 1, closeBracketIndex)
      }

      return {
        name: item.Field,
        type,
        length
      }
    })
  }
}

Connection.adapters = {}

Connection.dataKeys = [
  'id',
  'color',
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
  'sshprivatekey',
  'sshport',
  'status'
]

export default Connection
