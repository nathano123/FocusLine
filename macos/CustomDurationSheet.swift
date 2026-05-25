// CustomDurationSheet.swift
// "Custom duration" modal — see the MacCustomDuration artboard.
// Hosted in a transient NSWindow attached to the popover via beginSheet.
//
// Drop into the macOS target.

import AppKit
import SwiftUI

enum CustomDurationSheet {
    static func makeWindow(model: TimerModel, onClose: @escaping (NSWindow) -> Void) -> NSWindow {
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 380, height: 380),
            styleMask: [.titled, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.titleVisibility = .hidden
        window.titlebarAppearsTransparent = true
        window.isMovableByWindowBackground = true
        window.contentView = NSHostingView(rootView: CustomDurationView(model: model, onClose: {
            onClose(window)
        }))
        return window
    }
}

struct CustomDurationView: View {
    @ObservedObject var model: TimerModel
    var onClose: () -> Void

    @State private var minutes: Int = 42

    private let chips: [Int] = [10, 20, 30, 45, 60, 90]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 10) {
                BrandMark(size: 18)
                Text("CUSTOM DURATION")
                    .font(.system(size: 10.5).monospaced())
                    .tracking(0.9)
                    .foregroundStyle(.secondary)
            }
            Text("How long to focus?")
                .font(.system(size: 20, weight: .medium))
                .tracking(-0.4)
                .padding(.top, 8)
            Text("Up to 10 hours. The line will fill across this duration.")
                .font(.system(size: 13.5))
                .foregroundStyle(.secondary)
                .padding(.top, 2)

            HStack(alignment: .lastTextBaseline, spacing: 8) {
                Text("\(minutes)")
                    .font(.system(size: 72, weight: .medium, design: .monospaced))
                    .monospacedDigit()
                    .tracking(-2.5)
                Text("min")
                    .font(.system(size: 16).monospaced())
                    .foregroundStyle(.secondary)
                Spacer()
                Text("= \(minutes / 60)h \(minutes % 60)m")
                    .font(.system(size: 12).monospaced())
                    .foregroundStyle(.tertiary)
            }
            .padding(.top, 12)
            .padding(.bottom, 12)

            Slider(value: Binding(get: { Double(minutes) }, set: { minutes = Int($0) }), in: 1...180, step: 1)
                .tint(Color.accentColor)

            // Tick labels
            HStack {
                ForEach([5, 25, 50, 90, 120], id: \.self) { m in
                    Text("\(m)").font(.system(size: 9.5).monospaced()).foregroundStyle(.secondary)
                    if m != 120 { Spacer() }
                }
            }
            .padding(.top, 2)
            .padding(.bottom, 12)

            HStack(spacing: 5) {
                ForEach(chips, id: \.self) { m in
                    Button {
                        minutes = m
                    } label: {
                        Text("\(m)m")
                            .font(.system(size: 11.5).monospaced())
                            .padding(.horizontal, 9)
                            .padding(.vertical, 4)
                            .background(m == minutes ? Color.black.opacity(0.88) : Color.black.opacity(0.05))
                            .foregroundStyle(m == minutes ? .white : .primary)
                            .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.bottom, 18)

            HStack {
                Spacer()
                Button("Cancel", action: onClose)
                    .keyboardShortcut(.escape, modifiers: [])
                Button("Start · \(minutes) min") {
                    model.startTimer(minutes: minutes, phase: .work, intention: "")
                    onClose()
                }
                .keyboardShortcut(.defaultAction)
                .buttonStyle(.borderedProminent)
            }
        }
        .padding(22)
        .frame(width: 380)
        .background(.ultraThinMaterial)
    }
}
