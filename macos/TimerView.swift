import SwiftUI

struct TimerView: View {
    @ObservedObject var model: TimerModel

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color.black.opacity(0.15))
                Rectangle()
                    .fill(model.lineColor.opacity(model.isRunning ? 0.95 : 0.5))
                    .frame(width: geometry.size.width * model.progress)
                    .animation(.linear(duration: 0.1), value: model.progress)
            }
        }
        .frame(height: model.lineThickness)
    }
}
