<template lang="pug">
  .item
    .tablename.item-hover(@click="showFields = !showFields")
      span.caret
      =" {{ table.name }}"

      .badge 13

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

  .badge
    position: absolute
    top: 50%
    right: 4px
    transform: translateY(-50%)

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
        this.fields.push({
          name: 'id',
          type: 'int'
        }, {
          name: 'name',
          type: 'varchar'
        });
      }
    }
  }
</script>
