<template lang="pug">
  .modal-content
    .modal-header.p-10
      button.close(@click="$emit('cancel')")
        span &times;
      h4.modal-title New Table

    .modal-body.p-10
      form
        .form-group
          label Name
          input.form-control(type="text")

        .form-group
          label Charset
          .select
            .caret
            select.form-control
              option test

        .form-group
          label Encoding
          .select
            .caret
            select.form-control
              option test

    .modal-footer.p-10
      button.btn.btn-default.btn-sm(@click="$emit('cancel')")
        i.glyphicon.glyphicon-remove
      button.btn.btn-success.btn-sm(@click="$emit('ok')")
        i.glyphicon.glyphicon-ok
</template>

<script>
export default {
  props: ['modal']
}
</script>
