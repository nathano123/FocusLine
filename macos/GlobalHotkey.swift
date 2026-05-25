import Cocoa

/// A simple global hotkey monitor using NSEvent.addGlobalMonitorForEvents.
/// Local monitor is also installed so the shortcut still fires when our own app is frontmost.
@MainActor
final class GlobalHotkey {
    private var globalMonitor: Any?
    private var localMonitor: Any?

    /// Key spec: a `keyCode` (e.g. 3 = F) and a `modifierFlags` set.
    /// Default: ⌃⌥⌘F (Control + Option + Command + F).
    private let keyCode: UInt16
    private let modifierFlags: NSEvent.ModifierFlags
    private let handler: () -> Void

    init(keyCode: UInt16 = 3,
         modifierFlags: NSEvent.ModifierFlags = [.control, .option, .command],
         handler: @escaping () -> Void) {
        self.keyCode = keyCode
        self.modifierFlags = modifierFlags
        self.handler = handler
    }

    func start() {
        guard globalMonitor == nil else { return }
        globalMonitor = NSEvent.addGlobalMonitorForEvents(matching: .keyDown) { [weak self] event in
            self?.handleIfMatch(event)
        }
        localMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { [weak self] event in
            self?.handleIfMatch(event)
            return event
        }
    }

    func stop() {
        if let g = globalMonitor { NSEvent.removeMonitor(g) }
        if let l = localMonitor { NSEvent.removeMonitor(l) }
        globalMonitor = nil
        localMonitor = nil
    }

    private func handleIfMatch(_ event: NSEvent) {
        guard event.keyCode == keyCode else { return }
        // Compare only the modifier flags that matter (ignore caps lock, num pad, etc).
        let mask: NSEvent.ModifierFlags = [.control, .option, .command, .shift]
        if event.modifierFlags.intersection(mask) == modifierFlags {
            handler()
        }
    }
}
