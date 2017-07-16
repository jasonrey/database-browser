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

    this.data = filteredData

    store.commit('log/action', {
      action: 'createConnection',
      connection: this.adapter.connectioninfo
    })
  }

  get name() {
    return this.adapter.connectionname
  }

  connect() {
    return this.adapter.connect()
      .then(() => {
        this.id = this.adapter.id

        store.commit('log/action', {
          action: 'connect',
          connection: this.adapter.connectioninfo,
          payload: {
            id: this.id
          }
        })
      })
      .catch(err => {
        store.commit('log/error', {
          connection: this.adapter.connectioninfo,
          action: 'connect',
          err
        })

        throw new Error(err)
      })
  }

  query(query, values) {
    return this.adapter.query(query, values)
      .then(([result, fields]) => {
        store.commit('log/query', {
          connection: this.adapter.connectioninfo,
          query,
          values,
          result,
          fields
        })

        return [result, fields]
      })
      .catch(err => {
        store.commit('log/error', {
          connection: this.adapter.connectioninfo,
          action: 'query',
          err,
          payload: {
            query,
            values
          }
        })

        throw new Error(err)
      })
  }

  end() {
    store.commit('log/action', {
      action: 'end',
      connection: this.adapter.connectioninfo
    })

    return this.adapter.end()
  }

  getDatabases() {
    return this.query('show databases')
      .then(([result]) => result.map(item => item.Database).filter(item => [
        'performance_schema',
        'information_schema',
        'mysql',
        'sys'
      ].indexOf(item) === -1))
  }

  useDatabase(db) {
    return this.query('use ??', [db])
  }

  getTables(db) {
    return this.query('select table_name as name, table_rows as total from information_schema.tables where table_schema = ?', [db])
      .then(([result, fields]) => result)
  }

  getResult(query) {
    return this.query(query)
  }

  getColumns(db, table) {
    return this.query('show full columns from ??.??', [db, table])
      .then(([result, fields]) => {
        return result.map(item => {
          let openBracketIndex = item.Type.indexOf('(')
          let closeBracketIndex = item.Type.indexOf(')')
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
      })
  }
}

Connection.adapters = {}

Connection.dataKeys = [
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
  'status'
]

export default Connection
