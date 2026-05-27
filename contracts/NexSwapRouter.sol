// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// ─────────────────────────────────────────────────────────────────────────────
//  NexSwapRouter — Fee-collecting proxy for Uniswap v3 SwapRouter02
//
//  Every swap charges a platform fee (default 0.25 %).
//  Fee is taken from the INPUT token/ETH before routing through Uniswap v3.
//  Fee is transferred directly to the treasury wallet.
//
//  Supported chains (pass the correct addresses in constructor):
//    Ethereum  router: 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45
//              weth:   0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
//    Polygon   router: 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45
//              weth:   0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270 (WMATIC)
//    Arbitrum  router: 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45
//              weth:   0x82aF49447D8a07e3bd95BD0d56f35241523fBab1
//    Optimism  router: 0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45
//              weth:   0x4200000000000000000000000000000000000006
//    Base      router: 0x2626664c2603336E57B271c5C0b26F421741e481
//              weth:   0x4200000000000000000000000000000000000006
// ─────────────────────────────────────────────────────────────────────────────

// ── Inline interfaces (no imports needed — works in Remix out of the box) ───

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
}

interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256 amount) external;
}

/// @dev SwapRouter02 exactInputSingle (same on all supported chains)
interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24  fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params)
        external payable returns (uint256 amountOut);
}

// ── Main contract ─────────────────────────────────────────────────────────────

