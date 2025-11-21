// Contract info
const contractAddress = "0xF9475310E94AB38aBaff84A25B791D41A37cD5d7";
const abi = [
	{
		"inputs": [{"internalType": "string","name": "_note","type": "string"}],
		"name": "setNote",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getNote",
		"outputs": [{"internalType": "string","name": "","type": "string"}],
		"stateMutability": "view",
		"type": "function"
	}
];

let provider;
let signer;
let contract;

// Connect wallet
document.getElementById("connectButton").addEventListener("click", async () => {
  if (!window.ethereum) return alert("MetaMask not detected!");
  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, abi, signer);

    document.getElementById("connectButton").innerText = "Wallet Connected ✔";
    document.getElementById("connectButton").style.backgroundColor = "#4CAF50";

    console.log("Connected:", await signer.getAddress());
  } catch (err) {
    console.error(err);
    alert("Connection failed. Check MetaMask!");
  }
});

// Set note
document.getElementById("setBtn").addEventListener("click", async () => {
  if (!contract) return alert("Connect wallet first!");
  const note = document.getElementById("note").value;
  if (!note) return alert("Enter a note!");
  try {
    const tx = await contract.setNote(note);
    await tx.wait();
    alert("Note saved to blockchain!");
  } catch (err) {
    console.error(err);
    alert("Transaction failed!");
  }
});

// Get note
document.getElementById("getBtn").addEventListener("click", async () => {
  if (!contract) return alert("Connect wallet first!");
  try {
    const note = await contract.getNote();
    document.getElementById("result").innerText = note;
  } catch (err) {
    console.error(err);
    alert("Failed to read note!");
  }
});
