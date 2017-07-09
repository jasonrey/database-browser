<template lang="pug">
.servercontent
    p hello
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
        display: block
</style>

<script>
export default {
    data() {
        return {

        };
    }
}
</script>
