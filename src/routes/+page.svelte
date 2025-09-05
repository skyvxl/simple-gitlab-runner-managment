<script lang="ts">
  import { onMount } from "svelte";
  import { resolve } from "$app/paths";
  import { Button, TextField, Dialog, Snackbar } from "m3-svelte";

  let runners: any[] = [];
  let userId: string | null = null;
  let formData = {
    url: "",
    token: "",
    description: "",
    tags: "",
  };
  let loading = false;
  let deleting: { [key: string]: boolean } = {};
  let showDeleteDialog = false;
  let runnerToDelete: any = null;
  let snackbar: ReturnType<typeof Snackbar>;

  onMount(async () => {
    userId = localStorage.getItem("userId");
    if (!userId) {
      userId = crypto.randomUUID();
      localStorage.setItem("userId", userId);
    }
    await loadRunners();
  });

  async function loadRunners() {
    try {
      const response = await fetch(`${resolve("/api/runners")}`);
      if (response.ok) {
        runners = await response.json();
      }
    } catch (error) {
      console.error("Error loading runners:", error);
      showMessage("Failed to load runners");
    }
  }

  async function registerRunner() {
    loading = true;
    try {
      const response = await fetch(`${resolve("/api/runners")}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, userId }),
      });
      if (response.ok) {
        await loadRunners();
        formData = { url: "", token: "", description: "", tags: "" };
        showMessage("Runner registered successfully");
      } else {
        showMessage("Failed to register runner");
      }
    } catch (error) {
      console.error("Error registering runner:", error);
      showMessage("Error registering runner");
    }
    loading = false;
  }

  function confirmDelete(runner: any) {
    runnerToDelete = runner;
    showDeleteDialog = true;
  }

  async function deleteRunner() {
    if (!runnerToDelete) return;

    const token = runnerToDelete.token;
    deleting[runnerToDelete.name] = true;
    showDeleteDialog = false;

    try {
      const response = await fetch(`${resolve("/api/runners")}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId }),
      });
      if (response.ok) {
        await loadRunners();
        showMessage("Runner deleted successfully");
      } else {
        showMessage("Failed to delete runner");
      }
    } catch (error) {
      console.error("Error deleting runner:", error);
      showMessage("Error deleting runner");
    }
    deleting[runnerToDelete.name] = false;
    runnerToDelete = null;
  }

  function showMessage(message: string) {
    snackbar?.show({ message });
  }
</script>

