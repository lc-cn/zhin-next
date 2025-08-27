<template>
  <header>
    <nav>
      <title>Menus</title>
    </nav>
    <ul>
      <li v-for="menu in menus" :key="menu.path">
        <router-link :to="menu.path">
          <span>{{ menu.name }}</span>
        </router-link>
      </li>
    </ul>
  </header>
  <main>
    <router-view/>
  </main>
</template>

<script setup lang="ts">
import { useCommonStore } from '@zhin.js/client';
import { computed } from 'vue';
const menus = computed(() => {
  return useCommonStore().store.menus || [];
});
</script>
