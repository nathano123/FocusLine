import SwiftUI
import UserNotifications

@main
struct FocusLineApp: App {
    init() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
