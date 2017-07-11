<template lang="pug">
    .item.item-gutter.item-hover.item-border
        .query select * from blablabla
        .meta.flex.small.text-muted
            span.flex-grow
            span 2 rows
            span 1.12s
            span 2017-07-10 00:00:00
</template>

<style lang="sass" scoped>
    @import '../sass/colors'

    .query
        padding: 20px 10px

    .meta
        position: absolute
        bottom: 0
        right: 0

        > *
            margin: 0 5px

</style>

<script>
    export default {

    }
</script>
