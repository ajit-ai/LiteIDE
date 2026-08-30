# External Plugins Drop Folder

Drop external plugin folders here. Each plugin must contain a `plugin.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "0.1.0",
  "languages": ["go"],
  "entry": "index.js"
}
```

Plugins communicate **only** via the Event Bus (see `src/plugins/plugin-api.ts`).
Direct imports between plugins are forbidden. Adding a new language = one new plugin package — zero core changes (Rule 4).
