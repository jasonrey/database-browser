<template lang="pug">
  .active-only.active-flex.abs.abs-full-size
    .sidebar.flex-no-shrink.flex.flex-column
      .select.flex-no-shrink
        .caret
        select.form-control(v-model="selectedDatabase", @change="selectDatabase(selectedDatabase)")
          option(disabled, :value="null") Select Database
          option(
            v-for="database in databases"
            :key="database"
            :value="database"
          ) {{ database }}
      .flex-grow
        .abs.abs-full-size.overflow-auto
          tableitem(
            v-for="table in tables"
            :key="table.name"
            :table="table"
            :connection="connection"
            :database="selectedDatabase"
          )

      .flex-no-grow.flex-no-shrink.btn-group.btn-group-justified
        .btn-group
          button.btn.btn-default
            i.glyphicon.glyphicon-plus
        .btn-group
          button.btn.btn-default(@click="refresh")
            i.glyphicon.glyphicon-refresh
        .btn-group
          button.btn.btn-default
            i.glyphicon.glyphicon-cog
        .btn-group
          button.btn.btn-default
            i.glyphicon.glyphicon-info-sign
    .flex.flex-grow.flex-column
      .content-query
        ul.nav.nav-tabs
          li(
            :class="{ active: queryTab === '' || queryTab === 'editor' }"
            @click="queryTab = 'editor'"
          )
            a(href="javascript:;") Editor
          li(
            :class="{ active: queryTab === 'saved' }"
            @click="queryTab = 'saved'"
          )
            a(href="javascript:;") Saved
          li(
            :class="{ active: queryTab === 'history' }"
            @click="queryTab = 'history'"
          )
            a(href="javascript:;") History

        .nav-contents
          .active-only.active-flex.flex-column(:class="{ active: queryTab === '' || queryTab === 'editor' }")
            textarea.form-control.flex-grow.monospace(
              v-model="query"
              @keyup.ctrl.enter="execute(query)"
              @keyup.meta.enter="execute(query)"
              :class="{ querying: isQuerying, queryerror: queryError }"
            )
            .bg-muted.flex.flex-align-items-center
              .small.p-5(v-if="query") Count: {{ query.length }}
              .flex-grow
              button.btn.btn-link.btn-sm(@click="save(query)")
                i.glyphicon.glyphicon-star-empty
              button.btn.btn-link.btn-sm(@click="query = ''")
                i.glyphicon.glyphicon-remove
              button.btn.btn-link.btn-sm(@click="execute(query)")
                i.glyphicon.glyphicon-ok
          .active-only.overflow-auto.ph-10(:class="{ active: queryTab === 'saved' }")
            querysaveditem(
              v-for="item in savedqueries"
              :key="item.id"
              :item="item"
              @click="executeSave(item)"
              @remove="removeSave(item)"
            )
          .active-only.overflow-auto.ph-10(:class="{ active: queryTab === 'history' }")
            queryhistoryitem(
              v-for="item in history"
              :key="item.id"
              :item="item"
              @click="executeHistory(item)"
            )

            button.btn.btn-block.btn-warning.mv-10(v-if="history.length", @click="clearHistory")
              strong Clear History

      .content-result.flex-grow(:class="{ 'full-result': selectedResult }")
        resultitem(
          v-if="selectedResult"
          @viewHistory="selectedResult = null"
          :selected="selectedResult"
          :item="selectedResult"
        )

        .abs.abs-full-size.p-10.overflow-auto(v-else)
          resultitem(
            v-for="(item, index) in results"
            @viewResult="selectedResult = item"
            :key="index"
            :selected="selectedResult"
            :item="item"
          )

</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .nav.nav-tabs
    border-bottom-width: 1px

    li
      a
        border: 0
        margin-right: 0

      &.active
        border-bottom: 2px solid $gray-dark

        a
          color: $brand-primary

  .nav-contents
    > div
      height: 200px

  textarea
    border: 0
    resize: none
    z-index: 1

    &.querying
      background-color: rgba($brand-warning, .1)

    &.queryerror
      background-color: rgba($brand-danger, .1)

  .content-result
    border-top: 3px solid $gray-light
</style>

