import ActivityKit
import Foundation

/// Shared between the app target and the widget extension.
public struct FocusLineActivityAttributes: ActivityAttributes {
    public typealias ContentState = State

    public struct State: Codable, Hashable {
        public var startDate: Date
        public var endDate: Date
        public var isRunning: Bool
        public var phase: Phase
        public var intention: String?
        public var colorHex: String

        public init(startDate: Date, endDate: Date, isRunning: Bool, phase: Phase, intention: String?, colorHex: String) {
            self.startDate = startDate
            self.endDate = endDate
            self.isRunning = isRunning
            self.phase = phase
            self.intention = intention
            self.colorHex = colorHex
        }
    }

    public enum Phase: String, Codable, Hashable {
        case work
        case shortBreak
        case longBreak

        public var displayName: String {
            switch self {
            case .work: return "Focus"
            case .shortBreak: return "Short break"
            case .longBreak: return "Long break"
            }
        }
    }

    /// Attribute fields that don't change for the lifetime of the activity.
    public var sessionId: String

    public init(sessionId: String) {
        self.sessionId = sessionId
    }
}
