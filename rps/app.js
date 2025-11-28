// ------------------------------
//   CONTRACT SETTINGS
// ------------------------------

const contractAddress = "0xCAb8f5168a45828DE8846db03D1741D37686653f";

const contractABI = [
	{
		"inputs": [],
		"name": "fundContract",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum RPS.Move",
				"name": "playerMove",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "enum RPS.Move",
				"name": "computerMove",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "result",
				"type": "string"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amountWon",
				"type": "uint256"
			}
		],
		"name": "GamePlayed",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint8",
				"name": "_playerMove",
				"type": "uint8"
			}
		],
		"name": "play",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "betAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "contractBalance",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let provider;
let signer;
let contract;

let userScore = 0;
let computerScore = 0;

// UI elements
const resultText = document.getElementById("result-text");
const connectBtn = document.getElementById("connectBtn");

const rock_div = document.getElementById("r");
const paper_div = document.getElementById("p");
const scissors_div = document.getElementById("s");

const userScore_span = document.getElementById("user-score");
const computerScore_span = document.getElementById("computer-score");

// ------------------------------
//   CONNECT WALLET
// ------------------------------

async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask not found!");
        return;
    }

    await ethereum.request({ method: "eth_requestAccounts" });

    provider = new ethers.providers.Web3Provider(window.ethereum);
    signer = provider.getSigner();
    contract = new ethers.Contract(contractAddress, contractABI, signer);

    connectBtn.innerText = "Connected ✔";
    connectBtn.disabled = true;
}

connectBtn.addEventListener("click", connectWallet);

// ------------------------------
//   RPS FRONTEND → BLOCKCHAIN GAME
// ------------------------------

function convert(moveNumber) {
    return ["Rock", "Paper", "Scissors"][moveNumber];
}

async function playMove(moveIndex) {
    if (!contract) {
        alert("Connect wallet first!");
        return;
    }

    resultText.innerText = "Waiting for blockchain... ⏳";

    // Required bet
    const bet = await contract.betAmount();

    // Send transaction
    let tx;
    try {
        tx = await contract.play(moveIndex, { value: bet });
    } catch (err) {
        resultText.innerText = "Transaction rejected ❌";
        return;
    }

    // Wait until mined
    resultText.innerText = "Processing result...";

    const receipt = await tx.wait();

    // -------------------------------------------
    // 🔥 1) Try to get event directly from receipt
    // -------------------------------------------

    let event = receipt.events.find(e => e.event === "GamePlayed");

    if (!event) {
        // MetaMask sometimes strips decoded data → fallback decoding
        event = receipt.logs
            .map(log => {
                try { return contract.interface.parseLog(log); }
                catch { return null; }
            })
            .find(p => p && p.name === "GamePlayed");
    }

    // -------------------------------------------
    // 🔥 2) If still no event → query blockchain
    // -------------------------------------------
    if (!event) {
        const player = await signer.getAddress();
        const filter = contract.filters.GamePlayed(player);
        const currentBlock = await provider.getBlockNumber();

        const events = await contract.queryFilter(
            filter,
            currentBlock - 3000,
            currentBlock
        );

        if (events.length > 0) {
            event = events[events.length - 1];
        }
    }

    // -------------------------------------------
    // 🔥 3) If STILL no event → timeout
    // -------------------------------------------
    if (!event) {
        resultText.innerText = "Could not retrieve game result 😢. Try again.";
        return;
    }

    // Event args
    const args = event.args;
    const playerMove = convert(args.playerMove);
    const computerMove = convert(args.computerMove);
    const result = args.result;

    // -------------------------------------------
    // UPDATE UI
    // -------------------------------------------
    if (result === "win") {
        userScore++;
        resultText.innerText = `${playerMove} beats ${computerMove} — YOU WIN! 🎉`;
    } else if (result === "lose") {
        computerScore++;
        resultText.innerText = `${playerMove} loses to ${computerMove} — You lost... 😢`;
    } else {
        resultText.innerText = `${playerMove} equals ${computerMove} — Draw! 😐`;
    }

    userScore_span.innerText = userScore;
    computerScore_span.innerText = computerScore;
}

// ------------------------------
//   BUTTON CLICK LISTENERS
// ------------------------------

rock_div.addEventListener("click", () => playMove(0));
paper_div.addEventListener("click", () => playMove(1));
scissors_div.addEventListener("click", () => playMove(2));
