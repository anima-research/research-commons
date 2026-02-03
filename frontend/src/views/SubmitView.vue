<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <LeftSidebar :show="showMobileSidebar" @navigate="handleNavigate" @close="showMobileSidebar = false" />

    <!-- Mobile hamburger -->
    <button
      v-if="isMobile"
      @click="showMobileSidebar = true"
      class="fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 lg:hidden"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <div class="lg:ml-64">
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 transition-colors">
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">✨ New Submission</h1>
      </header>

      <div class="max-w-4xl mx-auto p-8">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6 transition-colors">
        
        <!-- Step 1: Upload -->
        <div v-if="step === 'upload'">
          <!-- Submission Type Selector -->
          <div class="mb-8">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">What are you submitting?</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <!-- Conversation -->
              <button
                @click="submissionCategory = 'conversation'"
                class="relative p-4 rounded-xl border-2 transition-all text-left"
                :class="submissionCategory === 'conversation' 
                  ? 'border-indigo-500 bg-indigo-500/10 ring-2 ring-indigo-500/20' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'"
              >
                <div class="text-2xl mb-2">💬</div>
                <div class="font-medium text-gray-100">Conversation</div>
                <div class="text-xs text-gray-500 mt-1">Multi-turn dialogue, potentially containing multiple forks</div>
              </button>
              
              <!-- Completion -->
              <button
                @click="submissionCategory = 'completion'"
                class="relative p-4 rounded-xl border-2 transition-all text-left"
                :class="submissionCategory === 'completion' 
                  ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/20' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'"
              >
                <div class="text-2xl mb-2">📄</div>
                <div class="font-medium text-gray-100">Completion</div>
                <div class="text-xs text-gray-500 mt-1">Single text document that can be marked up to separate prefix from completion</div>
              </button>
              
              <!-- Loom -->
              <button
                @click="submissionCategory = 'loom'"
                class="relative p-4 rounded-xl border-2 transition-all text-left"
                :class="submissionCategory === 'loom' 
                  ? 'border-green-500 bg-green-500/10 ring-2 ring-green-500/20' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'"
              >
                <div class="text-2xl mb-2">🌳</div>
                <div class="font-medium text-gray-100">Loom</div>
                <div class="text-xs text-gray-500 mt-1">A document containing multiple forks of LLM generation paths</div>
              </button>
              
              <!-- Other -->
              <button
                @click="submissionCategory = 'other'"
                class="relative p-4 rounded-xl border-2 transition-all text-left"
                :class="submissionCategory === 'other' 
                  ? 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20' 
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'"
              >
                <div class="text-2xl mb-2">📦</div>
                <div class="font-medium text-gray-100">Other</div>
                <div class="text-xs text-gray-500 mt-1">Custom format</div>
              </button>
            </div>
          </div>

          <!-- Source Type (for conversation and loom categories) -->
          <div v-if="submissionCategory === 'conversation' || submissionCategory === 'loom'" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Import Source
            </label>
            <select
              v-model="sourceType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="json-upload">JSON Upload</option>
              <option value="arc-certified">ARC Certified</option>
              <option value="discord">Discord</option>
            </select>
          </div>
          
          <!-- Source Type (for other category) -->
          <div v-if="submissionCategory === 'other'" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Format
            </label>
            <select
              v-model="sourceType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="json-upload">JSON Upload</option>
              <option value="other">Other Format</option>
            </select>
          </div>

          <!-- Discord Import -->
          <div v-if="(submissionCategory === 'conversation' || submissionCategory === 'loom') && sourceType === 'discord'" class="space-y-4 mb-6">
            <div class="p-3 bg-blue-900/20 border border-blue-700/50 rounded text-sm text-blue-200">
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <strong>Discord Bridge Required:</strong> This feature only works with Discord servers that have the export bridge bot installed. 
              Imports are authenticated server-side and message history is fetched securely.
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Last Message URL <span class="text-red-400">*</span>
              </label>
              <div class="relative">
                <input
                  v-model="discordLastMessageUrl"
                  @blur="validateDiscordUrl"
                  @change="discordUrlValidated = false; discordUrlError = ''"
                  type="text"
                  placeholder="https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID"
                  :class="{
                    'border-red-500 focus:ring-red-500': discordLastMessageUrl && (discordUrlError || !isValidDiscordUrl(discordLastMessageUrl)),
                    'border-green-500 focus:ring-green-500': discordUrlValidated && !discordUrlError,
                    'border-gray-700 focus:ring-indigo-500': !discordLastMessageUrl || (!discordUrlError && !discordUrlValidated)
                  }"
                  class="w-full px-3 py-2 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:border-transparent pr-10"
                />
                <!-- Loading spinner while validating -->
                <div v-if="discordUrlValidating" class="absolute right-3 top-1/2 -translate-y-1/2">
                  <div class="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                </div>
                <!-- Success checkmark -->
                <div v-else-if="discordUrlValidated && !discordUrlError" class="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              <p v-if="discordUrlError" class="mt-1 text-xs text-red-400">
                {{ discordUrlError }}
              </p>
              <p v-else-if="discordUrlValidated" class="mt-1 text-xs text-green-400">
                ✓ URL validated - ready to browse messages
              </p>
              <p v-else-if="discordLastMessageUrl && !isValidDiscordUrl(discordLastMessageUrl)" class="mt-1 text-xs text-red-400">
                Invalid Discord message URL format
              </p>
              <p v-else class="mt-1 text-xs text-gray-500">The ending message URL (most recent)</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                First Message URL <span class="text-gray-500">(optional)</span>
              </label>
              <div class="flex gap-2">
                <input
                  v-model="discordFirstMessageUrl"
                  type="text"
                  placeholder="https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID"
                  class="flex-1 px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  @click="openMessageSelector"
                  :disabled="!discordUrlValidated || discordUrlValidating || !!discordUrlError"
                  class="px-3 py-2 border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  :title="discordUrlValidated ? 'Browse messages to select starting point' : 'Validate URL first (blur input or press Tab)'"
                >
                  Browse
                </button>
              </div>
              <p class="mt-1 text-xs text-gray-500">The starting message URL (oldest) - or click Browse to select</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Max Messages
              </label>
              <input
                v-model.number="discordMaxMessages"
                type="number"
                min="1"
                placeholder="50"
                class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p class="mt-1 text-xs text-gray-500">Maximum number of messages to import (default: 50)</p>
            </div>
          </div>

          <!-- JSON Upload (for conversation and other categories) -->
          <div v-if="(submissionCategory === 'conversation' || submissionCategory === 'other') && (sourceType === 'json-upload' || sourceType === 'arc-certified' || sourceType === 'other')" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload JSON File
            </label>
            
            <!-- Supported formats info -->
            <div class="mb-3 p-3 bg-purple-900/20 border border-purple-700/50 rounded text-sm text-purple-200">
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <strong>Supported formats:</strong> ARC conversation exports or Anthropic API format. For Claude.ai, use the 
              <a 
                href="https://github.com/socketteer/Claude-Conversation-Exporter" 
                target="_blank" 
                rel="noopener noreferrer"
                class="underline hover:text-purple-100 transition-colors"
              >
                Claude Conversation Exporter</a> Chrome extension.
            </div>
            
            <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800 transition-colors hover:border-indigo-400 dark:hover:border-indigo-600">
              <input
                type="file"
                accept=".json,.txt"
                @change="handleFileUpload"
                class="hidden"
                ref="fileInput"
              />
              <button
                type="button"
                @click="($refs.fileInput as any)?.click()"
                class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                📁 Choose JSON File
              </button>
              <p v-if="uploadedFile" class="mt-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                ✓ {{ uploadedFile.name }}
              </p>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                ARC exports or Anthropic API message format
              </p>
            </div>
          </div>

          <!-- Completion/Document Upload -->
          <div v-if="submissionCategory === 'completion'" class="mb-6">
            <div class="mb-3 p-3 bg-emerald-900/20 border border-emerald-700/50 rounded text-sm text-emerald-200">
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
              </svg>
              <strong>Completion:</strong> Submit a model output, essay, or any text for annotation. Supports Markdown. 
              You can add highlights, comments, and tags to sections of the text.
            </div>
            
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title
            </label>
            <input
              v-model="documentTitle"
              type="text"
              placeholder="e.g., Claude on consciousness..."
              class="w-full px-3 py-2 mb-4 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content <span class="font-normal text-gray-500">(Markdown supported)</span>
            </label>
            <textarea
              v-model="documentContent"
              placeholder="Paste the model output or text here...

