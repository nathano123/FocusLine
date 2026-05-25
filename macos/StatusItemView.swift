// StatusItemView.swift
// Custom-drawn menubar icon: a small black rounded square with a thin
// colored line that fills as `progress` advances. Replaces the stock
// `NSImage(systemSymbolName: "timer")` in AppDelegate.setupMenuBar().
//
// Drop into the macOS target. Used by PopoverWindowController.

import AppKit
import SwiftUI

struct StatusItemIcon: View {
    /// 0...1 progress through the current session. 0 when idle.
    var progress: Double
    /// The chosen line color.
    var color: Color
    /// True while the timer is actively running (not paused, not idle).
    var isRunning: Bool

    var body: some View {
        // The menubar gives us 18×18 by default; we draw within that.
        let size: CGFloat = 18
        let radius = size * 0.27
        let lineY = size * 0.41
        let lineHeight = max(2, size * 0.14)
        let lineLeft = size * 0.18
        let lineFullWidth = size * 0.64

        ZStack(alignment: .topLeading) {
            // Black rounded square — the "screen" the line lives on
            RoundedRectangle(cornerRadius: radius, style: .continuous)
                .fill(Color.black.opacity(0.88))
                .frame(width: size, height: size)

            // Empty track
            Capsule()
                .fill(Color.white.opacity(0.18))
                .frame(width: lineFullWidth, height: lineHeight)
                .offset(x: lineLeft, y: lineY)

            // Filled line
            Capsule()
                .fill(color)
                .frame(width: lineFullWidth * CGFloat(min(1, max(0, progress))), height: lineHeight)
                .opacity(isRunning ? 1 : 0.5)
                .shadow(color: isRunning ? color.opacity(0.7) : .clear, radius: 2)
                .offset(x: lineLeft, y: lineY)
                .animation(.linear(duration: 0.1), value: progress)
        }
        .frame(width: size, height: size)
        .accessibilityHidden(true)
    }
}

/// A drop-in NSView that hosts StatusItemIcon. Use this as the
/// status-item button's view so the icon updates reactively.
final class StatusItemIconHostingView: NSView {
    private let host: NSHostingView<StatusItemIcon>
    private(set) var progress: Double = 0
    private(set) var isRunning: Bool = false
    private(set) var color: NSColor = .systemGreen

    init() {
        self.host = NSHostingView(
            rootView: StatusItemIcon(progress: 0, color: Color(nsColor: .systemGreen), isRunning: false)
        )
        super.init(frame: NSRect(x: 0, y: 0, width: 22, height: 22))
        host.translatesAutoresizingMaskIntoConstraints = false
        addSubview(host)
        NSLayoutConstraint.activate([
            host.centerXAnchor.constraint(equalTo: centerXAnchor),
            host.centerYAnchor.constraint(equalTo: centerYAnchor),
            host.widthAnchor.constraint(equalToConstant: 18),
            host.heightAnchor.constraint(equalToConstant: 18),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    func update(progress: Double, isRunning: Bool, color: NSColor) {
        self.progress = progress
        self.isRunning = isRunning
        self.color = color
        host.rootView = StatusItemIcon(
            progress: progress,
            color: Color(nsColor: color),
            isRunning: isRunning
        )
    }
}
