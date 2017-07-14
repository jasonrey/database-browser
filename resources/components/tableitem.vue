<template lang="pug">
  .item
    .item-hover.flex.flex-align-items-center(@click="showFields = !showFields")
      span.caret.flex-no-shrink
      .tablename.small.flex-grow(:title="table.name")=" {{ table.name }}"
      .label.label-default.label-xs.flex-no-shrink {{ table.total }}

    ul(v-show="showFields")
      li.monospace(v-for="field in fields", :key="field.name")
        span.field-name {{ field.name }}
        span.field-type {{ field.type }}
</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .item
    border-bottom: 1px solid $gray-light

    &:last-child
      border-bottom: 0

  .tablename
    padding: 10px 0
    white-space: pre
    text-overflow: ellipsis
    overflow: hidden

  .field-type
    &::before
      content: ' ['

    &::after
      content: ']'
</style>

<script>
  export default {
    props: ['table'],

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
      }
    }
  }
</script>