Supports Markdown formatting:
# Headings
**bold**, *italic*
- Lists
- Code blocks"
              rows="16"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors font-mono text-sm"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500">{{ documentContent.length.toLocaleString() }} characters</p>
            
            <!-- Or upload file -->
            <div class="mt-4 text-center text-gray-500 text-sm">— or —</div>
            <div class="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center bg-gray-50 dark:bg-gray-800 transition-colors hover:border-indigo-400 dark:hover:border-indigo-600">
              <input
                type="file"
                accept=".md,.txt,.markdown"
                @change="handleDocumentFileUpload"
                class="hidden"
                ref="docFileInput"
              />
              <button
                type="button"
                @click="($refs.docFileInput as any)?.click()"
                class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors text-sm"
              >
                📄 Upload .md or .txt file
              </button>
            </div>
            
            <!-- Display options -->
            <div class="mt-6 pt-4 border-t border-gray-700/50">
              <label class="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  v-model="useMonospace"
                  class="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
                />
                <div>
                  <span class="text-sm text-gray-300 group-hover:text-gray-100">Display in monospace font</span>
                  <p class="text-xs text-gray-500">Enable for ASCII art, formatted tables, or code-heavy content</p>
                </div>
              </label>
            </div>
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm transition-colors">
            {{ error }}
          </div>

          <div class="flex justify-end">
            <button
              v-if="submissionCategory === 'conversation' && sourceType === 'discord'"
              @click="fetchDiscordMessages"
              :disabled="!discordLastMessageUrl || submitting"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ submitting ? 'Fetching...' : 'Fetch Messages →' }}
            </button>
            <button
              v-else-if="submissionCategory === 'completion'"
              @click="prepareDocument"
              :disabled="!documentContent || !documentTitle"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue →
            </button>
            <button
              v-else
              @click="parseJSON"
              :disabled="!uploadedFile"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Parse & Continue →
            </button>
          </div>
        </div>

        <!-- Step 2: Configure -->
        <div v-if="step === 'configure'">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Configure Submission</h2>
            <button
              @click="resetToUpload"
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              ← Back to Upload
            </button>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="e.g., Claude on Non-duality"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              v-model="description"
              rows="3"
              placeholder="What makes this conversation interesting or noteworthy?"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Research Topics
            </label>
            <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-800 transition-colors">
              <label
                v-for="topic in availableTopics"
                :key="topic.id"
                class="flex items-start gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :value="topic.name"
                  v-model="selectedTopics"
                  class="w-4 h-4 mt-0.5"
                />
                <div class="flex-1">
                  <div class="text-sm text-gray-900 dark:text-gray-100">{{ topic.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ topic.description }}</div>
                </div>
              </label>
              <div v-if="availableTopics.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                No topics available
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <select
              v-model="visibility"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="researcher">🔬 Researchers Only — visible to verified researchers</option>
              <option value="public">🌐 Public — visible to everyone</option>
              <option value="unlisted">🔗 Unlisted — accessible via direct link only</option>
              <option value="private">🔒 Private — only you and admins</option>
            </select>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span v-if="visibility === 'researcher'">
                Recommended for sensitive conversations. You can make it public later.
              </span>
              <span v-else-if="visibility === 'public'">
                Anyone can find and view this conversation.
              </span>
              <span v-else-if="visibility === 'unlisted'">
                Won't appear in browse listings, but anyone with the link can view it.
              </span>
              <span v-else-if="visibility === 'private'">
                Only you and platform admins can see this conversation.
              </span>
            </p>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Identify Participants
              <span class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                (Map each participant to a model or mark as human)
              </span>
            </label>
            <div class="space-y-2">
              <div
                v-for="name in participantNames"
                :key="name"
                class="p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                <div class="flex items-center gap-2 mb-2">
                  <!-- Avatar -->
                  <img
                    v-if="getParticipantAvatar(name)"
                    :src="getParticipantAvatar(name)"
                    class="w-8 h-8 rounded-full border border-gray-600"
                    :alt="name"
                  />
                  <div v-else class="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-sm font-medium text-gray-300">
                    {{ name.charAt(0).toUpperCase() }}
                  </div>
                  
                  <!-- Names -->
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-100">
                      {{ getParticipantDisplayName(name) }}
                    </div>
                    <div class="text-xs text-gray-400">
                      @{{ getParticipantUsername(name) }}
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <div class="flex-1 flex gap-2">
                    <select
                      v-model="participantMapping[name]"
                      class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 text-sm transition-colors"
                    >
                      <option value="">-- Select Type --</option>
                      <option value="human">👤 Human</option>
                      <optgroup label="AI Models" class="text-gray-900 dark:text-gray-100">
                        <option 
                          v-for="model in availableModels" 
                          :key="model.id" 
                          :value="model.id"
                        >
                          {{ model.avatar && !model.avatar.startsWith('http') ? model.avatar + ' ' : '' }}{{ model.name }}
                        </option>
                      </optgroup>
                    </select>
                    <button
                      v-if="participantMapping[name] && participantMapping[name] !== 'human' && getParticipantAvatar(name)"
                      @click="updateModelAvatar(name, participantMapping[name])"
                      class="px-3 py-2 border border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded text-xs transition-all flex items-center gap-1 shrink-0"
                      title="Update model avatar from Discord"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Update Avatar
                    </button>
                  </div>
                  <button
                    v-if="authStore.user?.roles.includes('admin') || authStore.user?.roles.includes('researcher')"
                    @click="openCreateModelForParticipant(name)"
                    class="px-3 py-2 border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded text-xs transition-all flex items-center gap-1 shrink-0"
                    title="Create new model for this participant"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    New
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Create Model Modal -->
          <div v-if="showCreateModel" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" @mousedown.self="showCreateModel = false">
            <div class="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4" @mousedown.stop>
              <h3 class="text-lg font-semibold text-gray-100 mb-4">
                Create Model{{ creatingModelForParticipant ? ` for "${creatingModelForParticipant}"` : '' }}
              </h3>
              
              <!-- Avatar Preview -->
              <div v-if="newModel.avatar" class="mb-4 flex items-center gap-3 p-3 bg-gray-800 rounded border border-gray-700">
                <img :src="newModel.avatar" class="w-12 h-12 rounded-full" alt="Model avatar" />
                <div class="text-sm text-gray-400">Avatar from Discord profile</div>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
                  <input
                    v-model="newModel.name"
                    type="text"
                    placeholder="GPT-4, Claude 3.5, etc."
                    class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <input
                    v-model="newModel.description"
                    type="text"
                    placeholder="Brief description"
                    class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Provider</label>
                  <select
                    v-model="newModel.provider"
                    class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="google">Google</option>
                    <option value="meta">Meta</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Model ID</label>
                  <input
                    v-model="newModel.model_id"
                    type="text"
                    placeholder="e.g., gpt-4, claude-3-5-sonnet"
                    class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Color</label>
                  <input
                    v-model="newModel.color"
                    type="color"
                    class="w-full h-10 border border-gray-700 rounded bg-gray-800 cursor-pointer"
                  />
                </div>
              </div>
              
              <div class="flex gap-3 mt-6">
                <button
                  @click="cancelCreateModel"
                  class="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="createNewModel"
                  :disabled="!newModel.name || !newModel.provider || !newModel.model_id"
                  class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Model
                </button>
              </div>
            </div>
          </div>

          <!-- Discord Fetch Statistics -->
          <div v-if="fetchStats && sourceType === 'discord'" class="mb-6 p-4 rounded border transition-colors"
            :class="{
              'bg-green-900/20 border-green-700/50': fetchStats.firstMessageReached,
              'bg-amber-900/20 border-amber-700/50': !fetchStats.firstMessageReached
            }">
            <div class="flex items-center gap-3 mb-2">
              <div class="text-lg font-semibold" :class="fetchStats.firstMessageReached ? 'text-green-300' : 'text-amber-300'">
                {{ fetchStats.messageCount }} messages fetched
              </div>
              <div v-if="fetchStats.firstMessageReached" class="flex items-center gap-1 text-sm text-green-400">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                {{ fetchStats.requestedFirstUrl ? 'First message reached' : 'Complete fetch' }}
              </div>
              <div v-else class="flex items-center gap-1 text-sm text-amber-400">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                {{ fetchStats.requestedFirstUrl ? 'First message NOT reached' : 'Truncated (more messages exist)' }}
              </div>
            </div>
            <div class="text-xs text-gray-400">
              <span v-if="fetchStats.requestedFirstUrl">
                Requested range: first message URL was {{ fetchStats.firstMessageReached ? 'found' : 'not reached (may need more messages)' }}
              </span>
              <span v-else-if="fetchStats.truncated">
                Only the most recent {{ fetchStats.messageCount }} messages were fetched. Set a "First Message URL" or increase "Max Messages" to get more.
              </span>
              <span v-else>
                All available messages in range were fetched.
              </span>
            </div>
          </div>

          <div v-if="previewMessages.length > 0" class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              📝 Preview: {{ previewMessages.length }} messages
            </div>
            <div class="space-y-2 text-xs text-gray-400">
              <!-- Head: First 3 messages -->
              <div class="text-[10px] uppercase tracking-wide text-gray-500 mb-1">← First (oldest)</div>
              <div v-for="(msg, idx) in previewMessages.slice(0, 3)" :key="'head-' + idx" class="flex items-start gap-2">
                <div class="shrink-0">
                  <img
                    v-if="msg.metadata?.avatar_url"
                    :src="msg.metadata.avatar_url"
                    class="w-6 h-6 rounded-full"
                    :alt="msg.participant_name"
                  />
                  <div v-else-if="participantMapping[msg.participant_name] && participantMapping[msg.participant_name] !== 'human'" class="text-lg">
                    {{ getModelAvatar(participantMapping[msg.participant_name]) && !getModelAvatar(participantMapping[msg.participant_name]).startsWith('http') ? getModelAvatar(participantMapping[msg.participant_name]) : '🤖' }}
                  </div>
                  <span v-else>👤</span>
                </div>
                <span class="flex-1 min-w-0">
                  <span class="font-medium text-gray-100">{{ msg.participant_name }}</span>: 
                  {{ truncate(getMessageText(msg), 50) }}
                </span>
              </div>
              
              <!-- Middle indicator -->
              <div v-if="previewMessages.length > 6" class="text-center text-gray-500 py-2 border-y border-gray-700/50 my-2">
                ⋮ {{ previewMessages.length - 6 }} messages ⋮
              </div>
              
              <!-- Tail: Last 3 messages -->
              <div v-if="previewMessages.length > 3" class="text-[10px] uppercase tracking-wide text-gray-500 mb-1 mt-3">Last (newest) →</div>
              <div v-for="(msg, idx) in previewMessages.slice(-3)" :key="'tail-' + idx" class="flex items-start gap-2"
                   v-show="previewMessages.length > 3 && !previewMessages.slice(0, 3).includes(msg)">
                <div class="shrink-0">
                  <img
                    v-if="msg.metadata?.avatar_url"
                    :src="msg.metadata.avatar_url"
                    class="w-6 h-6 rounded-full"
                    :alt="msg.participant_name"
                  />
                  <div v-else-if="participantMapping[msg.participant_name] && participantMapping[msg.participant_name] !== 'human'" class="text-lg">
                    {{ getModelAvatar(participantMapping[msg.participant_name]) && !getModelAvatar(participantMapping[msg.participant_name]).startsWith('http') ? getModelAvatar(participantMapping[msg.participant_name]) : '🤖' }}
                  </div>
                  <span v-else>👤</span>
                </div>
                <span class="flex-1 min-w-0">
                  <span class="font-medium text-gray-100">{{ msg.participant_name }}</span>: 
                  {{ truncate(getMessageText(msg), 50) }}
                </span>
              </div>
            </div>
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm transition-colors">
            {{ error }}
          </div>

          <div class="flex gap-3">
            <button
              @click="resetToUpload"
              class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="submit"
              :disabled="!title || !allParticipantsMapped || submitting"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ submitting ? 'Uploading...' : 'Upload Conversation' }}
            </button>
          </div>
        </div>

      </div>
      </div>
    </div>
    
    <!-- Message Selector Modal (outside step sections) -->
    <div v-if="showMessageSelector" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" @mousedown.self="showMessageSelector = false">
      <div class="bg-gray-900 rounded-lg border border-gray-700 max-w-3xl w-full max-h-[80vh] flex flex-col" @mousedown.stop>
        <div class="p-4 border-b border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-100">Select Starting Message</h3>
            <button @click="showMessageSelector = false" class="text-gray-400 hover:text-gray-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-sm text-gray-400 mt-1">Click a message to set it as the starting point</p>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4 space-y-2">
          <div v-if="loadingPreview" class="text-center py-8 text-gray-400">
            <div class="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 mx-auto mb-2"></div>
            Loading messages...
          </div>
          
          <button
            v-for="msg in selectorPreviewMessages"
            :key="msg.id"
            @click="selectFirstMessage(msg.message_url)"
            class="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 hover:border-indigo-500/50 rounded transition-all group"
          >
                  <div class="flex items-start gap-3">
                    <div class="text-xs text-gray-500 w-14 shrink-0 text-right">
                      {{ formatPreviewTime(msg.timestamp) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-gray-300 mb-1">
                        {{ msg.author_name }}
                        <span class="text-xs text-gray-500">@{{ msg.author_username }}</span>
                      </div>
                      <div class="text-xs text-gray-400 line-clamp-2">
                        {{ msg.content || '[No text content]' }}
                      </div>
                    </div>
              <svg class="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
          </button>
        </div>
        
              <div class="p-4 border-t border-gray-700 flex justify-between items-center">
                <div>
                  <button
                    v-if="canLoadEarlier"
                    @click="loadEarlierMessages"
                    :disabled="loadingPreview"
                    class="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg v-if="loadingPreview" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{{ loadingPreview ? 'Loading...' : '← Load Earlier' }}</span>
                  </button>
                </div>
                <button
                  @click="showMessageSelector = false"
                  class="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { submissionsAPI, researchAPI, modelsAPI, importsAPI, discordPreviewAPI } from '@/services/api'
import type { Message } from '@/types'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const fileInput = ref<HTMLInputElement>()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)

onMounted(async () => {
  window.addEventListener('resize', checkMobile)
  await Promise.all([
    loadTopics(),
    loadModels()
  ])
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleNavigate(route: string) {
  router.push(route)
}

async function loadTopics() {
  try {
    const response = await researchAPI.getTopics()
    availableTopics.value = response.data.topics
    
    // Auto-select first topic if none selected
    if (selectedTopics.value.length === 0 && response.data.topics.length > 0) {
      selectedTopics.value = [response.data.topics[0].id]
      console.log('[Submit] Auto-selected default topic:', response.data.topics[0].name)
    }
  } catch (err) {
    console.error('Failed to load topics:', err)
  }
}

async function loadModels() {
  try {
    const response = await modelsAPI.list()
    availableModels.value = response.data.models
  } catch (err) {
    console.error('Failed to load models:', err)
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  uploadedFile.value = file
  error.value = ''
}

async function handleDocumentFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  try {
    const text = await file.text()
    documentContent.value = text
    // Use filename (without extension) as title if not set
    if (!documentTitle.value) {
      documentTitle.value = file.name.replace(/\.(md|txt|markdown)$/i, '')
    }
    error.value = ''
  } catch (err) {
    error.value = 'Failed to read file'
    console.error('Document file read error:', err)
  }
}

// Prepare a document for submission - creates a single-message submission
function prepareDocument() {
  if (!documentContent.value || !documentTitle.value) {
    error.value = 'Please provide a title and content'
    return
  }
  
  error.value = ''
  title.value = documentTitle.value
  
  // Create a single message for the document
  const documentMessage: Message = {
    id: crypto.randomUUID(),
    submission_id: '', // Will be filled by server
    parent_message_id: null,
    order: 0,
    participant_name: 'Document',
    participant_type: 'system',
    content_blocks: [{
      type: 'text',
      text: documentContent.value
    }],
    metadata: useMonospace.value ? { monospace: true } : undefined
  }
  
  previewMessages.value = [documentMessage]
  participantNames.value = ['Document']
  // Auto-map Document as system (skips the mapping step)
  participantMapping.value = { 'Document': 'human' } // Treat as human to skip model selection
  
  // Skip straight to configure step
  step.value = 'configure'
}

function resetToUpload() {
  step.value = 'upload'
  title.value = ''
  description.value = ''
  visibility.value = 'researcher'
  selectedTopics.value = []
  participantMapping.value = {}
  previewMessages.value = []
  participantNames.value = []
  error.value = ''
  fetchStats.value = null
}

const title = ref('')
const description = ref('')
const submissionCategory = ref<'conversation' | 'completion' | 'loom' | 'other'>('conversation')
const sourceType = ref<'json-upload' | 'arc-certified' | 'discord' | 'other'>('json-upload')

// Document/Completion upload state
const documentTitle = ref('')
const documentContent = ref('')
const useMonospace = ref(false) // Display content in monospace font
const visibility = ref<'public' | 'unlisted' | 'researcher' | 'private'>('researcher')
const selectedTopics = ref<string[]>([])
const availableTopics = ref<any[]>([])
const availableModels = ref<any[]>([])
const uploadedFile = ref<File | null>(null)
const previewMessages = ref<Message[]>([])
const participantNames = ref<string[]>([])
const participantMapping = ref<Record<string, string>>({}) // participantName -> modelId or 'human'
const error = ref('')
const submitting = ref(false)
const step = ref<'upload' | 'configure'>('upload')

// Discord import fields
const discordLastMessageUrl = ref('')
const discordFirstMessageUrl = ref('')
const discordMaxMessages = ref<number>(50)
const discordUrlValidated = ref(false) // Track if URL has been validated
const discordUrlValidating = ref(false) // Track validation in progress
const discordUrlError = ref('') // Track validation error
const discordParticipantsWithIds = ref<Array<{ 
  name: string; 
  discord_user_id: string; 
  username: string;
  display_name: string;
  is_bot: boolean;
  avatar_url?: string;
}>>([])

// Fetch statistics
const fetchStats = ref<{
  messageCount: number;
  truncated: boolean;
  firstMessageReached: boolean;
  requestedFirstUrl: string | undefined;
} | null>(null)

// Message selector modal
const showMessageSelector = ref(false)
const selectorPreviewMessages = ref<any[]>([])
const loadingPreview = ref(false)
const canLoadEarlier = ref(false)
const oldestMessageUrl = ref('')

// Model creation
const showCreateModel = ref(false)
const creatingModelForParticipant = ref<string | null>(null)
const newModel = ref({
  name: '',
  description: '',
  provider: 'other' as 'anthropic' | 'openai' | 'google' | 'meta' | 'other',
  model_id: '',
  avatar: '',
  color: '#8b5cf6' // Will be randomized on open
})

const allParticipantsMapped = computed(() => {
  return participantNames.value.every(name => participantMapping.value[name])
})

function getModelAvatar(modelId: string): string {
  const model = availableModels.value.find(m => m.id === modelId)
  return model?.avatar || '🤖'
}

function getParticipantAvatar(participantName: string): string | undefined {
  const participant = discordParticipantsWithIds.value.find(p => p.name === participantName)
  return participant?.avatar_url
}

function getParticipantUsername(participantName: string): string {
  const participant = discordParticipantsWithIds.value.find(p => p.name === participantName)
  return participant?.username || participantName
}

function getParticipantDisplayName(participantName: string): string {
  const participant = discordParticipantsWithIds.value.find(p => p.name === participantName)
  return participant?.display_name || participantName
}

// Message selector functions
async function openMessageSelector() {
  if (!discordLastMessageUrl.value) return
  
  showMessageSelector.value = true
  selectorPreviewMessages.value = []
  oldestMessageUrl.value = discordLastMessageUrl.value
  
  await loadSelectorMessages(discordLastMessageUrl.value)
}

async function loadSelectorMessages(fromUrl: string, appendToExisting: boolean = false) {
  loadingPreview.value = true
  
  try {
    // When loading earlier: fromUrl is the oldest message, we want to fetch 50 messages before it
    // Don't pass firstParam - let the API work backwards from fromUrl
    console.log('[Message Selector] Fetching from:', fromUrl, 'append:', appendToExisting)
    
    const response = await discordPreviewAPI.fetchMessages(fromUrl, undefined, 50)
    
    console.log('[Message Selector] Got messages:', response.data.messages.length)
    
    // Sort messages by timestamp (oldest first, like a chat)
    const sorted = response.data.messages.sort((a: any, b: any) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    if (appendToExisting) {
      // Prepend older messages to the beginning of the list
      selectorPreviewMessages.value = [...sorted, ...selectorPreviewMessages.value]
    } else {
      // Initial load - replace list
      selectorPreviewMessages.value = sorted
    }
    
    canLoadEarlier.value = response.data.has_more
    
    // Update oldest message URL (first item after sorting = oldest)
    if (selectorPreviewMessages.value.length > 0) {
      oldestMessageUrl.value = selectorPreviewMessages.value[0].message_url
    }
    
    console.log('[Message Selector] Total messages now:', selectorPreviewMessages.value.length)
  } catch (err: any) {
    console.error('[Message Selector] Failed to load messages:', err)
    error.value = 'Failed to load message preview'
  } finally {
    loadingPreview.value = false
  }
}

async function loadEarlierMessages() {
  if (!oldestMessageUrl.value || !selectorPreviewMessages.value.length) {
    console.log('[Message Selector] Cannot load earlier - no oldest URL or no messages')
    return
  }
  
  console.log('[Message Selector] Load Earlier clicked, current count:', selectorPreviewMessages.value.length)
  
  // Call with append mode - fetch from oldest we have going back 50 more
  await loadSelectorMessages(oldestMessageUrl.value, true)
}

function selectFirstMessage(messageUrl: string) {
  discordFirstMessageUrl.value = messageUrl
  showMessageSelector.value = false
  console.log('[Message Selector] Selected first message:', messageUrl)
}

function formatPreviewTime(timestamp: string): string {
  // Get the most recent message (LAST in the list since we sort oldest first) as reference
  if (selectorPreviewMessages.value.length === 0) return ''
  
  const messageDate = new Date(timestamp)
  const latestMessage = selectorPreviewMessages.value[selectorPreviewMessages.value.length - 1]  // Last = newest
  const latestDate = new Date(latestMessage.timestamp)
  
  const diffMs = latestDate.getTime() - messageDate.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  
  if (diffMinutes < 1) return 'now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffWeeks < 4) return `${diffWeeks}w ago`
  if (diffMonths < 12) return `${diffMonths}mo ago`
  
  const diffYears = Math.floor(diffMonths / 12)
  return `${diffYears}y ago`
}

function isValidDiscordUrl(url: string): boolean {
  // Discord message URL format: https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID
  const pattern = /^https:\/\/discord\.com\/channels\/\d+\/\d+\/\d+$/
  return pattern.test(url)
}

function extractMessageId(url: string): string | null {
  const match = url.match(/\/channels\/\d+\/\d+\/(\d+)$/)
  return match ? match[1] : null
}

async function validateDiscordUrl() {
  if (!discordLastMessageUrl.value) {
    discordUrlValidated.value = false
    discordUrlError.value = ''
    return
  }
  
  // Check format first
  if (!isValidDiscordUrl(discordLastMessageUrl.value)) {
    discordUrlValidated.value = false
    discordUrlError.value = 'Invalid URL format'
    return
  }
  
  // Test with actual API call (fetch 1 message)
  discordUrlValidating.value = true
  discordUrlError.value = ''
  
  try {
    console.log('[Discord Validation] Testing URL:', discordLastMessageUrl.value)
    const response = await discordPreviewAPI.fetchMessages(discordLastMessageUrl.value, undefined, 1)
    
    // Check if we actually got messages back
    if (!response.data.messages || response.data.messages.length === 0) {
      discordUrlValidated.value = false
      discordUrlError.value = 'No messages found - Message ID may not exist in this channel'
      console.log('[Discord Validation] URL valid but no messages returned')
      return
    }
    
    // Success!
    discordUrlValidated.value = true
    discordUrlError.value = ''
    console.log('[Discord Validation] URL is valid and accessible')
  } catch (err: any) {
    console.error('[Discord Validation] Failed:', err)
    discordUrlValidated.value = false
    
    // Provide specific error messages
    if (err.response?.status === 403 || err.response?.status === 401) {
      discordUrlError.value = 'Permission denied - Bridge bot may not have access to this channel'
    } else if (err.response?.status === 404) {
      discordUrlError.value = 'Message not found - URL may be invalid or message deleted'
    } else if (err.response?.status === 400) {
      discordUrlError.value = 'Invalid request - Please check the URL'
    } else if (err.message?.includes('timeout') || err.message?.includes('timed out')) {
      discordUrlError.value = 'Request timed out - Bridge service may be unavailable'
    } else if (err.message?.includes('Network Error')) {
      discordUrlError.value = 'Network error - Check your connection'
    } else {
      discordUrlError.value = 'Unable to access this URL - Please verify it is correct'
    }
  } finally {
    discordUrlValidating.value = false
  }
}

async function updateModelAvatar(participantName: string, modelId: string) {
  const participant = discordParticipantsWithIds.value.find(p => p.name === participantName)
  if (!participant?.avatar_url) {
    console.error('[Model] No avatar URL for participant:', participantName)
    return
  }
  
  const model = availableModels.value.find(m => m.id === modelId)
  if (!model) {
    console.error('[Model] Model not found:', modelId)
    return
  }
  
  try {
    // Update the model's avatar - send full model data
    await modelsAPI.update(modelId, {
      name: model.name,
      description: model.description,
      provider: model.provider,
      model_id: model.model_id,
      avatar: participant.avatar_url,
      color: model.color
    })
    
    // Update in local models list
    const modelIndex = availableModels.value.findIndex(m => m.id === modelId)
    if (modelIndex !== -1) {
      availableModels.value[modelIndex].avatar = participant.avatar_url
    }
    
    console.log('[Model] Updated avatar for model:', modelId, 'from Discord user:', participantName)
  } catch (err: any) {
    console.error('[Model] Failed to update avatar:', err)
    error.value = 'Failed to update model avatar: ' + (err.response?.data?.error || err.message)
  }
}

// Color palette for models - curated for variety and visual distinction
const MODEL_COLOR_PALETTE = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Green
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#f43f5e', // Rose
  '#a855f7', // Violet
  '#0ea5e9', // Sky
  '#22c55e', // Emerald
  '#eab308'  // Yellow
]

function getRandomColor(): string {
  return MODEL_COLOR_PALETTE[Math.floor(Math.random() * MODEL_COLOR_PALETTE.length)]
}

function detectProvider(participantName: string): 'anthropic' | 'openai' | 'google' | 'meta' | 'other' {
  const nameLower = participantName.toLowerCase()
  
  // Anthropic heuristics
  if (nameLower.includes('claude') || nameLower.includes('opus') || 
      nameLower.includes('sonnet') || nameLower.includes('haiku')) {
    return 'anthropic'
  }
  
  // OpenAI heuristics
  if (nameLower.includes('gpt') || nameLower.includes('o3') || 
      nameLower.includes('4o') || nameLower.includes('chatgpt')) {
    return 'openai'
  }
  
  // Google heuristics
  if (nameLower.includes('gemini') || nameLower.includes('gem') || 
      nameLower.includes('bard') || nameLower.includes('palm')) {
    return 'google'
  }
  
  // Meta heuristics
  if (nameLower.includes('llama') || nameLower.includes('meta')) {
    return 'meta'
  }
  
  return 'other'
}

function openCreateModelForParticipant(participantName: string) {
  creatingModelForParticipant.value = participantName
  
  // Smart provider detection
  const detectedProvider = detectProvider(participantName)
  
  // Get participant info including avatar
  const participantInfo = discordParticipantsWithIds.value.find(p => p.name === participantName)
  
  // Pre-populate with participant name, random color, and Discord avatar
  newModel.value = {
    name: participantName,
    description: '',
    provider: detectedProvider,
    model_id: participantName.toLowerCase().replace(/\s+/g, '-'),
    color: getRandomColor(),
    avatar: participantInfo?.avatar_url || ''
  }
  
  showCreateModel.value = true
}

function cancelCreateModel() {
  showCreateModel.value = false
  creatingModelForParticipant.value = null
  newModel.value = {
    name: '',
    description: '',
    provider: 'other',
    model_id: '',
    avatar: '',
    color: getRandomColor()
  }
}

async function createNewModel() {
  if (!newModel.value.name || !newModel.value.provider || !newModel.value.model_id) {
    return
  }
  
  try {
    const response = await modelsAPI.create({
      name: newModel.value.name,
      description: newModel.value.description,
      provider: newModel.value.provider,
      model_id: newModel.value.model_id,
      avatar: newModel.value.avatar,
      color: newModel.value.color
    })
    
    // Add to available models
    availableModels.value.push(response.data)
    
    // Auto-map to the participant we're creating this for
    if (creatingModelForParticipant.value) {
      participantMapping.value[creatingModelForParticipant.value] = response.data.id
    }
    
    // Reset form
    newModel.value = {
      name: '',
      description: '',
      provider: 'other',
      model_id: '',
      avatar: '',
      color: getRandomColor()
    }
    
    creatingModelForParticipant.value = null
    showCreateModel.value = false
    
    console.log('[Model] Created new model:', response.data)
  } catch (err: any) {
    console.error('[Model] Failed to create model:', err)
    error.value = 'Failed to create model: ' + (err.response?.data?.error || err.message)
  }
}

async function parseJSON() {
  if (!uploadedFile.value) {
    error.value = 'Please select a file first'
    return
  }
  
  error.value = ''
  previewMessages.value = []
  
  try {
    const text = await uploadedFile.value.text()
    const data = JSON.parse(text)
    
    // Check if this is ARC's branching conversation format
    if (data.conversation && data.messages && Array.isArray(data.messages)) {
      console.log('[Submit] Detected ARC conversation format')
      
      // Set title from conversation metadata
      if (data.conversation.title && !title.value) {
        title.value = data.conversation.title
      }
      
      // If this is a loom submission, preserve all branches
      if (submissionCategory.value === 'loom') {
        console.log('[Submit] Preserving branches for loom submission')
        
        // Convert ARC branching format to research-commons branch format
        // Preserve ALL branches, not just the active one
        const converted: Message[] = []
        const participants = new Set<string>()
        const branchIdMap = new Map<string, string>() // ARC branch ID -> new branch ID
        
        data.messages.forEach((arcMsg: any, idx: number) => {
          const messageId = crypto.randomUUID()
          
          // Convert all branches
          const branches = arcMsg.branches.map((arcBranch: any) => {
            const branchId = crypto.randomUUID()
            branchIdMap.set(arcBranch.id, branchId)
            
            // Extract content blocks
            // ARC format can have contentBlocks array OR content string
            // Prefer contentBlocks if it exists and has items, otherwise use content
            let contentBlocks = []
            if (arcBranch.contentBlocks && Array.isArray(arcBranch.contentBlocks) && arcBranch.contentBlocks.length > 0) {
              // Use contentBlocks array (may include thinking blocks)
              contentBlocks = arcBranch.contentBlocks.map((block: any) => {
                if (block.type === 'thinking') {
                  return {
                    type: 'thinking',
                    thinking: {
                      content: block.thinking,
                      signature: block.signature
                    }
                  }
                }
                // For text blocks, ensure they have the right format
                if (block.type === 'text') {
                  return {
                    type: 'text',
                    text: block.text || ''
                  }
                }
                return block
              })
            } else if (typeof arcBranch.content === 'string' && arcBranch.content) {
              // Fall back to content string if no contentBlocks
              contentBlocks = [{ type: 'text', text: arcBranch.content }]
            } else if (Array.isArray(arcBranch.content)) {
              contentBlocks = arcBranch.content
            }
            
            // Determine participant type
            let participantType: 'human' | 'model' | 'system' = 'human'
            if (arcBranch.role === 'assistant') {
              participantType = 'model'
            } else if (arcBranch.role === 'system') {
              participantType = 'system'
            }
            
            // Map participant name
            const participantName = arcBranch.participantName || 
              (arcBranch.role === 'user' ? 'User' : 
               arcBranch.role === 'assistant' ? 'Assistant' : 
               arcBranch.role || 'Unknown')
            
            participants.add(participantName)
            
            // Map parentBranchId
            let parentBranchId: string | undefined
            if (arcBranch.parentBranchId && arcBranch.parentBranchId !== 'root') {
              parentBranchId = branchIdMap.get(arcBranch.parentBranchId)
            }
            
            // Map timestamp
            const timestamp = arcBranch.createdAt 
              ? (typeof arcBranch.createdAt === 'string' ? new Date(arcBranch.createdAt) : arcBranch.createdAt)
              : new Date()
            
            return {
              id: branchId,
              participant_name: participantName,
              participant_type: participantType,
              content_blocks: contentBlocks,
              parent_branch_id: parentBranchId,
              model_info: arcBranch.model ? {
                model_id: arcBranch.model,
                provider: 'other',
                reasoning_enabled: false
              } : undefined,
              timestamp: timestamp,
              hidden_from_models: arcBranch.hiddenFromAi || false,
              metadata: {}
            }
          })
          
          // Map activeBranchId
          const activeBranchId = branchIdMap.get(arcMsg.activeBranchId) || branches[0]?.id
          
          if (!activeBranchId) {
            console.warn('[Submit] Message has no branches or active branch:', arcMsg.id)
            return
          }
          
          converted.push({
            id: messageId,
            submission_id: '', // Will be filled by server
            branches: branches,
            active_branch_id: activeBranchId,
            order: idx
          })
        })
        
        previewMessages.value = converted
        participantNames.value = Array.from(participants)
        
        // Auto-detect source type based on conversation format
        if (sourceType.value === 'json-upload') {
          sourceType.value = 'arc-certified'
        }
        
        console.log('[Submit] Converted', converted.length, 'messages from ARC format with branches preserved')
      } else {
        // For non-loom submissions, convert to linear format by following active branches
        const converted: Message[] = []
        const participants = new Set<string>()
        let parentId: string | null = null
        
        // Build map of branch IDs to their parent message IDs
        const branchToMessageId = new Map<string, string>()
        
        data.messages.forEach((msg: any, idx: number) => {
          // Get the active branch for this message
          const activeBranch = msg.branches.find((b: any) => b.id === msg.activeBranchId)
          
          if (!activeBranch) {
            console.warn('[Submit] Message has no active branch:', msg.id)
            return
          }
          
          const messageId = crypto.randomUUID()
          
          // Store mapping of branch ID to our message ID
          branchToMessageId.set(activeBranch.id, messageId)
          
          // Extract content blocks from branch
          // ARC format has contentBlocks array with thinking/text blocks
          let contentBlocks = []
          if (activeBranch.contentBlocks && Array.isArray(activeBranch.contentBlocks)) {
            // Transform ARC contentBlocks format to our format
            contentBlocks = activeBranch.contentBlocks.map((block: any) => {
              if (block.type === 'thinking') {
                // ARC has thinking as a direct string, we need { content, signature }
                return {
                  type: 'thinking',
                  thinking: {
                    content: block.thinking,
                    signature: block.signature
                  }
                }
              }
              return block
            })
          } else if (typeof activeBranch.content === 'string') {
            contentBlocks = [{ type: 'text', text: activeBranch.content }]
          } else if (Array.isArray(activeBranch.content)) {
            contentBlocks = activeBranch.content
          }
          
          // Determine participant name from role
          let participantName = activeBranch.role === 'user' ? 'User' : 
                               activeBranch.role === 'assistant' ? 'Assistant' : 
                               activeBranch.role || 'Unknown'
          
          participants.add(participantName)
          
          // Figure out parent message ID by looking up parent branch
          let actualParentId = parentId
          if (activeBranch.parentBranchId && activeBranch.parentBranchId !== 'root') {
            actualParentId = branchToMessageId.get(activeBranch.parentBranchId) || parentId
          }
          
          converted.push({
            id: messageId,
            submission_id: '', // Will be filled by server
            parent_message_id: actualParentId,
            order: idx,
            participant_name: participantName,
            participant_type: 'human' as any, // Will be updated based on selection
            content_blocks: contentBlocks,
            model_info: activeBranch.model ? { 
              model_id: activeBranch.model,
              provider: 'other',
              reasoning_enabled: false
            } : undefined,
            timestamp: activeBranch.createdAt || new Date().toISOString()
          })
          
          parentId = messageId
        })
        
        previewMessages.value = converted
        participantNames.value = Array.from(participants)
        
        // Auto-detect source type based on conversation format
        if (sourceType.value === 'json-upload') {
          sourceType.value = 'arc-certified'
        }
        
        console.log('[Submit] Converted', converted.length, 'messages from ARC format')
      }
      
    } else if (data.messages && Array.isArray(data.messages)) {
      // Standard Anthropic API format
      console.log('[Submit] Detected standard Anthropic format')
      
      // Convert Anthropic format to our format
      const converted: Message[] = []
      const participants = new Set<string>()
      let parentId: string | null = null
      
      data.messages.forEach((msg: any, idx: number) => {
        const messageId = crypto.randomUUID()
        
        // Extract content blocks
        let contentBlocks = []
        if (Array.isArray(msg.content)) {
          contentBlocks = msg.content
        } else if (typeof msg.content === 'string') {
          contentBlocks = [{ type: 'text', text: msg.content }]
        }
        
        // Determine participant (but don't assume type yet)
        const participantName = msg.role === 'user' ? 'User' : 
                               msg.role === 'assistant' ? 'Assistant' : 
                               msg.role || 'Unknown'
        participants.add(participantName)
        
        converted.push({
          id: messageId,
          submission_id: '', // Will be filled by server
          parent_message_id: parentId,
          order: idx,
          participant_name: participantName,
          participant_type: 'human' as any, // Will be updated based on selection
          content_blocks: contentBlocks,
          model_info: undefined // Will be set if this is the model
        })
        
        parentId = messageId
      })
      
      previewMessages.value = converted
      participantNames.value = Array.from(participants)
    } else {
      error.value = 'JSON must have a "messages" array (with optional "conversation" metadata for ARC format)'
      return
    }
    
    // Auto-map "Assistant" to Claude if available
    if (participantNames.value.includes('Assistant') && availableModels.value.length > 0) {
      const claude = availableModels.value.find(m => m.name.includes('Claude'))
      if (claude) {
        participantMapping.value['Assistant'] = claude.id
      }
    }
    
    // Auto-map "User" to human
    if (participantNames.value.includes('User')) {
      participantMapping.value['User'] = 'human'
    }
    
    step.value = 'configure'
  } catch (err: any) {
    error.value = 'Invalid JSON: ' + err.message
    console.error('[Submit] Parse error:', err)
  }
}

async function fetchDiscordMessages() {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }
  
  if (!discordLastMessageUrl.value) {
    error.value = 'Please enter the last message URL'
    return
  }
  
  submitting.value = true
  error.value = ''
  
  try {
    console.log('[Discord Import] Fetching messages with params:', {
      last: discordLastMessageUrl.value,
      first: discordFirstMessageUrl.value,
      maxMessages: discordMaxMessages.value
    })
    
    // Fetch messages from Discord API through our backend (server-side credentials)
    const response = await importsAPI.fetchDiscordMessages({
      lastMessageUrl: discordLastMessageUrl.value,
      firstMessageUrl: discordFirstMessageUrl.value || undefined,
      maxMessages: discordMaxMessages.value
    })
    
    console.log('[Discord Import] Fetched messages:', response.data)
    
    // Store fetch statistics
    const metadata = response.data.metadata
    const requestedFirst = discordFirstMessageUrl.value || undefined
    
    // Determine if first message was reached:
    // - If we specified a first URL and got it, we reached it
    // - If we didn't specify a first URL and not truncated, we got everything
    // - If truncated, we didn't reach the beginning
    let firstMessageReached = !metadata.truncated
    if (requestedFirst && response.data.messages.length > 0) {
      const firstMsgId = response.data.messages[0]?.metadata?.discord_message_id
      firstMessageReached = firstMsgId === extractMessageId(requestedFirst)
    }
    
    fetchStats.value = {
      messageCount: metadata.message_count || response.data.messages.length,
      truncated: metadata.truncated || false,
      firstMessageReached,
      requestedFirstUrl: requestedFirst
    }
    
    console.log('[Discord Import] Fetch stats:', fetchStats.value)
    
    // Store participant info with Discord IDs
    discordParticipantsWithIds.value = metadata.participants_with_ids || []
    
    // Convert to preview format
    previewMessages.value = response.data.messages
    
    // Extract unique participants
    const participants = new Set<string>()
    response.data.messages.forEach((msg: any) => {
      participants.add(msg.participant_name)
    })
    participantNames.value = Array.from(participants)
    
    // Use existing mappings first (keyed by Discord user ID), then auto-detect
    participantMapping.value = {}
    const existingMappingsByUserId = response.data.existing_mappings_by_user_id || {}
    
    console.log('[Discord Import] Applying mappings for participants:', participantNames.value)
    console.log('[Discord Import] Existing mappings by user ID:', existingMappingsByUserId)
    
    participantNames.value.forEach(name => {
      // Find participant info to get Discord user ID
      const participantInfo = discordParticipantsWithIds.value.find(p => p.name === name)
      
      if (!participantInfo) {
        console.log(`[Discord Import] No participant info for ${name}`)
        return
      }
      
      // Check if we have an existing mapping for this Discord user ID
      const existingMapping = existingMappingsByUserId[participantInfo.discord_user_id]
      
      if (existingMapping) {
        console.log(`[Discord Import] Found existing mapping for ${name} (${participantInfo.discord_user_id}):`, existingMapping)
        if (existingMapping.is_human) {
          participantMapping.value[name] = 'human'
        } else if (existingMapping.model_id) {
          participantMapping.value[name] = existingMapping.model_id
        }
        console.log(`[Discord Import] Applied mapping: ${name} → ${participantMapping.value[name]}`)
      } else {
        console.log(`[Discord Import] No existing mapping for ${name}, auto-detecting...`)
        // Auto-detect for new participants
        const msg = response.data.messages.find((m: any) => m.participant_name === name)
        if (msg) {
          if (msg.participant_type === 'model' && msg.model_info) {
            // Try to find existing model by name
            const existingModel = availableModels.value.find(
              m => m.name === msg.model_info.model_id || m.model_id === msg.model_info.model_id
            )
            if (existingModel) {
              participantMapping.value[name] = existingModel.id
            }
          } else if (msg.participant_type === 'human') {
            participantMapping.value[name] = 'human'
          }
        }
      }
    })
    
    // Set default title from Discord
    if (!title.value && response.data.title) {
      title.value = response.data.title
    }
    
    // Move to configure step
    step.value = 'configure'
  } catch (err: any) {
    console.error('[Discord Import] Fetch failed:', err)
    
    // Provide specific error messages based on response
    if (err.response?.status === 403 || err.response?.status === 401) {
      error.value = 'Permission denied: The Discord bridge bot may not have access to this channel. Please check that the bot is invited to the server and has permission to read message history.'
    } else if (err.response?.status === 404) {
      error.value = 'Message not found: The Discord message URL may be invalid or the message may have been deleted. Please verify the URL is correct.'
    } else if (err.response?.status === 400) {
      // Bad request - could be invalid URL format or bad parameters
      const errorMsg = err.response?.data?.error || err.response?.data?.message || ''
      if (errorMsg.toLowerCase().includes('url') || errorMsg.toLowerCase().includes('format')) {
        error.value = 'Invalid Discord URL format. Please use: https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID'
      } else {
        error.value = `Invalid request: ${errorMsg || 'Please check your input parameters'}`
      }
    } else if (err.message?.includes('timeout') || err.message?.includes('timed out')) {
      error.value = 'Request timed out: The Discord bridge service is not responding. It may be temporarily unavailable. Please try again in a moment.'
    } else if (err.message?.includes('Network Error') || err.message?.includes('fetch failed')) {
      error.value = 'Network error: Unable to connect to Discord bridge service. Please check your internet connection and try again.'
    } else {
      // Generic error with whatever message we got
      error.value = err.response?.data?.error || err.message || 'Failed to fetch Discord messages. Please try again or contact support.'
    }
  } finally {
    submitting.value = false
  }
}

async function submit() {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }
  
  if (!title.value) {
    error.value = 'Title is required'
    return
  }
  
  // Check all participants are mapped
  const unmapped = participantNames.value.filter(name => !participantMapping.value[name])
  if (unmapped.length > 0) {
    error.value = `Please identify all participants: ${unmapped.join(', ')}`
    return
  }
  
  submitting.value = true
  error.value = ''
  
  try {
    // Update messages with correct participant types and model info
    // For loom submissions: apply mapping to branches (each branch has its own participant)
    // For non-loom submissions: apply mapping to messages
    const updatedMessages = previewMessages.value.map(msg => {
      // If this is a loom message with branches
      if (msg.branches && msg.branches.length > 0) {
        const updatedBranches = msg.branches.map(branch => {
          const mapping = participantMapping.value[branch.participant_name]
          const isHuman = mapping === 'human'
          const modelData = isHuman ? null : availableModels.value.find(m => m.id === mapping)
          
          return {
            ...branch,
            participant_type: isHuman ? 'human' : 'model',
            model_info: modelData ? {
              model_id: modelData.model_id,
              provider: modelData.provider,
              reasoning_enabled: false
            } : undefined
          }
        })
        
        return {
          ...msg,
          branches: updatedBranches
        }
      } else {
        // Non-loom message - apply mapping directly
        const mapping = participantMapping.value[msg.participant_name]
        const isHuman = mapping === 'human'
        const modelData = isHuman ? null : availableModels.value.find(m => m.id === mapping)
        
        return {
          ...msg,
          participant_type: isHuman ? 'human' : 'model',
          model_info: modelData ? {
            model_id: modelData.model_id,
            provider: modelData.provider,
            reasoning_enabled: false
          } : undefined
        }
      }
    })
    
    // Map submissionCategory to submission_type
    const submissionTypeMap: Record<string, 'conversation' | 'document' | 'loom'> = {
      'conversation': 'conversation',
      'completion': 'document',
      'loom': 'loom',
      'other': 'conversation'
    }
    
    const response = await submissionsAPI.create({
      title: title.value,
      submission_type: submissionTypeMap[submissionCategory.value] || 'conversation',
      source_type: submissionCategory.value === 'completion' ? 'other' : sourceType.value,
      visibility: visibility.value,
      messages: updatedMessages,
      metadata: {
        tags: selectedTopics.value,
        description: description.value || undefined
      }
    })
    
    // Save participant mappings if this was a Discord import
    if (sourceType.value === 'discord' && discordParticipantsWithIds.value.length > 0) {
      try {
        const mappingsToSave = discordParticipantsWithIds.value.map(participant => {
          const mapping = participantMapping.value[participant.name]
          return {
            source_user_id: participant.discord_user_id,
            source_username: participant.username,
            source_display_name: participant.display_name,
            avatar_url: participant.avatar_url,
            model_id: mapping === 'human' ? undefined : mapping,
            is_human: mapping === 'human'
          }
        }).filter(m => m.model_id || m.is_human) // Only save if mapped
        
        if (mappingsToSave.length > 0) {
          await importsAPI.saveMappings('discord', mappingsToSave)
          console.log('[Discord Import] Saved', mappingsToSave.length, 'participant mappings')
        }
      } catch (err) {
        console.error('[Discord Import] Failed to save mappings:', err)
        // Don't block submission on mapping save failure
      }
    }
    
    // Navigate to the new submission
    router.push(`/submissions/${response.data.id}`)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to submit'
    console.error('Submit error:', err)
  } finally {
    submitting.value = false
  }
}

function getMessageText(msg: Message): string {
  const textBlock = msg.content_blocks.find(b => b.type === 'text')
  return textBlock?.text || ''
}

function truncate(text: string, length: number) {
  return text.length > length ? text.substring(0, length) + '...' : text
}
</script>
