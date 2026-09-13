import CoreBluetooth
import Observation

@MainActor @Observable
final class BluetoothHeartRateService: NSObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    enum State: Equatable { case idle, scanning, connected(String), unavailable, failed }

    private let heartRateService = CBUUID(string: "180D")
    private let measurementCharacteristic = CBUUID(string: "2A37")
    private var central: CBCentralManager!
    private var peripheral: CBPeripheral?
    private(set) var state: State = .idle
    private(set) var heartRate: Int?

    override init() {
        super.init()
        central = CBCentralManager(delegate: self, queue: .main)
    }

    func connect() {
        guard central.state == .poweredOn else { state = .unavailable; return }
        state = .scanning
        central.scanForPeripherals(withServices: [heartRateService], options: [CBCentralManagerScanOptionAllowDuplicatesKey: false])
    }

    func disconnect() {
        central.stopScan()
        if let peripheral { central.cancelPeripheralConnection(peripheral) }
        peripheral = nil
        heartRate = nil
        state = .idle
    }

    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state != .poweredOn { state = .unavailable }
    }

    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi RSSI: NSNumber) {
        central.stopScan()
        self.peripheral = peripheral
        peripheral.delegate = self
        central.connect(peripheral)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        state = .connected(peripheral.name ?? "Pulsómetro")
        peripheral.discoverServices([heartRateService])
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) { state = .failed }
    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) { state = .idle }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        peripheral.services?.first(where: { $0.uuid == heartRateService }).map { peripheral.discoverCharacteristics([measurementCharacteristic], for: $0) }
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        service.characteristics?.first(where: { $0.uuid == measurementCharacteristic }).map { peripheral.setNotifyValue(true, for: $0) }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard characteristic.uuid == measurementCharacteristic, let data = characteristic.value, data.count >= 2 else { return }
        let bytes = [UInt8](data)
        heartRate = bytes[0] & 0x01 == 0 ? Int(bytes[1]) : Int(UInt16(bytes[1]) | UInt16(bytes[2]) << 8)
    }
}
