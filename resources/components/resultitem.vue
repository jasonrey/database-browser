<template lang="pug">
  .result-item.mb-10.flex.flex-column(:class="{ bordered: !selected, 'abs abs-full-size': selected }")
    .bg-info.flex-no-shrink.flex.flex-align-items-center
      button.btn.btn-link.btn-xs.flex-no-shrink(v-if="selected", @click="$emit('viewHistory')")
        i.glyphicon.glyphicon-menu-left
        span History
      .flex-grow.monospace.p-5 {{ item.query }}

      span.small.flex-no-shrink.m-5(v-if="hasCount") {{ count }} row{{ count > 1 ? 's' : '' }}
      span.small.flex-no-shrink.m-5 1.12s
      span.small.flex-no-shrink.m-5 {{ date }}

      button.btn.btn-link.btn-xs.flex-no-shrink(v-if="!selected", @click="$emit('viewResult')") View Full Result
        i.glyphicon.glyphicon.glyphicon-menu-right
    .result.flex-grow(:class="{ cropped: !selected }")
      .overflow-auto(:class="{ 'abs abs-full-size': selected }")
        table.table.table-condensed.table-hover.table-striped.table-bordered.small.m-0(v-if="rows.length")
          thead
            tr
              th(v-for="field in item.fields", :key="field.name") {{ field.name }}
          tbody
            tr(v-for="(row, index) in rows", :key="index")
              td(v-for="field in item.fields", :key="index + '-' + field.name") {{ row[field.name] }}

          tfoot(v-if="item.result.length > 5 && !selected")
            tr
              td(:colspan="item.fields.length")
                button.btn.btn-link.btn-xs(@click="$emit('viewResult')") ... {{ item.result.length - rows.length }} more rows

</template>

<style lang="sass" scoped>
  @import '../sass/colors'

  .bordered
    border: 1px solid $gray-light

  .cropped
    max-height: 400px

</style>

<script>
  import moment from 'moment'

  export default {
    props: ['selected', 'item'],

    computed: {
      hasCount() {
        return this.item.fields
      },

      count() {
        if (!this.hasCount) {
          return false
        }

        return this.item.result.length
      },

      date() {
        return moment(this.item.date).format('YYYY-MM-DD HH:mm:ss')
      },

      rows() {
        if (!this.item.fields) {
          return []
        }

        if (this.selected) {
          return this.item.result
        }

        return this.item.result.slice(0, 5)
      }
    }
  }
</script>
