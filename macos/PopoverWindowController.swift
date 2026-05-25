// PopoverWindowController.swift
// Owns the NSPopover that hosts PopoverContentView. Wires the
// status-item button to toggle the popover, and exposes a public
// `tearDown()` for clean shutdown.
//
// Drop into the macOS target.

import AppKit
import SwiftUI
import Combine

@MainActor
final class PopoverWindowController: NSObject, NSPopoverDelegate {
    let popover = NSPopover()
    let statusItem: NSStatusItem
    let model: TimerModel
    var preferencesController: PreferencesWindowController?
    var customDurationSheet: NSWindow?
    private var statusIconView: StatusItemIconHostingView?
    private var cancellables = Set<AnyCancellable>()

    init(statusItem: NSStatusItem, model: TimerModel) {
        self.statusItem = statusItem
        self.model = model
        super.init()
        configurePopover()
        configureStatusItem()
        observeModel()
    }

    private func configurePopover() {
        popover.behavior = .transient
        popover.animates = true
        popover.delegate = self
        popover.contentViewController = NSHostingController(
            rootView: PopoverContentView(
                model: model,
                onOpenPreferences: { [weak self] in self?.openPreferences() },
                onOpenCustomDuration: { [weak self] in self?.openCustomDuration() },
                onQuit: { NSApp.terminate(nil) }
            )
        )
    }

    private func configureStatusItem() {
        guard let button = statusItem.button else { return }
        let icon = StatusItemIconHostingView()
        button.addSubview(icon)
        button.target = self
        button.action = #selector(handleClick(_:))
        button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        statusIconView = icon

        // Layout: pin the icon view to button's content area
        icon.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            icon.centerYAnchor.constraint(equalTo: button.centerYAnchor),
            icon.leadingAnchor.constraint(equalTo: button.leadingAnchor, constant: 4),
            icon.widthAnchor.constraint(equalToConstant: 22),
            icon.heightAnchor.constraint(equalToConstant: 22),
        ])
    }

    private func observeModel() {
        model.objectWillChange
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in
                DispatchQueue.main.async { self?.refreshStatusItem() }
            }
            .store(in: &cancellables)
    }

    private func refreshStatusItem() {
        guard let button = statusItem.button else { return }
        let isIdle = model.phase == .idle
        // Update the SwiftUI icon
        let nsColor = NSColor(model.lineColor)
        statusIconView?.update(
            progress: model.progress,
            isRunning: model.isRunning,
            color: nsColor
        )

        // Update countdown text beside the icon
        if isIdle {
            button.title = ""
            button.setAccessibilityLabel("FocusLine timer, ready")
        } else {
            let s = model.remainingSeconds
            let str = String(format: " %02d:%02d", s / 60, s % 60)
            button.title = str
            button.setAccessibilityLabel("FocusLine timer, \(str.trimmingCharacters(in: .whitespaces)) remaining")
        }
    }

    @objc private func handleClick(_ sender: NSStatusBarButton) {
        if popover.isShown {
            popover.performClose(sender)
        } else {
            popover.show(relativeTo: sender.bounds, of: sender, preferredEdge: .minY)
            // Pull the popover's window forward so it can take focus
            popover.contentViewController?.view.window?.makeKey()
        }
    }

    func openPreferences() {
        if preferencesController == nil {
            preferencesController = PreferencesWindowController(model: model)
        }
        preferencesController?.show()
        popover.performClose(nil)
    }

    func openCustomDuration() {
        // Sheet implementation lives in CustomDurationSheet.swift —
        // present it from the popover's content window.
        guard let window = popover.contentViewController?.view.window else { return }
        let sheet = CustomDurationSheet.makeWindow(model: model) { [weak self] in
            window.endSheet($0)
            self?.customDurationSheet = nil
        }
        customDurationSheet = sheet
        window.beginSheet(sheet)
    }

    // MARK: - NSPopoverDelegate

    func popoverDidClose(_ notification: Notification) {
        // Pop out the focus from any text field inside the popover
        NSApp.keyWindow?.makeFirstResponder(nil)
    }
}
