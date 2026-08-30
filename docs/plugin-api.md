# Plugin API

Source of truth: `src/plugins/plugin-api.ts`

```ts
interface LiteIDEPlugin {
  metadata: { id, name, version, languages: string[] }
  activate(api: LiteIDEPluginAPI): void
  deactivate(): void
}
interface LiteIDEPluginAPI {
  commands: CommandsAPI
  editor: EditorAPI
  fs: FileSystemAPI
  process: ProcessAPI
  ui: UIAPI
  events: EventBusAPI
}
```

## Rules
- ADDITIVE ONLY
- Event Bus only for inter-plugin comms
- One language = one plugin package under `src/plugins/lang-*`

## Adding a language example (Go)

Create `src/plugins/lang-go/index.ts` implementing `LiteIDEPlugin` with `gopls`.
