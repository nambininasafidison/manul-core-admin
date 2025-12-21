<script lang="ts">
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores';
  import { onMount } from 'svelte';

  onMount(() => {
    // Redirect based on auth state
    if ($authStore.isAuthenticated) {
      goto('/dashboard');
    } else {
      goto('/login');
    }
  });
</script>

<div class="flex min-h-screen items-center justify-center bg-[hsl(var(--background))]">
  <div class="text-center">
    <div
      class="animate-spin h-8 w-8 border-2 border-[hsl(var(--primary))] border-t-transparent rounded-full mx-auto"
    ></div>
    <p class="mt-4 text-[hsl(var(--muted-foreground))]">Loading...</p>
  </div>
</div>
