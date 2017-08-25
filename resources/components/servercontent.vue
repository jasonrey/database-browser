<template lang="pug">
  .active-only.active-flex.abs.abs-full-size(:class="'tag-' + connection.server.color")
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
        .loader-bar.active-only(:class="{ active: isLoadingTable }")
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
          button.btn.btn-default(@click="newtable")
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
            .query-editor(
              :id="editorId"
              @keyup.ctrl.enter="execute()"
              @keyup.meta.enter="execute()"
            )

            .bg-muted.flex.flex-align-items-center
              .small.p-5(v-if="query") Count: {{ query.length }}
              .flex-grow
              button.btn.btn-link.btn-sm(@click="save")
                i.glyphicon.glyphicon-star-empty
              button.btn.btn-link.btn-sm(@click="clearQuery")
                i.glyphicon.glyphicon-remove
              button.btn.btn-link.btn-sm(@click="execute()")
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

            button.btn.btn-block.btn-default.mv-10(v-if="history.length", @click="clearHistory")
              strong Clear History

      .content-result.flex-grow(:class="{ 'full-result': selectedResult }")
        .loader-bar.active-only(:class="{ active: isQuerying }")
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
    modal(:modal="modal")
</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  $tagColors: (red: $tag-red, orange: $tag-orange, yellow: $tag-yellow, green: $tag-green, blue: $tag-blue, purple: $tag-purple)

  @each $tag, $color in $tagColors
    .tag-#{$tag}
      background-color: rgba($color, .05)

  .query-editor
    height: 100%

  .nav.nav-tabs
    border-bottom-width: 1px

    li
      a
        border: 0
        margin-right: 0
        background-color: transparent

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
    background-color: transparent

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

import modal from './modal.vue'

import Config from '../js/classes/Config.js'

import Ace from 'brace'
import 'brace/mode/sql'
import 'brace/theme/sqlserver'

export default {
  components: {
    tableitem,
    resultitem,
    querysaveditem,
    queryhistoryitem,
    modal
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

      editorId: '',
      editor: null,

      isQuerying: false,
      queryError: '',

      isLoadingTable: false,

      modal: {
        show: false,
        type: '',
        title: '',
        content: '',
        cancel: null,
        ok: null
      }
    }
  },

  computed: {
    history() {
      return this.historyqueries.slice().reverse()
    }
  },

  async created() {
    this.editorId = 'editor-' + Math.random().toString().slice(2) + Date.now()

    if (this.connection.server.id) {
      let config = Config.get(this.connection.server.id, {})

      if (config.history) {
        this.historyqueries = config.history
      }

      if (config.saved) {
        this.savedqueries = config.saved
      }
    }

    await this.refreshDatabases()

    if (this.connection.server.database && this.databases.indexOf(this.connection.server.database) >= 0) {
      this.selectDatabase(this.connection.server.database)
    }
  },

  mounted() {
    this.editor = ace.edit(this.editorId)

    this.editor.getSession().setMode('ace/mode/sql')
    this.editor.setTheme('ace/theme/sqlserver')
  },

  methods: {
    async refresh() {
      const result = await this.refreshDatabases()

      if (this.selectedDatabase && result.indexOf(this.selectedDatabase) < 0) {
        this.selectDatabase(null)
      }

      if (this.selectedDatabase) {
        return await this.refreshTables()
      }
    },

    async refreshDatabases() {
      try {
        this.databases = await this.connection.getDatabases()

        return this.databases
      } catch (err) {
        alert(err)
      }
    },

    async refreshTables() {
      this.isLoadingTable = true

      this.tables = await this.connection.getTables(this.selectedDatabase)

      this.isLoadingTable = false
    },

    async selectDatabase(db) {
      this.selectedDatabase = db

      if (!db) {
        this.tables = []
        return Promise.resolve()
      }

      await this.connection.useDatabase(db)

      return await this.refreshTables()
    },

    async execute(query, recordHistory = true) {
      const date = Date.now()

      query = (query ||
        this.editor.session.getTextRange(this.editor.getSelectionRange()) ||
        this.editor.getValue()
      ).trim()

      if (!query) {
        return
      }

      this.queryError = false
      this.isQuerying = true

      let historydata = {
        id: date + '-' + Math.random().toString().slice(2),
        query,
        date,
        selectedDatabase: this.selectedDatabase,
        state: null
      }

      const historyqueriesIndex = this.historyqueries.length

      if (recordHistory) {
        this.historyqueries.push(historydata)
      }

      try {
        const [result, fields] = await this.connection.query(query)

        const time = Date.now() - date

        this.results.push({
          query, result, fields, date, time
        })

        this.selectedResult = this.results[this.results.length - 1]

        this.isQuerying = false

        if (recordHistory) {
          historydata.state = true
          historydata.result = result
          historydata.fields = fields
          historydata.time = time

          this.historyqueries.splice(historyqueriesIndex, 1, historydata)

          this.syncHistory()
        }
      } catch (err) {
        this.isQuerying = false
        this.queryError = err

        if (recordHistory) {
          historydata.state = false
          historydata.err = err
          historydata.time = Date.now() - date

          this.historyqueries.splice(historyqueriesIndex, 1, historydata)

          this.syncHistory()
        }
      }
    },

    clearQuery() {
      this.editor.setValue('')
    },

    async executeHistory(item) {
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

      await Promise.all(processes)

      this.execute(item.query, false)
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
        id: date + '-' + Math.random().toString().slice(2),
        query,
        date,
        selectedDatabase: this.selectedDatabase
      }

      this.savedqueries.push(savedata)

      this.syncSave()
    },

    async executeSave(item) {
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

      await Promise.all(processes)

      this.execute(item.query)
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
    },

    newtable() {
      this.modal.type = 'newtable'
      this.modal.show = true
    }
  }
}
</script>
