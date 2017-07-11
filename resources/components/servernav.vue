<template lang="pug">
    li
        a(href="javascript:;")
            span.connection-status
            h5=" {{ servername }}"
</template>

<style lang="sass" scoped>
    .connection-status
        display: inline-block
        vertical-align: middle
        width: 6px
        height: 6px
        border-radius: 50%
        background-color: red
        margin: 0 4px 0 0

    h5
        margin: 0
        display: inline-block

</style>

<script>
    export default {
        data() {
            return {
                servername: 'Home'
            }
        }
    }
</script>
