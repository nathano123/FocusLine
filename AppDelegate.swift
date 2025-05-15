import Cocoa
import SwiftUI
import UserNotifications

class AppDelegate: NSObject, NSApplicationDelegate, UNUserNotificationCenterDelegate {
    private var statusItem: NSStatusItem!
    private var timerWindow: NSWindow?
    private var timerModel = TimerModel()
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Prevent the app from terminating when the last window is closed
        NSApp.setActivationPolicy(.accessory)
        
        UNUserNotificationCenter.current().delegate = self
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound]) { _, _ in }
        setupMenuBar()
    }
    
    func applicationWillTerminate(_ notification: Notification) {
        // Clean up any resources
        timerModel.isRunning = false
    }
    
    private func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "timer", accessibilityDescription: "Timer")
        }
        
        let menu = NSMenu()
        
        // Add preset durations
        let durations = [5, 15, 25, 50]
        for duration in durations {
            let item = NSMenuItem(title: "\(duration) minutes", action: #selector(startTimer(_:)), keyEquivalent: "")
            item.target = self
            item.tag = duration
            menu.addItem(item)
        }
        
        menu.addItem(NSMenuItem.separator())
        
        // Add custom duration option
        let customItem = NSMenuItem(title: "Custom Duration...", action: #selector(showCustomDuration), keyEquivalent: "")
        customItem.target = self
        menu.addItem(customItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Add color submenu
        let colorMenu = NSMenu()
        for (name, color) in timerModel.availableColors {
            let item = NSMenuItem(title: name, action: #selector(setColor(_:)), keyEquivalent: "")
            item.target = self
            item.tag = timerModel.availableColors.firstIndex(where: { $0.0 == name }) ?? 0
            colorMenu.addItem(item)
        }
        let colorItem = NSMenuItem(title: "Line Color", action: nil, keyEquivalent: "")
        colorItem.submenu = colorMenu
        menu.addItem(colorItem)
        
        // Add thickness submenu
        let thicknessMenu = NSMenu()
        for (name, thickness) in timerModel.availableThicknesses {
            let item = NSMenuItem(title: name, action: #selector(setThickness(_:)), keyEquivalent: "")
            item.target = self
            item.tag = timerModel.availableThicknesses.firstIndex(where: { $0.0 == name }) ?? 0
            thicknessMenu.addItem(item)
        }
        let thicknessItem = NSMenuItem(title: "Line Thickness", action: nil, keyEquivalent: "")
        thicknessItem.submenu = thicknessMenu
        menu.addItem(thicknessItem)
        
        menu.addItem(NSMenuItem.separator())
        
        // Add quit option
        let quitItem = NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        menu.addItem(quitItem)
        
        statusItem.menu = menu
    }
    
    @objc private func startTimer(_ sender: NSMenuItem) {
        let duration = sender.tag
        startTimerWithDuration(duration)
    }
    
    @objc private func showCustomDuration() {
        let alert = NSAlert()
        alert.messageText = "Enter Custom Duration"
        alert.informativeText = "Please enter the duration in minutes:"
        
        let input = NSTextField(frame: NSRect(x: 0, y: 0, width: 200, height: 24))
        input.placeholderString = "Enter minutes"
        alert.accessoryView = input
        
        alert.addButton(withTitle: "Start")
        alert.addButton(withTitle: "Cancel")
        
        if alert.runModal() == .alertFirstButtonReturn {
            if let duration = Int(input.stringValue) {
                startTimerWithDuration(duration)
            }
        }
    }
    
    @objc private func setColor(_ sender: NSMenuItem) {
        let index = sender.tag
        if index < timerModel.availableColors.count {
            timerModel.lineColor = timerModel.availableColors[index].1
        }
    }
    
    @objc private func setThickness(_ sender: NSMenuItem) {
        let index = sender.tag
        if index < timerModel.availableThicknesses.count {
            timerModel.lineThickness = timerModel.availableThicknesses[index].1
        }
    }
    
    private func startTimerWithDuration(_ minutes: Int) {
        if timerWindow == nil {
            setupTimerWindow()
        }
        
        timerModel.startTimer(duration: minutes)
    }
    
    private func setupTimerWindow() {
        guard let screen = NSScreen.main else { return }
        
        let window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: screen.frame.width, height: timerModel.lineThickness),
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )
        
        window.level = .floating
        window.backgroundColor = .clear
        window.isOpaque = false
        window.hasShadow = false
        window.ignoresMouseEvents = true
        window.collectionBehavior = [.canJoinAllSpaces, .stationary]
        
        let timerView = TimerView(model: timerModel)
        window.contentView = NSHostingView(rootView: timerView)
        
        self.timerWindow = window
        
        // Position window at the top of the screen
        window.setFrameOrigin(NSPoint(x: 0, y: screen.frame.height - timerModel.lineThickness))
        window.makeKeyAndOrderFront(nil)
    }

    // Show notifications even if app is foreground/background
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        return [.banner, .sound]
    }
} 
