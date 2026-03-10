<template>
  <FileListing />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FileListing from './views/FileListing.vue';

export default defineComponent({
  name: 'App',
  components: { FileListing }
});
</script>