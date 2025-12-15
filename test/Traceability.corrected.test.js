const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Food Supply Chain Contract - Basic Integration Tests", function () {
  let FoodSupplyChain, foodsupplychain;
  let owner, handler, carrier, store, sensor, unauthorized;

  const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const HANDLER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("HANDLER_ROLE"));
  const CARRIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("CARRIER_ROLE"));
  const STORE_ROLE = ethers.keccak256(ethers.toUtf8Bytes("STORE_ROLE"));
  const SENSOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("SENSOR_ROLE"));

  const SAFE_TEMP = -25;
  const BAD_TEMP = -10;

  before(async function () {
    [owner, handler, carrier, store, sensor, unauthorized] = await ethers.getSigners();
  FoodSupplyChain = await ethers.getContractFactory("FoodSupplyChain");
  });

  beforeEach(async function () {
  foodsupplychain = await FoodSupplyChain.deploy();
  await foodsupplychain.waitForDeployment();
  });

  it("deploys and assigns roles to deployer", async function () {
  expect(await foodsupplychain.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
  expect(await foodsupplychain.hasRole(HANDLER_ROLE, owner.address)).to.be.true;
  });

  it("allows handler to create shipment and record traces", async function () {
    // grant handler role to another account
  await foodsupplychain.grantRole(HANDLER_ROLE, handler.address);

  const tx = await foodsupplychain.connect(handler).createShipment("Apples", "Batch A");
    const receipt = await tx.wait();
    expect(receipt).to.exist;

    const id = 1;
  const info = await foodsupplychain.getShipmentInfo(id);
  expect(info.shipmentId).to.equal(1);
  expect(info.currentHolder).to.equal(handler.address);

    // add safe trace
  await expect(foodsupplychain.connect(handler).addTrace(id, "Warehouse", SAFE_TEMP, "All good")).to.emit(foodsupplychain, "TraceLog");

    // add bad trace -> contaminated
  await expect(foodsupplychain.connect(handler).addTrace(id, "Truck", BAD_TEMP, "Temp spike")).to.emit(foodsupplychain, "TraceLog");
  expect(await foodsupplychain.isShipmentContaminated(id)).to.be.true;
  });

  it("supports custody transfer and sensor readings", async function () {
  await foodsupplychain.grantRole(HANDLER_ROLE, handler.address);
  await foodsupplychain.grantRole(CARRIER_ROLE, carrier.address);
  await foodsupplychain.grantRole(STORE_ROLE, store.address);
  await foodsupplychain.grantRole(SENSOR_ROLE, sensor.address);

  await foodsupplychain.connect(handler).createShipment("Oranges", "Batch B");
  const id = 1;

  await foodsupplychain.connect(handler).transferCustody(id, carrier.address, "To carrier");
  let info = await foodsupplychain.getShipmentInfo(id);
  expect(info.currentHolder).to.equal(carrier.address);

  // sensor submits readings
  await foodsupplychain.connect(sensor).submitSensorReadings(id, [SAFE_TEMP, SAFE_TEMP], ["A", "B"], [Math.floor(Date.now()/1000), Math.floor(Date.now()/1000)+60]);
  expect(await foodsupplychain.isShipmentContaminated(id)).to.be.false;

  // sensor reports bad temp
  await foodsupplychain.connect(sensor).submitSensorReadings(id, [BAD_TEMP], ["C"], [Math.floor(Date.now()/1000)+120]);
  expect(await foodsupplychain.isShipmentContaminated(id)).to.be.true;
  });

  it("allows admin emergency contamination", async function () {
  await foodsupplychain.grantRole(HANDLER_ROLE, handler.address);
  await foodsupplychain.connect(handler).createShipment("Grapes", "Batch C");
  const id = 1;

  await foodsupplychain.emergencyContaminateShipment(id, "Manual flag");
  expect(await foodsupplychain.isShipmentContaminated(id)).to.be.true;
  });
});
