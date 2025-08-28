<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";

  let { children } = $props();
</script>

<svelte:head>
  <title>GitLab Runner UI</title>
  <meta name="description" content="Simple management of GitLab runners with ease." />
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