<script>
  import tableitem from './tableitem.vue'
  import resultitem from './resultitem.vue'
  import querysaveditem from './querysaveditem.vue'
  import queryhistoryitem from './queryhistoryitem.vue'

  import Config from '../js/classes/Config.js'

  export default {
    components: {
      tableitem,
      resultitem,
      querysaveditem,
      queryhistoryitem
    },

    props: ['connection'],

    data() {
      return {
        queryTab: '',

        databases: [],
        tables: [],
        results: [],
        savedqueries: [],
        historyqueries: [],

        selectedResult: null,

        selectedDatabase: null,

        query: '',

        isQuerying: false,
        queryError: ''
      }
    },

    computed: {
      history() {
        return this.historyqueries.slice().reverse()
      }
    },

    created() {
      this.refreshDatabases()
        .then(() => {
          if (this.connection.server.database && this.databases.indexOf(this.connection.server.database) >= 0) {
            this.selectDatabase(this.connection.server.database)
          }
        })

      if (this.connection.server.id) {
        let config = Config.get(this.connection.server.id, {})

        if (config.history) {
          this.historyqueries = config.history
        }

        if (config.saved) {
          this.savedqueries = config.saved
        }
      }
    },

    methods: {
      refresh() {
        return this.refreshDatabases()
          .then(result => {
            if (this.selectedDatabase && result.indexOf(this.selectedDatabase) < 0) {
              this.selectDatabase(null)
            }

            if (this.selectedDatabase) {
              return this.refreshTables()
            }
          })
      },

      refreshDatabases() {
        return this.connection.getDatabases()
          .then(result => this.databases = result)
          .catch(err => {
            alert(err)
          })
      },

      refreshTables() {
        this.tables = []

        return this.connection.getTables(this.selectedDatabase)
          .then(result => this.tables = result)
      },

      selectDatabase(db) {
        this.selectedDatabase = db

        if (!db) {
          this.tables = []
          return Promise.resolve()
        }

        return this.connection.useDatabase(db)
          .then(() => this.refreshTables())
      },

      execute(query, recordHistory = true) {
        const date = Date.now()

        query = query.trim()

        if (!query) {
          return
        }

        this.queryError = false
        this.isQuering = true

        let historydata = {
          id: date + '.' + Math.random().toString().slice(2),
          query,
          date,
          selectedDatabase: this.selectedDatabase,
          state: null
        }

        const historyqueriesIndex = this.historyqueries.length

        if (recordHistory) {
          this.historyqueries.push(historydata)
        }

        return this.connection.query(query)
          .then(([result, fields]) => {
            this.results.push({
              query, result, fields, date
            })

            this.selectedResult = this.results[this.results.length - 1]

            this.isQuerying = false

            if (recordHistory) {
              historydata.state = true
              historydata.result = result
              historydata.fields = fields
              historydata.time = Date.now() - date

              this.historyqueries.splice(historyqueriesIndex, 1, historydata)

              this.syncHistory()
            }
          })
          .catch(err => {
            this.isQuerying = false
            this.queryError = err

            if (recordHistory) {
              historydata.state = false
              historydata.err = err
              historydata.time = Date.now() - date

              this.historyqueries.splice(historyqueriesIndex, 1, historydata)

              this.syncHistory()
            }
          })
      },

      executeHistory(item) {
        let result = true

        const processes = []

        if (this.selectedDatabase !== item.selectedDatabase) {
          result = confirm('Query database and selected database is different. This will change the current database.')

          if (result) {
            processes.push(this.selectDatabase(item.selectedDatabase))
          }
        }

        if (!result) {
          return
        }

        return Promise.all(processes)
          .then(() => this.execute(item.query, false))
      },

      clearHistory() {
        if (!confirm('This will clear all history items.')) {
          return
        }

        this.historyqueries = []

        this.syncHistory()
      },

      syncHistory() {
        if (this.connection.server.id) {
          Config.set(this.connection.server.id + '.history', JSON.parse(JSON.stringify(this.historyqueries)))
        }
      },

      save(query) {
        if (!query.trim()) {
          return
        }

        const date = Date.now()

        let savedata = {
          id: date + '.' + Math.random().toString().slice(2),
          query,
          date,
          selectedDatabase: this.selectedDatabase
        }

        this.savedqueries.push(savedata)

        this.syncSave()
      },

      executeSave(item) {
        let result = true

        const processes = []

        if (this.selectedDatabase !== item.selectedDatabase) {
          result = confirm('Query database and selected database is different. This will change the current database.')

          if (result) {
            processes.push(this.selectDatabase(item.selectedDatabase))
          }
        }

        if (!result) {
          return
        }

        return Promise.all(processes)
          .then(() => this.execute(item.query))
      },

      removeSave(item) {
        if (!confirm(`Delete the saved query: ${item.query}?`)) {
          return
        }

        this.savedqueries.splice(this.savedqueries.indexOf(item), 1)

        this.syncSave()
      },

      syncSave() {
        if (this.connection.server.id) {
          Config.set(this.connection.server.id + '.saved', JSON.parse(JSON.stringify(this.savedqueries)))
        }
      }
    }
  }
</script>
