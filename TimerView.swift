import SwiftUI
import UserNotifications

struct TimerView: View {
    @ObservedObject var model: TimerModel

    var body: some View {
        GeometryReader { geometry in
            Rectangle()
                .fill(model.lineColor.opacity(0.8))
                .frame(width: geometry.size.width * model.progress, height: model.lineThickness)
                .animation(.linear(duration: 0.1), value: model.progress)
        }
        .frame(height: model.lineThickness)
        .onAppear {
            requestNotificationPermission()
        }
    }
    
    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { granted, error in
            if let error = error {
                print("Error requesting notification permission: \(error)")
            }
        }
    }
} 
