<template lang="pug">
    .item.clearfix
        .connectionname.item-hover Test

            .actions
                button.btn.btn-sm.btn-link
                    i.glyphicon.glyphicon-pencil
                button.btn.btn-sm.btn-link
                    i.glyphicon.glyphicon-remove
</template>

<style lang="sass" scoped>
    @import '../sass/colors'

    .item
        border-bottom: 1px solid $gray-light

        &:last-child
            border-bottom: 0

        &:hover
            .actions
                opacity: 1

    .connectionname
        padding: 10px

    .actions
        position: absolute
        top: 50%
        right: 4px
        transform: translateY(-50%)
        opacity: 0
</style>

<script>
    export default {

    }
</script>
