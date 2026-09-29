import CoreBluetooth
import Observation

@MainActor @Observable
final class BluetoothHeartRateService: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    enum State: Equatable { case idle, scanning, connected(String), unavailable, failed }

    private let heartRateService = CBUUID(string: "180D")
    private let measurementCharacteristic = CBUUID(string: "2A37")
    // Created on first connect: creating it at launch shows the Bluetooth
    // permission prompt before the athlete has asked for a heart-rate strap.
    private var central: CBCentralManager?
    private var wantsScan = false
    private var scanTimeout: Task<Void, Never>?
    private var peripheral: CBPeripheral?
    private(set) var state: State = .idle
    private(set) var heartRate: Int?

    func connect() {
        wantsScan = true
        guard let central else {
            state = .scanning
            central = CBCentralManager(delegate: self, queue: .main)
            return // Scanning starts once the manager reports .poweredOn.
        }
        startScanIfPossible(central)
    }

    func disconnect() {
        wantsScan = false
        scanTimeout?.cancel()
        central?.stopScan()
        if let peripheral { central?.cancelPeripheralConnection(peripheral) }
        peripheral = nil
        heartRate = nil
        state = .idle
    }

    private func startScanIfPossible(_ central: CBCentralManager) {
        guard wantsScan else { return }
        guard central.state == .poweredOn else {
            if central.state != .unknown && central.state != .resetting { state = .unavailable; wantsScan = false }
            return
        }
        state = .scanning
        central.scanForPeripherals(withServices: [heartRateService], options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
        scanTimeout?.cancel()
        scanTimeout = Task { [weak self] in
            try? await Task.sleep(for: .seconds(20))
            guard !Task.isCancelled, let self, self.state == .scanning else { return }
            self.central?.stopScan()
            self.wantsScan = false
            self.state = .failed
        }
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn { startScanIfPossible(central) }
        else if central.state != .unknown && central.state != .resetting { state = .unavailable; heartRate = nil }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
        central.stopScan()
        scanTimeout?.cancel()
        wantsScan = false
        self.peripheral = peripheral
        peripheral.delegate = self
        central.connect(peripheral)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        state = .connected(peripheral.name ?? "Pulsómetro")
        peripheral.discoverServices([heartRateService])
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) { state = .failed; heartRate = nil }
    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) { state = .idle; heartRate = nil }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        peripheral.services?.first(where: { $0.uuid == heartRateService }).map { peripheral.discoverCharacteristics([measurementCharacteristic], for: $0) }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        service.characteristics?.first(where: { $0.uuid == measurementCharacteristic }).map { peripheral.setNotifyValue(true, for: $0) }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard characteristic.uuid == measurementCharacteristic, let data = characteristic.value,
              let value = Self.heartRate(from: data) else { return }
        heartRate = value
    }

    /// Heart Rate Measurement (0x2A37): bit 0 of the flags selects UInt8 or
    /// little-endian UInt16. Malformed packets return nil instead of crashing.
    nonisolated static func heartRate(from data: Data) -> Int? {
        let bytes = [UInt8](data)
        guard let flags = bytes.first else { return nil }
        let value: Int
        if flags & 0x01 == 0 {
            guard bytes.count >= 2 else { return nil }
            value = Int(bytes[1])
        } else {
            guard bytes.count >= 3 else { return nil }
            value = Int(UInt16(bytes[1]) | UInt16(bytes[2]) << 8)
        }
        return (1...250).contains(value) ? value : nil
    }
}
