import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// loadFixture helper for Hardhat v3
const snapshots: Map<string, string> = new Map();
async function loadFixture<T>(fixture: () => Promise<T>): Promise<T> {
  const name = fixture.name;
  const snapshotId = snapshots.get(name);
  
  if (snapshotId) {
    await ethers.provider.send("evm_revert", [snapshotId]);
    const newSnapshotId = await ethers.provider.send("evm_snapshot", []);
    snapshots.set(name, newSnapshotId);
    return fixture();
  }
  
  const result = await fixture();
  const newSnapshotId = await ethers.provider.send("evm_snapshot", []);
  snapshots.set(name, newSnapshotId);
  return result;
}

describe("FortressPayment Contract", function () {
  
  // Fixture to deploy contract
  async function deployFortressFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();
    
    const FortressPayment = await ethers.getContractFactory("FortressPayment");
    const fortress = await FortressPayment.deploy();
    
    return { fortress, owner, user1, user2, user3 };
  }

  describe("Deployment", function () {
    it("Should set deployer as admin and user", async function () {
      const { fortress, owner } = await loadFixture(deployFortressFixture);
      
      expect(await fortress.admins(owner.address)).to.equal(true);
      expect(await fortress.users(owner.address)).to.equal(true);
    });

    it("Should start with zero transactions", async function () {
      const { fortress } = await loadFixture(deployFortressFixture);
      
      expect(await fortress.getTotalTransactions()).to.equal(0);
    });

    it("Should not be paused initially", async function () {
      const { fortress } = await loadFixture(deployFortressFixture);
      
      expect(await fortress.paused()).to.equal(false);
    });
  });

  describe("User Registration", function () {
    it("Should allow new user to register", async function () {
      const { fortress, user1 } = await loadFixture(deployFortressFixture);
      
      await expect(fortress.connect(user1).registerUser())
        .to.emit(fortress, "UserRegistered")
        .withArgs(user1.address);
      
      expect(await fortress.users(user1.address)).to.equal(true);
    });

    it("Should not allow duplicate registration", async function () {
      const { fortress, user1 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      
      await expect(fortress.connect(user1).registerUser())
        .to.be.revertedWith("Already registered");
    });
  });

  describe("Transactions", function () {
    it("Should create a transaction successfully", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      // Register users
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      const amount = ethers.parseEther("0.1");
      const metadata = "Payment for services";
      
      const tx = await fortress.connect(user1).createTransaction(user2.address, metadata, { value: amount });
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);
      
      await expect(tx)
        .to.emit(fortress, "TransactionCreated")
        .withArgs(0, user1.address, user2.address, amount, block!.timestamp);
      
      expect(await fortress.getTotalTransactions()).to.equal(1);
    });

    it("Should transfer funds to receiver", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      const amount = ethers.parseEther("0.5");
      const initialBalance = await ethers.provider.getBalance(user2.address);
      
      await fortress.connect(user1).createTransaction(
        user2.address, 
        "test", 
        { value: amount }
      );
      
      const finalBalance = await ethers.provider.getBalance(user2.address);
      expect(finalBalance - initialBalance).to.equal(amount);
    });

    it("Should fail if sender not registered", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user2).registerUser();
      
      await expect(
        fortress.connect(user1).createTransaction(
          user2.address, 
          "test", 
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWith("Register first");
    });

    it("Should fail with zero amount", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      await expect(
        fortress.connect(user1).createTransaction(user2.address, "test", { value: 0 })
      ).to.be.revertedWith("Amount required");
    });

    it("Should fail with invalid receiver", async function () {
      const { fortress, user1 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      
      await expect(
        fortress.connect(user1).createTransaction(
          ethers.ZeroAddress, 
          "test", 
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWith("Invalid receiver");
    });

    it("Should store encrypted metadata", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      const metadata = "Secret payment info";
      
      await fortress.connect(user1).createTransaction(
        user2.address, 
        metadata, 
        { value: ethers.parseEther("0.1") }
      );
      
      const tx = await fortress.getTransaction(0);
      
      // Metadata should be hashed (not plain text)
      expect(tx.encryptedMetadata).to.not.equal(metadata);
      expect(tx.encryptedMetadata).to.match(/^0x[a-fA-F0-9]{64}$/);
    });

    it("Should track user transactions correctly", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      // User1 sends 2 transactions
      await fortress.connect(user1).createTransaction(
        user2.address, 
        "tx1", 
        { value: ethers.parseEther("0.1") }
      );
      await fortress.connect(user1).createTransaction(
        user2.address, 
        "tx2", 
        { value: ethers.parseEther("0.2") }
      );
      
      const user1Txs = await fortress.getUserTransactions(user1.address);
      const user2Txs = await fortress.getUserTransactions(user2.address);
      
      expect(user1Txs.length).to.equal(2);
      expect(user2Txs.length).to.equal(2); // Receiver also tracks
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to add new admin", async function () {
      const { fortress, owner, user1 } = await loadFixture(deployFortressFixture);
      
      await expect(fortress.connect(owner).addAdmin(user1.address))
        .to.emit(fortress, "AdminAdded")
        .withArgs(user1.address);
      
      expect(await fortress.admins(user1.address)).to.equal(true);
      expect(await fortress.users(user1.address)).to.equal(true);
    });

    it("Should not allow non-admin to add admin", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await expect(
        fortress.connect(user1).addAdmin(user2.address)
      ).to.be.revertedWith("Admin only");
    });

    it("Should allow admin to flag transaction", async function () {
      const { fortress, owner, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      await fortress.connect(user1).createTransaction(
        user2.address, 
        "test", 
        { value: ethers.parseEther("0.1") }
      );
      
      const reason = "Suspicious activity";
      await expect(fortress.connect(owner).flagTransaction(0, reason))
        .to.emit(fortress, "TransactionFlagged")
        .withArgs(0, reason);
      
      const tx = await fortress.getTransaction(0);
      expect(tx.isFlagged).to.equal(true);
      expect(tx.status).to.equal("flagged");
    });

    it("Should not allow non-admin to flag transaction", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      await fortress.connect(user1).createTransaction(
        user2.address, 
        "test", 
        { value: ethers.parseEther("0.1") }
      );
      
      await expect(
        fortress.connect(user1).flagTransaction(0, "reason")
      ).to.be.revertedWith("Admin only");
    });

    it("Should pause and unpause contract", async function () {
      const { fortress, owner } = await loadFixture(deployFortressFixture);
      
      await expect(fortress.connect(owner).pauseContract())
        .to.emit(fortress, "ContractPaused");
      
      expect(await fortress.paused()).to.equal(true);
      
      await expect(fortress.connect(owner).unpauseContract())
        .to.emit(fortress, "ContractUnpaused");
      
      expect(await fortress.paused()).to.equal(false);
    });

    it("Should block transactions when paused", async function () {
      const { fortress, owner, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      await fortress.connect(owner).pauseContract();
      
      await expect(
        fortress.connect(user1).createTransaction(
          user2.address, 
          "test", 
          { value: ethers.parseEther("0.1") }
        )
      ).to.be.revertedWith("Contract paused");
    });
  });

  describe("Anomaly Detection", function () {
    it("Should detect high value transactions", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      // Send high value transaction (>1 MATIC)
      await fortress.connect(user1).createTransaction(
        user2.address, 
        "big payment", 
        { value: ethers.parseEther("2") }
      );
      
      const [isAnomaly, reason] = await fortress.checkTransactionAnomaly(user1.address);
      
      expect(isAnomaly).to.equal(true);
      expect(reason).to.equal("High value transaction");
    });

    it("Should detect rapid transactions", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      // Send 4 rapid transactions
      for (let i = 0; i < 4; i++) {
        await fortress.connect(user1).createTransaction(
          user2.address, 
          `tx${i}`, 
          { value: ethers.parseEther("0.1") }
        );
      }
      
      const [isAnomaly, reason] = await fortress.checkTransactionAnomaly(user1.address);
      
      expect(isAnomaly).to.equal(true);
      expect(reason).to.equal("Rapid transactions");
    });

    it("Should return no anomaly for normal transactions", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      await fortress.connect(user1).createTransaction(
        user2.address, 
        "normal", 
        { value: ethers.parseEther("0.5") }
      );
      
      const [isAnomaly, reason] = await fortress.checkTransactionAnomaly(user1.address);
      
      expect(isAnomaly).to.equal(false);
      expect(reason).to.equal("No anomalies");
    });
  });

  describe("View Functions", function () {
    it("Should get recent transactions", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      // Create 5 transactions
      for (let i = 0; i < 5; i++) {
        await fortress.connect(user1).createTransaction(
          user2.address, 
          `tx${i}`, 
          { value: ethers.parseEther("0.1") }
        );
      }
      
      const recent = await fortress.getRecentTransactions(3);
      
      expect(recent.length).to.equal(3);
      expect(recent[2].id).to.equal(4); // Most recent
    });

    it("Should handle empty transaction list", async function () {
      const { fortress } = await loadFixture(deployFortressFixture);
      
      const recent = await fortress.getRecentTransactions(5);
      
      expect(recent.length).to.equal(0);
    });

    it("Should return all transactions if count exceeds total", async function () {
      const { fortress, user1, user2 } = await loadFixture(deployFortressFixture);
      
      await fortress.connect(user1).registerUser();
      await fortress.connect(user2).registerUser();
      
      await fortress.connect(user1).createTransaction(
        user2.address, 
        "test", 
        { value: ethers.parseEther("0.1") }
      );
      
      const recent = await fortress.getRecentTransactions(10);
      
      expect(recent.length).to.equal(1);
    });
  });

  // Helper function to get current block timestamp
  async function getTimestamp() {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    return block.timestamp;
  }
});