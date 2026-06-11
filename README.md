# pi-caveman

Pi-native fork/package of [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman). Upstream idea, wording, and MIT license retained with attribution. This fork packages caveman as a Pi extension instead of an installer/skill bundle.

## Install

Standalone install:

```bash
pi install git:github.com/osmargm1202/pi-caveman
```

Recommended ORGM stack install:

```bash
for pkg in pi-mem pi-caveman pi-harness pi-footer; do
  pi install git:github.com/osmargm1202/$pkg
done
```

## ORGM Pi stack

This package is part of the ORGM Pi extension stack.

Packages:

- `pi-mem`: local memory/context index provider.
- `pi-caveman`: caveman runtime and shared state events.
- `pi-harness`: ORGM commands, config, title, ask/todo/banner bridge.
- `pi-footer`: Zentui-based editor/footer UI that displays ORGM status.

## Coupled integrations

Produces:

- Caveman prompt/runtime behavior.
- `/caveman`, `/caveman-commit`, `/caveman-review`, `/caveman-compress`, `/caveman-stats` commands.
- Shared state session entry/event: `pi-caveman:state`.

Consumes:

- Pi lifecycle/input events.
- User config at `~/.pi/agent/pi-caveman/config.json`.

Hard dependencies:

- None. `pi-caveman` can load alone.

Soft dependencies:

- `pi-footer` displays `pi-caveman:state` as `caveman:<level>`.
- `pi-harness` can observe caveman state for ORGM UI/status integrations.

Package manifest exposes only:

```json
{
  "pi": {
    "extensions": ["./extensions/caveman.ts"]
  }
}
```

No `SKILL.md` dependency. Prompt rules live in TypeScript package files.

## Default behavior

`pi-caveman` auto-enables for each new Pi session by default.

- default level: `full`
- default config path: `~/.pi/agent/pi-caveman/config.json`
- disable persistently: `/caveman off` or `/caveman normal`
- re-enable: `/caveman on`

Config schema:

```json
{
  "schemaVersion": 1,
  "autoEnable": true,
  "defaultLevel": "full",
  "showStartupNotice": false
}
```

Levels:

- `lite`
- `full`
- `ultra`
- `wenyan-lite`
- `wenyan-full`
- `wenyan-ultra`

`wenyan` aliases `wenyan-full`.

## Commands

| Command | What |
|---|---|
| `/caveman [status|on|off|normal|level]` | Show or change runtime caveman mode; level changes persist. |
| `/caveman-commit [context]` | Conventional Commit guidance in terse style. |
| `/caveman-review [context]` | Terse PR review/comment guidance. |
| `/caveman-compress <file>` | Safe preview guidance for compressing prose files; no destructive write without future explicit confirmation flow. |
| `/caveman-stats [--reset]` | Shows best-effort stats. Token savings are labeled estimates. |

## Shared Pi state contract

Runtime publishes state with one stable key/name:

- session entry `customType`: `pi-caveman:state`
- event name: `pi-caveman:state`

Payload:

```ts
interface PiCavemanStateV1 {
  schemaVersion: 1;
  packageName: "pi-caveman";
  enabled: boolean;
  level: CavemanLevel | null;
  defaultLevel: CavemanLevel;
  autoEnable: boolean;
  source: "startup" | "command" | "input" | "config";
  updatedAt: number;
}
```

Consumers should validate `schemaVersion === 1`, `packageName === "pi-caveman"`, known level/null, and booleans. Absence of this package should be silent.

## Development

```bash
bun test
pi -e ./extensions/caveman.ts
```

Install smoke, preferably with disposable Pi config/home:

```bash
pi install git:github.com/osmargm1202/pi-caveman
pi list
```

## Upstream attribution

This package is forked from `JuliusBrussee/caveman` by Julius Brussee and contributors. Original project: <https://github.com/JuliusBrussee/caveman>. License remains MIT. This fork changes packaging/runtime integration for Pi.
