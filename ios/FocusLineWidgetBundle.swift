// FocusLineWidgetBundle.swift
// Bundle entry — registers the Live Activity widget plus the two
// home-screen widgets.
//
// REPLACES the existing ios/FocusLineWidgetBundle.swift.

import WidgetKit
import SwiftUI

@main
struct FocusLineWidgetBundle: WidgetBundle {
    var body: some Widget {
        FocusLineLiveActivity()
        FocusLineSmallWidget()
        FocusLineMediumWidget()
        // To add a lock-screen rectangular widget, register here too.
    }
}
