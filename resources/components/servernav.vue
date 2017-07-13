<template lang="pug">
  li
    a(href="javascript:;", @click="selectConnection(connection)", :data-status="status")
      .inline-block {{ connection.name || connection.host }}

    button.btn.btn-link.btn-xs(@click="closeConnection(connection)")
      i.glyphicon.glyphicon-remove
</template>

<style lang="sass" scoped>
  a
    &::before
      content: ''
      display: inline-block
      vertical-align: middle
      width: 6px
      height: 6px
      border-radius: 50%
      background-color: red
      margin: 0 4px 0 0

    &[data-status="connecting"]
      &::before
        background-color: yellow

    &[data-status="connected"]
      &::before
        background-color: green

    .inline-block
      margin: 0 10px 0 5px

  button
    position: absolute
    top: 50%
    right: 4px
    transform: translateY(-50%)
    display: none

  li
    &:hover
      button
        display: block
</style>

<script>
  import { mapMutations, mapActions } from 'vuex'

  export default {
    props: ['connection'],

    computed: {
      status() {
        if (this.connection.status === null) {
          return 'connecting';
        }

        return this.connection.status ? 'connected' : false;
      }
    },

    methods: {
      ...mapMutations([
        'selectConnection'
      ]),

      ...mapActions([
        'closeConnection'
      ])
    }
  }
</script>
