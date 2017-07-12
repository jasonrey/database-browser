<template lang="pug">
    #modal.abs.abs-full-size(:class="{ active: show }")
        .modal-content.flex.flex-align-items-center
            .text-center.flex-grow
                h4 Working...
                button.btn.btn-danger(@click="cancel") Cancel

</template>

<style lang="sass" scoped>
    #modal
        background-color: rgba(0, 0, 0, 0.4)
        display: none

        &.active
            display: block

    .modal-content
        position: fixed
        top: 50%
        left: 50%
        width: 300px
        transform: translate(-50%, -50%)
        background-color: white
        box-shadow: 0 0 5px 1px rgba(0, 0, 0, 0.1)
        padding: 20px
        border: 0

    h4
        margin: 0 0 20px 0
</style>

<script>
    export default {
        data() {
            return {
                show: false
            }
        },

        methods: {
            cancel() {
                this.show = false;
            }
        }
    }
</script>
