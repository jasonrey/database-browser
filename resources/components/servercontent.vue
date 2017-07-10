<template lang="pug">
    .servercontent
        .sidebar
        .content

</template>

<style lang="sass" scoped>
    .servercontent
        position: absolute
        top: 0
        left: 0
        width: 100%
        height: 100%
        display: none

        &.active
            display: flex

    .sidebar
        flex-grow: 0
        max-width: 300px
        width: 20%
        min-width: 200px
        border-right: 1px solid #ddd
        flex-shrink: 1

    .content
        flex-grow: 1

</style>

<script>
    export default {
        data() {
            return {

            };
        }
    }
</script>
