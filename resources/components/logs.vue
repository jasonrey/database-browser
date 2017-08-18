<template lang="pug">
  .active-only.abs.abs-full-size.overflow-auto
    logitem(
      v-for="log in logs"
      :key="log.hash"
      :item="log"
    )
</template>

<script>
import logitem from './logitem.vue'

export default {
  components: {
    logitem
  },

  computed: {
    logs() {
      if (!this.$store) {
        return []
      }

      return this.$store.state.log.items.slice().reverse()
    }
  }
}
</script>
