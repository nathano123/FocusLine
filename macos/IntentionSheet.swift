// IntentionSheet.swift
// Modal sheet that asks "What are you focusing on?" before starting a work block.
// Shown by PopoverContentView when the user clicks a preset without having
// typed an intention. Wraps a `Recent` chip row for one-tap fill.
//
// Drop into the macOS target.

import SwiftUI

struct IntentionSheet: View {
    var minutes: Int
    var recent: [String]
    var onStart: (String) -> Void
    var onSkip: () -> Void

    @State private var intention: String = ""
    @FocusState private var focused: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(spacing: 10) {
                BrandMark(size: 18)
                Text("BEGIN · \(minutes) MIN")
                    .font(.system(size: 10.5).monospaced())
                    .tracking(0.9)
                    .foregroundStyle(.secondary)
            }

            Text("What are you focusing on?")
                .font(.system(size: 20, weight: .medium))
                .tracking(-0.4)
                .padding(.top, 8)

            Text("One short sentence. Surfaced in the menubar and your history.")
                .font(.system(size: 13.5))
                .foregroundStyle(.secondary)
                .padding(.top, 2)

            TextField("", text: $intention, prompt: Text("e.g. draft the launch post"))
                .textFieldStyle(.plain)
                .font(.system(size: 15))
                .focused($focused)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.black.opacity(0.1), lineWidth: 0.5))
                .padding(.top, 14)
                .onSubmit { onStart(intention) }

            if !recent.isEmpty {
                Text("RECENT")
                    .font(.system(size: 10.5).monospaced())
                    .tracking(0.9)
                    .foregroundStyle(.secondary)
                    .padding(.top, 14)

                FlowChips(items: recent) { tap in
                    intention = tap
                    focused = true
                }
                .padding(.top, 6)
            }

            HStack(spacing: 10) {
                Text("↵ start").font(.system(size: 11).monospaced()).foregroundStyle(.tertiary)
                Text("⎋ skip intention").font(.system(size: 11).monospaced()).foregroundStyle(.tertiary)
                Spacer()
                Button("Skip", action: onSkip)
                    .keyboardShortcut(.escape, modifiers: [])
                    .buttonStyle(.bordered)
                Button("Start focus") { onStart(intention) }
                    .keyboardShortcut(.defaultAction)
                    .buttonStyle(.borderedProminent)
            }
            .padding(.top, 18)
        }
        .padding(22)
        .frame(width: 380)
        .background(.ultraThinMaterial)
        .onAppear { focused = true }
    }
}

private struct FlowChips: View {
    var items: [String]
    var onTap: (String) -> Void

    var body: some View {
        // Simple wrap layout
        let chunks = items.chunked(into: 3)
        VStack(alignment: .leading, spacing: 5) {
            ForEach(Array(chunks.enumerated()), id: \.offset) { _, row in
                HStack(spacing: 5) {
                    ForEach(row, id: \.self) { chip in
                        Button {
                            onTap(chip)
                        } label: {
                            Text(chip)
                                .font(.system(size: 12))
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(Color.black.opacity(0.05))
                                .clipShape(Capsule())
                                .foregroundStyle(.primary)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

extension Array {
    func chunked(into size: Int) -> [[Element]] {
        guard size > 0 else { return [self] }
        return stride(from: 0, to: count, by: size).map {
            Array(self[$0..<Swift.min($0 + size, count)])
        }
    }
}
