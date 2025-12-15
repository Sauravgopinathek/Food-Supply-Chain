// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * Food Supply Chain
 */
contract FoodSupplyChain is AccessControl {
    using Counters for Counters.Counter;

    // ========== ROLE DEFINITIONS (renamed) ==========
    bytes32 public constant HANDLER_ROLE = keccak256("HANDLER_ROLE");
    bytes32 public constant CARRIER_ROLE = keccak256("CARRIER_ROLE");
    bytes32 public constant STORE_ROLE = keccak256("STORE_ROLE");
    bytes32 public constant SENSOR_ROLE = keccak256("SENSOR_ROLE");

    // ========== STATE ==========
    Counters.Counter private _shipmentIds;
    int256 private constant SAFE_TEMPERATURE_THRESHOLD = -20; // slightly different threshold
    // ==========================
    // Reputation system for suppliers/carriers
    // Tracks a lightweight reputation score per address. Scores are adjusted
    // on successful deliveries and penalized on contamination events.
    mapping(address => int256) public reputation;
    int256 public constant REPUTATION_INCREMENT = 5;
    int256 public constant REPUTATION_PENALTY = 20;
    event ReputationUpdated(address indexed account, int256 newScore);

    enum ShipmentStatus {
        PREPARED,
        TRANSIT,
        RECEIVED,
        CONTAMINATED
    }

    struct Shipment {
        uint256 shipmentId;
        uint64 createdAt;
        address handler;
        bool contaminated;
        ShipmentStatus status;
        address currentHolder;
    }

    mapping(uint256 => Shipment) public shipments;

    event TraceLog(
        uint256 indexed shipmentId,
        address indexed actor,
        uint256 timestamp,
        string action,
        string note,
        int256 temperature
    );

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(HANDLER_ROLE, msg.sender);
    }

    modifier shipmentExists(uint256 _id) {
        require(shipments[_id].shipmentId != 0, "Shipment not found");
        _;
    }

    modifier onlyHolderOrSensor(uint256 _id) {
        require(
            msg.sender == shipments[_id].currentHolder || hasRole(SENSOR_ROLE, msg.sender),
            "Not holder or authorized sensor"
        );
        _;
    }

    // ========== CORE API (renamed) ==========
    function createShipment(string memory _product, string memory _meta) public returns (uint256) {
        _shipmentIds.increment();
        uint256 newId = _shipmentIds.current();

        shipments[newId] = Shipment({
            shipmentId: newId,
            createdAt: uint64(block.timestamp),
            handler: msg.sender,
            contaminated: false,
            status: ShipmentStatus.PREPARED,
            currentHolder: msg.sender
        });

        emit TraceLog(newId, msg.sender, block.timestamp, "CREATED", string(abi.encodePacked(_product, " | ", _meta)), SAFE_TEMPERATURE_THRESHOLD);
        // Initialize reputation entry for creator if not set
        if (reputation[msg.sender] == 0) {
            // give a small starting score
            reputation[msg.sender] = 10;
            emit ReputationUpdated(msg.sender, reputation[msg.sender]);
        }
        return newId;
    }

    function addTrace(uint256 _id, string memory _location, int256 _temperature, string memory _note)
        public
        shipmentExists(_id)
        onlyHolderOrSensor(_id)
    {
        Shipment storage s = shipments[_id];

        if (_temperature > SAFE_TEMPERATURE_THRESHOLD) {
            s.contaminated = true;
            s.status = ShipmentStatus.CONTAMINATED;
            emit TraceLog(_id, msg.sender, block.timestamp, "CONTAMINATED", string(abi.encodePacked("Temp breach at ", _location, " | ", _note)), _temperature);
        } else {
            emit TraceLog(_id, msg.sender, block.timestamp, "UPDATE", string(abi.encodePacked("Location: ", _location, " | ", _note)), _temperature);
        }
    }

    function transferCustody(uint256 _id, address _newHolder, string memory _note) public shipmentExists(_id) {
        Shipment storage s = shipments[_id];
        require(msg.sender == s.currentHolder, "Only current holder can transfer");
        require(_newHolder != address(0), "New holder zero address");
        require(_newHolder != msg.sender, "Cannot transfer to self");

        address prev = s.currentHolder;
        s.currentHolder = _newHolder;

        if (hasRole(CARRIER_ROLE, _newHolder)) {
            s.status = ShipmentStatus.TRANSIT;
        } else if (hasRole(STORE_ROLE, _newHolder)) {
            s.status = ShipmentStatus.RECEIVED;
        }

        emit TraceLog(_id, prev, block.timestamp, "TRANSFER", string(abi.encodePacked("From ", _addressToString(prev), " to ", _addressToString(_newHolder), " | ", _note)), SAFE_TEMPERATURE_THRESHOLD);

        // Update reputation: if transfer results in RECEIVED and shipment was not contaminated,
        // reward the prev holder (successful handoff). If the new holder later causes contamination
        // the penalty is applied at contamination time.
        if (!shipments[_id].contaminated && shipments[_id].status == ShipmentStatus.RECEIVED) {
            reputation[prev] += REPUTATION_INCREMENT;
            emit ReputationUpdated(prev, reputation[prev]);
        }
    }

    // ========== VIEWS & HELPERS ==========
    function isShipmentContaminated(uint256 _id) public view shipmentExists(_id) returns (bool) {
        return shipments[_id].contaminated;
    }

    function getShipmentInfo(uint256 _id) public view shipmentExists(_id) returns (Shipment memory) {
        return shipments[_id];
    }

    function getShipmentCount() public view returns (uint256) {
        return _shipmentIds.current();
    }

    function hasAnyRole(address _account) public view returns (bool) {
        return hasRole(HANDLER_ROLE, _account) || hasRole(CARRIER_ROLE, _account) || hasRole(STORE_ROLE, _account) || hasRole(SENSOR_ROLE, _account);
    }

    function grantMultipleRoles(address _account, bytes32[] memory _roles) public onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_account != address(0), "Zero address");
        for (uint256 i = 0; i < _roles.length; i++) {
            _grantRole(_roles[i], _account);
        }
    }

    function emergencyContaminateShipment(uint256 _id, string memory _reason) public onlyRole(DEFAULT_ADMIN_ROLE) shipmentExists(_id) {
        Shipment storage s = shipments[_id];
        s.contaminated = true;
        s.status = ShipmentStatus.CONTAMINATED;
        emit TraceLog(_id, msg.sender, block.timestamp, "EMERGENCY", string(abi.encodePacked("Reason: ", _reason)), 0);
        // Penalize the current holder (responsibility) for contamination
        reputation[s.currentHolder] -= REPUTATION_PENALTY;
        emit ReputationUpdated(s.currentHolder, reputation[s.currentHolder]);
    }

    function submitSensorReadings(uint256 _id, int256[] memory _temps, string[] memory _locations, uint256[] memory _timestamps)
        public
        onlyRole(SENSOR_ROLE)
        shipmentExists(_id)
    {
        require(_temps.length == _locations.length && _locations.length == _timestamps.length, "Array lengths mismatch");
        require(_temps.length > 0, "Need readings");

        Shipment storage s = shipments[_id];
        for (uint256 i = 0; i < _temps.length; i++) {
            if (_temps[i] > SAFE_TEMPERATURE_THRESHOLD && !s.contaminated) {
                s.contaminated = true;
                s.status = ShipmentStatus.CONTAMINATED;
                // Penalize the current holder when contamination is detected by sensors
                reputation[s.currentHolder] -= REPUTATION_PENALTY;
                emit ReputationUpdated(s.currentHolder, reputation[s.currentHolder]);
            }
            emit TraceLog(_id, msg.sender, _timestamps[i], s.contaminated ? "CONTAMINATED" : "SENSOR_UPDATE", string(abi.encodePacked("Sensor at ", _locations[i])), _temps[i]);
        }
    }

    // ==========================
    // Reputation helpers
    function getReputation(address _account) public view returns (int256) {
        return reputation[_account];
    }

    // Simple helpers
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }
}
