<script lang="ts">
  import { onMount } from "svelte";
  import { enhance } from "$app/forms";

  let runners: any[] = [];
  let formData = {
    url: "",
    token: "",
    description: "",
    tags: "",
  };
  let loading = false;
  let deleting: { [key: string]: boolean } = {};
  onMount(async () => {
    await loadRunners();
  });

  async function loadRunners() {
    try {
      const response = await fetch("/api/runners");
      if (response.ok) {
        runners = await response.json();
      }
    } catch (error) {
      console.error("Error loading runners:", error);
    }
  }

  async function registerRunner() {
    loading = true;
    try {
      const response = await fetch("/api/runners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        await loadRunners();
        formData = { url: "", token: "", description: "", tags: "" };
      } else {
        alert("Failed to register runner");
      }
    } catch (error) {
      console.error("Error registering runner:", error);
      alert("Error registering runner");
    }
    loading = false;
  }

  async function unregisterRunner(name: string) {
    if (!confirm(`Are you sure you want to unregister runner "${name}"?`)) return;

    deleting[name] = true;
    try {
      const response = await fetch("/api/runners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (response.ok) {
        await loadRunners();
      } else {
        alert("Failed to unregister runner");
      }
    } catch (error) {
      console.error("Error unregistering runner:", error);
      alert("Error unregistering runner");
    }
    deleting[name] = false;
  }
</script>

<div class="max-w-4xl mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">GitLab Runner Management</h1>

  <!-- Register Form -->
  <div class="bg-white p-6 rounded-lg shadow-md mb-8">
    <h2 class="text-xl font-semibold mb-4">Register New Runner</h2>
    <form on:submit|preventDefault={registerRunner} class="space-y-4">
      <div>
        <label for="url" class="block text-sm font-medium mb-1">GitLab URL</label>
        <input
          id="url"
          type="url"
          bind:value={formData.url}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://gitlab.example.com"
        />
      </div>
      <div>
        <label for="token" class="block text-sm font-medium mb-1">Registration Token</label>
        <input
          id="token"
          type="text"
          bind:value={formData.token}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="GR1234567890abcdef"
        />
      </div>
      <div>
        <label for="description" class="block text-sm font-medium mb-1">Description</label>
        <input
          id="description"
          type="text"
          bind:value={formData.description}
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="My Runner"
        />
      </div>
      <div>
        <label for="tags" class="block text-sm font-medium mb-1">Tags (comma-separated)</label>
        <input
          id="tags"
          type="text"
          bind:value={formData.tags}
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="docker, linux"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Registering..." : "Register Runner"}
      </button>
    </form>
  </div>

  <!-- Runners List -->
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h2 class="text-xl font-semibold mb-4">Registered Runners</h2>
    {#if runners.length === 0}
      <p class="text-gray-500">No runners registered yet.</p>
    {:else}
      <div class="space-y-4">
        {#each runners as runner}
          <div class="flex items-center justify-between p-4 border border-gray-200 rounded-md">
            <div>
              <h3 class="font-medium">{runner.name}</h3>
              <p class="text-sm text-gray-600">
                URL: {runner.url}
              </p>
              <p class="text-sm text-gray-600">
                Status: {runner.status}
              </p>
            </div>
            <button
              on:click={() => unregisterRunner(runner.name)}
              disabled={deleting[runner.name]}
              class="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 disabled:opacity-50"
            >
              {deleting[runner.name] ? "Deleting..." : "Delete"}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
