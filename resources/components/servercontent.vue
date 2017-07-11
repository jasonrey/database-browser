<template lang="pug">
    .active-only.active-flex.abs.abs-full-size(:class="{ active: connection === selectedConnection }")
        .sidebar.flex-no-shrink.flex.flex-column
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
                        textarea.form-control.flex-grow.monospace
                        .clearfix.bg-muted
                            button.btn.btn-link.btn-sm.pull-right
                                i.glyphicon.glyphicon-remove
                            button.btn.btn-link.btn-sm.pull-right
                                i.glyphicon.glyphicon-star-empty
                    .query-saved.active-only.overflow-auto(:class="{ active: queryTab === 'saved' }")
                        querysaveditem(v-for="(item, index) in savedqueries", :key="index")
                    .query-history.active-only.overflow-auto(:class="{ active: queryTab === 'history' }")
                        queryhistoryitem(v-for="(item, index) in historyqueries", :key="index")

            .content-result.flex-grow(:class="{ 'full-result': selectedResult }")
                .abs.abs-full-width.abs-full-height.overflow-auto
                    resultitem(v-for="(item, index) in results", :key="index", :selected="selectedResult", @viewHistory="selectedResult = null", @viewResult="selectedResult = item")
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
    import { mapState } from 'vuex'

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

                tables: [],
                fullresults: [],
                savedqueries: [],
                historyqueries: [],

                selectedResult: null
            }
        },

        computed: {
            ...mapState([
                'selectedConnection'
            ]),

            results() {
                if (this.selectedResult) {
                    return this.selectedResult;
                }

                return this.fullresults;
            }
        },

        created() {
            this.tables.push({
                name: 'test'
            }, {
                name: 'test2'
            });

            this.fullresults.push(1, 2, 3);
            this.savedqueries.push(1, 2, 3);
            this.historyqueries.push(1, 2, 3);
        }
    }
</script>
