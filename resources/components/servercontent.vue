<template lang="pug">
  .active-only.active-flex.abs.abs-full-size
    .sidebar.flex-no-shrink.flex.flex-column
      .select.flex-no-shrink
        .caret
        select.form-control(v-model="selectedDatabase")
          option(disabled, :value="null") Select Database
          option(v-for="database in databases", :key="database", :value="database") {{ database }}
      .flex-grow
        .abs.abs-full-size.overflow-auto
          tableitem(v-for="table in tables", :key="table.name", :table="table")

      .flex-no-grow.flex-no-shrink.btn-group.btn-group-justified
        .btn-group
          button.btn.btn-default
            i.glyphicon.glyphicon-plus
        .btn-group
          button.btn.btn-default
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
          li(:class="{ active: queryTab === '' || queryTab === 'editor' }", @click="queryTab = 'editor'")
            a(href="javascript:;") Editor
          li(:class="{ active: queryTab === 'saved' }", @click="queryTab = 'saved'")
            a(href="javascript:;") Saved
          li(:class="{ active: queryTab === 'history' }", @click="queryTab = 'history'")
            a(href="javascript:;") History

        .nav-contents
          .active-only.active-flex.flex-column(:class="{ active: queryTab === '' || queryTab === 'editor' }")
            textarea.form-control.flex-grow.monospace(v-model="query", @keyup.ctrl.enter="execute", :class="{ querying: isQuerying, queryerror: queryError }")
            .bg-muted.flex.flex-align-items-center
              .small.p-5(v-if="query") Count: {{ query.length }}
              .flex-grow
              button.btn.btn-link.btn-sm
                i.glyphicon.glyphicon-star-empty
              button.btn.btn-link.btn-sm(@click="query = ''")
                i.glyphicon.glyphicon-remove
              button.btn.btn-link.btn-sm(@click="execute")
                i.glyphicon.glyphicon-ok
          .query-saved.active-only.overflow-auto(:class="{ active: queryTab === 'saved' }")
            querysaveditem(v-for="(item, index) in savedqueries", :key="index")
          .query-history.active-only.overflow-auto(:class="{ active: queryTab === 'history' }")
            queryhistoryitem(v-for="(item, index) in historyqueries", :key="index")

      .content-result.flex-grow(:class="{ 'full-result': selectedResult }")
        .abs.abs-full-width.abs-full-height.overflow-auto
          resultitem(v-if="selectedResult", :selected="selectedResult", @viewHistory="selectedResult = null", :item="selectedResult")

          .p-10(v-else)
            resultitem(v-for="(item, index) in results", :key="index", :selected="selectedResult", @viewResult="selectedResult = item", :item="item")

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

  .query-saved, .query-history
    padding: 0 10px

  .content-result
    border-top: 1px solid $gray-light

    > .abs
      padding: 10px

    &.full-result

      > .abs
        padding: 0
</style>

<script>
  import tableitem from './tableitem.vue'
  import resultitem from './resultitem.vue'
  import querysaveditem from './querysaveditem.vue'
  import queryhistoryitem from './queryhistoryitem.vue'

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

    watch: {
      selectedDatabase(newValue) {
        this.connection.useDatabase(newValue)
          .then(() => this.refreshTables())
      }
    },

    created() {
      this.refreshDatabases()
        .then(() => {
          if (this.connection.data.database && this.databases.indexOf(this.connection.data.database) >= 0) {
            this.selectedDatabase = this.connection.data.database
          }
        })
    },

    methods: {
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

      execute() {
        if (!this.query.trim()) {
          return
        }

        this.queryError = false
        this.isQuering = true

        return this.connection.query(this.query)
          .then(([result, fields]) => {
            this.results.push({
              result, fields
            })

            this.selectedResult = this.results[this.results.length - 1]

            this.isQuerying = false

          })
          .catch(err => {
            this.isQuerying = false
            this.queryError = err
          })
      }
    }
  }
</script>
