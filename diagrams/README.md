# Feature Sequence Diagrams

User-to-user interaction sequences showing device and relay communication.

## Interaction Types

| Symbol | Meaning |
|--------|---------|
| `🤝` | **In-Person (Proximity)** - Physical presence required, verified via ultrasonic/NFC/BLE |
| `🌐` | **Remote** - Over network via relay, no physical proximity |
| `📱` | Device |
| `🖥️` | Relay Server |

## Diagrams

| Diagram | Interaction Type | Description |
|---------|------------------|-------------|
| [Contact Exchange](01-contact-exchange.md) | 🤝 In-Person | QR code exchange with proximity verification |
| [Device Linking](02-device-linking.md) | 🤝 In-Person | Link new device to existing identity |
| [Sync Updates](03-sync-updates.md) | 🌐 Remote | Contact card updates via relay |
| [Contact Recovery](04-contact-recovery.md) | 🤝 + 🌐 Mixed | Social vouching with in-person + relay |

## Reading the Diagrams

- **Solid arrows** (`->>`): Synchronous request/response
- **Dashed arrows** (`-->>`): Asynchronous/background operation
- **Notes**: Explain what data is exchanged
- **Alt/Opt blocks**: Conditional flows

## Rendering

Diagrams use Mermaid syntax. View in:
- GitHub/GitLab (native support)
- VS Code with Mermaid extension
- Any Mermaid-compatible viewer
