<template>
  <header>
    <nav>
      <title>Menus</title>
    </nav>
    <Menu :model="menus">
      <template #item="{ item, props }">
        <router-link v-if="item.path" v-slot="{ href, navigate }" :to="item.path" custom>
          <a v-ripple :href="href" v-bind="props.action" @click="navigate">
            <span :class="item.icon" />
            <span class="ml-2">{{ item.name }}</span>
          </a>
        </router-link>
      </template>
    </Menu>
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
