<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { Button } from "m3-svelte";
  import "../app.css";
  import favicon from "$lib/assets/favicon.svg";
  import type { LayoutData } from "./$types";

  let { data, children } = $props<{ data: LayoutData; children: any }>();

  async function logout() {
    await fetch(resolve("/api/auth/logout"), { method: "POST" });
    await goto("/runners/login");
  }
</script>

<svelte:head>
  <title>GitLab Runner UI</title>
  <meta name="description" content="Simple management of GitLab runners with ease." />
  <link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
  <header
    class="m3-surface-container"
    style="padding: 12px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgb(var(--m3-scheme-outline-variant));"
  >
    <div class="m3-title-medium">
      Welcome, <span style="font-weight: 500;">{data.user.username}</span>
      {#if data.user.role === "admin"}
        <span
          style="
            background: rgb(var(--m3-scheme-tertiary-container));
            color: rgb(var(--m3-scheme-on-tertiary-container));
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 0.75rem;
            margin-left: 8px;
            vertical-align: middle;
          "
        >
          Admin
        </span>
      {/if}
    </div>
    <div>
      {#if data.user.role === "admin"}
        <a href="/runners/admin/runners">
          <Button variant="text">Admin Panel</Button>
        </a>
      {/if}
      <Button variant="outlined" onclick={logout} style="margin-left: 12px;">Logout</Button>
    </div>
  </header>
{/if}

{@render children()}
