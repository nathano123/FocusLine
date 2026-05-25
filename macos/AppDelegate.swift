import Cocoa
import SwiftUI
import UserNotifications
import Combine

@MainActor
class AppDelegate: NSObject, NSApplicationDelegate, UNUserNotificationCenterDelegate {
    private var statusItem: NSStatusItem!
    private var timerWindows: [NSWindow] = []
    private let timerModel = TimerModel()
    private var cancellables: Set<AnyCancellable> = []
    private var screenChangeObserver: NSObjectProtocol?
    private var hotkey: GlobalHotkey?
    private var wasRunningLastTick = false
    private var popoverController: PopoverWindowController?

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)

        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }

        setupMenuBar()
        observeModel()
        observeScreens()
        installHotkey()
    }

    func applicationWillTerminate(_ notification: Notification) {
        timerModel.cancel()
        if let token = screenChangeObserver {
            NotificationCenter.default.removeObserver(token)
        }
    }

    private func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        popoverController = PopoverWindowController(statusItem: statusItem, model: timerModel)
    }

    private func installHotkey() {
        // ⌃⌥⌘F → start a default work block (or pause/resume if one is already running)
        hotkey = GlobalHotkey { [weak self] in
            guard let self = self else { return }
            DispatchQueue.main.async {
                if self.timerModel.phase == .idle {
                    self.timerModel.startTimer(minutes: self.timerModel.workMinutes, phase: .work)
                    self.rebuildTimerWindows()
                    if self.timerModel.dndIntegration {
                        FocusShortcut.enable()
                    }
                } else if self.timerModel.isRunning {
                    self.timerModel.pause()
                } else {
                    self.timerModel.resume()
                }
            }
        }
        hotkey?.start()
    }

    // MARK: - Multi-monitor window management

    private func observeScreens() {
        screenChangeObserver = NotificationCenter.default.addObserver(
            forName: NSApplication.didChangeScreenParametersNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                guard let self = self else { return }
                if self.timerModel.phase != .idle {
                    self.rebuildTimerWindows()
                }
            }
        }
    }

    private func rebuildTimerWindows() {
        teardownTimerWindows()
        for screen in NSScreen.screens {
            timerWindows.append(makeWindow(for: screen))
        }
    }

    private func teardownTimerWindows() {
        for w in timerWindows {
            w.orderOut(nil)
        }
        timerWindows.removeAll()
    }

    private func makeWindow(for screen: NSScreen) -> NSWindow {
        let thickness = timerModel.lineThickness
        let frame = NSRect(
            x: screen.frame.origin.x,
            y: screen.frame.origin.y + screen.frame.height - thickness,
            width: screen.frame.width,
            height: thickness
        )
        let window = NSWindow(
            contentRect: frame,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        window.level = .statusBar
        window.backgroundColor = .clear
        window.isOpaque = false
        window.hasShadow = false
        window.ignoresMouseEvents = true
        window.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary]
        window.contentView = NSHostingView(rootView: TimerView(model: timerModel))
        window.orderFrontRegardless()
        return window
    }

    // MARK: - Model observation (DND + idle teardown)

    private func observeModel() {
        timerModel.objectWillChange
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in
                DispatchQueue.main.async { self?.onModelChange() }
            }
            .store(in: &cancellables)
    }

    private func onModelChange() {
        // Side effects only — the popover controller observes the model itself for UI updates.
        let isWorkingNow = timerModel.phase == .work && timerModel.isRunning

        // DND auto-toggle on work→non-work transition
        if wasRunningLastTick && !isWorkingNow && timerModel.dndIntegration {
            FocusShortcut.disable()
        }
        wasRunningLastTick = isWorkingNow

        // Tear down the line windows when the session ends
        if timerModel.phase == .idle {
            teardownTimerWindows()
        } else if timerWindows.isEmpty {
            // Phase entered from idle (e.g. popover started a session) — bring up the lines
            rebuildTimerWindows()
            if timerModel.phase == .work && timerModel.dndIntegration {
                FocusShortcut.enable()
            }
        }
    }

    // MARK: - Notification surfacing

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        return [.banner, .sound]
    }
}
