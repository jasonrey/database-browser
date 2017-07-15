<template lang="pug">
  .item
    .item-hover.flex.flex-align-items-center(@click="showFields = !showFields")
      span.caret.flex-no-shrink.mh-5
      .tablename.small.flex-grow.pv-10(:title="table.name")
        strong {{ table.name }}
      .label.label-default.label-xs.flex-no-shrink.mh-5 {{ table.total }}

    .ph-5.pb-5.small(v-if="showFields")
      .fields
        .field.p-5.pl-10.flex(v-for="field in fields", :key="field.name")
          .flex-grow {{ field.name }}
          .flex-no-shrink.monospace {{ field.type + (field.length ? '(' + field.length + ')' : '')}}
</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .item
    border-bottom: 1px solid $gray-light

    &:last-child
      border-bottom: 0

  .tablename
    white-space: pre
    text-overflow: ellipsis
    overflow: hidden

  .fields
    border-top: 1px solid $gray-light

  .field
    &:hover
      background-color: $gray-lighter
</style>

<script>
  export default {
    props: ['table', 'connection', 'database'],

    data() {
      return {
        showFields: false,
        fields: []
      }
    },

    watch: {
      showFields(newValue) {
        if (newValue && this.fields.length === 0) {
          this.initFields();
        }
      }
    },

    methods: {
      initFields() {
        return this.connection.getColumns(this.database, this.table.name)
          .then(fields => this.fields = fields)
      }
    }
  }
</script>
