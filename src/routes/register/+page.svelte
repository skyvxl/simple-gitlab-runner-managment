<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { Button, TextField, Snackbar } from 'm3-svelte';

  let username = $state('');
  let password = $state('');
  let loading = $state(false);
  let error = $state<string | null>(null);
  let snackbar: ReturnType<typeof Snackbar>;

  async function register() {
    loading = true;
    error = null;
    try {
      const response = await fetch(resolve('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        snackbar?.show({ message: 'Registration successful! Please log in.' });
        await goto('/login');
      } else {
        const data = await response.json();
        error = data.error || 'Registration failed';
        snackbar?.show({ message: error });
      }
    } catch (e) {
      error = 'An unexpected error occurred.';
      snackbar?.show({ message: error });
    }
    loading = false;
  }
</script>

<div class="m3-surface-container-lowest" style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px;">
  <div class="m3-card" style="width: 100%; max-width: 400px; padding: 32px; border-radius: 16px; background: rgb(var(--m3-scheme-surface-container-low));">
    <h1 class="m3-headline-medium" style="text-align: center; margin-bottom: 24px; color: rgb(var(--m3-scheme-on-surface));">
      Register
    </h1>
    <form onsubmit={(e) => { e.preventDefault(); register(); }} style="display: flex; flex-direction: column; gap: 20px;">
      <TextField label="Username" bind:value={username} required style="width: 100%;" />
      <TextField label="Password" type="password" bind:value={password} required style="width: 100%;" />

      <div class="m3-body-small" style="color: rgb(var(--m3-scheme-on-surface-variant)); margin-top: 8px; text-align: center;">
        Password cannot be recovered. Please store it in a safe place.
      </div>

      <Button variant="filled" type="submit" disabled={loading} style="margin-top: 16px;">
        {#if loading}
          Registering...
        {:else}
          Register
        {/if}
      </Button>

      <div style="text-align: center; margin-top: 16px;">
        <span class="m3-body-medium" style="color: rgb(var(--m3-scheme-on-surface-variant));">
          Already have an account?
        </span>
        <a href="/login" class="m3-label-large" style="text-decoration: none; color: rgb(var(--m3-scheme-primary)); margin-left: 4px;">
          Login
        </a>
      </div>
    </form>
  </div>
</div>

<Snackbar bind:this={snackbar} />
