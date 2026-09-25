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

    func testCheckoutUsesTheSignedInAccountAsAppleAccountToken() {
        XCTAssertEqual(
            SubscriptionAccountToken.uuid(for: "11111111-1111-4111-8111-111111111111"),
            UUID(uuidString: "11111111-1111-4111-8111-111111111111")
        )
    }

    func testCheckoutRejectsAnInvalidAccountIdentifier() {
        XCTAssertNil(SubscriptionAccountToken.uuid(for: "not-a-user-id"))
    }

    func testCoachCapacityAcceptsConfiguredFiveSeatStepsBeyondFifty() {
        XCTAssertEqual(SubscriptionStore.coachCapacity(forProductID: "com.triwavex.coach.monthly"), 10)
        XCTAssertEqual(SubscriptionStore.coachCapacity(forProductID: "com.triwavex.coach.monthly.55"), 55)
        XCTAssertEqual(SubscriptionStore.coachCapacity(forProductID: "com.triwavex.coach.monthly.100"), 100)
    }

    func testCoachCapacityRejectsNonCanonicalOrInvalidTiers() {
        XCTAssertNil(SubscriptionStore.coachCapacity(forProductID: "com.triwavex.coach.monthly.11"))
        XCTAssertNil(SubscriptionStore.coachCapacity(forProductID: "com.triwavex.coach.monthly.56"))
        XCTAssertNil(SubscriptionStore.coachCapacity(forProductID: "com.triwavex.coach.monthly.015"))
        XCTAssertNil(SubscriptionStore.coachCapacity(forProductID: "com.triwavex.coach.monthly.2147483650"))
        XCTAssertNil(SubscriptionStore.coachCapacity(forProductID: "com.triwavex.athlete.monthly"))
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
