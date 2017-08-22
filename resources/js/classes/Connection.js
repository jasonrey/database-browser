/* global store */
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

  async connect() {
    try {
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
  'sshport',
  'status'
]

export default Connection
