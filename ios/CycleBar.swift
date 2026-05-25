// CycleBar.swift
// Pomodoro cycle visualization — shared across iOS app, macOS popover
// (when running), and any other surface that wants to show the
// work/break/long-break rhythm.
//
// Drop into both targets.

import SwiftUI

struct CycleBar: View {
    /// How many work blocks have been completed so far.
    var completed: Int
    /// Are we currently in a break (vs. a work block)?
    var isInBreak: Bool
    /// 0…1 progress through the *current* block.
    var currentProgress: Double
    /// After this many work blocks, the cycle inserts a long break.
    var cyclesBeforeLongBreak: Int = 4
    /// Accent color for work blocks.
    var color: Color = .red

    private let breakColor = Color.green   // spring
    private let longBreakColor = Color.blue // cobalt

    var body: some View {
        // Build a flat list of [work, short, work, short, …, long]
        // covering the next `cyclesBeforeLongBreak` work blocks.
        let segments = buildSegments()
        HStack(spacing: 4) {
            ForEach(Array(segments.enumerated()), id: \.offset) { idx, seg in
                segView(seg)
                    .layoutPriority(Double(seg.weight))
                    .frame(maxWidth: .infinity)
            }
        }
    }

    @ViewBuilder
    private func segView(_ seg: Segment) -> some View {
        let segColor: Color = {
            switch seg.kind {
            case .work: return color
            case .short: return breakColor
            case .long: return longBreakColor
            }
        }()
        ZStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 4)
                .fill(seg.done ? segColor : (seg.active ? .clear : Color.black.opacity(0.06)))
            if seg.active {
                RoundedRectangle(cornerRadius: 4)
                    .fill(segColor)
                    .frame(width: nil)
                    .mask(
                        GeometryReader { geo in
                            HStack(spacing: 0) {
                                Rectangle().fill(.black).frame(width: geo.size.width * currentProgress)
                                Spacer(minLength: 0)
                            }
                        }
                    )
                RoundedRectangle(cornerRadius: 4).stroke(segColor, lineWidth: 1)
            }
            // Label
            Text(label(for: seg))
                .font(.system(size: 9.5).monospaced())
                .tracking(0.6)
                .foregroundStyle(seg.done ? .white : (seg.active ? segColor : .secondary))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func label(for seg: Segment) -> String {
        switch seg.kind {
        case .work: return "25"
        case .short: return "5m"
        case .long: return "15m"
        }
    }

    private func buildSegments() -> [Segment] {
        var out: [Segment] = []
        let n = cyclesBeforeLongBreak
        for i in 0..<n {
            let workDone = i < completed
            let workActive = (i == completed) && !isInBreak
            out.append(.init(kind: .work, weight: 4, done: workDone, active: workActive))
            if i < n - 1 {
                let breakDone = i < completed - (isInBreak ? 1 : 0)
                let breakActive = (i == completed - (isInBreak ? 1 : 0)) && isInBreak
                out.append(.init(kind: .short, weight: 1, done: breakDone, active: breakActive))
            }
        }
        out.append(.init(kind: .long, weight: 3, done: false, active: false))
        return out
    }

    struct Segment {
        enum Kind { case work, short, long }
        let kind: Kind
        let weight: Int
        let done: Bool
        let active: Bool
    }
}