contract NexSwapRouter {

    // ── Immutables ────────────────────────────────────────────────────────────
    ISwapRouter02 public immutable uniswapRouter;
    IWETH         public immutable weth;

    // ── State ─────────────────────────────────────────────────────────────────
    address public owner;
    address public treasury;
    uint256 public feeBps = 25;          // 25 bps = 0.25 %
    uint256 public constant MAX_FEE_BPS = 100; // hard cap at 1 %

    // ── Reentrancy guard ──────────────────────────────────────────────────────
    uint256 private _status = 1;
    modifier nonReentrant() {
        require(_status == 1, "Reentrant call");
        _status = 2;
        _;
        _status = 1;
    }

    // ── Access control ────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ── Deadline guard ────────────────────────────────────────────────────────
    modifier beforeDeadline(uint256 deadline) {
        require(block.timestamp <= deadline, "Deadline exceeded");
        _;
    }

    // ── Events ────────────────────────────────────────────────────────────────
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 feeAmount
    );
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ── Constructor ───────────────────────────────────────────────────────────

    /// @param _router   Uniswap v3 SwapRouter02 address for this chain
    /// @param _weth     WETH (or WMATIC/WETH on L2) address for this chain
    /// @param _treasury Address that receives all platform fees
    constructor(address _router, address _weth, address _treasury) {
        require(_router   != address(0), "Zero router");
        require(_weth     != address(0), "Zero weth");
        require(_treasury != address(0), "Zero treasury");
        uniswapRouter = ISwapRouter02(_router);
        weth          = IWETH(_weth);
        treasury      = _treasury;
        owner         = msg.sender;
    }

    // ── Owner functions ───────────────────────────────────────────────────────

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= MAX_FEE_BPS, "Fee too high (max 1%)");
        emit FeeUpdated(feeBps, _feeBps);
        feeBps = _feeBps;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /// @notice Rescue accidentally sent ERC-20 tokens
    function rescueTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner, amount), "Transfer failed");
    }

    /// @notice Rescue accidentally sent ETH
    function rescueETH() external onlyOwner {
        (bool ok,) = owner.call{value: address(this).balance}("");
        require(ok, "ETH rescue failed");
    }

    // ── Swap: ERC-20 input ────────────────────────────────────────────────────

    /// @notice Swap ERC-20 → any token via Uniswap v3, charging a platform fee.
    /// @dev    Caller must first approve this contract for `amountIn`.
    ///         amountOutMinimum should already account for the fee reducing the
    ///         effective input (multiply quote by (10000-feeBps)/10000).
    ///
    /// @param tokenIn           ERC-20 to sell
    /// @param tokenOut          Token to receive (use WETH address for WETH output)
    /// @param poolFee           Uniswap v3 pool fee tier (100/500/3000/10000)
    /// @param amountIn          Gross amount to sell (fee will be deducted)
    /// @param amountOutMinimum  Minimum output — reverts if not met (slippage guard)
    /// @param deadline          Unix timestamp after which tx reverts
    function swapExactInput(
        address tokenIn,
        address tokenOut,
        uint24  poolFee,
        uint256 amountIn,
        uint256 amountOutMinimum,
        uint256 deadline
    )
        external
        nonReentrant
        beforeDeadline(deadline)
        returns (uint256 amountOut)
    {
        require(amountIn > 0, "Zero amount");

        // Pull full amountIn from user
        require(
            IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn),
            "TransferFrom failed"
        );

        // Deduct platform fee
        uint256 feeAmount  = (amountIn * feeBps) / 10000;
        uint256 swapAmount = amountIn - feeAmount;

        // Forward fee to treasury
        if (feeAmount > 0) {
            require(IERC20(tokenIn).transfer(treasury, feeAmount), "Fee transfer failed");
        }

        // Approve router (reset first for USDT-style tokens)
        IERC20(tokenIn).approve(address(uniswapRouter), 0);
        IERC20(tokenIn).approve(address(uniswapRouter), swapAmount);

        // Execute swap — tokens land directly in user's wallet
        amountOut = uniswapRouter.exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn:           tokenIn,
                tokenOut:          tokenOut,
                fee:               poolFee,
                recipient:         msg.sender,
                amountIn:          swapAmount,
                amountOutMinimum:  amountOutMinimum,
                sqrtPriceLimitX96: 0
            })
        );

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut, feeAmount);
    }

    // ── Swap: ETH input ───────────────────────────────────────────────────────

    /// @notice Swap ETH → ERC-20 via Uniswap v3, charging a platform fee in ETH.
    /// @dev    Send ETH as msg.value. Fee is forwarded in ETH to treasury.
    ///         Remaining ETH is wrapped to WETH and routed through Uniswap.
    ///
    /// @param tokenOut          Token to receive
    /// @param poolFee           Uniswap v3 pool fee tier
    /// @param amountOutMinimum  Minimum output — reverts if not met
    /// @param deadline          Unix timestamp after which tx reverts
    function swapExactETHInput(
        address tokenOut,
        uint24  poolFee,
        uint256 amountOutMinimum,
        uint256 deadline
    )
        external
        payable
        nonReentrant
        beforeDeadline(deadline)
        returns (uint256 amountOut)
    {
        require(msg.value > 0, "Zero ETH");

        // Deduct platform fee in ETH
        uint256 feeAmount  = (msg.value * feeBps) / 10000;
        uint256 swapAmount = msg.value - feeAmount;

        // Forward ETH fee to treasury
        if (feeAmount > 0) {
            (bool ok,) = treasury.call{value: feeAmount}("");
            require(ok, "ETH fee transfer failed");
        }

        // Wrap remaining ETH → WETH for Uniswap
        weth.deposit{value: swapAmount}();
        IERC20(address(weth)).approve(address(uniswapRouter), swapAmount);

        // Execute swap — tokens land directly in user's wallet
        amountOut = uniswapRouter.exactInputSingle(
            ISwapRouter02.ExactInputSingleParams({
                tokenIn:           address(weth),
                tokenOut:          tokenOut,
                fee:               poolFee,
                recipient:         msg.sender,
                amountIn:          swapAmount,
                amountOutMinimum:  amountOutMinimum,
                sqrtPriceLimitX96: 0
            })
        );

        emit Swap(msg.sender, address(0), tokenOut, msg.value, amountOut, feeAmount);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// @notice Returns the net amount that will be swapped (after platform fee)
    function netSwapAmount(uint256 grossAmount) external view returns (uint256) {
        return grossAmount - (grossAmount * feeBps) / 10000;
    }

    /// @notice Returns the platform fee for a given gross amount
    function platformFee(uint256 grossAmount) external view returns (uint256) {
        return (grossAmount * feeBps) / 10000;
    }

    // Accept ETH from WETH.withdraw() only — rejects direct ETH sends
    receive() external payable {
        require(msg.sender == address(weth), "Only WETH");
    }
}
