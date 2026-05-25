import Foundation

/// Runs user-defined macOS Shortcuts via the `shortcuts` CLI to toggle a Focus mode.
/// macOS doesn't expose a public API to programmatically toggle Focus. The standard
/// workaround (used by Vimcal, Cal.com, etc.): the user creates two Shortcuts —
/// "FocusLine On" turns Do Not Disturb on, "FocusLine Off" turns it off — and we
/// shell out to run them.
enum FocusShortcut {
    /// Names the user is expected to create.
    static let onName = "FocusLine On"
    static let offName = "FocusLine Off"

    static func enable() { run(onName) }
    static func disable() { run(offName) }

    private static func run(_ shortcutName: String) {
        let p = Process()
        p.launchPath = "/usr/bin/env"
        p.arguments = ["shortcuts", "run", shortcutName]
        // We don't care about the output and don't want to block; fire and forget.
        let pipe = Pipe()
        p.standardOutput = pipe
        p.standardError = pipe
        DispatchQueue.global(qos: .utility).async {
            do { try p.run() } catch { /* user hasn't set up the shortcut yet */ }
        }
    }
}