<!-- Main Container with MD3 Surface -->
<div class="m3-surface-container-lowest" style="min-height: 100vh; padding: 24px;">
  <div class="m3-container" style="max-width: 1200px; margin: 0 auto;">
    <!-- Header Section -->
    <header class="m3-header" style="margin-bottom: 40px;">
      <div
        class="m3-display-small"
        style="color: rgb(var(--m3-scheme-on-surface)); margin-bottom: 8px;"
      >
        GitLab Runner Management
      </div>
      <div class="m3-body-large" style="color: rgb(var(--m3-scheme-on-surface-variant));">
        Manage and monitor your GitLab CI/CD runners
      </div>
    </header>

    <!-- Main Content Grid -->
    <div
      class="m3-content-grid"
      style="display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start;"
    >
      <!-- Registration Section -->
      <section class="m3-registration-section">
        <div
          class="m3-card"
          style="
          background: rgb(var(--m3-scheme-surface-container-low));
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgb(var(--m3-scheme-outline-variant));
        "
        >
          <h2
            class="m3-headline-small"
            style="color: rgb(var(--m3-scheme-on-surface)); margin-bottom: 20px; font-weight: 500;"
          >
            Register New Runner
          </h2>

          <form
            on:submit|preventDefault={registerRunner}
            class="m3-form"
            style="display: flex; flex-direction: column; gap: 20px;"
          >
            <div class="m3-form-field">
              <TextField
                label="GitLab Instance URL"
                bind:value={formData.url}
                type="url"
                required
                style="width: 100%;"
              />
              <p
                class="m3-supporting-text"
                style="color: rgb(var(--m3-scheme-on-surface-variant)); font-size: 0.875rem; margin: 4px 0 0 0;"
              >
                Example: https://gitlab.example.com
              </p>
            </div>

            <div class="m3-form-field">
              <TextField
                label="Registration Token"
                bind:value={formData.token}
                type="password"
                required
                style="width: 100%;"
              />
              <p
                class="m3-supporting-text"
                style="color: rgb(var(--m3-scheme-on-surface-variant)); font-size: 0.875rem; margin: 4px 0 0 0;"
              >
                Example: GR1234567890abcdef
              </p>
            </div>

            <div class="m3-form-field">
              <TextField
                label="Runner Description"
                bind:value={formData.description}
                required
                style="width: 100%;"
              />
              <p
                class="m3-supporting-text"
                style="color: rgb(var(--m3-scheme-on-surface-variant)); font-size: 0.875rem; margin: 4px 0 0 0;"
              >
                Example: Production Runner, Staging CI, etc.
              </p>
            </div>

            <div class="m3-form-field">
              <TextField label="Tags" bind:value={formData.tags} required style="width: 100%;" />
              <p
                class="m3-supporting-text"
                style="color: rgb(var(--m3-scheme-on-surface-variant)); font-size: 0.875rem; margin: 4px 0 0 0;"
              >
                Example: docker, linux, production
              </p>
            </div>

            <div
              class="m3-form-actions"
              style="display: flex; gap: 12px; align-items: center; margin-top: 8px;"
            >
              <Button variant="filled" type="submit" disabled={loading} style="flex: 1;">
                {#if loading}
                  Registering...
                {:else}
                  Register Runner
                {/if}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <!-- Runners List Section -->
      <section class="m3-runners-section">
        <div
          class="m3-card"
          style="
          background: rgb(var(--m3-scheme-surface-container-low));
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgb(var(--m3-scheme-outline-variant));
        "
        >
          <div
            class="m3-section-header"
            style="display: flex; align-items: center; margin-bottom: 20px;"
          >
            <h2
              class="m3-headline-small"
              style="color: rgb(var(--m3-scheme-on-surface)); font-weight: 500; margin: 0;"
            >
              Registered Runners
            </h2>
            {#if runners.length > 0}
              <span
                class="m3-badge"
                style="
                background: rgb(var(--m3-scheme-primary-container));
                color: rgb(var(--m3-scheme-on-primary-container));
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 0.875rem;
                font-weight: 500;
                margin-left: 12px;
              "
              >
                {runners.length}
              </span>
            {/if}
          </div>

          {#if runners.length === 0}
            <div
              class="m3-empty-state"
              style="
              text-align: center;
              padding: 48px 24px;
              color: rgb(var(--m3-scheme-on-surface-variant));
            "
            >
              <div
                class="m3-empty-icon"
                style="
                width: 64px;
                height: 64px;
                background: rgb(var(--m3-scheme-surface-container-high));
                border-radius: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 16px;
                font-size: 32px;
                opacity: 0.5;
              "
              >
                🏃
              </div>
              <div class="m3-body-large" style="margin-bottom: 8px; font-weight: 500;">
                No runners registered
              </div>
              <div class="m3-body-medium">Register your first runner to get started</div>
            </div>
          {:else}
            <div class="m3-runners-list" style="display: flex; flex-direction: column; gap: 12px;">
              {#each runners as runner}
                <div
                  class="m3-runner-item"
                  style="
                  background: rgb(var(--m3-scheme-surface-container-high));
                  border-radius: 12px;
                  padding: 20px;
                  border: 1px solid {runner.userId === userId
                    ? 'rgb(var(--m3-scheme-primary))'
                    : 'rgb(var(--m3-scheme-outline-variant))'};
                  transition: all 0.2s ease;
                "
                >
                  <div
                    class="m3-runner-header"
                    style="display: flex; align-items: center; margin-bottom: 16px;"
                  >
                    <div
                      class="m3-runner-icon"
                      style="
                      width: 48px;
                      height: 48px;
                      background: rgb(var(--m3-scheme-primary-container));
                      color: rgb(var(--m3-scheme-on-primary-container));
                      border-radius: 24px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      margin-right: 16px;
                      font-size: 24px;
                    "
                    >
                      🏃
                    </div>
                    <div class="m3-runner-info" style="flex: 1;">
                      <div
                        class="m3-title-medium"
                        style="color: rgb(var(--m3-scheme-on-surface)); margin-bottom: 4px; font-weight: 500;"
                      >
                        {runner.name}
                      </div>
                      <div
                        class="m3-body-small"
                        style="color: rgb(var(--m3-scheme-on-surface-variant));"
                      >
                        {runner.url}
                      </div>
                    </div>
                  </div>

                  <div
                    class="m3-runner-details"
                    style="display: flex; align-items: center; justify-content: space-between;"
                  >
                    <div
                      class="m3-runner-status"
                      style="
                      background: rgb(var(--m3-scheme-secondary-container));
                      color: rgb(var(--m3-scheme-on-secondary-container));
                      padding: 6px 16px;
                      border-radius: 16px;
                      font-size: 0.875rem;
                      font-weight: 500;
                      display: flex;
                      align-items: center;
                      gap: 6px;
                    "
                    >
                      <span
                        style="width: 8px; height: 8px; background: rgb(var(--m3-scheme-on-secondary-container)); border-radius: 50%;"
                      ></span>
                      {runner.status}
                    </div>

                    {#if runner.userId === userId}
                      <Button
                        variant="text"
                        onclick={() => confirmDelete(runner)}
                        disabled={deleting[runner.name]}
                        style="color: rgb(var(--m3-scheme-error));"
                      >
                        {#if deleting[runner.name]}
                          Deleting...
                        {:else}
                          Delete
                        {/if}
                      </Button>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    </div>

    <!-- Delete Confirmation Dialog -->
    <Dialog bind:open={showDeleteDialog} headline="Delete Runner">
      <div class="m3-body-medium" style="margin-bottom: 24px;">
        Are you sure you want to delete runner <strong>"{runnerToDelete?.name}"</strong>? This
        action cannot be undone and will remove the runner from GitLab.
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

    <!-- Snackbar for notifications -->
    <Snackbar bind:this={snackbar} />
  </div>
</div>

<style>
  .m3-container {
    padding: 0 16px;
  }

  @media (min-width: 600px) {
    .m3-container {
      padding: 0 24px;
    }
  }

  @media (min-width: 600px) {
    .m3-content-grid {
      grid-template-columns: 400px 1fr !important;
      gap: 32px !important;
    }
  }

  .m3-form-field {
    position: relative;
    width: 100%;
  }

  .m3-form-field :global(*) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .m3-form {
    width: 100%;
  }

  .m3-form :global(input) {
    width: 100% !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .m3-form :global(.m3-text-field) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .m3-form :global(label) {
    width: 100% !important;
    max-width: 100% !important;
  }

  .m3-runner-item:hover {
    background: rgb(var(--m3-scheme-surface-container-highest));
    border-color: rgb(var(--m3-scheme-outline));
  }

  .m3-empty-state {
    animation: fadeIn 0.3s ease-in-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
