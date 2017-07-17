<template lang="pug">
  .modal.abs(:class="{ active: modal.show }")
    .modal-dialog.mt-5
      div(
        v-if="modal.type"
        :is="modal.type"
        :modal="modal"
        @cancel="cancel"
        @ok="ok"
      )

</template>

<style lang="sass">
  .modal
    background-color: rgba(black, .5)

    &.active
      display: block

  .modal-header
    .close
      z-index: 1
</style>

<script>
  import remove from './modals/remove.vue'
  import error from './modals/error.vue'

  export default {
    props: ['modal'],

    components: {
      remove,
      error
    },

    methods: {
      cancel() {
        this.modal.show = false

        return Promise.resolve(typeof this.modal.cancel === 'function' ? this.modal.cancel() : true)
          .then(() => this.modal.cancel = null)
      },

      ok() {
        this.modal.show = false

        return Promise.resolve(typeof this.modal.ok === 'function' ? this.modal.ok() : true)
          .then(() => this.modal.ok = null)
      }
    }
  }
</script>
