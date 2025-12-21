<script lang="ts">
  import { cn } from '$lib/utils';

  interface Props {
    headers: string[];
    class?: string;
    children?: import('svelte').Snippet;
  }

  let { headers, class: className, children }: Props = $props();
</script>

<div class={cn('overflow-hidden rounded-lg border border-border', className)}>
  <table class="w-full">
    <thead class="bg-secondary/50">
      <tr>
        {#each headers as header}
          <th
            class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {header}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody class="divide-y divide-border bg-background">
      {@render children?.()}
    </tbody>
  </table>
</div>
