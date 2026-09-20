import XCTest
@testable import TriWaveX

final class SubscriptionFinishGateTests: XCTestCase {
    private let transactionID = "transaction-123"
    private let userID = "user-123"
    private let role = "athlete"

    func testAcceptedAuthorizedResponseFinishesTransaction() async {
        let result = authorizedResult(accepted: true)
        var finishCount = 0

        let finished = await SubscriptionFinishGate.finishIfAuthorized(
            result,
            transactionID: transactionID,
            expectedUserID: userID,
            expectedRole: role,
            finish: { finishCount += 1 }
        )

        XCTAssertTrue(finished)
        XCTAssertEqual(finishCount, 1)
    }

    func testDuplicateAuthorizedResponseFinishesTransaction() async {
        let result = authorizedResult(accepted: false, duplicate: true)
        var finishCount = 0

        let finished = await SubscriptionFinishGate.finishIfAuthorized(
            result,
            transactionID: transactionID,
            expectedUserID: userID,
            expectedRole: role,
            finish: { finishCount += 1 }
        )

        XCTAssertTrue(finished)
        XCTAssertEqual(finishCount, 1)
    }

    func testServerRejectionDoesNotFinishTransaction() async {
        await assertDoesNotFinish(authorizedResult(accepted: false))
    }

    func testNetworkFailureDoesNotFinishTransaction() async {
        await assertDoesNotFinish(nil)
    }

    func testMismatchedUserDoesNotFinishTransaction() async {
        await assertDoesNotFinish(authorizedResult(userID: "other-user"))
    }

    func testMismatchedRoleDoesNotFinishTransaction() async {
        await assertDoesNotFinish(authorizedResult(role: "coach"))
    }

    func testMismatchedTransactionDoesNotFinishTransaction() async {
        await assertDoesNotFinish(authorizedResult(transactionID: "other-transaction"))
    }

    func testIncompatibleDestinationDoesNotFinishTransaction() async {
        await assertDoesNotFinish(authorizedResult(destination: "/coach/dashboard"))
    }

    func testFalseEntitlementDoesNotFinishTransaction() async {
        await assertDoesNotFinish(authorizedResult(entitled: false))
    }

    func testPendingPurchaseDoesNotFinishTransaction() async {
        await assertDoesNotFinish(nil)
    }

    func testCancelledPurchaseDoesNotFinishTransaction() async {
        await assertDoesNotFinish(nil)
    }

    func testUnverifiedPurchaseDoesNotFinishTransaction() async {
        await assertDoesNotFinish(nil)
    }

    private func assertDoesNotFinish(
        _ result: NativeSubscriptionResult?,
        file: StaticString = #filePath,
        line: UInt = #line
    ) async {
        var finishCount = 0
        let finished = await SubscriptionFinishGate.finishIfAuthorized(
            result,
            transactionID: transactionID,
            expectedUserID: userID,
            expectedRole: role,
            finish: { finishCount += 1 }
        )

        XCTAssertFalse(finished, file: file, line: line)
        XCTAssertEqual(finishCount, 0, file: file, line: line)
    }

    private func authorizedResult(
        accepted: Bool = true,
        duplicate: Bool = false,
        status: String = "active",
        destination: String = "/dashboard",
        userID: String? = nil,
        role: String? = nil,
        entitled: Bool = true,
        transactionID: String? = nil
    ) -> NativeSubscriptionResult {
        NativeSubscriptionResult(
            accepted: accepted,
            duplicate: duplicate,
            status: status,
            destination: destination,
            userID: userID ?? self.userID,
            role: role ?? self.role,
            entitled: entitled,
            transactionID: transactionID ?? self.transactionID
        )
    }
}
