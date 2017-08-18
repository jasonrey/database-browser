<template lang="pug">
  .modal-content
    .modal-header.p-10
      button.close(@click="$emit('cancel')")
        span &times;
      h4.modal-title(v-if="modal.title") {{ modal.title }}

    .modal-body.p-10(v-if="modal.content")
      p {{ modal.content }}

    .modal-footer.p-10
      button.btn.btn-default.btn-sm(@click="$emit('cancel')") Cancel
      button.btn.btn-danger.btn-sm(@click="$emit('ok')")
        i.glyphicon.glyphicon-trash
</template>

<script>
export default {
  props: ['modal']
}
</script>
