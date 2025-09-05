<script lang="ts">
  import { Button, Dialog, Snackbar } from 'm3-svelte';
  import { resolve } from '$app/paths';
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();
  let allRunners = $state(data.allRunners);

  let deleting = $state<Record<number, boolean>>({});
  let showDeleteDialog = $state(false);
  let runnerToDelete = $state<any>(null);
  let snackbar: ReturnType<typeof Snackbar>;

  function confirmDelete(runner: any) {
    runnerToDelete = runner;
    showDeleteDialog = true;
  }

  async function deleteRunner() {
    if (!runnerToDelete) return;

    const id = runnerToDelete.id;
    deleting[id] = true;
    showDeleteDialog = false;

    try {
      const response = await fetch(resolve('/api/runners'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        allRunners = allRunners.filter((r) => r.id !== id);
        showMessage('Runner deleted successfully');
      } else {
        const res = await response.json();
        showMessage(res.error || 'Failed to delete runner');
      }
    } catch (error) {
      console.error('Error deleting runner:', error);
      showMessage('Error deleting runner');
    }
    deleting[id] = false;
    runnerToDelete = null;
  }

  function showMessage(message: string) {
    snackbar?.show({ message });
  }

  const runnersByOwner = $derived(() => {
    return allRunners.reduce((acc, runner) => {
      const owner = runner.owner || 'Unknown';
      if (!acc[owner]) {
        acc[owner] = [];
      }
      acc[owner].push(runner);
      return acc;
    }, {} as Record<string, typeof allRunners>);
  });
</script>

<div class="m3-surface-container-lowest" style="min-height: 100vh; padding: 24px;">
  <div class="m3-container" style="max-width: 1200px; margin: 0 auto;">
    <header class="m3-header" style="margin-bottom: 40px;">
      <div class="m3-display-small" style="color: rgb(var(--m3-scheme-on-surface)); margin-bottom: 8px;">
        Admin - All Runners
      </div>
      <div class="m3-body-large" style="color: rgb(var(--m3-scheme-on-surface-variant));">
        View and manage all registered runners in the system.
      </div>
    </header>

    {#if Object.keys(runnersByOwner).length === 0}
      <div class="m3-empty-state" style="text-align: center; padding: 48px 24px;">
        <div class="m3-body-large">No runners registered in the system.</div>
      </div>
    {:else}
      <div style="display: flex; flex-direction: column; gap: 32px;">
        {#each Object.entries(runnersByOwner) as [owner, runners]}
          <section>
            <h2 class="m3-headline-small" style="margin-bottom: 16px; border-bottom: 1px solid rgb(var(--m3-scheme-outline-variant)); padding-bottom: 8px;">
              Owner: {owner}
            </h2>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              {#each runners as runner}
                <div
                  class="m3-runner-item"
                  style="
                    background: rgb(var(--m3-scheme-surface-container-high));
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid rgb(var(--m3-scheme-outline-variant));
                  "
                >
                  <div style="display: flex; align-items: center; margin-bottom: 16px;">
                    <div style="flex: 1;">
                      <div class="m3-title-medium">{runner.name}</div>
                      <div class="m3-body-small" style="color: rgb(var(--m3-scheme-on-surface-variant));">{runner.url}</div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div
                      class="m3-runner-status"
                      style="
                        background: {runner.status === 'online' ? 'rgb(var(--m3-scheme-primary-container))' : 'rgb(var(--m3-scheme-secondary-container))'};
                        color: {runner.status === 'online' ? 'rgb(var(--m3-scheme-on-primary-container))' : 'rgb(var(--m3-scheme-on-secondary-container))'};
                        padding: 6px 16px; border-radius: 16px; font-size: 0.875rem;
                      "
                    >
                      {runner.status}
                    </div>
                    <Button
                      variant="text"
                      onclick={() => confirmDelete(runner)}
                      disabled={deleting[runner.id]}
                      style="color: rgb(var(--m3-scheme-error));"
                    >
                      {#if deleting[runner.id]}Deleting...{:else}Delete{/if}
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          </section>
        {/each}
      </div>
    {/if}
  </div>
</div>

<Dialog bind:open={showDeleteDialog} headline="Delete Runner">
  <div class="m3-body-medium" style="margin-bottom: 24px;">
    Are you sure you want to delete runner <strong>"{runnerToDelete?.name}"</strong> owned by <strong>{runnerToDelete?.owner}</strong>?
  </div>
  {#snippet buttons()}
    <Button variant="text" onclick={() => (showDeleteDialog = false)}>Cancel</Button>
    <Button
      variant="filled"
      onclick={deleteRunner}
      style="background: rgb(var(--m3-scheme-error)); color: rgb(var(--m3-scheme-on-error));"
    >
      Delete Runner
    </Button>
  {/snippet}
</Dialog>

<Snackbar bind:this={snackbar} />
